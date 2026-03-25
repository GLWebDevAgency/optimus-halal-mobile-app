"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useTrack } from "@/lib/posthog";
import { EVENTS } from "@/lib/analytics-events";

type WaitlistState = "idle" | "loading" | "success" | "already" | "error";

interface UseWaitlistJoinOptions {
  source?: "landing" | "marketplace" | "navbar" | "cta";
}

export function useWaitlistJoin({ source = "landing" }: UseWaitlistJoinOptions = {}) {
  const [state, setState] = useState<WaitlistState>("idle");
  const [email, setEmail] = useState("");
  const track = useTrack();

  const mutation = trpc.waitlist.join.useMutation({
    onSuccess(data) {
      if (data.status === "created") {
        setState("success");
        track(EVENTS.WAITLIST_SUBMITTED, { source });
      } else {
        setState("already");
        track(EVENTS.WAITLIST_ALREADY_EXISTS, { source });
      }
    },
    onError() {
      setState("error");
    },
  });

  const submit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const value = email.trim();
      if (!value || state === "loading") return;

      setState("loading");

      // Capture UTM params from URL
      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;

      mutation.mutate({
        email: value,
        source,
        utmSource: params?.get("utm_source") ?? undefined,
        utmMedium: params?.get("utm_medium") ?? undefined,
        utmCampaign: params?.get("utm_campaign") ?? undefined,
      });
    },
    [email, state, mutation, source]
  );

  return { state, email, setEmail, submit, track };
}
