/**
 * useMapStores — Fetch nearby stores for the map viewport
 *
 * Debounces calls to trpc.store.nearby when camera moves.
 */

import { useState, useEffect, useRef } from "react";
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
  debounceMs?: number;
}

export function useMapStores(
  region: MapRegion | null,
  options: UseMapStoresOptions = {},
) {
  const { storeType, halalCertifiedOnly = false, limit = 50, debounceMs = 300 } = options;
  const [debouncedRegion, setDebouncedRegion] = useState(region);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedRegion(region);
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [region?.latitude, region?.longitude, region?.radiusKm, debounceMs]);

  const query = trpc.store.nearby.useQuery(
    {
      latitude: debouncedRegion?.latitude ?? 0,
      longitude: debouncedRegion?.longitude ?? 0,
      radiusKm: debouncedRegion?.radiusKm ?? 5,
      storeType,
      halalCertifiedOnly,
      limit,
    },
    {
      enabled: debouncedRegion !== null,
      staleTime: 30_000,
      placeholderData: (prev) => prev,
    },
  );

  return query;
}
