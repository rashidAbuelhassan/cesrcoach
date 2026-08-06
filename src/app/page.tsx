/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { getBranding } from "@/lib/settings";
import { formatDuration } from "@/lib/utils";
import type { Consultant, EventType } from "@/lib/types";

export const revalidate = 300;

const pathwaySteps = [
  {
    title: "Understand the route",
    body: "Learn what the Portfolio Pathway (formerly CESR) involves: eligibility, curriculum mapping and what the GMC evaluators actually look for.",
  },
  {
    title: "Plan your evidence",
    body: "Build a personal roadmap across every domain of the curriculum — logbooks, audits, teaching, leadership, reflections and more.",
  },
  {
    title: "Build your portfolio",
    body: "Compile, anonymise and structure your evidence so it tells a clear, verifiable story of equivalence to CCT-level training.",
  },
  {
    title: "Review & refine",
    body: "Have a consultant who has been there scrutinise your portfolio one-to-one and close the gaps before the GMC does.",
  },
  {
    title: "Submit with confidence",
    body: "Approach your application knowing your evidence has been stress-tested by specialists who know the standard.",
  },
];

const faqs = [
  {
    q: "What is the CESR / Portfolio Pathway route?",
    a: "It's the GMC route to the Specialist Register for doctors who haven't completed a UK-approved training programme. You demonstrate that your skills, knowledge and experience are equivalent to CCT-level training by submitting a structured portfolio of evidence.",
  },
  {
    q: "Who are your coaches?",
    a: "We are a group of practising NHS consultants across multiple specialties, many of whom obtained specialist registration through this very route and have reviewed dozens of successful portfolios.",
  },
  {
    q: "Why must I share my portfolio 3 weeks before a Portfolio Clinic?",
    a: "Thirty minutes goes fast. Your reviewer studies your portfolio in depth beforehand so the session is spent on targeted feedback and an action plan — not on reading your documents.",
  },
  {
    q: "How do I book a session?",
    a: "Create a free account, head to the member area and pick a date for the session type you need, then pay securely by card. Portfolio Clinics and their follow-ups are one-to-one; preparation sessions and pathway events run as small groups.",
  },
  {
    q: "Where do the sessions take place?",
    a: "Everything we run is fully online, so you can join from anywhere in the world. Once your booking is confirmed, the joining link appears against that session in your member area.",
  },
  {
    q: "What is the Portfolio Clinic Follow-up for?",
    a: "It's a shorter, lower-cost session for after your main Portfolio Clinic. Your reviewer already knows your portfolio, so you can spend the time reviewing the changes you've made, resolving anything still outstanding and confirming you're ready to submit.",
  },
  {
    q: "How much do sessions cost?",
    a: "Prices are per person in GBP and shown on each service above: Portfolio Clinic £499, Portfolio Clinic Follow-up £100, Portfolio Preparation Session £250, and Guidance to the Portfolio Pathway £200.",
  },
  {
    q: "Can I access resources between sessions?",
    a: "Yes — members get access to our library of pre-recorded video presentations and downloadable templates, checklists and guides, available any time.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const branding = await getBranding();

  const [{ data: eventTypes }, { data: consultants }] = await Promise.all([
    supabase
      .from("coach_event_types")
      .select("*")
      .eq("active", true)
      .order("sort_order"),
    supabase
      .from("coach_consultants")
      .select("*")
      .eq("active", true)
      .order("sort_order"),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />

      {/* ---------- HERO ---------- */}
      <section className="relative px-4 pt-40 pb-24 sm:pt-48">
        <div className="mx-auto max-w-4xl text-center">
          <span className="chip mx-auto text-cyan-200/90">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Consultant-led CESR &amp; Portfolio Pathway coaching
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Your route to the{" "}
            <span className="text-aurora">Specialist Register</span>,
            <br className="hidden sm:block" /> guided by those who&apos;ve walked it.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-mist/65 sm:text-lg">
            {branding.siteName} is a group of experienced NHS consultants ready
            to share their expertise with any doctor seeking entry to the
            specialist register through the CESR (Portfolio Pathway) route —
            from first questions to final submission.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register" className="btn-liquid px-8 py-3.5 text-sm">
              Start your journey
            </Link>
            <Link href="/#services" className="btn-ghost px-8 py-3.5 text-sm">
              Explore our services
            </Link>
          </div>

          {/* floating stat cards */}
          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            {[
              ["1-to-1", "portfolio clinics with a consultant reviewer"],
              ["100% online", "join from anywhere in the world"],
              ["24/7", "member library of videos & documents"],
            ].map(([stat, label]) => (
              <div key={stat} className="glass glass-hover rounded-3xl p-6">
                <p className="text-3xl font-bold text-aurora">{stat}</p>
                <p className="mt-2 text-sm text-mist/60">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- SERVICES ---------- */}
      <section id="services" className="scroll-mt-28 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Four ways we <span className="text-aurora">coach you</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-mist/60">
              Book whichever fits where you are on the pathway. Every session is
              delivered online by consultants with real CESR experience, so you
              can join from anywhere.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {(eventTypes as EventType[] | null)?.map((t, i) => (
              <div
                key={t.id}
                className="glass glass-hover flex flex-col rounded-3xl p-8"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl"
                  style={{
                    background: `${t.color}22`,
                    border: `1px solid ${t.color}55`,
                  }}
                >
                  {["🔍", "🔄", "🛠️", "🧭"][i] ?? "✨"}
                </div>
                <h3 className="mt-5 text-xl font-bold">{t.name}</h3>
                <p className="mt-1 text-sm font-medium" style={{ color: t.color ?? undefined }}>
                  {t.tagline}
                </p>
                {t.price_gbp != null && Number(t.price_gbp) > 0 && (
                  <p className="mt-4 text-3xl font-bold">
                    £{Number(t.price_gbp).toFixed(0)}
                    <span className="ml-1.5 text-xs font-normal text-mist/45">
                      per person
                    </span>
                  </p>
                )}
                <p className="mt-3 flex-1 text-sm leading-relaxed text-mist/60">
                  {t.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="chip">⏱ {formatDuration(t.duration_minutes)}</span>
                  <span className="chip">💻 Online</span>
                  <span className="chip">
                    {t.format === "one_to_one"
                      ? "👤 One-to-one"
                      : `👥 Group of ${t.min_group_size}+`}
                  </span>
                  {t.requires_portfolio && (
                    <span className="chip text-amber-200/90">
                      📁 Portfolio {t.portfolio_lead_days} days ahead
                    </span>
                  )}
                </div>
                <Link
                  href="/members/bookings"
                  className="btn-ghost mt-6 w-full py-2.5 text-sm"
                >
                  Book a session →
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-mist/40">
            ⚠️ Portfolio Clinic bookings require you to upload or share access
            to your portfolio at least 3 weeks before your session, so your
            reviewer can assess it properly.
          </p>
        </div>
      </section>

      {/* ---------- PATHWAY ---------- */}
      <section id="pathway" className="scroll-mt-28 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              The pathway, <span className="text-aurora">step by step</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-mist/60">
              The Portfolio Pathway is a marathon with paperwork. We break it
              into a route you can actually run.
            </p>
          </div>

          <ol className="relative mt-14 space-y-6">
            {pathwaySteps.map((s, i) => (
              <li key={s.title} className="glass glass-hover flex gap-5 rounded-3xl p-6 sm:p-8">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/30 to-violet-400/30 font-bold text-cyan-200 ring-1 ring-white/15">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-bold">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-mist/60">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- TEAM ---------- */}
      <section id="team" className="scroll-mt-28 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Meet your <span className="text-aurora">consultants</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-mist/60">
              Practising NHS consultants across specialties — many of whom
              earned their own specialist registration through this route.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(consultants as Consultant[] | null)?.map((c) => (
              <div key={c.id} className="glass glass-hover rounded-3xl p-7 text-center">
                {c.photo_url ? (
                  <img
                    src={c.photo_url}
                    alt={c.name}
                    className="mx-auto h-24 w-24 rounded-full border border-white/15 object-cover"
                  />
                ) : (
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/25 to-violet-400/25 text-3xl ring-1 ring-white/15">
                    🩺
                  </div>
                )}
                <h3 className="mt-4 font-bold">{c.name}</h3>
                <p className="text-sm text-cyan-300/80">{c.title}</p>
                <p className="mt-3 text-sm leading-relaxed text-mist/55">{c.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="scroll-mt-28 px-4 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Questions, <span className="text-aurora">answered</span>
            </h2>
          </div>
          <div className="mt-12 space-y-4">
            {faqs.map((f) => (
              <details key={f.q} className="glass group rounded-2xl">
                <summary className="cursor-pointer list-none px-6 py-5 font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {f.q}
                    <span className="text-cyan-300 transition-transform group-open:rotate-45">＋</span>
                  </span>
                </summary>
                <p className="px-6 pb-5 text-sm leading-relaxed text-mist/60">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="px-4 py-20">
        <div className="glass mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] p-10 text-center sm:p-16">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[120%] -translate-x-1/2 rounded-full bg-cyan-400/15 blur-[90px]" />
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to reach the <span className="text-aurora">Specialist Register</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-mist/60">
            Join {branding.siteName} today — free to register. Book your first
            session, watch the video library and download the templates that
            successful candidates use.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register" className="btn-liquid px-8 py-3.5 text-sm">
              Create your free account
            </Link>
            <a
              href={`mailto:${branding.contactEmail}`}
              className="btn-ghost px-8 py-3.5 text-sm"
            >
              Talk to us first
            </a>
          </div>
        </div>
      </section>

      <Footer siteName={branding.siteName} contactEmail={branding.contactEmail} />
    </div>
  );
}
