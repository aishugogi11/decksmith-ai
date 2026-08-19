import type { GeoPoint } from "@/lib/types";

/** High-level errand / goal category. */
export type IntentCategory =
  | "grocery"
  | "pharmacy"
  | "dinner"
  | "lunch"
  | "coffee"
  | "gas"
  | "gym"
  | "home"
  | "work"
  | "other";

export interface Intent {
  id: string;
  category: IntentCategory;
  rawText: string;
  priority: number;
  /** Preferred place name from routines, if any */
  preferredPlaceName?: string;
}

export type TaskStatus = "pending" | "active" | "done" | "skipped";

export interface Task {
  id: string;
  intent: Intent;
  status: TaskStatus;
}

export interface PlaceCandidate {
  id: string;
  name: string;
  category: string;
  address?: string;
  coordinates: GeoPoint;
  rating?: number;
  isOpen?: boolean;
  closesAt?: string;
  googleMapsUri?: string;
  imageUrl?: string;
}

export interface Stop {
  id: string;
  taskId: string;
  place: PlaceCandidate;
  etaIso: string;
  departByIso: string;
  distanceMiles: number;
  travelMinutesFromPrev: number;
  dwellMinutes: number;
  hoursLabel: string;
  trafficLabel: string;
  /** Transparent recommendation reasons */
  reasons: string[];
  alternatives: PlaceCandidate[];
  detourMinutes?: number;
  status: TaskStatus;
}

export interface PlanConstraints {
  origin: GeoPoint | null;
  originLabel?: string;
  nowIso: string;
  arriveByIso?: string;
  useMemory: boolean;
}

export interface ReplanEvent {
  id: string;
  type: "skip_stop" | "traffic_bump" | "closed" | "user_request";
  message: string;
  createdAtIso: string;
  stopId?: string;
  extraMinutes?: number;
}

export interface RoutePlan {
  id: string;
  utterance: string;
  summary: string;
  spokenSummary: string;
  constraints: PlanConstraints;
  tasks: Task[];
  stops: Stop[];
  suggestedStops: Stop[];
  replanEvents: ReplanEvent[];
  createdAtIso: string;
  updatedAtIso: string;
}

export interface Recommendation {
  taskId: string;
  chosen: PlaceCandidate;
  reasons: string[];
  alternatives: PlaceCandidate[];
  detourMinutes: number;
}

export type RoutineCadence =
  | "weekday_morning"
  | "after_work"
  | "sunday_evening"
  | "friday_night"
  | "monthly"
  | "anytime";

export interface UserRoutine {
  id: string;
  category: IntentCategory;
  placeName: string;
  placeId?: string;
  coordinates?: GeoPoint;
  cadence: RoutineCadence;
  frequency: number;
  lastUsedIso?: string;
}

export interface SavedPlace {
  id: string;
  label: string;
  placeName: string;
  coordinates: GeoPoint;
  category?: IntentCategory;
}

export interface PreferenceState {
  consent: boolean;
  routines: UserRoutine[];
  savedPlaces: SavedPlace[];
  /** Soft history used only to promote routines when consent is on */
  visitEvents: VisitEvent[];
}

export interface VisitEvent {
  id: string;
  category: IntentCategory;
  placeName: string;
  placeId?: string;
  coordinates?: GeoPoint;
  atIso: string;
}
