import type { Destination, GeoPoint, RankedDestination, SearchPreferences } from "@/lib/types";

/** Resolved search origin — GPS or saved city/ZIP fallback. */
export interface UserLocation {
  coordinates: GeoPoint;
  /** Human label, e.g. "Near you" or "94103" */
  label: string;
  source: "gps" | "fallback";
  updatedAt: number;
}

/** AI-understood intent from a natural-language request. */
export interface SearchIntent {
  rawQuery: string;
  /** Text sent to the places provider */
  placesQuery: string;
  category?: string;
  preferences: SearchPreferences;
}

/** Provider-agnostic place search request. */
export interface PlacesSearchRequest {
  query: string;
  /** Optional — without it, search is relevance-based (not nearby). */
  origin?: GeoPoint | null;
  radiusMeters: number;
  openNow?: boolean;
  category?: string;
}

/** Raw place record returned by a PlacesProvider (maps-agnostic). */
export interface PlacesProviderResult {
  destinations: Destination[];
}

export interface PlacesProvider {
  searchNearby(request: PlacesSearchRequest): Promise<PlacesProviderResult>;
}

export interface NavigationDirectionsParams {
  destination: GeoPoint;
  destinationName?: string;
  placeId?: string;
  origin?: GeoPoint;
}

/** Maps navigation adapter — swap Google for Mapbox/Apple later. */
export interface NavigationProvider {
  openDirections(params: NavigationDirectionsParams): void;
}

export interface RankedSearchResult {
  query: string;
  intent: SearchIntent;
  destinations: RankedDestination[];
  selectedId: string | null;
  origin?: GeoPoint;
  radiusMeters: number;
}
