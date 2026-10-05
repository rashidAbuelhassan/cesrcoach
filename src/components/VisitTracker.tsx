"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Pages that are not part of the public site's traffic. */
const SKIP = ["/admin", "/reader", "/api", "/auth"];

/**
 * Sends one anonymous page view per page the visitor opens. No cookies, no
 * browser storage, and visitors who have turned on Do Not Track or Global
 * Privacy Control are not counted at all.
 */
export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || SKIP.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return;

    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return;

    const payload = JSON.stringify({ path: pathname });
    const sent =
      typeof nav.sendBeacon === "function" &&
      nav.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
    if (!sent) {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }, [pathname]);

  return null;
}
