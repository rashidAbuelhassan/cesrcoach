"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Registers the service worker and shows a dismissible "Add to Home Screen"
 * pill when the browser signals the app is installable (or iOS hint).
 */
export default function PwaProvider() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    if (localStorage.getItem("cesr-a2hs-dismissed")) return;
    // deliberate one-time sync with localStorage on mount
    setTimeout(() => setDismissed(false), 0);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS Safari has no install prompt — show a gentle hint instead.
    const ua = window.navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        (window.navigator as unknown as { standalone: boolean }).standalone);
    if (isIos && !standalone) {
      const t = setTimeout(() => setShowIosHint(true), 4000);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onPrompt);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem("cesr-a2hs-dismissed", "1");
    setInstallEvent(null);
    setShowIosHint(false);
    setDismissed(true);
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    dismiss();
  }

  if (dismissed || (!installEvent && !showIosHint)) return null;

  return (
    <div className="glass-deep fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl p-4 sm:inset-x-auto sm:right-6">
      <span className="text-2xl" aria-hidden>📲</span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">Add CESR Coach to your home screen</p>
        {showIosHint ? (
          <p className="mt-0.5 text-xs text-mist/60">
            Tap the Share button, then “Add to Home Screen”.
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-mist/60">
            Quick access to your videos, documents and bookings.
          </p>
        )}
      </div>
      {installEvent && (
        <button onClick={install} className="btn-liquid px-4 py-2 text-xs">
          Install
        </button>
      )}
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="text-mist/50 transition hover:text-mist"
      >
        ✕
      </button>
    </div>
  );
}
