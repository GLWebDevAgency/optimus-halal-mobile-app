import type { NextConfig } from "next";
import path from "node:path";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking — only allow our own origin to frame
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Referrer: send origin only on cross-origin, full on same-origin
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // HSTS — 1 year, include subdomains, preload-ready (prod only)
          ...(!isDev
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains; preload",
                },
              ]
            : []),
          // Permissions Policy — disable sensors we don't use
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // CSP — strict but functional
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://us-assets.i.posthog.com https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://*.googleusercontent.com https://pub-f871593571bd4d04a86a25015aac1057.r2.dev",
              "font-src 'self' https://fonts.gstatic.com",
              [
                "connect-src 'self'",
                "https://us.i.posthog.com",
                "https://vitals.vercel-insights.com",
                "https://va.vercel-scripts.com",
                "https://api.naqiy.app",
                "https://api-preview.naqiy.app",
                ...(isDev ? ["http://localhost:*", "ws://localhost:*"] : []),
              ].join(" "),
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
