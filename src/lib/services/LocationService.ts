import type { GeoPoint } from "@/lib/types";
import type { UserLocation } from "@/lib/services/types";

const FALLBACK_STORAGE_KEY = "lumen.fallbackLocation";

/** Default search radius: 10 km */
export const DEFAULT_SEARCH_RADIUS_METERS = 10_000;

export interface StoredFallbackLocation {
  coordinates: GeoPoint;
  label: string;
  savedAt: number;
}

/**
 * LocationService — GPS awareness + city/ZIP fallback.
 * Browser-only for geolocation; storage helpers are SSR-safe.
 */
export class LocationService {
  readonly defaultRadiusMeters = DEFAULT_SEARCH_RADIUS_METERS;

  isGeolocationAvailable(): boolean {
    return typeof navigator !== "undefined" && Boolean(navigator.geolocation);
  }

  getFallback(): StoredFallbackLocation | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(FALLBACK_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredFallbackLocation;
      if (
        typeof parsed?.coordinates?.lat !== "number" ||
        typeof parsed?.coordinates?.lng !== "number"
      ) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  saveFallback(coordinates: GeoPoint, label: string): UserLocation {
    const stored: StoredFallbackLocation = {
      coordinates,
      label: label.trim(),
      savedAt: Date.now(),
    };
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(stored));
    }
    return {
      coordinates,
      label: stored.label,
      source: "fallback",
      updatedAt: stored.savedAt,
    };
  }

  clearFallback(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(FALLBACK_STORAGE_KEY);
  }

  /**
   * One-shot GPS read (used on first launch / explicit refresh).
   */
  requestCurrentPosition(options?: PositionOptions): Promise<UserLocation | null> {
    if (!this.isGeolocationAvailable()) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            coordinates: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            },
            label: "Near you",
            source: "gps",
            updatedAt: Date.now(),
          });
        },
        () => resolve(null),
        {
          enableHighAccuracy: true,
          timeout: 12_000,
          maximumAge: 30_000,
          ...options,
        }
      );
    });
  }

  /**
   * Continuously track GPS. Returns an unsubscribe function.
   */
  watchPosition(
    onUpdate: (location: UserLocation) => void,
    onError?: (denied: boolean, message: string) => void
  ): () => void {
    if (!this.isGeolocationAvailable()) {
      onError?.(false, "Location is not available in this browser.");
      return () => undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        onUpdate({
          coordinates: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
          label: "Near you",
          source: "gps",
          updatedAt: Date.now(),
        });
      },
      (err) => {
        const denied = err.code === err.PERMISSION_DENIED;
        onError?.(
          denied,
          denied
            ? "Location permission denied."
            : "Could not read your location."
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15_000,
        timeout: 20_000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }

  /**
   * Prefer live GPS; otherwise saved city/ZIP fallback.
   */
  resolveSearchOrigin(gps: UserLocation | null): UserLocation | null {
    if (gps?.source === "gps") return gps;
    const fallback = this.getFallback();
    if (!fallback) return gps;
    return {
      coordinates: fallback.coordinates,
      label: fallback.label,
      source: "fallback",
      updatedAt: fallback.savedAt,
    };
  }

  /**
   * Geocode a city or ZIP via Lumen's geocode API.
   */
  async geocodeFallback(query: string): Promise<UserLocation> {
    const trimmed = query.trim();
    if (!trimmed) {
      throw new Error("Enter a city or ZIP/postcode.");
    }

    const res = await fetch("/api/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: trimmed }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      lat?: number;
      lng?: number;
      label?: string;
      error?: string;
    };

    if (!res.ok || typeof data.lat !== "number" || typeof data.lng !== "number") {
      throw new Error(data.error ?? "Could not find that city or ZIP.");
    }

    return this.saveFallback(
      { lat: data.lat, lng: data.lng },
      data.label ?? trimmed
    );
  }
}

export const locationService = new LocationService();
