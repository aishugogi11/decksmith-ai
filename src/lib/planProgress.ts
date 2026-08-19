import type { RoutePlan, Stop } from "@/models";

/** Find a stop by spoken place name (fuzzy). */
export function findStopByName(
  plan: RoutePlan | null | undefined,
  spokenName: string
): Stop | null {
  if (!plan?.stops.length || !spokenName.trim()) return null;
  const q = spokenName.toLowerCase().trim();

  const exact = plan.stops.find((s) => s.place.name.toLowerCase() === q);
  if (exact) return exact;

  const includes = plan.stops.find(
    (s) =>
      s.place.name.toLowerCase().includes(q) ||
      q.includes(s.place.name.toLowerCase())
  );
  if (includes) return includes;

  // Token overlap (e.g. "trader joes" vs "Trader Joe's")
  const tokens = q.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  let best: Stop | null = null;
  let bestScore = 0;
  for (const s of plan.stops) {
    const name = s.place.name.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
    const score = tokens.filter((t) => name.includes(t)).length;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return bestScore > 0 ? best : null;
}
export function getActiveStop(plan: RoutePlan | null | undefined): Stop | null {
  if (!plan?.stops.length) return null;
  return (
    plan.stops.find((s) => s.status === "active") ??
    plan.stops.find((s) => s.status === "pending") ??
    null
  );
}

/** Next stop after the current active/pending one. */
export function getNextStop(plan: RoutePlan | null | undefined): Stop | null {
  if (!plan?.stops.length) return null;
  const activeIdx = plan.stops.findIndex((s) => s.status === "active");
  const start = activeIdx >= 0 ? activeIdx + 1 : 0;
  for (let i = start; i < plan.stops.length; i += 1) {
    const s = plan.stops[i];
    if (s.status === "pending" || s.status === "active") return s;
  }
  // If active is last pending-ish, find first still pending after done ones
  return plan.stops.find((s) => s.status === "pending") ?? null;
}

/**
 * Mark `completedId` done and activate the following stop.
 */
export function advancePlanAfterNavigate(
  plan: RoutePlan,
  completedId: string
): RoutePlan {
  const stops = plan.stops.map((s) => {
    if (s.id === completedId) return { ...s, status: "done" as const };
    return s;
  });

  const nextPending = stops.find((s) => s.status === "pending");
  const withActive = stops.map((s) => {
    if (nextPending && s.id === nextPending.id) {
      return { ...s, status: "active" as const };
    }
    if (s.status === "active" && s.id !== completedId) {
      return { ...s, status: "pending" as const };
    }
    return s;
  });

  const tasks = plan.tasks.map((t) => {
    const stop = withActive.find((s) => s.taskId === t.id);
    if (!stop) return t;
    return { ...t, status: stop.status };
  });

  return {
    ...plan,
    stops: withActive,
    tasks,
    updatedAtIso: new Date().toISOString(),
  };
}
