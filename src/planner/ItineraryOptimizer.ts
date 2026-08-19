import type {
  PlanConstraints,
  Recommendation,
  RoutePlan,
  Stop,
  Task,
} from "@/models";
import { addMinutes, formatClock, uid } from "@/models/helpers";
import { distanceMiles } from "@/lib/geo";
import { travelMinutesFromMiles } from "@/models/helpers";
import { dwellMinutesFor } from "./IntentParser";
import { stubTrafficProvider } from "@/lib/services/TrafficService";

/**
 * Orders stops for efficiency (greedy NN) ending at home when present.
 */
export class ItineraryOptimizer {
  async optimize(params: {
    utterance: string;
    tasks: Task[];
    recommendations: Recommendation[];
    constraints: PlanConstraints;
  }): Promise<RoutePlan> {
    const { utterance, tasks, recommendations, constraints } = params;
    const byTask = new Map(recommendations.map((r) => [r.taskId, r]));
    const origin = constraints.origin!;

    const homeTask = tasks.find((t) => t.intent.category === "home");
    const errandTasks = tasks.filter((t) => t.intent.category !== "home");

    // Greedy nearest-neighbor on errands
    const remaining = [...errandTasks];
    const ordered: Task[] = [];
    let cursor = origin;

    while (remaining.length) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < remaining.length; i += 1) {
        const rec = byTask.get(remaining[i].id);
        if (!rec) continue;
        const d = distanceMiles(cursor, rec.chosen.coordinates);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      const next = remaining.splice(bestIdx, 1)[0];
      ordered.push(next);
      const rec = byTask.get(next.id);
      if (rec) cursor = rec.chosen.coordinates;
    }

    if (homeTask) ordered.push(homeTask);

    const stops: Stop[] = [];
    let timeCursor = constraints.nowIso;
    let prev = origin;
    const trafficFactor = stubTrafficProvider.getBumpFactor();

    for (let i = 0; i < ordered.length; i += 1) {
      const task = ordered[i];
      const rec = byTask.get(task.id);
      if (!rec) continue;

      const miles = distanceMiles(prev, rec.chosen.coordinates);
      const travel = travelMinutesFromMiles(miles, trafficFactor);
      const dwell = dwellMinutesFor(task.intent.category);
      const departByIso = timeCursor;
      const etaIso = addMinutes(timeCursor, travel);
      const afterDwell = addMinutes(etaIso, dwell);

      const trafficLabel =
        trafficFactor > 1.2
          ? `Heavier traffic · ~${travel} min`
          : `Light traffic · ~${travel} min`;

      stops.push({
        id: uid("stop"),
        taskId: task.id,
        place: rec.chosen,
        etaIso,
        departByIso,
        distanceMiles: Math.round(miles * 10) / 10,
        travelMinutesFromPrev: travel,
        dwellMinutes: dwell,
        hoursLabel: rec.chosen.isOpen
          ? `Open now${rec.chosen.closesAt ? ` · closes ${rec.chosen.closesAt}` : ""}`
          : "Hours uncertain",
        trafficLabel,
        reasons: rec.reasons.map((r) =>
          r.startsWith("it ") || r.startsWith("note")
            ? r
            : r
        ),
        alternatives: rec.alternatives,
        detourMinutes: rec.detourMinutes,
        status: i === 0 ? "active" : "pending",
      });

      timeCursor = afterDwell;
      prev = rec.chosen.coordinates;
    }

    // Mark first as active
    const tasksOut = tasks.map((t) => {
      const idx = ordered.findIndex((o) => o.id === t.id);
      return {
        ...t,
        status: (idx === 0 ? "active" : "pending") as Task["status"],
      };
    });

    const names = stops.map((s) => s.place.name);
    const lastEta = stops[stops.length - 1]?.etaIso;
    const arriveLabel = lastEta ? formatClock(lastEta) : "";

    let summary = names.length
      ? `${names.join(" → ")}`
      : "No stops planned yet";
    if (arriveLabel) {
      summary += ` · arrive ~${arriveLabel}`;
    }

    const spokenSummary = buildSpokenPlan(stops, arriveLabel);

    const now = new Date().toISOString();
    return {
      id: uid("plan"),
      utterance,
      summary,
      spokenSummary,
      constraints,
      tasks: tasksOut,
      stops,
      suggestedStops: [],
      replanEvents: [],
      createdAtIso: now,
      updatedAtIso: now,
    };
  }
}

/** Speak a full explanation of the next stop, then the rest of the plan. */
function buildSpokenPlan(
  stops: Stop[],
  arriveLabel: string
): string {
  if (!stops.length) {
    return "I couldn't build a plan from that. Try listing a few errands.";
  }

  const next = stops[0];
  const parts: string[] = [explainStop(next, { isNext: true })];

  if (stops.length > 1) {
    const rest = stops.slice(1).map((s) => s.place.name);
    parts.push(
      `After that you'll go to ${rest.join(", then ")}${
        arriveLabel ? `, and wrap up around ${arriveLabel}` : ""
      }.`
    );
  }

  parts.push(
    `Say navigate when you're ready, and I'll open Google Maps for ${next.place.name}.`
  );

  return parts.join(" ");
}

/** Natural-language explanation of why this stop was chosen. */
function explainStop(
  stop: Stop,
  opts?: { isNext?: boolean }
): string {
  const name = stop.place.name;
  const category = speakableCategory(stop.place.category);
  const lead = opts?.isNext
    ? `Your next stop is ${name}`
    : `I chose ${name}`;

  const bits: string[] = [lead];

  if (category && category !== "home" && category !== name.toLowerCase()) {
    bits[0] += `, for ${category}`;
  }

  // Keep speech shorter so browsers actually play it
  if (stop.distanceMiles > 0) {
    bits.push(
      `about ${stop.distanceMiles.toFixed(1)} miles away, around ${stop.travelMinutesFromPrev} minutes`
    );
  }

  if (stop.hoursLabel && /open now/i.test(stop.hoursLabel)) {
    bits.push("it's open now");
  }

  if (stop.etaIso) {
    bits.push(`arrive around ${formatClock(stop.etaIso)}`);
  }

  const reasons = stop.reasons
    .map(speakableReason)
    .filter(Boolean)
    .slice(0, 2);

  if (reasons.length === 1) {
    bits.push(`I picked it because ${reasons[0]}`);
  } else if (reasons.length > 1) {
    bits.push(`I picked it because ${reasons[0]}, and ${reasons[1]}`);
  }

  if (bits.length === 1) return `${bits[0]}.`;
  return `${bits[0]}. ${bits.slice(1).join(". ")}.`;
}

/** Friendly category wording for TTS (avoid Google’s “Drugstore”). */
function speakableCategory(raw?: string): string | null {
  if (!raw) return null;
  const t = raw.trim().toLowerCase();
  if (!t) return null;
  if (/drug\s*store|pharmacy|chemist/.test(t)) return "pharmacy";
  if (/grocery|supermarket|convenience/.test(t)) return "groceries";
  if (/gas_station|gas station|fuel/.test(t)) return "gas";
  if (/cafe|coffee/.test(t)) return "coffee";
  if (/restaurant|meal_takeaway|food/.test(t)) return "food";
  return t;
}

function speakableReason(reason?: string): string {
  if (!reason) return "";
  return reason
    .replace(/^note:\s*/i, "")
    .replace(/\bdrug\s*stores?\b/gi, "pharmacies")
    .trim();
}

export const itineraryOptimizer = new ItineraryOptimizer();
