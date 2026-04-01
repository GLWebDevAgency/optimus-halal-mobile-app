#!/usr/bin/env tsx
/**
 * Veille Content Script — Fetches monitored sources, detects new content.
 *
 * Called by Claude Cowork scheduled task (daily 9h CET).
 * Can also be run manually: `cd backend && pnpm tsx scripts/veille-content.ts`
 *
 * What it does:
 * 1. Reads active content_sources from DB
 * 2. Fetches each RSS/website source
 * 3. Extracts article titles, URLs, dates
 * 4. Filters for items newer than last_item_date
 * 5. Outputs a structured JSON report for Claude to process
 *
 * What it does NOT do:
 * - AI analysis (Claude Cowork does that with the output)
 * - Insert drafts (Claude Cowork decides and inserts via psql)
 *
 * Environment: uses DATABASE_URL from .env (PgBouncer 6432 or direct 5432)
 */

import postgres from "postgres";

// Support --env prod|dev flag
const envArg = process.argv.find((a) => a.startsWith("--env="))?.split("=")[1]
  ?? (process.argv.includes("--prod") ? "prod" : "dev");

// Load the right .env file
if (envArg === "prod") {
  // Load .env.production.local for production DATABASE_URL + R2 keys
  const { readFileSync } = await import("fs");
  const { resolve } = await import("path");
  try {
    const envPath = resolve(import.meta.dirname ?? ".", ".env.production.local");
    const envContent = readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...rest] = trimmed.split("=");
        if (key && rest.length > 0) {
          process.env[key.trim()] = rest.join("=").trim();
        }
      }
    }
    console.log("[env] Loaded .env.production.local (PRODUCTION)\n");
  } catch {
    console.error("[env] ERROR: .env.production.local not found. Copy .env.production.local.example and fill in Railway URL.\n");
    process.exit(1);
  }
} else {
  console.log("[env] Using dev environment (localhost)\n");
}

const DB_URL = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:6432/optimus_halal";
const sql = postgres(DB_URL, { max: 1, idle_timeout: 5 });

const FETCH_TIMEOUT = 10_000;

// ── Types ──────────────────────────────────────────────

interface ContentSource {
  id: string;
  name: string;
  url: string;
  type: string;
  target_type: string;
  category_hint: string | null;
  last_item_date: string | null;
}

interface FeedItem {
  title: string;
  link: string;
  pubDate: string | null;
  description: string | null;
  imageUrl: string | null;
}

interface SourceReport {
  source: { id: string; name: string; type: string; targetType: string; categoryHint: string | null };
  newItems: FeedItem[];
  error: string | null;
}

// ── RSS Parser (lightweight, no dependency) ────────────

function parseRssItems(xmlText: string): FeedItem[] {
  const items: FeedItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const block = match[1];
    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
      ?? block.match(/<title>(.*?)<\/title>/)?.[1]
      ?? "";
    const link = block.match(/<link>(.*?)<\/link>/)?.[1]
      ?? block.match(/<guid.*?>(.*?)<\/guid>/)?.[1]
      ?? "";
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? null;
    const description = block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1]
      ?? block.match(/<description>(.*?)<\/description>/)?.[1]
      ?? null;

    // Extract image: media:content, enclosure, or img in description
    const imageUrl =
      block.match(/<media:content[^>]+url="([^"]+)"/)?.[1]
      ?? block.match(/<enclosure[^>]+url="([^"]+)"[^>]+type="image/)?.[1]
      ?? block.match(/<image>([\s\S]*?)<url>(.*?)<\/url>/)?.[2]
      ?? block.match(/<img[^>]+src="([^"]+)"/)?.[1]
      ?? null;

    if (title) {
      items.push({ title: title.trim(), link: link.trim(), pubDate, description, imageUrl });
    }
  }

  return items;
}

// ── Atom Parser ────────────────────────────────────────

function parseAtomItems(xmlText: string): FeedItem[] {
  const items: FeedItem[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
  let match;

  while ((match = entryRegex.exec(xmlText)) !== null) {
    const block = match[1];
    const title = block.match(/<title.*?>(.*?)<\/title>/)?.[1] ?? "";
    const link = block.match(/<link.*?href="(.*?)"/)?.[1] ?? "";
    const pubDate = block.match(/<published>(.*?)<\/published>/)?.[1]
      ?? block.match(/<updated>(.*?)<\/updated>/)?.[1]
      ?? null;
    const description = block.match(/<summary.*?>(.*?)<\/summary>/)?.[1] ?? null;
    const imageUrl = block.match(/<media:content[^>]+url="([^"]+)"/)?.[1]
      ?? block.match(/<link[^>]+rel="enclosure"[^>]+href="([^"]+)"/)?.[1]
      ?? null;

    if (title) {
      items.push({ title: title.trim(), link: link.trim(), pubDate, description, imageUrl });
    }
  }

  return items;
}

// ── Fetch source ───────────────────────────────────────

async function fetchSource(source: ContentSource): Promise<SourceReport> {
  const report: SourceReport = {
    source: {
      id: source.id,
      name: source.name,
      type: source.type,
      targetType: source.target_type,
      categoryHint: source.category_hint,
    },
    newItems: [],
    error: null,
  };

  try {
    const response = await fetch(source.url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
      headers: {
        "User-Agent": "Naqiy-Veille/1.0 (naqiy.app)",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html",
      },
    });

    if (!response.ok) {
      report.error = `HTTP ${response.status}`;
      return report;
    }

    const text = await response.text();

    // Detect feed type
    let items: FeedItem[] = [];
    if (text.includes("<rss") || text.includes("<channel>")) {
      items = parseRssItems(text);
    } else if (text.includes("<feed") || text.includes("xmlns:atom")) {
      items = parseAtomItems(text);
    } else {
      report.error = "not_rss";
      return report;
    }

    // Filter for new items (after last_item_date)
    const cutoff = source.last_item_date ? new Date(source.last_item_date) : null;

    for (const item of items) {
      if (!cutoff) {
        report.newItems.push(item);
        if (report.newItems.length >= 5) break;
      } else if (item.pubDate) {
        const itemDate = new Date(item.pubDate);
        if (itemDate > cutoff) {
          report.newItems.push(item);
        }
      }
    }

    // Update last_fetched_at and last_item_date
    const newestDate = items[0]?.pubDate ? new Date(items[0].pubDate).toISOString() : null;
    await sql`
      UPDATE content_sources
      SET last_fetched_at = now(),
          last_fetch_count = ${report.newItems.length},
          last_item_date = COALESCE(${newestDate}::timestamptz, last_item_date)
      WHERE id = ${source.id}::uuid
    `;
  } catch (err: unknown) {
    report.error = err instanceof Error ? err.message : String(err);
  }

  return report;
}

// ── Main ───────────────────────────────────────────────

async function main() {
  console.log("=== Naqiy Veille Content ===");
  console.log("Timestamp:", new Date().toISOString(), "\n");

  const sources = await sql<ContentSource[]>`
    SELECT id, name, url, type, target_type, category_hint,
           last_item_date::text as last_item_date
    FROM content_sources
    WHERE is_active = true
    ORDER BY name
  `;

  console.log("Sources actives:", sources.length, "\n");

  const reports: SourceReport[] = [];

  for (const source of sources) {
    console.log("Fetching:", source.name, "(" + source.type + ") ...");
    const report = await fetchSource(source);

    if (report.error && report.error !== "not_rss") {
      console.log("  Erreur:", report.error);
    } else if (report.error === "not_rss") {
      console.log("  Site web (pas RSS) — verification manuelle requise");
    } else {
      console.log("  OK:", report.newItems.length, "nouveau(x) element(s)");
    }

    reports.push(report);
  }

  const totalNew = reports.reduce((sum, r) => sum + r.newItems.length, 0);

  console.log("\n=== RAPPORT VEILLE ===");
  console.log("Total nouveaux elements:", totalNew);
  console.log("\n--- JSON ---\n");

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    totalNewItems: totalNew,
    reports: reports.filter((r) => r.newItems.length > 0 || (r.error && r.error !== "not_rss")),
  }, null, 2));

  await sql.end();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
