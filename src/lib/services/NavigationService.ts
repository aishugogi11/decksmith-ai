import type {
  NavigationDirectionsParams,
  NavigationProvider,
} from "@/lib/services/types";

/**
 * Google Maps directions provider.
 * Swap this out without touching recommendation logic.
 */
export class GoogleMapsNavigationProvider implements NavigationProvider {
  openDirections(params: NavigationDirectionsParams): void {
    if (typeof window === "undefined") return;

    const url = new URL("https://www.google.com/maps/dir/");
    url.searchParams.set("api", "1");
    url.searchParams.set(
      "destination",
      `${params.destination.lat},${params.destination.lng}`
    );
    url.searchParams.set("travelmode", "driving");

    if (params.origin) {
      url.searchParams.set(
        "origin",
        `${params.origin.lat},${params.origin.lng}`
      );
    }

    window.open(url.toString(), "_blank", "noopener,noreferrer");
  }
}

/**
 * NavigationService — opens turn-by-turn directions via the configured provider.
 */
export class NavigationService {
  constructor(private readonly provider: NavigationProvider) {}

  openDirections(params: NavigationDirectionsParams): void {
    this.provider.openDirections(params);
  }

  /** Convenience for recommendation cards. */
  navigateToPlace(params: {
    coordinates: { lat: number; lng: number };
    name?: string;
    placeId?: string;
    origin?: { lat: number; lng: number };
  }): void {
    this.openDirections({
      destination: params.coordinates,
      destinationName: params.name,
      placeId: params.placeId,
      origin: params.origin,
    });
  }
}

export const navigationService = new NavigationService(
  new GoogleMapsNavigationProvider()
);
