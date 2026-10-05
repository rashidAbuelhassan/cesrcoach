import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Crawlers, uptime monitors and scripts are not visitors. */
const NOT_A_PERSON =
  /bot|crawl|spider|slurp|scan|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|httpclient|axios|node-fetch|go-http|java\//i;

const done = () => new NextResponse(null, { status: 204 });

/**
 * POST /api/track — one page view, counted anonymously.
 *
 * The visitor's address and browser are handed to the database only so it
 * can turn them into a one-way hash with a salt that changes every day
 * (see coach_record_visit). Neither is stored, and no cookie is set.
 * This is a beacon: it never reports an error to the page.
 */
export async function POST(request: Request) {
  try {
    const ua = request.headers.get("user-agent") ?? "";
    if (!ua || NOT_A_PERSON.test(ua)) return done();

    let path = "/";
    try {
      const body = await request.json();
      if (typeof body?.path === "string") path = body.path;
    } catch {
      return done();
    }
    if (!path.startsWith("/") || path.length > 200) return done();

    const ip =
      (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "";

    const supabase = await createClient();
    await supabase.rpc("coach_record_visit", {
      p_path: path,
      p_ip: ip,
      p_ua: ua.slice(0, 300),
    });
  } catch {
    // counting must never get in a visitor's way
  }
  return done();
}
