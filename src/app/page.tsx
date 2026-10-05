/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HashLink from "@/components/HashLink";
import { createClient } from "@/lib/supabase/server";
import { getBranding } from "@/lib/settings";
import { formatDuration } from "@/lib/utils";
import type { Consultant, EventType } from "@/lib/types";

export const revalidate = 300;

const pathwaySteps = [
  { title: "Understand the route", body: "Eligibility, curriculum mapping and what the GMC looks for." },
  { title: "Plan your evidence", body: "A roadmap across every domain of the curriculum." },
  { title: "Build your portfolio", body: "Evidence structured to tell one clear, verifiable story." },
  { title: "Review & refine", body: "A consultant who's been there closes the gaps before the GMC does." },
  { title: "Submit with confidence", body: "Evidence stress-tested by specialists who know the standard." },
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
    a: "Your session goes fast. Your reviewer studies your portfolio in depth beforehand so the time is spent on targeted feedback and an action plan — not on reading your documents.",
  },
  {
    q: "How do I book a session?",
    a: "Create a free account, head to the member area and pick a date for the session type you need, then pay securely by card. Portfolio Clinics and their follow-ups are one-to-one, preparation sessions suit an individual or a group, and pathway events run as a group.",
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

  // Built from the database so prices in the FAQ can never drift out of date.
  const priced = (eventTypes as EventType[] | null)?.filter(
    (t) => t.price_gbp != null && Number(t.price_gbp) > 0
  );
  const faqList = priced?.length
    ? [
        ...faqs,
        {
          q: "How much do sessions cost?",
          a:
            `Prices are per person in GBP: ` +
            priced
              .map((t) => `${t.name} £${Number(t.price_gbp).toFixed(0)}`)
              .join(", ") +
            `.${branding.priceNote ? ` ${branding.priceNote}` : ""}`,
        },
      ]
    : faqs;

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />

      {/* ---------- HERO ---------- */}
      {/* Text sits to one side (and high up on phones) so the scene behind stays in view. */}
      <section className="relative flex min-h-[100svh] items-start px-4 pt-28 pb-16 sm:pt-40 lg:items-center lg:pt-28">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
            <span className="chip hidden sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Consultant-led CESR &amp; Portfolio Pathway coaching
            </span>
            <h1 className="on-scene text-[1.9rem] font-bold leading-[1.1] tracking-tight sm:mt-6 sm:text-5xl lg:text-6xl">
              Your route to the <span className="text-aurora">Specialist Register</span>, guided by those
              who&apos;ve walked it.
            </h1>
            <p className="on-scene mx-auto mt-3 max-w-md text-[0.95rem] text-mist/90 sm:mt-5 sm:text-lg lg:mx-0">
              Experienced NHS consultants coaching doctors through the CESR
              (Portfolio Pathway) route, from first question to final submission.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:mt-8 lg:justify-start">
              <Link href="/register" className="btn-liquid px-8 py-3.5 text-sm">
                Start your journey
              </Link>
              <HashLink href="/#services" className="btn-ghost px-8 py-3.5 text-sm">
                Explore our services
              </HashLink>
            </div>
            <ul className="mt-8 hidden flex-wrap justify-center gap-2 sm:flex lg:justify-start">
              {["1-to-1 portfolio clinics", "100% online", "24/7 member library"].map((t) => (
                <li key={t} className="chip">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- PATHWAY ---------- */}
      <section id="pathway" className="scroll-mt-28 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-md">
            <h2 className="on-scene text-3xl font-bold sm:text-4xl">
              The pathway, <span className="text-aurora">step by step</span>
            </h2>
            <ol className="glass mt-6 divide-y divide-white/15 rounded-3xl">
              {pathwaySteps.map((s, i) => (
                <li key={s.title} className="flex gap-4 px-5 py-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/35 bg-white/10 text-sm font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold leading-snug">{s.title}</h3>
                    <p className="mt-0.5 text-sm leading-snug text-mist/77">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* breathing space: the scene plays on its own */}
      <div aria-hidden className="h-[38svh]" />

      {/* ---------- TEAM ---------- */}
      <section id="team" className="scroll-mt-28 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-xl">
            <h2 className="on-scene text-3xl font-bold sm:text-4xl">
              Meet your <span className="text-aurora">consultants</span>
            </h2>
            <p className="on-scene mt-3 text-mist/90">
              Practising NHS consultants, many of whom earned their own
              specialist registration through this route.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {(consultants as Consultant[] | null)?.map((c) => (
              <div key={c.id} className="glass flex items-start gap-4 rounded-3xl p-5">
                {c.photo_url ? (
                  <img
                    src={c.photo_url}
                    alt={c.name}
                    className="h-16 w-16 shrink-0 rounded-full border border-white/30 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 text-2xl">
                    🩺
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-bold leading-snug">{c.name}</h3>
                  <p className="text-sm text-mist/84">{c.title}</p>
                  {c.bio && (
                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-mist/77">{c.bio}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* breathing space: street hands over to the desk here */}
      <div aria-hidden data-scene-handover className="h-[52svh]" />

      {/* ---------- SERVICES ---------- */}
      <section id="services" className="scroll-mt-28 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-xl">
            <h2 className="on-scene text-3xl font-bold sm:text-4xl">
              Four ways we <span className="text-aurora">coach you</span>
            </h2>
            <p className="on-scene mt-3 text-mist/90">
              Every session is online. Choose where you are on the pathway.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(eventTypes as EventType[] | null)?.map((t, i) => (
              <div key={t.id} className="glass flex flex-col rounded-3xl p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-white/10 text-lg">
                    {["🔍", "🔄", "🛠️", "🧭"][i] ?? "✨"}
                  </span>
                  <h3 className="text-lg font-bold leading-snug">{t.name}</h3>
                </div>
                <p className="mt-3 text-sm text-mist/84">{t.tagline}</p>
                {t.price_gbp != null && Number(t.price_gbp) > 0 && (
                  <p className="mt-4 text-3xl font-bold">
                    £{Number(t.price_gbp).toFixed(0)}
                    <span className="ml-1.5 text-xs font-normal text-mist/70">per person</span>
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="chip">⏱ {formatDuration(t.duration_minutes)}</span>
                  <span className="chip">
                    {t.format === "one_to_one"
                      ? "👤 One-to-one"
                      : t.min_group_size <= 1
                        ? "👤 Individual or group"
                        : `👥 Group of ${t.min_group_size}+`}
                  </span>
                  {t.requires_portfolio && (
                    <span className="chip">
                      {t.portfolio_lead_days > 0
                        ? `📁 Portfolio ${t.portfolio_lead_days} days ahead`
                        : "📁 Portfolio link required"}
                    </span>
                  )}
                </div>
                <details className="group mt-4 flex-1 text-sm">
                  <summary className="cursor-pointer list-none text-mist/84 marker:hidden [&::-webkit-details-marker]:hidden">
                    <span className="underline decoration-white/40 underline-offset-4 group-open:no-underline">
                      What&apos;s included
                    </span>
                  </summary>
                  <p className="mt-2 leading-relaxed text-mist/84">{t.description}</p>
                </details>
                <Link href="/members/bookings" className="btn-ghost mt-5 w-full py-2.5 text-sm">
                  Book a session →
                </Link>
              </div>
            ))}
          </div>

          <div className="on-scene mt-6 space-y-1 text-sm text-mist/90">
            {branding.priceNote && <p className="font-medium">{branding.priceNote}</p>}
            <p>Portfolio Clinic: share your portfolio at least 3 weeks before the session.</p>
          </div>
        </div>
      </section>

      {/* breathing space: the papers settle */}
      <div aria-hidden className="h-[38svh]" />

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="scroll-mt-28 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="on-scene text-3xl font-bold sm:text-4xl">
            Questions, <span className="text-aurora">answered</span>
          </h2>
          <div className="mt-8 grid items-start gap-3 lg:grid-cols-2">
            {faqList.map((f) => (
              <details key={f.q} className="glass group rounded-2xl">
                <summary className="cursor-pointer list-none px-5 py-4 font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {f.q}
                    <span className="shrink-0 text-mist/84 transition-transform group-open:rotate-45">＋</span>
                  </span>
                </summary>
                <p className="px-5 pb-4 text-sm leading-relaxed text-mist/84">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="px-4 py-16">
        <div className="glass mx-auto max-w-3xl rounded-[2rem] p-8 text-center sm:p-10">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Ready to reach the <span className="text-aurora">Specialist Register</span>?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-mist/84">
            Free to register. Book a session, watch the video library and use
            the templates successful candidates use.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="btn-liquid px-8 py-3.5 text-sm">
              Create your free account
            </Link>
            <Link href="/contact" className="btn-ghost px-8 py-3.5 text-sm">
              Talk to us first
            </Link>
          </div>
        </div>
      </section>

      <Footer siteName={branding.siteName} contactEmail={branding.contactEmail} />
    </div>
  );
}
