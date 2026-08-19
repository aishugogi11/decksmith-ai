import type { GeoPoint } from "@/lib/types";

/** Minutes of driving given miles (urban estimate). */
export function travelMinutesFromMiles(miles: number, trafficFactor = 1): number {
  return Math.max(3, Math.round(miles * 12 * trafficFactor));
}

export function addMinutes(iso: string, minutes: number): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

export function formatClock(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Default SF-ish origin when GPS unavailable (demo corridor). */
export const FALLBACK_ORIGIN: GeoPoint = {
  lat: 37.7749,
  lng: -122.4194,
};
