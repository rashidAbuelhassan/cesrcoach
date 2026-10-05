"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "Overview", icon: "📊" },
  { href: "/admin/events", label: "Sessions", icon: "🗓" },
  { href: "/admin/bookings", label: "Bookings", icon: "🎟" },
  { href: "/admin/enquiries", label: "Enquiries", icon: "💬" },
  { href: "/admin/discounts", label: "Discounts", icon: "🏷" },
  { href: "/admin/videos", label: "Videos", icon: "🎬" },
  { href: "/admin/documents", label: "Documents", icon: "📄" },
  { href: "/admin/members", label: "Members", icon: "👥" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminNav({ newEnquiries = 0 }: { newEnquiries?: number }) {
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
                : "text-mist/73 hover:bg-white/6 hover:text-mist"
            }`}
          >
            <span aria-hidden>{t.icon}</span>
            {t.label}
            {t.href === "/admin/enquiries" && newEnquiries > 0 && (
              <span
                className="min-w-5 rounded-full bg-white px-1.5 py-0.5 text-center text-[11px] font-bold leading-none text-neutral-900"
                aria-label={`${newEnquiries} new`}
              >
                {newEnquiries}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
