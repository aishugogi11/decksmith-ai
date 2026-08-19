import type { GeoPoint } from "@/lib/types";

/**
 * Maps handoff — Lumen never does turn-by-turn; it opens an external maps app.
 */
export interface MapsProvider {
  openDirections(params: {
    destination: GeoPoint;
    destinationName?: string;
    origin?: GeoPoint;
    waypoints?: GeoPoint[];
  }): void;
}

export class GoogleMapsHandoffProvider implements MapsProvider {
  openDirections(params: {
    destination: GeoPoint;
    destinationName?: string;
    origin?: GeoPoint;
    waypoints?: GeoPoint[];
  }): void {
    if (typeof window === "undefined") return;

    let url: string;

    if (params.waypoints?.length) {
      const points: string[] = [];
      if (params.origin) {
        points.push(`${params.origin.lat},${params.origin.lng}`);
      }
      for (const wp of params.waypoints) {
        points.push(`${wp.lat},${wp.lng}`);
      }
      points.push(`${params.destination.lat},${params.destination.lng}`);
      url = `https://www.google.com/maps/dir/${points.map(encodeURIComponent).join("/")}`;
    } else {
      const u = new URL("https://www.google.com/maps/dir/?api=1");
      u.searchParams.set(
        "destination",
        `${params.destination.lat},${params.destination.lng}`
      );
      if (params.destinationName) {
        u.searchParams.set("destination", params.destinationName);
        // Prefer lat,lng for accuracy; name as query when useful
        u.searchParams.set(
          "destination",
          `${params.destination.lat},${params.destination.lng}`
        );
      }
      u.searchParams.set("travelmode", "driving");
      if (params.origin) {
        u.searchParams.set(
          "origin",
          `${params.origin.lat},${params.origin.lng}`
        );
      }
      url = u.toString();
    }

    openMapsUrl(url);
  }
}

/** Open Maps in a way that survives async voice callbacks better. */
function openMapsUrl(url: string) {
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (win) return;

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export class MapsService {
  constructor(private readonly provider: MapsProvider) {}

  navigateToStop(params: {
    destination: GeoPoint;
    destinationName?: string;
    origin?: GeoPoint;
  }) {
    this.provider.openDirections(params);
  }

  navigateFullRoute(params: {
    origin?: GeoPoint;
    stops: { coordinates: GeoPoint; name?: string }[];
  }) {
    if (!params.stops.length) return;
    const last = params.stops[params.stops.length - 1];
    const middle = params.stops.slice(0, -1).map((s) => s.coordinates);
    this.provider.openDirections({
      origin: params.origin,
      destination: last.coordinates,
      destinationName: last.name,
      waypoints: middle.length ? middle : undefined,
    });
  }
}

export const mapsService = new MapsService(new GoogleMapsHandoffProvider());
