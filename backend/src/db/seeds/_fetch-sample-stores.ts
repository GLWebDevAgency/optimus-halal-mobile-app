/**
 * Fetch diverse sample stores for Google Places API exploration.
 * Usage: pnpm tsx --env-file=.env src/db/seeds/_fetch-sample-stores.ts
 */

import postgres from "postgres";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

  // Get a diverse mix: different types, certifiers, sources
  const stores = await sql`
    SELECT id, name, address, city, postal_code, store_type, certifier, source_id, latitude, longitude
    FROM stores
    WHERE name IS NOT NULL AND address IS NOT NULL
    ORDER BY random()
    LIMIT 20
  `;

  console.log(JSON.stringify(stores, null, 2));
  await sql.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
