import type { MetadataRoute } from "next";

/**
 * World-class robots.txt — inspired by Apple, HubSpot, Vercel.
 *
 * Strategy:
 * - Allow all public pages
 * - Block admin, API, and Next.js internals (crawl budget optimization)
 * - Declare sitemap location
 * - Block AI training crawlers (protect content IP)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── Standard crawlers (Google, Bing, etc.) ──
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/_next/static/",
          "/_next/image/",
          "/_vercel/",
        ],
      },
      // ── Block AI training crawlers (protect IP) ──
      {
        userAgent: "GPTBot",
        disallow: "/",
      },
      {
        userAgent: "ChatGPT-User",
        disallow: "/",
      },
      {
        userAgent: "CCBot",
        disallow: "/",
      },
      {
        userAgent: "anthropic-ai",
        disallow: "/",
      },
      {
        userAgent: "Google-Extended",
        disallow: "/",
      },
    ],
    sitemap: "https://naqiy.app/sitemap.xml",
    host: "https://naqiy.app",
  };
}
