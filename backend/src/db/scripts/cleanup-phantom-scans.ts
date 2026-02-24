/**
 * Cleanup — Remove phantom scan entries created by the viewOnly bug
 *
 * The bug: clicking a history item navigated to scan-result which triggered
 * scanMutation.mutate(), creating a duplicate scan record every single time.
 *
 * Strategy:
 *   For each (userId, barcode) group, keep the FIRST scan (earliest scannedAt)
 *   and delete all subsequent duplicates. A "duplicate" is defined as a scan
 *   with the same userId + barcode where there are multiple entries.
 *
 *   Since the real scan is always the first one, and all subsequent ones are
 *   phantoms created by re-opening from history, this is safe.
 *
 * Usage: pnpm tsx src/db/scripts/cleanup-phantom-scans.ts
 */

import pg from "pg";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL manquante");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  console.log("━━━ Naqiy — Phantom Scan Cleanup ━━━\n");

  // Step 1: Count total scans before
  const beforeRes = await client.query("SELECT count(*)::int AS count FROM scans");
  console.log(`📊 Scans avant nettoyage: ${beforeRes.rows[0].count}`);

  // Step 2: Show duplicates before deleting
  const dupsRes = await client.query(`
    SELECT user_id, barcode, count(*)::int AS cnt
    FROM scans
    GROUP BY user_id, barcode
    HAVING count(*) > 1
    ORDER BY count(*) DESC
    LIMIT 20
  `);
  console.log(`\n🔍 Barcodes avec doublons: ${dupsRes.rows.length}`);
  for (const row of dupsRes.rows) {
    console.log(`   ${row.barcode}: ${row.cnt} scans (${row.cnt - 1} fantômes)`);
  }

  // Step 3: Delete duplicates — keep only the first scan per (userId, barcode)
  const deleteResult = await client.query(`
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY user_id, barcode
          ORDER BY scanned_at ASC
        ) AS rn
      FROM scans
    )
    DELETE FROM scans
    WHERE id IN (
      SELECT id FROM ranked WHERE rn > 1
    )
  `);

  const deletedCount = deleteResult.rowCount ?? 0;
  console.log(`\n🗑️  Scans fantômes supprimés: ${deletedCount}`);

  // Step 4: Count total scans after
  const afterRes = await client.query("SELECT count(*)::int AS count FROM scans");
  console.log(`📊 Scans après nettoyage: ${afterRes.rows[0].count}`);

  // Step 5: Verify no more duplicates
  const verifyRes = await client.query(`
    SELECT count(*)::int AS dup_groups
    FROM (
      SELECT user_id, barcode
      FROM scans
      GROUP BY user_id, barcode
      HAVING count(*) > 1
    ) sub
  `);
  console.log(`\n✅ Groupes avec doublons restants: ${verifyRes.rows[0].dup_groups}`);

  console.log("\n✅ Nettoyage terminé !");
  await client.end();
}

main().catch((err) => {
  console.error("❌ Erreur:", err);
  process.exit(1);
});
