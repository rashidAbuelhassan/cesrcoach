"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isTrackedPath, loadAnalytics, POSTHOG_KEY } from "@/lib/analytics";

/** Sends one PostHog page view per public page the visitor opens. */
export default function PostHogTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!POSTHOG_KEY || !pathname || !isTrackedPath(pathname)) return;
    void loadAnalytics().then((ph) => ph?.capture("$pageview"));
  }, [pathname]);

  return null;
}
