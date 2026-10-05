import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ENQUIRY_LIMITS,
  ENQUIRY_STAGES,
  validateEnquiry,
  type EnquiryInput,
} from "@/lib/contact";

/** A person fills the form in more slowly than a script posts it. */
const MIN_FILL_MS = 2500;

const text = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max + 1) : "";

/**
 * POST /api/contact — a visitor's details and question.
 * No account needed. The row is written with the visitor's own (anonymous)
 * permissions: the database only lets them add a new enquiry, never read
 * one back, and it rate-limits each email address.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Bots fill every field, including the hidden "website" one, and post instantly.
  // They are told it worked so they don't adapt.
  const trap = typeof body.website === "string" && body.website.trim() !== "";
  const elapsed = typeof body.elapsed === "number" ? body.elapsed : MIN_FILL_MS;
  if (trap || elapsed < MIN_FILL_MS) {
    return NextResponse.json({ ok: true });
  }

  const L = ENQUIRY_LIMITS;
  const input: EnquiryInput = {
    name: text(body.name, L.name.max),
    email: text(body.email, L.email.max).toLowerCase(),
    phone: text(body.phone, L.phone.max),
    specialty: text(body.specialty, L.specialty.max),
    stage: text(body.stage, 60),
    question: text(body.question, L.question.max),
  };

  const errors = validateEnquiry(input);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { error: Object.values(errors)[0], fields: errors },
      { status: 400 }
    );
  }
  const stage = (ENQUIRY_STAGES as readonly string[]).includes(input.stage)
    ? input.stage
    : null;

  const supabase = await createClient();
  const { error } = await supabase.from("coach_enquiries").insert({
    name: input.name,
    email: input.email,
    phone: input.phone || null,
    specialty: input.specialty || null,
    stage,
    question: input.question,
  });

  if (error) {
    // the database's own flood-protection messages are safe to show
    if (/too many messages|lot of messages/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    console.error("Enquiry insert failed:", error.message);
    return NextResponse.json(
      {
        error:
          "We couldn't send your message just now. Please try again in a moment.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
