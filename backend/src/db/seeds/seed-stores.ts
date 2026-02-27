/**
 * Store seed adapter — called by run-all.ts
 *
 * Phase 1: Upsert stores (on sourceId conflict)
 * Phase 2: Insert store hours (delete-then-insert per store for idempotency)
 */

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq, inArray, sql } from "drizzle-orm";
import { loadStoreSeedData } from "./stores-halal.js";
import { stores, storeHours } from "../schema/stores.js";

export async function seedStores(db: PostgresJsDatabase): Promise<number> {
  const { stores: storeData, hours: hoursData, stats, droppedSourceIds } = await loadStoreSeedData();
  let storeCount = 0;
  let hoursCount = 0;

  // ── Phase 0: Delete zombie duplicates from previous runs ──
  // This catches both:
  //   a) sourceIds dropped during dedup (e.g., avs-wholesaler-1152 when avs-butcher-1152 wins)
  //   b) Legacy format sourceIds (e.g., achahada-wholesaler-6961 → now achahada-6961)
  const survivingSourceIds = new Set(storeData.map((s) => s.sourceId));
  const allDbSourceIds = await db.select({ sourceId: stores.sourceId }).from(stores);
  const zombieIds = allDbSourceIds
    .map((r) => r.sourceId)
    .filter((id): id is string => id !== null && !survivingSourceIds.has(id));

  if (zombieIds.length > 0) {
    const BATCH = 50;
    let deletedCount = 0;
    for (let i = 0; i < zombieIds.length; i += BATCH) {
      const batch = zombieIds.slice(i, i + BATCH);
      const deleted = await db.delete(stores).where(inArray(stores.sourceId, batch)).returning({ id: stores.id });
      deletedCount += deleted.length;
    }
    if (deletedCount > 0) {
      console.log(`    Cleaned up ${deletedCount} zombie stores (not in current pipeline)`);
    }
  }

  // ── Phase 1: Upsert stores ──────────────────────────────
  for (const store of storeData) {
    await db
      .insert(stores)
      .values(store)
      .onConflictDoUpdate({
        target: stores.sourceId,
        set: {
          name: store.name,
          storeType: store.storeType,
          address: store.address,
          city: store.city,
          postalCode: store.postalCode,
          latitude: store.latitude,
          longitude: store.longitude,
          phone: store.phone,
          email: store.email,
          website: store.website,
          logoUrl: store.logoUrl,
          description: store.description,
          certifier: store.certifier,
          certifierName: store.certifierName,
          rawData: store.rawData,
          updatedAt: new Date(),
        },
      });
    storeCount++;
  }

  // ── Phase 2: Insert store hours ─────────────────────────
  if (hoursData.length > 0) {
    // Build sourceId → storeId lookup from the stores we just upserted
    const sourceIdToStoreId = new Map<string, string>();
    const achahadaSourceIds = [...new Set(hoursData.map((h) => h.sourceId))];

    for (const sourceId of achahadaSourceIds) {
      const [row] = await db
        .select({ id: stores.id })
        .from(stores)
        .where(eq(stores.sourceId, sourceId))
        .limit(1);
      if (row) sourceIdToStoreId.set(sourceId, row.id);
    }

    // Delete existing hours for these stores, then insert fresh
    for (const [sourceId, storeId] of sourceIdToStoreId) {
      await db.delete(storeHours).where(eq(storeHours.storeId, storeId));

      const rows = hoursData
        .filter((h) => h.sourceId === sourceId)
        .map((h) => ({
          storeId,
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
          isClosed: h.isClosed,
        }));

      if (rows.length > 0) {
        await db.insert(storeHours).values(rows);
        hoursCount += rows.length;
      }
    }
  }

  console.log(`    Stores: ${storeCount} | Hours: ${hoursCount} rows`);
  console.log(`    By source: ${JSON.stringify(stats.bySource)}`);
  console.log(`    By type: ${JSON.stringify(stats.byType)}`);

  return storeCount;
}
