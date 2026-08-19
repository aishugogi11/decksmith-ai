import type { PlaceCandidate, RoutePlan } from "@/models";
import type { GeoPoint } from "@/lib/types";
import type { ReplanAction } from "@/planner";

export async function createPlan(params: {
  utterance: string;
  origin?: GeoPoint | null;
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
}): Promise<RoutePlan> {
  const res = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      utterance: params.utterance,
      lat: params.origin?.lat,
      lng: params.origin?.lng,
      originLabel: params.originLabel,
      arriveByIso: params.arriveByIso,
      useMemory: params.useMemory,
      routines: params.routines,
      home: params.home,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  const data = (await res.json().catch(() => ({}))) as RoutePlan & {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to create plan");
  }
  return data;
}

export async function replanRoute(
  plan: RoutePlan,
  replan: ReplanAction,
  home?: PlaceCandidate
): Promise<RoutePlan> {
  const res = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, replan, home }),
    signal: AbortSignal.timeout(20_000),
  });

  const data = (await res.json().catch(() => ({}))) as RoutePlan & {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to replan");
  }
  return data;
}
