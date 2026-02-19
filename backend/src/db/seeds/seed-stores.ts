/**
 * Store seed adapter — called by run-all.ts
 */

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { loadStoreSeedData } from "./stores-halal.js";
import { stores } from "../schema/stores.js";

export async function seedStores(db: PostgresJsDatabase): Promise<number> {
  const { stores: storeData } = await loadStoreSeedData();
  let count = 0;

  for (const store of storeData) {
    await db
      .insert(stores)
      .values(store)
      .onConflictDoUpdate({
        target: stores.sourceId,
        set: {
          name: store.name,
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
          rawData: store.rawData,
          updatedAt: new Date(),
        },
      });
    count++;
  }

  return count;
}
