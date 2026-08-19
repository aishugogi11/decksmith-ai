import { NextRequest, NextResponse } from "next/server";
import { plannerAgent } from "@/agents";
import { placesService } from "@/lib/services";
import type { PlaceCandidate } from "@/models";
import type { GeoPoint } from "@/lib/types";
import type { ReplanAction } from "@/planner";
import type { RoutePlan } from "@/models";

export const runtime = "nodejs";

interface PlanBody {
  utterance?: string;
  lat?: number;
  lng?: number;
  originLabel?: string;
  arriveByIso?: string;
  useMemory?: boolean;
  routines?: {
    category: string;
    placeName: string;
    placeId?: string;
    coordinates?: GeoPoint;
  }[];
  home?: PlaceCandidate;
  /** Existing plan + action for dynamic replan */
  plan?: RoutePlan;
  replan?: ReplanAction;
}

async function placeLookup(
  query: string,
  origin: GeoPoint | null
): Promise<PlaceCandidate[]> {
  if (!process.env.GOOGLE_MAPS_API_KEY?.trim()) return [];

  try {
    const ranked = await placesService.searchNearOrigin({
      query,
      origin,
      radiusMeters: 8000,
    });
    return ranked.destinations.slice(0, 5).map((d) => ({
      id: d.id,
      name: d.name,
      category: d.category,
      address: d.address,
      coordinates: d.coordinates,
      rating: d.rating,
      isOpen: d.isOpen,
      closesAt: d.closesAt,
      googleMapsUri: d.googleMapsUri,
      imageUrl: d.imageUrl,
    }));
  } catch {
    return [];
  }
}

/**
 * POST /api/plan
 * Create a daily itinerary from a natural-language goal,
 * or replan an existing RoutePlan.
 */
export async function POST(request: NextRequest) {
  let body: PlanBody;
  try {
    body = (await request.json()) as PlanBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const hasCoords =
    typeof body.lat === "number" &&
    typeof body.lng === "number" &&
    !Number.isNaN(body.lat) &&
    !Number.isNaN(body.lng);

  const origin = hasCoords
    ? { lat: body.lat as number, lng: body.lng as number }
    : null;

  try {
    if (body.plan && body.replan) {
      const next = await plannerAgent.replan(body.plan, body.replan, {
        placeLookup,
        getHome: body.home ? () => body.home : undefined,
      });
      return NextResponse.json(next);
    }

    const utterance = body.utterance?.trim();
    if (!utterance) {
      return NextResponse.json(
        { error: "utterance is required" },
        { status: 400 }
      );
    }

    const plan = await plannerAgent.createPlan({
      utterance,
      origin,
      originLabel: body.originLabel,
      arriveByIso: body.arriveByIso,
      useMemory: body.useMemory,
      routines: body.routines,
      home: body.home,
      placeLookup,
    });

    return NextResponse.json(plan);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Plan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
