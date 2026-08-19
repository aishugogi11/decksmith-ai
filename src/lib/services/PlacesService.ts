import { distanceMiles } from "@/lib/geo";
import {
  runGooglePlaceFetch,
  type GooglePlaceFetchOptions,
} from "@/lib/google/places";
import { aiRecommendationEngine } from "@/lib/services/AIRecommendationEngine";
import { DEFAULT_SEARCH_RADIUS_METERS } from "@/lib/services/LocationService";
import type {
  PlacesProvider,
  PlacesSearchRequest,
  PlacesProviderResult,
  RankedSearchResult,
} from "@/lib/services/types";
import type { GeoPoint, SearchResult } from "@/lib/types";

/**
 * Google Places adapter — the only file that should talk to Google Places.
 */
export class GooglePlacesProvider implements PlacesProvider {
  async searchNearby(request: PlacesSearchRequest): Promise<PlacesProviderResult> {
    const options: GooglePlaceFetchOptions = {
      query: request.query,
      origin: request.origin,
      radiusMeters: request.radiusMeters,
      openNow: request.openNow,
    };

    const destinations = await runGooglePlaceFetch(options);

    if (!request.origin) {
      return { destinations };
    }

    // Enforce hard radius when we have a GPS/ZIP origin
    const maxMiles = request.radiusMeters / 1609.344;
    const filtered = destinations.filter(
      (d) => distanceMiles(request.origin!, d.coordinates) <= maxMiles + 0.15
    );

    return { destinations: filtered.length ? filtered : destinations };
  }
}

/**
 * PlacesService — queries a PlacesProvider, then ranks via AIRecommendationEngine.
 * Recommendation ranking stays decoupled from the maps provider.
 */
export class PlacesService {
  constructor(private readonly provider: PlacesProvider) {}

  async searchNearOrigin(params: {
    query: string;
    origin?: GeoPoint | null;
    radiusMeters?: number;
  }): Promise<RankedSearchResult> {
    const radiusMeters = params.radiusMeters ?? DEFAULT_SEARCH_RADIUS_METERS;
    const intent = aiRecommendationEngine.understand(params.query);

    const { destinations } = await this.provider.searchNearby({
      query: intent.placesQuery,
      origin: params.origin,
      radiusMeters,
      openNow: intent.preferences.openNow,
      category: intent.category,
    });

    const ranked = aiRecommendationEngine.rank(destinations, intent);

    return {
      query: params.query,
      intent,
      destinations: ranked,
      selectedId: ranked[0]?.id ?? null,
      origin: params.origin ?? undefined,
      radiusMeters,
    };
  }

  /** Shape used by the existing UI SearchResult contract. */
  toSearchResult(
    ranked: RankedSearchResult,
    options?: { searchingNearYou?: boolean; locationLabel?: string }
  ): SearchResult {
    return {
      query: ranked.query,
      destinations: ranked.destinations,
      selectedId: ranked.selectedId,
      source: "google",
      origin: ranked.origin,
      searchingNearYou: options?.searchingNearYou,
      locationLabel: options?.locationLabel,
      radiusMeters: ranked.radiusMeters,
    };
  }
}

export const placesService = new PlacesService(new GooglePlacesProvider());
