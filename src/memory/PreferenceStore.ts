import type {
  IntentCategory,
  PreferenceState,
  SavedPlace,
  UserRoutine,
  VisitEvent,
} from "@/models";
import { uid } from "@/models/helpers";

const STORAGE_KEY = "lumen.preferences.v1";

const DEFAULT_STATE: PreferenceState = {
  consent: false,
  routines: [],
  savedPlaces: [
    {
      id: "saved_home",
      label: "Home",
      placeName: "Home",
      coordinates: { lat: 37.76, lng: -122.435 },
      category: "home",
    },
  ],
  visitEvents: [],
};

function read(): PreferenceState {
  if (typeof window === "undefined") return structuredClone(DEFAULT_STATE);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    return { ...structuredClone(DEFAULT_STATE), ...JSON.parse(raw) };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function write(state: PreferenceState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Local preference store — only learns when consent is true.
 */
export class PreferenceStore {
  getState(): PreferenceState {
    return read();
  }

  setConsent(consent: boolean) {
    const state = read();
    state.consent = consent;
    if (!consent) {
      state.visitEvents = [];
      // Keep explicit routines/saved places; clear soft history
    }
    write(state);
    return state;
  }

  getConsent(): boolean {
    return read().consent;
  }

  listRoutines(): UserRoutine[] {
    return read().routines;
  }

  listSavedPlaces(): SavedPlace[] {
    return read().savedPlaces;
  }

  upsertRoutine(routine: Omit<UserRoutine, "id"> & { id?: string }) {
    const state = read();
    if (!state.consent) return state;
    const existing = state.routines.find(
      (r) =>
        r.category === routine.category &&
        r.placeName.toLowerCase() === routine.placeName.toLowerCase()
    );
    if (existing) {
      existing.frequency += 1;
      existing.lastUsedIso = routine.lastUsedIso ?? new Date().toISOString();
      existing.cadence = routine.cadence;
      if (routine.coordinates) existing.coordinates = routine.coordinates;
      if (routine.placeId) existing.placeId = routine.placeId;
    } else {
      state.routines.push({
        id: routine.id ?? uid("routine"),
        category: routine.category,
        placeName: routine.placeName,
        placeId: routine.placeId,
        coordinates: routine.coordinates,
        cadence: routine.cadence,
        frequency: routine.frequency ?? 1,
        lastUsedIso: routine.lastUsedIso ?? new Date().toISOString(),
      });
    }
    write(state);
    return state;
  }

  seedDemoRoutinesIfEmpty() {
    const state = read();
    if (!state.consent || state.routines.length > 0) return state;
    state.routines = [
      {
        id: uid("routine"),
        category: "grocery",
        placeName: "Trader Joe's",
        cadence: "sunday_evening",
        frequency: 8,
        coordinates: { lat: 37.7614, lng: -122.424 },
      },
      {
        id: uid("routine"),
        category: "pharmacy",
        placeName: "CVS",
        cadence: "monthly",
        frequency: 5,
        coordinates: { lat: 37.7765, lng: -122.4242 },
      },
      {
        id: uid("routine"),
        category: "dinner",
        placeName: "Chipotle",
        cadence: "after_work",
        frequency: 6,
        coordinates: { lat: 37.7879, lng: -122.4075 },
      },
      {
        id: uid("routine"),
        category: "coffee",
        placeName: "Blue Bottle",
        cadence: "weekday_morning",
        frequency: 10,
        coordinates: { lat: 37.7763, lng: -122.423 },
      },
    ];
    write(state);
    return state;
  }

  recordVisit(event: Omit<VisitEvent, "id">) {
    const state = read();
    if (!state.consent) return state;
    state.visitEvents.push({ ...event, id: uid("visit") });
    // Cap history
    if (state.visitEvents.length > 200) {
      state.visitEvents = state.visitEvents.slice(-200);
    }
    write(state);
    return state;
  }

  getRoutineForCategory(category: IntentCategory): UserRoutine | undefined {
    const routines = read().routines.filter((r) => r.category === category);
    if (!routines.length) return undefined;
    return routines.sort((a, b) => b.frequency - a.frequency)[0];
  }

  getHome(): SavedPlace | undefined {
    return read().savedPlaces.find((p) => p.category === "home" || p.label === "Home");
  }
}

export const preferenceStore = new PreferenceStore();
