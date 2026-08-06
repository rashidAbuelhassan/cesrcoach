import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateDiscount } from "@/lib/discounts";
import type { CoachEvent, EventType } from "@/lib/types";

/**
 * POST /api/discount/validate — preview a discount code for one session.
 * Signed-in members only, and it never returns the code list; just whether
 * the code given works and what it is worth.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: { code?: string; event_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.code || !body.event_id) {
    return NextResponse.json({ error: "Enter a discount code." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Discount codes aren't available right now." },
      { status: 503 }
    );
  }

  const { data: event } = (await supabase
    .from("coach_events")
    .select("event_type_id, coach_event_types(*)")
    .eq("id", body.event_id)
    .single()) as {
    data: (Pick<CoachEvent, "event_type_id"> & {
      coach_event_types: EventType;
    }) | null;
  };

  if (!event) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const result = await validateDiscount(
    admin,
    body.code,
    event.event_type_id,
    Number(event.coach_event_types?.price_gbp ?? 0)
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
