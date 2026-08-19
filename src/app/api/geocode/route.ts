import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Geocode a city or ZIP/postcode for fallback search origin.
 * POST { address: "94103" | "San Francisco, CA" }
 */
export async function POST(request: NextRequest) {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      {
        error:
          "GOOGLE_MAPS_API_KEY is missing. Add it to .env.local to geocode a city or ZIP.",
        code: "MISSING_API_KEY",
      },
      { status: 503 }
    );
  }

  let body: { address?: string };
  try {
    body = (await request.json()) as { address?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const address = body.address?.trim();
  if (!address) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", address);
    url.searchParams.set("key", key);

    const upstream = await fetch(url, { cache: "no-store" });
    const data = (await upstream.json()) as {
      status: string;
      results?: Array<{
        formatted_address?: string;
        geometry?: { location?: { lat?: number; lng?: number } };
      }>;
      error_message?: string;
    };

    if (data.status !== "OK" || !data.results?.[0]?.geometry?.location) {
      return NextResponse.json(
        {
          error:
            data.error_message ??
            "Could not find that city or ZIP. Try a fuller address.",
          code: "GEOCODE_FAILED",
        },
        { status: 404 }
      );
    }

    const result = data.results[0];
    const lat = result.geometry!.location!.lat!;
    const lng = result.geometry!.location!.lng!;

    return NextResponse.json({
      lat,
      lng,
      label: result.formatted_address ?? address,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Geocode failed";
    console.error("[api/geocode]", message);
    return NextResponse.json({ error: message, code: "GEOCODE_ERROR" }, { status: 502 });
  }
}
