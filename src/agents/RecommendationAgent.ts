import type { IntentCategory, Recommendation } from "@/models";
import type { PlanConstraints, Task } from "@/models";
import { RecommendationEngine, type PlaceLookup } from "@/planner";
import type { UserRoutine, PlaceCandidate } from "@/models";

/**
 * RecommendationAgent — wraps recommendation engine for stop-level why/alternatives.
 */
export class RecommendationAgent {
  constructor(private readonly placeLookup?: PlaceLookup) {}

  async recommendTasks(
    tasks: Task[],
    constraints: PlanConstraints,
    getRoutine?: (category: IntentCategory) => UserRoutine | undefined,
    getHome?: () => PlaceCandidate | undefined
  ): Promise<Recommendation[]> {
    const engine = new RecommendationEngine(
      this.placeLookup,
      getRoutine,
      getHome
    );
    return engine.recommend(tasks, constraints);
  }
}

export const recommendationAgent = new RecommendationAgent();
