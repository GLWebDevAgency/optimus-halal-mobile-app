/**
 * useMapSearch — Hybrid search: stores + addresses
 *
 * Combines two sources in parallel:
 * 1. tRPC store.search — matching store names/addresses in DB
 * 2. API BAN geocoding — French address → coordinates
 *
 * Results displayed in two sections: "Commerces" + "Adresses"
 * Selecting a store → fly-to + open detail
 * Selecting an address → fly-to (existing geocode behavior)
 */

import { useState, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";

const BAN_BASE = "https://api-adresse.data.gouv.fr";

export interface StoreSearchResult {
  type: "store";
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  storeType: string;
  halalCertified: boolean;
  averageRating: number;
  distance?: number;
}

export interface AddressSearchResult {
  type: "address";
  label: string;
  city: string;
  postcode: string;
  latitude: number;
  longitude: number;
}

export type SearchResult = StoreSearchResult | AddressSearchResult;

export function useMapSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const utils = trpc.useUtils();

  const search = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    // Cancel previous in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setIsSearching(true);
    try {
      // Fire both searches in parallel
      const [storeResults, banResults] = await Promise.allSettled([
        // tRPC store search
        utils.store.search.fetch({ query: trimmed, limit: 5 }),
        // BAN geocoding
        fetch(
          `${BAN_BASE}/search/?q=${encodeURIComponent(trimmed)}&limit=4`,
          { signal },
        ).then((r) => r.ok ? r.json() : null),
      ]);

      if (signal.aborted) return;

      const combined: SearchResult[] = [];

      // Stores first (higher relevance for our use case)
      if (storeResults.status === "fulfilled" && storeResults.value?.items) {
        for (const s of storeResults.value.items) {
          combined.push({
            type: "store",
            id: s.id,
            name: s.name,
            address: s.address,
            city: s.city,
            latitude: s.latitude,
            longitude: s.longitude,
            storeType: s.storeType,
            halalCertified: s.halalCertified,
            averageRating: s.averageRating,
          });
        }
      }

      // Addresses after
      if (banResults.status === "fulfilled" && banResults.value?.features) {
        for (const f of banResults.value.features) {
          combined.push({
            type: "address",
            label: f.properties.label,
            city: f.properties.city,
            postcode: f.properties.postcode,
            latitude: f.geometry.coordinates[1],
            longitude: f.geometry.coordinates[0],
          });
        }
      }

      setResults(combined);
    } catch (err: any) {
      if (err.name !== "AbortError") setResults([]);
    } finally {
      if (!signal.aborted) setIsSearching(false);
    }
  }, [utils]);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setResults([]);
    setIsSearching(false);
  }, []);

  return { results, isSearching, search, clear };
}
