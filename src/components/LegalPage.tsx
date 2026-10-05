import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HashLink from "@/components/HashLink";
import { getBranding } from "@/lib/settings";
import { legal, site } from "@/config/site";

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

/** Shared frame for the Privacy Policy and Terms of Service. */
export default async function LegalPage({
  title,
  intro,
  summary,
  sections,
  path,
  otherPage,
}: {
  title: string;
  intro: string;
  /** "The short version" — a plain-English summary shown first. */
  summary?: React.ReactNode;
  sections: LegalSection[];
  /** This page's own route, used for the contents links. */
  path: string;
  otherPage: { href: string; label: string };
}) {
  const branding = await getBranding();
  const entity = legal.entity || site.name;

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-28 pb-8 sm:pt-36">
        <header className="max-w-2xl">
          <span className="chip">Legal</span>
          <h1 className="on-scene mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="on-scene mt-4 text-mist/90">{intro}</p>
          <p className="on-scene mt-3 text-sm text-mist/84">
            Last updated {legal.updated} · {entity}
          </p>
        </header>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <nav
            aria-label="On this page"
            className="glass hidden rounded-2xl p-4 text-sm lg:sticky lg:top-28 lg:block"
          >
            <p className="mb-2 font-semibold">On this page</p>
            <ol className="space-y-1.5 text-mist/84">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <HashLink
                    href={`${path}#${s.id}`}
                    className="block rounded-lg px-2 py-1 hover:bg-white/8 hover:text-white"
                  >
                    {i + 1}. {s.title}
                  </HashLink>
                </li>
              ))}
            </ol>
          </nav>

          <article className="legal glass-deep rounded-3xl p-6 sm:p-9">
            {summary && (
              <div className="mb-8 rounded-2xl border border-white/20 bg-white/6 p-5">
                <p className="!mt-0 text-sm font-semibold uppercase tracking-wider text-white">
                  The short version
                </p>
                {summary}
              </div>
            )}
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-28">
                <h2>
                  {i + 1}. {s.title}
                </h2>
                {s.body}
              </section>
            ))}
            <p className="mt-10 border-t border-white/15 pt-5 text-sm">
              Questions about this page? Write to{" "}
              <a href={`mailto:${branding.contactEmail}`}>{branding.contactEmail}</a>
              {" "}or use our <Link href="/contact">contact form</Link>. See also our{" "}
              <Link href={otherPage.href}>{otherPage.label}</Link>.
            </p>
          </article>
        </div>
      </main>
      <Footer siteName={branding.siteName} contactEmail={branding.contactEmail} />
    </div>
  );
}
