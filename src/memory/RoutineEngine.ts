import type { IntentCategory, UserRoutine } from "@/models";
import { preferenceStore } from "./PreferenceStore";
import { historyAnalyzer } from "./HistoryAnalyzer";

/**
 * Routine engine — patterns over places, not a recents list.
 */
export class RoutineEngine {
  ensureConsentedDemo() {
    if (preferenceStore.getConsent()) {
      preferenceStore.seedDemoRoutinesIfEmpty();
    }
  }

  list(): UserRoutine[] {
    this.ensureConsentedDemo();
    historyAnalyzer.analyzeAndPromote();
    return preferenceStore
      .listRoutines()
      .slice()
      .sort((a, b) => b.frequency - a.frequency);
  }

  preferFor(category: IntentCategory): UserRoutine | undefined {
    if (!preferenceStore.getConsent()) return undefined;
    this.ensureConsentedDemo();
    return preferenceStore.getRoutineForCategory(category);
  }

  rememberVisit(params: {
    category: IntentCategory;
    placeName: string;
    placeId?: string;
    coordinates?: { lat: number; lng: number };
  }) {
    if (!preferenceStore.getConsent()) return;
    preferenceStore.recordVisit({
      category: params.category,
      placeName: params.placeName,
      placeId: params.placeId,
      coordinates: params.coordinates,
      atIso: new Date().toISOString(),
    });
    preferenceStore.upsertRoutine({
      category: params.category,
      placeName: params.placeName,
      placeId: params.placeId,
      coordinates: params.coordinates,
      cadence:
        categoryCadence(params.category),
      frequency: 1,
    });
    historyAnalyzer.analyzeAndPromote();
  }
}

function categoryCadence(category: IntentCategory): UserRoutine["cadence"] {
  if (category === "coffee") return "weekday_morning";
  if (category === "grocery") return "sunday_evening";
  if (category === "pharmacy") return "monthly";
  if (category === "dinner") return "after_work";
  return "anytime";
}

export const routineEngine = new RoutineEngine();
