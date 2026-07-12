"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "Overview", icon: "📊" },
  { href: "/admin/events", label: "Sessions", icon: "🗓" },
  { href: "/admin/bookings", label: "Bookings", icon: "🎟" },
  { href: "/admin/videos", label: "Videos", icon: "🎬" },
  { href: "/admin/documents", label: "Documents", icon: "📄" },
  { href: "/admin/members", label: "Members", icon: "👥" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="glass flex gap-1 overflow-x-auto rounded-2xl p-1.5">
      {tabs.map((t) => {
        const active =
          t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
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
    </nav>
  );
}
