import Link from "next/link";
import { companion, site } from "@/config/site";

export default function Footer({
  siteName = site.name,
  contactEmail = site.contactEmail,
}: {
  siteName?: string;
  contactEmail?: string;
}) {
  return (
    <footer className="relative mt-24 px-4 pb-8">
      <div className="glass mx-auto max-w-6xl rounded-3xl px-6 py-10 sm:px-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="text-lg font-bold">{siteName}</p>
            <p className="mt-2 text-sm text-mist/77">
              Experienced consultants guiding doctors to the GMC Specialist
              Register through the CESR / Portfolio Pathway route.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-mist/90">Explore</p>
            <ul className="mt-3 space-y-2 text-sm text-mist/77">
              <li><Link className="hover:text-white" href="/#pathway">The CESR pathway</Link></li>
              <li><Link className="hover:text-white" href="/#team">Our consultants</Link></li>
              <li><Link className="hover:text-white" href="/#services">Our services</Link></li>
              <li><Link className="hover:text-white" href="/members">Member area</Link></li>
              <li>
                <a
                  className="hover:text-white"
                  href={companion.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {companion.name} ↗
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-mist/90">Contact</p>
            <ul className="mt-3 space-y-2 text-sm text-mist/77">
              <li>
                <a className="hover:text-white" href={`mailto:${contactEmail}`}>
                  {contactEmail}
                </a>
              </li>
              <li>
                <Link className="underline underline-offset-2 hover:text-white" href="/contact">
                  Send us a question
                </Link>
              </li>
              <li>United Kingdom</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-white/10 pt-5 text-center text-xs text-mist/64">
          © {new Date().getFullYear()} {siteName}. All rights reserved. CESR is
          now formally known as the Portfolio Pathway (GMC). We count visits
          anonymously, without cookies.
        </div>
      </div>
    </footer>
  );
}
