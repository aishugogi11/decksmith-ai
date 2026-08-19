import type { IntentCategory, UserRoutine, VisitEvent } from "@/models";
import { preferenceStore } from "./PreferenceStore";

/**
 * Turns visit history into reusable routines — never surfaces raw history as UI.
 */
export class HistoryAnalyzer {
  analyzeAndPromote(events?: VisitEvent[]): UserRoutine[] {
    if (!preferenceStore.getConsent()) return preferenceStore.listRoutines();

    const visits = events ?? preferenceStore.getState().visitEvents;
    const counts = new Map<
      string,
      { category: IntentCategory; placeName: string; count: number; last: string; coords?: VisitEvent["coordinates"]; placeId?: string }
    >();

    for (const v of visits) {
      const key = `${v.category}::${v.placeName.toLowerCase()}`;
      const prev = counts.get(key);
      if (prev) {
        prev.count += 1;
        prev.last = v.atIso;
      } else {
        counts.set(key, {
          category: v.category,
          placeName: v.placeName,
          count: 1,
          last: v.atIso,
          coords: v.coordinates,
          placeId: v.placeId,
        });
      }
    }

    for (const entry of counts.values()) {
      if (entry.count < 2) continue;
      preferenceStore.upsertRoutine({
        category: entry.category,
        placeName: entry.placeName,
        placeId: entry.placeId,
        coordinates: entry.coords,
        cadence: guessCadence(entry.category),
        frequency: entry.count,
        lastUsedIso: entry.last,
      });
    }

    return preferenceStore.listRoutines();
  }
}

function guessCadence(category: IntentCategory): UserRoutine["cadence"] {
  switch (category) {
    case "coffee":
      return "weekday_morning";
    case "grocery":
      return "sunday_evening";
    case "gym":
      return "after_work";
    case "pharmacy":
      return "monthly";
    case "dinner":
      return "after_work";
    default:
      return "anytime";
  }
}

export const historyAnalyzer = new HistoryAnalyzer();
