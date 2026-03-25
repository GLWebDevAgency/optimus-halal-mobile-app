"use client";

import { useEffect, useCallback } from "react";
import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

let initialized = false;

function initPostHog() {
  if (initialized || !POSTHOG_KEY || typeof window === "undefined") return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: true,
    capture_pageleave: true,
    disable_session_recording: true,
    persistence: "localStorage",
  });
  // Capture UTM params as super properties
  const params = new URLSearchParams(window.location.search);
  const utmProps: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    if (key.startsWith("utm_")) {
      utmProps[key] = value;
    }
  }
  if (Object.keys(utmProps).length > 0) {
    posthog.register(utmProps);
  }
  initialized = true;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);
  return <>{children}</>;
}

export function useTrack() {
  return useCallback((event: string, properties?: Record<string, unknown>) => {
    if (!POSTHOG_KEY) return;
    posthog.capture(event, properties);
  }, []);
}
