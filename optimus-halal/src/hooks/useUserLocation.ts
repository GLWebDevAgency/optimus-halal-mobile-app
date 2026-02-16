/**
 * useUserLocation — GPS location with permission handling
 *
 * Returns current coordinates, permission state, and a refresh function.
 * Uses expo-location for GPS access.
 */

import { useState, useEffect, useCallback } from "react";
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

  const requestAndFetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const permStatus = status === "granted" ? "granted" : "denied";
      setPermission(permStatus);

      if (permStatus !== "granted") {
        setIsLoading(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
    } catch {
      // Silently fail — location is optional
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    requestAndFetch();
  }, [requestAndFetch]);

  return { location, permission, isLoading, refresh: requestAndFetch };
}
