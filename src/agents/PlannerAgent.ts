import type { PlaceCandidate, RoutePlan } from "@/models";
import type { GeoPoint } from "@/lib/types";
import {
  routePlanner,
  dynamicReplanner,
  type PlaceLookup,
  type ReplanAction,
} from "@/planner";

/**
 * PlannerAgent — understands goals and returns an optimized itinerary.
 */
export class PlannerAgent {
  async createPlan(input: {
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
  }): Promise<RoutePlan> {
    return routePlanner.plan(input);
  }

  async replan(
    plan: RoutePlan,
    action: ReplanAction,
    opts?: {
      placeLookup?: PlaceLookup;
      getHome?: () => PlaceCandidate | undefined;
    }
  ): Promise<RoutePlan> {
    return dynamicReplanner.replan(plan, action, opts);
  }
}

export const plannerAgent = new PlannerAgent();
