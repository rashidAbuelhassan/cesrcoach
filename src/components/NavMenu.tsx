"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const publicLinks = [
  { href: "/#services", label: "Services" },
  { href: "/#pathway", label: "The Pathway" },
  { href: "/#team", label: "Our Consultants" },
  { href: "/#faq", label: "FAQ" },
];

export default function NavMenu({
  signedIn,
  isAdmin,
}: {
  signedIn: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const authLinks = signedIn ? (
    <>
      <Link href="/members" className="btn-ghost px-4 py-2 text-sm">
        Member area
      </Link>
      {isAdmin && (
        <Link href="/admin" className="btn-ghost px-4 py-2 text-sm">
          Admin
        </Link>
      )}
      <button onClick={signOut} className="btn-danger px-4 py-2 text-sm">
        Sign out
      </button>
    </>
  ) : (
    <>
      <Link href="/login" className="btn-ghost px-4 py-2 text-sm">
        Sign in
      </Link>
      <Link href="/register" className="btn-liquid px-4 py-2 text-sm">
        Join us
      </Link>
    </>
  );

  return (
    <>
      {/* desktop */}
      <nav className="hidden items-center gap-1 md:flex">
        {publicLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-full px-3 py-2 text-sm text-mist/70 transition hover:bg-white/8 hover:text-mist"
          >
            {l.label}
          </Link>
        ))}
        <div className="ml-2 flex items-center gap-2">{authLinks}</div>
      </nav>

      {/* mobile toggle */}
      <button
        className="btn-ghost h-10 w-10 md:hidden"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
        aria-expanded={open}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {open ? (
            <path d="M3 3l12 12M15 3L3 15" />
          ) : (
            <path d="M2 4.5h14M2 9h14M2 13.5h14" />
          )}
        </svg>
      </button>

      {/* mobile sheet */}
      {open && (
        <div className="glass-deep absolute inset-x-3 top-[calc(100%+8px)] rounded-2xl p-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {publicLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm text-mist/80 transition hover:bg-white/8"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-3">
              {authLinks}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
