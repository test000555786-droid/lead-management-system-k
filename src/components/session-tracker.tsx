"use client";

import { useEffect, useRef } from "react";
import { pingSession } from "@/lib/actions";

export function SessionTracker() {
  const isPinging = useRef(false);

  useEffect(() => {
    // Initial ping on mount
    if (!isPinging.current) {
      isPinging.current = true;
      pingSession().finally(() => {
        isPinging.current = false;
      });
    }

    // Ping every 60 seconds
    const interval = setInterval(() => {
      // Only ping if the document is visible (user is actively looking at the tab)
      if (document.visibilityState === "visible" && !isPinging.current) {
        isPinging.current = true;
        pingSession().finally(() => {
          isPinging.current = false;
        });
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return null; // Invisible tracker
}
