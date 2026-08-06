import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { validateDiscount } from "@/lib/discounts";
import { daysUntil } from "@/lib/utils";
import type { CoachEvent, EventType } from "@/lib/types";

/**
 * POST /api/checkout — book a session.
 * Free sessions are booked directly (pending, admin confirms).
 * Paid sessions create a pending booking + Stripe Checkout session; the
 * webhook confirms the booking on successful payment and cancels it if
 * the checkout expires unpaid.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: {
    event_id?: string;
    portfolio_url?: string;
    notes?: string;
    discount_code?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.event_id) {
    return NextResponse.json({ error: "Missing event." }, { status: 400 });
  }

  const { data: event } = (await supabase
    .from("coach_events")
    .select("*, coach_event_types(*)")
    .eq("id", body.event_id)
    .eq("status", "scheduled")
    .single()) as { data: (CoachEvent & { coach_event_types: EventType }) | null };

  if (!event || new Date(event.starts_at) <= new Date()) {
    return NextResponse.json(
      { error: "This session is no longer available." },
      { status: 400 }
    );
  }

  const type = event.coach_event_types;

  // portfolio clinic rules: link required, 3-week lead time enforced
  if (type.requires_portfolio) {
    if (!body.portfolio_url) {
      return NextResponse.json(
        { error: "A portfolio link is required for this session." },
        { status: 400 }
      );
    }
    if (daysUntil(event.starts_at) < type.portfolio_lead_days) {
      return NextResponse.json(
        {
          error: `This session starts in under ${type.portfolio_lead_days} days — too late for a full portfolio review. Please pick a later date.`,
        },
        { status: 400 }
      );
    }
  }

  const listPriceGbp = Number(type.price_gbp ?? 0);
  const admin = createAdminClient();

  // Re-validate any discount here rather than trusting the amount the
  // browser showed — this is the figure the member is actually charged.
  let discountGbp = 0;
  let discountCode: string | null = null;
  if (body.discount_code && listPriceGbp > 0 && admin) {
    const check = await validateDiscount(
      admin,
      body.discount_code,
      event.event_type_id,
      listPriceGbp
    );
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }
    discountGbp = check.discountGbp;
    discountCode = check.code;
  }

  const priceGbp = Math.max(0, listPriceGbp - discountGbp);
  const isPaid = priceGbp > 0;

  if (isPaid && (!admin || !getStripe())) {
    return NextResponse.json(
      {
        error:
          "Online payment isn't configured yet. Please contact us to book this session.",
      },
      { status: 503 }
    );
  }

  // Create the booking (capacity + duplicate constraints enforced in the DB).
  // The service client is used so payment fields can be written; user identity
  // is taken from the authenticated session above, never from the request body.
  // a code worth 100% leaves nothing to charge — the seat is comped
  const fullyDiscounted = !isPaid && listPriceGbp > 0;

  const writer = admin ?? supabase;
  const { data: booking, error: insertError } = await writer
    .from("coach_bookings")
    .insert({
      event_id: event.id,
      user_id: user.id,
      portfolio_url: type.requires_portfolio ? body.portfolio_url : null,
      notes: body.notes || null,
      discount_code: discountCode,
      discount_gbp: discountGbp || null,
      payment_status: isPaid ? "unpaid" : fullyDiscounted ? "paid" : "not_required",
      ...(fullyDiscounted
        ? {
            status: "confirmed",
            amount_paid_gbp: 0,
            paid_at: new Date().toISOString(),
          }
        : {}),
    })
    .select()
    .single();

  if (insertError || !booking) {
    const message = insertError?.message.includes("duplicate")
      ? "You already have a booking for this session."
      : insertError?.message.includes("fully booked")
        ? "This session is fully booked."
        : (insertError?.message ?? "Could not create the booking.");
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!isPaid) {
    if (fullyDiscounted && discountCode && admin) {
      await admin.rpc("coach_redeem_discount", { p_code: discountCode });
    }
    return NextResponse.json({ free: true, comped: fullyDiscounted });
  }

  // Paid: create the Stripe Checkout session
  const stripe = getStripe()!;
  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: Math.round(priceGbp * 100),
            product_data: {
              name: event.title,
              description:
                `${type.name} · ${new Date(event.starts_at).toLocaleString("en-GB")}` +
                (discountCode
                  ? ` · code ${discountCode} (−£${discountGbp.toFixed(2)})`
                  : ""),
            },
          },
        },
      ],
      metadata: {
        booking_id: booking.id,
        event_id: event.id,
        user_id: user.id,
        ...(discountCode ? { discount_code: discountCode } : {}),
      },
      // seat is held while checkout is open; webhook releases it on expiry
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${origin}/members/bookings?payment=success`,
      cancel_url: `${origin}/members/bookings?payment=cancelled&booking=${booking.id}`,
    });

    await admin!
      .from("coach_bookings")
      .update({ stripe_session_id: session.id })
      .eq("id", booking.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    // roll the seat back if Stripe failed
    await admin!.from("coach_bookings").delete().eq("id", booking.id);
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Could not start the payment. Please try again." },
      { status: 502 }
    );
  }
}
