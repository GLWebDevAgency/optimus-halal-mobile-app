/**
 * useGeocode — French address geocoding via API BAN
 *
 * api-adresse.data.gouv.fr — free, no auth, French government.
 * Provides forward search (address → coords) and reverse (coords → address).
 */

import { useState, useCallback, useRef } from "react";

const BAN_BASE = "https://api-adresse.data.gouv.fr";

export interface GeocodeSuggestion {
  label: string;
  city: string;
  postcode: string;
  latitude: number;
  longitude: number;
}

export function useGeocode() {
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    // Cancel previous request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsSearching(true);
    try {
      const url = `${BAN_BASE}/search/?q=${encodeURIComponent(query)}&limit=5`;
      const res = await fetch(url, { signal: abortRef.current.signal });
      if (!res.ok) throw new Error(`BAN API ${res.status}`);

      const data = await res.json();
      const results: GeocodeSuggestion[] = (data.features ?? []).map(
        (f: any) => ({
          label: f.properties.label,
          city: f.properties.city,
          postcode: f.properties.postcode,
          longitude: f.geometry.coordinates[0],
          latitude: f.geometry.coordinates[1],
        }),
      );
      setSuggestions(results);
    } catch (err: any) {
      if (err.name !== "AbortError") setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const reverse = useCallback(
    async (lat: number, lon: number): Promise<string | null> => {
      try {
        const url = `${BAN_BASE}/reverse/?lat=${lat}&lon=${lon}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        return data.features?.[0]?.properties?.label ?? null;
      } catch {
        return null;
      }
    },
    [],
  );

  const clearSuggestions = useCallback(() => setSuggestions([]), []);

  return { suggestions, isSearching, search, reverse, clearSuggestions };
}
