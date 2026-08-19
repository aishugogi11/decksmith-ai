import type { ReplanEvent, RoutePlan, Stop } from "@/models";
import { uid } from "@/models/helpers";
import { stubTrafficProvider } from "@/lib/services/TrafficService";
import { itineraryOptimizer } from "./ItineraryOptimizer";
import { RecommendationEngine } from "./RecommendationEngine";
import type { PlaceLookup } from "./RecommendationEngine";
import type { PlaceCandidate } from "@/models";

export type ReplanAction =
  | { type: "skip_stop"; stopId: string }
  | { type: "traffic_bump"; extraMinutes?: number; stopId?: string }
  | { type: "closed"; stopId: string };

/**
 * Rebuilds itinerary when conditions change.
 */
export class DynamicReplanner {
  async replan(
    plan: RoutePlan,
    action: ReplanAction,
    opts?: {
      placeLookup?: PlaceLookup;
      getRoutine?: (category: string) => unknown;
      getHome?: () => PlaceCandidate | undefined;
    }
  ): Promise<RoutePlan> {
    const now = new Date().toISOString();
    let event: ReplanEvent;

    if (action.type === "skip_stop") {
      const stop = plan.stops.find((s) => s.id === action.stopId);
      event = {
        id: uid("replan"),
        type: "skip_stop",
        message: stop
          ? `Skipped ${stop.place.name}. Rebuilding the rest of your plan.`
          : "Skipped a stop. Rebuilding your plan.",
        createdAtIso: now,
        stopId: action.stopId,
      };

      const tasksForRebuild = plan.tasks
        .map((t) => {
          const skipped =
            plan.stops.find((s) => s.id === action.stopId)?.taskId === t.id;
          return skipped ? { ...t, status: "skipped" as const } : t;
        })
        .filter((t) => t.status !== "skipped" && t.status !== "done");

      const engine = new RecommendationEngine(
        opts?.placeLookup,
        opts?.getRoutine as never,
        opts?.getHome
      );
      const recommendations = await engine.recommend(
        tasksForRebuild,
        plan.constraints
      );
      const next = await itineraryOptimizer.optimize({
        utterance: plan.utterance,
        tasks: tasksForRebuild,
        recommendations,
        constraints: plan.constraints,
      });
      next.id = plan.id;
      next.createdAtIso = plan.createdAtIso;
      next.replanEvents = [...plan.replanEvents, event];
      next.updatedAtIso = now;
      next.spokenSummary = `${event.message} ${next.spokenSummary}`;
      return next;
    }

    if (action.type === "traffic_bump") {
      const factor = 1 + (action.extraMinutes ?? 15) / 40;
      stubTrafficProvider.setBumpFactor(Math.max(1.15, factor));

      const target = action.stopId
        ? plan.stops.find((s) => s.id === action.stopId)
        : plan.stops.find((s) => s.status === "active" || s.status === "pending");

      // Prefer an alternative for the affected stop if available
      let tasks = plan.tasks.filter((t) => t.status !== "skipped" && t.status !== "done");
      const engine = new RecommendationEngine(
        opts?.placeLookup,
        opts?.getRoutine as never,
        opts?.getHome
      );

      // Swap chosen place toward alternative when traffic bumps
      const recommendations = await engine.recommend(tasks, plan.constraints);
      if (target?.alternatives[0]) {
        const idx = recommendations.findIndex((r) => r.taskId === target.taskId);
        if (idx >= 0) {
          const alt = target.alternatives[0];
          const saved = Math.max(
            5,
            Math.round((action.extraMinutes ?? 15) * 0.8)
          );
          recommendations[idx] = {
            ...recommendations[idx],
            chosen: alt,
            reasons: [
              `Traffic near ${target.place.name} increased by about ${action.extraMinutes ?? 15} minutes`,
              `${alt.name} is now the faster option and should save about ${saved} minutes`,
              "it is currently open",
              "it keeps your overall itinerary moving",
            ],
            alternatives: [
              target.place,
              ...target.alternatives.filter((a) => a.id !== alt.id),
            ],
            detourMinutes: Math.max(3, (recommendations[idx].detourMinutes ?? 10) - 5),
          };
          event = {
            id: uid("replan"),
            type: "traffic_bump",
            message: `Traffic near ${target.place.name} has increased by ${action.extraMinutes ?? 15} minutes. ${alt.name} is now the faster option and will save approximately ${saved} minutes.`,
            createdAtIso: now,
            stopId: target.id,
            extraMinutes: action.extraMinutes ?? 15,
          };
        } else {
          event = {
            id: uid("replan"),
            type: "traffic_bump",
            message: `Traffic increased by about ${action.extraMinutes ?? 15} minutes. Recalculating your route.`,
            createdAtIso: now,
            extraMinutes: action.extraMinutes ?? 15,
          };
        }
      } else {
        event = {
          id: uid("replan"),
          type: "traffic_bump",
          message: `Traffic increased by about ${action.extraMinutes ?? 15} minutes. Recalculating your route.`,
          createdAtIso: now,
          extraMinutes: action.extraMinutes ?? 15,
        };
      }

      const next = await itineraryOptimizer.optimize({
        utterance: plan.utterance,
        tasks,
        recommendations,
        constraints: plan.constraints,
      });
      next.id = plan.id;
      next.createdAtIso = plan.createdAtIso;
      next.replanEvents = [...plan.replanEvents, event];
      next.updatedAtIso = now;
      next.spokenSummary = `${event.message} Updated plan: ${next.stops.map((s) => s.place.name).join(", then ")}.`;
      next.summary = next.stops.map((s) => s.place.name).join(" → ");
      return next;
    }

    // closed
    const stop = plan.stops.find((s) => s.id === action.stopId);
    event = {
      id: uid("replan"),
      type: "closed",
      message: stop
        ? `${stop.place.name} appears closed. Switching to an alternative.`
        : "A stop closed. Rebuilding.",
      createdAtIso: now,
      stopId: action.stopId,
    };

    const tasks = plan.tasks.filter((t) => t.status !== "done");
    const engine = new RecommendationEngine(
      opts?.placeLookup,
      opts?.getRoutine as never,
      opts?.getHome
    );
    const recommendations = await engine.recommend(tasks, plan.constraints);
    if (stop?.alternatives[0]) {
      const idx = recommendations.findIndex((r) => r.taskId === stop.taskId);
      if (idx >= 0) {
        recommendations[idx] = {
          ...recommendations[idx],
          chosen: stop.alternatives[0],
          reasons: [
            `${stop.place.name} is closed or unavailable`,
            `${stop.alternatives[0].name} is the best open alternative`,
            "it keeps your remaining errands on track",
          ],
          alternatives: [stop.place, ...stop.alternatives.slice(1)],
        };
      }
    }

    const next = await itineraryOptimizer.optimize({
      utterance: plan.utterance,
      tasks,
      recommendations,
      constraints: plan.constraints,
    });
    next.id = plan.id;
    next.createdAtIso = plan.createdAtIso;
    next.replanEvents = [...plan.replanEvents, event];
    next.updatedAtIso = now;
    next.spokenSummary = `${event.message} ${next.spokenSummary}`;
    return next;
  }
}

export const dynamicReplanner = new DynamicReplanner();

/** Helper to format why-this-stop copy */
export function whyThisStop(stop: Stop): string {
  if (!stop.reasons.length) return `${stop.place.name} fits this stop on your plan.`;
  return `I selected ${stop.place.name} because:\n${stop.reasons.map((r) => `• ${r}`).join("\n")}`;
}
