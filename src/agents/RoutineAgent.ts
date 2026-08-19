import { routineEngine, preferenceStore } from "@/memory";
import type { IntentCategory, UserRoutine } from "@/models";

/**
 * RoutineAgent — surfaces patterns, never raw place history.
 */
export class RoutineAgent {
  listRoutines(): UserRoutine[] {
    return routineEngine.list();
  }

  prefer(category: IntentCategory) {
    return routineEngine.preferFor(category);
  }

  rememberStop(params: {
    category: IntentCategory;
    placeName: string;
    placeId?: string;
    coordinates?: { lat: number; lng: number };
  }) {
    routineEngine.rememberVisit(params);
  }

  getConsent() {
    return preferenceStore.getConsent();
  }

  setConsent(value: boolean) {
    return preferenceStore.setConsent(value);
  }
}

export const routineAgent = new RoutineAgent();
