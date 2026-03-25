export const EVENTS = {
  LANDING_VIEW: "landing_view",
  HERO_CTA_CLICKED: "hero_cta_clicked",
  NAVBAR_CTA_CLICKED: "navbar_cta_clicked",
  MOBILE_CTA_CLICKED: "mobile_cta_clicked",
  PRICING_VIEWED: "pricing_viewed",
  WAITLIST_STARTED: "waitlist_started",
  WAITLIST_SUBMITTED: "waitlist_submitted",
  WAITLIST_ALREADY_EXISTS: "waitlist_already_exists",
  MARKETPLACE_TEASER_CLICKED: "marketplace_teaser_clicked",
  SCROLL_DEPTH: "scroll_depth",
} as const;

export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS];
