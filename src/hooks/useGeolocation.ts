"use client";

import { useCallback, useState } from "react";
import type { GeoPoint } from "@/lib/types";

export type GeoStatus = "idle" | "prompting" | "ready" | "denied" | "unavailable";

interface UseGeolocationResult {
  origin: GeoPoint | null;
  status: GeoStatus;
  error: string | null;
  requestLocation: () => Promise<GeoPoint | null>;
}

/**
 * Browser geolocation for nearby Google Places search.
 */
export function useGeolocation(): UseGeolocationResult {
  const [origin, setOrigin] = useState<GeoPoint | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      setError("Location is not available in this browser.");
      return null;
    }

    setStatus("prompting");
    setError(null);

    return new Promise<GeoPoint | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setOrigin(next);
          setStatus("ready");
          resolve(next);
        },
        (err) => {
          const denied = err.code === err.PERMISSION_DENIED;
          setStatus(denied ? "denied" : "unavailable");
          setError(
            denied
              ? "Location permission denied. Enable it to find stores near you."
              : "Could not read your location. Try again or use Demo Mode."
          );
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 60_000,
        }
      );
    });
  }, []);

  return { origin, status, error, requestLocation };
}
