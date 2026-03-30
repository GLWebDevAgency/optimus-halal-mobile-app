/**
 * PaywallTrigger — identifies what action triggered the paywall.
 * Used for contextual feature reordering (Yuka-inspired pattern).
 */
export type PaywallTrigger =
  | "scan_quota"        // 15 scans/day limit for free users
  | "profile_creation"  // Tried to create an account (premium feature)
  | "favorites"         // Tried to add > 10 favorites
  | "history"           // Tried to access full scan history
  | "offline"           // Tried to use offline mode
  | "health_profile"    // Tried to access health/nutrition profile
  | "store_favorites"   // Tried to add > 10 store favorites
  | "search"            // Tried to search products by name
  | "generic";          // Default (no specific trigger)
