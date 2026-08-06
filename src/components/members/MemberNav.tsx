"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { companion } from "@/config/site";

const tabs = [
  { href: "/members", label: "Dashboard", icon: "🏠" },
  { href: "/members/videos", label: "Videos", icon: "🎬" },
  { href: "/members/documents", label: "Documents", icon: "📄" },
  { href: "/members/bookings", label: "Bookings", icon: "📅" },
  { href: "/members/profile", label: "Profile", icon: "👤" },
];

export default function MemberNav() {
  const pathname = usePathname();

  return (
    <nav className="glass flex gap-1 overflow-x-auto rounded-2xl p-1.5">
      {tabs.map((t) => {
        const active =
          t.href === "/members"
            ? pathname === "/members"
            : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-white/12 text-mist shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
                : "text-mist/55 hover:bg-white/6 hover:text-mist"
            }`}
          >
            <span aria-hidden>{t.icon}</span>
            {t.label}
          </Link>
        );
      })}

      <a
        href={companion.url}
        target="_blank"
        rel="noopener noreferrer"
        title={`${companion.name} — opens in a new tab`}
        className="ml-auto flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-cyan-300/80 transition hover:bg-cyan-300/10 hover:text-cyan-200"
      >
        <span aria-hidden>🧭</span>
        {companion.name}
        <span aria-hidden className="text-xs">↗</span>
      </a>
    </nav>
  );
}
