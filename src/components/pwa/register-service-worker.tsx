"use client";

import { useEffect } from "react";

// Registers the no-op service worker (public/sw.js) so the app is
// installable on Android. Silently does nothing on browsers without
// service worker support, and never throws if registration fails.
export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
