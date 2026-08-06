import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/stripe/webhook — Stripe events.
 * checkout.session.completed → mark paid + confirm the booking.
 * checkout.session.expired   → cancel the unpaid booking (release the seat).
 * Configure the endpoint in Stripe with events: checkout.session.completed,
 * checkout.session.expired; put its signing secret in STRIPE_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const admin = createAdminClient();
  if (!stripe || !secret || !admin) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.expired"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;
    if (!bookingId) return NextResponse.json({ received: true });

    if (event.type === "checkout.session.completed") {
      // count the redemption only once the money is in
      const discountCode = session.metadata?.discount_code;
      if (discountCode) {
        await admin.rpc("coach_redeem_discount", { p_code: discountCode });
      }

      await admin
        .from("coach_bookings")
        .update({
          status: "confirmed",
          payment_status: "paid",
          stripe_payment_intent:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent?.id ?? null),
          amount_paid_gbp: (session.amount_total ?? 0) / 100,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId);
    } else {
      // expired unpaid checkout: release the seat
      await admin
        .from("coach_bookings")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId)
        .eq("payment_status", "unpaid");
    }
  }

  return NextResponse.json({ received: true });
}
