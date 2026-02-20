/**
 * useMapStores — Fetch nearby stores for the map viewport
 *
 * Zero debounce: the camera handler in map.tsx already debounces (200ms
 * post-gesture) and quantizes coordinates (~110m grid). By the time
 * region reaches this hook, it's stable and quantized — pass directly
 * to the query for minimum latency.
 *
 * Combined with speculative prefetch during gesture, this gives
 * near-instant store appearance when the user stops panning:
 * speculative fetch warms both TanStack Query cache and backend Redis,
 * so the final query often resolves from memory with 0ms network wait.
 */

import { trpc } from "@/lib/trpc";

interface MapRegion {
  latitude: number;
  longitude: number;
  radiusKm: number;
}

interface UseMapStoresOptions {
  storeType?: "supermarket" | "butcher" | "restaurant" | "bakery" | "abattoir" | "wholesaler" | "online" | "other";
  halalCertifiedOnly?: boolean;
  limit?: number;
}

export function useMapStores(
  region: MapRegion | null,
  options: UseMapStoresOptions = {},
) {
  const { storeType, halalCertifiedOnly = false, limit = 50 } = options;

  const query = trpc.store.nearby.useQuery(
    {
      latitude: region?.latitude ?? 0,
      longitude: region?.longitude ?? 0,
      radiusKm: region?.radiusKm ?? 5,
      storeType,
      halalCertifiedOnly,
      limit,
    },
    {
      enabled: region !== null,
      staleTime: 30_000,
      placeholderData: (prev) => prev,
      refetchOnWindowFocus: true,
    },
  );

  return query;
}
