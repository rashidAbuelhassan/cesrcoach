/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { site } from "@/config/site";

interface LogoProps {
  /** Admin-uploaded logo URL (from settings) — overrides the bundled file. */
  logoUrl?: string | null;
  siteName?: string;
  className?: string;
  href?: string;
}

/**
 * The single place the logo is rendered. Swap the logo by replacing
 * `public/branding/logo.svg`, or upload one in Admin → Settings.
 */
export default function Logo({
  logoUrl,
  siteName = site.name,
  className = "h-9",
  href = "/",
}: LogoProps) {
  return (
    <Link href={href} className="flex items-center gap-2 shrink-0" aria-label={siteName}>
      <img
        src={logoUrl || site.logo}
        alt={siteName}
        className={`${className} w-auto`}
      />
    </Link>
  );
}
