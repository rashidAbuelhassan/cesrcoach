import type { PostHog } from "posthog-js";

/**
 * PostHog product analytics, configured to be cookieless:
 *  - nothing is written to cookies or browser storage (in-memory only)
 *  - no autocapture, session recording, surveys or feature-flag requests
 *  - only the pages listed in `SKIP` are ever left out, so the member area,
 *    admin console and document reader are never reported
 *  - visitors with Do Not Track / Global Privacy Control are not measured
 *  - EU-hosted by default
 * It does nothing at all unless NEXT_PUBLIC_POSTHOG_KEY is set.
 */
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

/** Areas that are private or not part of the public site. */
const SKIP = ["/admin", "/members", "/reader", "/api", "/auth"];

export const isTrackedPath = (path: string) =>
  !SKIP.some((p) => path === p || path.startsWith(`${p}/`));

let client: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;

function privacySignalOn() {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.doNotTrack === "1" || !!nav.globalPrivacyControl;
}

/** Loads PostHog once, on first use, and only when tracking is allowed. */
export function loadAnalytics(): Promise<PostHog | null> {
  if (!POSTHOG_KEY || typeof window === "undefined" || privacySignalOn()) {
    return Promise.resolve(null);
  }
  loading ??= import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        persistence: "memory",
        disable_persistence: true,
        person_profiles: "identified_only",
        capture_pageview: false, // sent by hand on each route change
        capture_pageleave: false,
        autocapture: false,
        rageclick: false,
        capture_dead_clicks: false,
        capture_exceptions: false,
        disable_session_recording: true,
        disable_surveys: true,
        disable_conversations: true,
        disable_web_experiments: true,
        advanced_disable_flags: true,
        // addresses can carry tokens or private paths: report the page only
        before_send: (event) => {
          if (event?.properties) {
            for (const key of ["$current_url", "$referrer"] as const) {
              const value = event.properties[key];
              if (typeof value === "string") {
                try {
                  const u = new URL(value);
                  event.properties[key] = `${u.origin}${u.pathname}`;
                } catch {
                  /* leave as is */
                }
              }
            }
          }
          return event;
        },
      });
      client = posthog;
      return posthog;
    })
    .catch(() => null);
  return loading;
}

/** Records a named event. Never include personal data in `props`. */
export function track(event: string, props?: Record<string, string | number | boolean>) {
  if (!POSTHOG_KEY) return;
  void loadAnalytics().then((ph) => (ph ?? client)?.capture(event, props));
}
