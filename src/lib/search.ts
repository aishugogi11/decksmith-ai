import { DEMO_DESTINATIONS } from "./demoData";
import { aiRecommendationEngine } from "@/lib/services/AIRecommendationEngine";
import { DEFAULT_SEARCH_RADIUS_METERS } from "@/lib/services/LocationService";
import type { GeoPoint, SearchResult } from "./types";

export class SearchApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "SearchApiError";
    this.code = code;
    this.status = status;
  }
}

/**
 * Local Demo Mode — zero API keys.
 */
export async function runDemoSearch(
  query: string,
  options?: { delayMs?: number; origin?: GeoPoint | null }
): Promise<SearchResult> {
  const delay = options?.delayMs ?? 1600;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const intent = aiRecommendationEngine.understand(query);
  const destinations = aiRecommendationEngine.rank(DEMO_DESTINATIONS, intent);

  return {
    query,
    destinations,
    selectedId: destinations[0]?.id ?? null,
    source: "demo",
    origin: options?.origin ?? undefined,
    searchingNearYou: false,
    locationLabel: options?.origin ? "Demo area" : undefined,
    radiusMeters: DEFAULT_SEARCH_RADIUS_METERS,
  };
}

/**
 * Live search against /api/search.
 * Origin optional — without it, Google returns real places by relevance.
 */
export async function runLiveSearch(
  query: string,
  origin?: GeoPoint | null,
  options?: {
    radiusMeters?: number;
    searchingNearYou?: boolean;
    locationLabel?: string;
  }
): Promise<SearchResult> {
  const res = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      ...(origin
        ? { lat: origin.lat, lng: origin.lng }
        : {}),
      radiusMeters: options?.radiusMeters ?? DEFAULT_SEARCH_RADIUS_METERS,
      searchingNearYou: Boolean(options?.searchingNearYou && origin),
      locationLabel: options?.locationLabel,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  const data = (await res.json().catch(() => ({}))) as SearchResult & {
    error?: string;
    code?: string;
  };

  if (!res.ok) {
    throw new SearchApiError(
      data.error ?? "Live search failed",
      data.code ?? "SEARCH_FAILED",
      res.status
    );
  }

  return data;
}

/**
 * Prefer live Google search; Demo Mode only as fallback.
 */
export async function runSearch(
  query: string,
  options?: {
    delayMs?: number;
    origin?: GeoPoint | null;
    mode?: "auto" | "demo" | "live";
    searchingNearYou?: boolean;
    locationLabel?: string;
    radiusMeters?: number;
  }
): Promise<SearchResult> {
  const mode = options?.mode ?? "auto";

  if (mode === "demo") {
    return runDemoSearch(query, {
      delayMs: options?.delayMs,
      origin: options?.origin,
    });
  }

  return runLiveSearch(query, options?.origin, {
    radiusMeters: options?.radiusMeters,
    searchingNearYou: options?.searchingNearYou,
    locationLabel: options?.locationLabel,
  });
}
