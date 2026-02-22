/**
 * useUserLocation — GPS location with permission handling
 *
 * Two-phase strategy for fast centering (especially on Android):
 * 1. getLastKnownPositionAsync() — instant, uses OS-cached coords from other apps
 * 2. getCurrentPositionAsync(Balanced) — accurate fix, upgrades the cached position
 *
 * This avoids the 5-10s GPS cold-start delay on Android where
 * getCurrentPositionAsync alone leaves the map stuck on the default center.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import * as Location from "expo-location";

interface UserLocation {
  latitude: number;
  longitude: number;
}

type PermissionStatus = "undetermined" | "granted" | "denied";

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [permission, setPermission] = useState<PermissionStatus>("undetermined");
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  const requestAndFetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const permStatus = status === "granted" ? "granted" : "denied";
      if (!isMounted.current) return;
      setPermission(permStatus);

      if (permStatus !== "granted") {
        setIsLoading(false);
        return;
      }

      // Phase 1: Instant cached position (OS-level, from Google Play Services / CoreLocation)
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown && isMounted.current) {
        setLocation({
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
        });
        setIsLoading(false);
      }

      // Phase 2: Accurate GPS fix (upgrades the cached position)
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (isMounted.current) {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      }
    } catch {
      // Silently fail — location is optional
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    requestAndFetch();
    return () => { isMounted.current = false; };
  }, [requestAndFetch]);

  return { location, permission, isLoading, refresh: requestAndFetch };
}
