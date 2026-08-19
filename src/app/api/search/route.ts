import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_SEARCH_RADIUS_METERS,
  placesService,
} from "@/lib/services";

export const runtime = "nodejs";

interface SearchBody {
  query?: string;
  lat?: number;
  lng?: number;
  radiusMeters?: number;
  searchingNearYou?: boolean;
  locationLabel?: string;
}

/**
 * Google Places search.
 * With lat/lng → nearby within radius.
 * Without lat/lng → relevance search (still real places).
 *
 * POST { query, lat?, lng?, radiusMeters? }
 */
export async function POST(request: NextRequest) {
  if (!process.env.GOOGLE_MAPS_API_KEY?.trim()) {
    return NextResponse.json(
      {
        error:
          "GOOGLE_MAPS_API_KEY is missing. Add it to .env.local to enable live Google search.",
        code: "MISSING_API_KEY",
      },
      { status: 503 }
    );
  }

  let body: SearchBody;
  try {
    body = (await request.json()) as SearchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const query = body.query?.trim();
  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const hasCoords =
    typeof body.lat === "number" &&
    typeof body.lng === "number" &&
    !Number.isNaN(body.lat) &&
    !Number.isNaN(body.lng);

  const origin = hasCoords
    ? { lat: body.lat as number, lng: body.lng as number }
    : null;

  const radiusMeters =
    typeof body.radiusMeters === "number" && body.radiusMeters > 0
      ? body.radiusMeters
      : Number(process.env.GOOGLE_SEARCH_RADIUS_METERS ?? DEFAULT_SEARCH_RADIUS_METERS);

  try {
    const ranked = await placesService.searchNearOrigin({
      query,
      origin,
      radiusMeters,
    });

    const result = placesService.toSearchResult(ranked, {
      searchingNearYou: Boolean(body.searchingNearYou && origin),
      locationLabel:
        body.locationLabel ??
        (origin ? undefined : "Anywhere (no location)"),
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    console.error("[api/search]", message);
    return NextResponse.json({ error: message, code: "PLACES_ERROR" }, { status: 502 });
  }
}
