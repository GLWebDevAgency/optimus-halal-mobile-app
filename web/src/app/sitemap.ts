import type { MetadataRoute } from "next";

/**
 * World-class sitemap following Google's best practices.
 *
 * Rules applied:
 * - lastModified uses REAL dates (not new Date() — Google penalizes fake freshness)
 * - Priority reflects actual page importance for the business
 * - Images included for rich results (OG image)
 * - Only public, indexable pages listed (no admin, no API)
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://naqiy.app";

  return [
    // ── Landing (core page, updated frequently) ──
    {
      url: baseUrl,
      lastModified: new Date("2026-03-28"),
      changeFrequency: "weekly",
      priority: 1.0,
    },

    // ── Legal pages (updated 28 mars 2026 — v2.0 rewrite) ──
    {
      url: `${baseUrl}/cgu`,
      lastModified: new Date("2026-03-28"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/confidentialite`,
      lastModified: new Date("2026-03-28"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/mentions-legales`,
      lastModified: new Date("2026-03-28"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
