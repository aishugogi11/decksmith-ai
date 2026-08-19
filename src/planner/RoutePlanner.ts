import type {
  IntentCategory,
  PlaceCandidate,
  PlanConstraints,
  RoutePlan,
  UserRoutine,
} from "@/models";
import type { GeoPoint } from "@/lib/types";
import { intentParser } from "./IntentParser";
import { constraintParser } from "./ConstraintParser";
import { RecommendationEngine, type PlaceLookup } from "./RecommendationEngine";
import { itineraryOptimizer } from "./ItineraryOptimizer";

export interface PlanRequest {
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
  placeLookup?: PlaceLookup;
}

/**
 * Orchestrates intent → recommend → optimize into a RoutePlan.
 */
export class RoutePlanner {
  async plan(req: PlanRequest): Promise<RoutePlan> {
    const constraints: PlanConstraints = constraintParser.parse({
      utterance: req.utterance,
      origin: req.origin,
      originLabel: req.originLabel,
      arriveByIso: req.arriveByIso,
      useMemory: req.useMemory,
    });

    const intents = intentParser.parse(req.utterance);
    const tasks = intentParser.toTasks(intents);

    const engine = new RecommendationEngine(
      req.placeLookup,
      (category: IntentCategory) => {
        if (!req.useMemory || !req.routines) return undefined;
        const match = req.routines.find((r) => r.category === category);
        if (!match) return undefined;
        const routine: UserRoutine = {
          id: `tmp_${category}`,
          category,
          placeName: match.placeName,
          placeId: match.placeId,
          coordinates: match.coordinates,
          cadence: "anytime",
          frequency: 1,
        };
        return routine;
      },
      () => req.home
    );

    const recommendations = await engine.recommend(tasks, constraints);
    return itineraryOptimizer.optimize({
      utterance: req.utterance,
      tasks,
      recommendations,
      constraints,
    });
  }
}

export const routePlanner = new RoutePlanner();
