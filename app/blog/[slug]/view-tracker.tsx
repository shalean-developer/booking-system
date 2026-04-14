"use client";

import { useEffect } from "react";

type ViewTrackerProps = {
  slug: string;
};

export function ViewTracker({ slug }: ViewTrackerProps) {
  useEffect(() => {
    const storageKey = `page_view_tracked:${slug}`;
    if (typeof window !== "undefined" && window.sessionStorage.getItem(storageKey)) {
      return;
    }

    const controller = new AbortController();

    fetch("/api/track-page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      signal: controller.signal
    })
      .then((response) => {
        if (response.ok && typeof window !== "undefined") {
          window.sessionStorage.setItem(storageKey, "1");
        }
      })
      .catch(() => {
        // Best-effort analytics only.
      });

    return () => controller.abort();
  }, [slug]);

  return null;
}
