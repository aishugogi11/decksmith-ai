"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  locationService,
  type UserLocation,
} from "@/lib/services";

export type LocationAwarenessStatus =
  | "bootstrapping"
  | "prompting"
  | "ready"
  | "denied"
  | "fallback"
  | "unavailable";

interface UseLocationAwarenessResult {
  location: UserLocation | null;
  status: LocationAwarenessStatus;
  error: string | null;
  searchingNearYou: boolean;
  /** Request / re-request GPS */
  requestGps: () => Promise<UserLocation | null>;
  /** Save city or ZIP as fallback origin */
  saveFallback: (cityOrZip: string) => Promise<UserLocation>;
  clearFallback: () => void;
}

/**
 * First-launch geolocation + continuous GPS watch + city/ZIP fallback.
 */
export function useLocationAwareness(): UseLocationAwarenessResult {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [status, setStatus] = useState<LocationAwarenessStatus>("bootstrapping");
  const [error, setError] = useState<string | null>(null);

  const applyFallback = useCallback(() => {
    const stored = locationService.getFallback();
    if (stored) {
      setLocation({
        coordinates: stored.coordinates,
        label: stored.label,
        source: "fallback",
        updatedAt: stored.savedAt,
      });
      setStatus("fallback");
      setError(null);
      return true;
    }
    return false;
  }, []);

  const requestGps = useCallback(async () => {
    if (!locationService.isGeolocationAvailable()) {
      setStatus("unavailable");
      setError("Location is not available in this browser.");
      applyFallback();
      return null;
    }

    setStatus("prompting");
    setError(null);
    const gps = await locationService.requestCurrentPosition();
    if (gps) {
      setLocation(gps);
      setStatus("ready");
      setError(null);
      return gps;
    }

    setStatus("denied");
    setError("Location permission denied. Enter a city or ZIP instead.");
    applyFallback();
    return null;
  }, [applyFallback]);

  // First launch: ask for location, then watch continuously if granted
  useEffect(() => {
    let stopWatch: (() => void) | undefined;
    let cancelled = false;

    async function bootstrap() {
      if (!locationService.isGeolocationAvailable()) {
        if (!cancelled) {
          setStatus("unavailable");
          if (!applyFallback()) {
            setError("Location unavailable — enter a city or ZIP to search nearby.");
          }
        }
        return;
      }

      setStatus("prompting");
      const gps = await locationService.requestCurrentPosition();
      if (cancelled) return;

      if (gps) {
        setLocation(gps);
        setStatus("ready");
        setError(null);

        stopWatch = locationService.watchPosition(
          (next) => {
            if (cancelled) return;
            setLocation(next);
            setStatus("ready");
          },
          (denied, message) => {
            if (cancelled) return;
            if (denied) {
              setStatus("denied");
              setError(message);
              applyFallback();
            }
          }
        );
        return;
      }

      setStatus("denied");
      setError("Location permission denied. Enter a city or ZIP instead.");
      applyFallback();
    }

    void bootstrap();

    return () => {
      cancelled = true;
      stopWatch?.();
    };
  }, [applyFallback]);

  const saveFallback = useCallback(async (cityOrZip: string) => {
    const next = await locationService.geocodeFallback(cityOrZip);
    setLocation(next);
    setStatus("fallback");
    setError(null);
    return next;
  }, []);

  const clearFallback = useCallback(() => {
    locationService.clearFallback();
    if (location?.source === "fallback") {
      setLocation(null);
      setStatus("denied");
    }
  }, [location?.source]);

  const searchingNearYou = useMemo(
    () => location?.source === "gps",
    [location?.source]
  );

  return {
    location,
    status,
    error,
    searchingNearYou,
    requestGps,
    saveFallback,
    clearFallback,
  };
}
