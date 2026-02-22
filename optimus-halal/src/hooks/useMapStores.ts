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
  openNow?: boolean;
  minRating?: number;
  query?: string;
  limit?: number;
}

export function useMapStores(
  region: MapRegion | null,
  options: UseMapStoresOptions = {},
) {
  const { storeType, halalCertifiedOnly = false, openNow = false, minRating, query: searchQuery, limit = 50 } = options;

  const result = trpc.store.nearby.useQuery(
    {
      latitude: region?.latitude ?? 0,
      longitude: region?.longitude ?? 0,
      radiusKm: region?.radiusKm ?? 5,
      storeType,
      halalCertifiedOnly,
      openNow,
      minRating,
      query: searchQuery,
      limit,
    },
    {
      enabled: region !== null,
      // When openNow is active, reduce staleTime since status changes in real-time
      staleTime: openNow ? 15_000 : 30_000,
      placeholderData: (prev) => prev,
      refetchOnWindowFocus: false,
    },
  );

  return result;
}
