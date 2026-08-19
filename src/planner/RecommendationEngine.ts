import type {
  IntentCategory,
  PlaceCandidate,
  PlanConstraints,
  Recommendation,
  Task,
} from "@/models";
import { uid } from "@/models/helpers";
import { distanceMiles } from "@/lib/geo";
import { businessHoursService } from "@/lib/services/BusinessHoursService";
import { categorySearchQuery } from "./IntentParser";
import type { UserRoutine } from "@/models";

export interface PlaceLookup {
  (query: string, origin: { lat: number; lng: number } | null): Promise<PlaceCandidate[]>;
}

const DEMO_PLACES: Record<IntentCategory, PlaceCandidate[]> = {
  grocery: [
    {
      id: "demo_tj",
      name: "Trader Joe's",
      category: "Grocery",
      address: "555 9th St, San Francisco",
      coordinates: { lat: 37.7705, lng: -122.412 },
      rating: 4.5,
      isOpen: true,
      closesAt: "9:00 PM",
    },
    {
      id: "demo_wf",
      name: "Whole Foods Market",
      category: "Grocery",
      address: "450 Rhode Island St, San Francisco",
      coordinates: { lat: 37.7642, lng: -122.4028 },
      rating: 4.3,
      isOpen: true,
      closesAt: "10:00 PM",
    },
  ],
  pharmacy: [
    {
      id: "demo_cvs",
      name: "CVS Pharmacy",
      category: "Pharmacy",
      address: "350 Bay St, San Francisco",
      coordinates: { lat: 37.8059, lng: -122.412 },
      rating: 3.8,
      isOpen: true,
      closesAt: "10:00 PM",
    },
    {
      id: "demo_wag",
      name: "Walgreens",
      category: "Pharmacy",
      address: "1301 Market St, San Francisco",
      coordinates: { lat: 37.777, lng: -122.416 },
      rating: 3.6,
      isOpen: true,
      closesAt: "12:00 AM",
    },
  ],
  dinner: [
    {
      id: "demo_chip",
      name: "Chipotle Mexican Grill",
      category: "Dinner",
      address: "525 Market St, San Francisco",
      coordinates: { lat: 37.7905, lng: -122.399 },
      rating: 4.0,
      isOpen: true,
      closesAt: "10:00 PM",
    },
    {
      id: "demo_sushi",
      name: "Ryoko's Japanese Restaurant",
      category: "Dinner",
      address: "619 Taylor St, San Francisco",
      coordinates: { lat: 37.7882, lng: -122.412 },
      rating: 4.4,
      isOpen: true,
      closesAt: "1:30 AM",
    },
  ],
  lunch: [
    {
      id: "demo_lunch",
      name: "Sweetgreen",
      category: "Lunch",
      coordinates: { lat: 37.787, lng: -122.4 },
      rating: 4.2,
      isOpen: true,
      closesAt: "9:00 PM",
    },
  ],
  coffee: [
    {
      id: "demo_bb",
      name: "Blue Bottle Coffee",
      category: "Coffee",
      coordinates: { lat: 37.7763, lng: -122.423 },
      rating: 4.5,
      isOpen: true,
      closesAt: "6:00 PM",
    },
  ],
  gas: [
    {
      id: "demo_gas",
      name: "Shell",
      category: "Gas",
      coordinates: { lat: 37.78, lng: -122.42 },
      isOpen: true,
      closesAt: "Open 24 hours",
    },
  ],
  gym: [
    {
      id: "demo_gym",
      name: "Equinox",
      category: "Gym",
      coordinates: { lat: 37.789, lng: -122.403 },
      isOpen: true,
      closesAt: "10:00 PM",
    },
  ],
  home: [],
  work: [],
  other: [
    {
      id: "demo_other",
      name: "Nearby spot",
      category: "Place",
      coordinates: { lat: 37.78, lng: -122.41 },
      isOpen: true,
    },
  ],
};

/**
 * Chooses a stop per task with transparent reasons.
 */
export class RecommendationEngine {
  constructor(
    private readonly placeLookup?: PlaceLookup,
    private readonly getRoutine?: (category: IntentCategory) => UserRoutine | undefined,
    private readonly getHome?: () => PlaceCandidate | undefined
  ) {}

  async recommend(
    tasks: Task[],
    constraints: PlanConstraints
  ): Promise<Recommendation[]> {
    const out: Recommendation[] = [];
    const origin = constraints.origin;

    for (const task of tasks) {
      const cat = task.intent.category;

      if (cat === "home") {
        const home =
          this.getHome?.() ??
          ({
            id: "home",
            name: "Home",
            category: "Home",
            coordinates: origin ?? { lat: 37.76, lng: -122.435 },
            isOpen: true,
          } satisfies PlaceCandidate);
        out.push({
          taskId: task.id,
          chosen: home,
          reasons: [
            "Final destination on your plan",
            "Keeps the rest of your errands oriented toward getting home",
          ],
          alternatives: [],
          detourMinutes: 0,
        });
        continue;
      }

      if (cat === "work") {
        const work: PlaceCandidate = {
          id: "work",
          name: "Work",
          category: "Work",
          coordinates: origin ?? { lat: 37.79, lng: -122.4 },
          isOpen: true,
        };
        out.push({
          taskId: task.id,
          chosen: work,
          reasons: ["Matches your work destination"],
          alternatives: [],
          detourMinutes: 0,
        });
        continue;
      }

      const routine = constraints.useMemory ? this.getRoutine?.(cat) : undefined;
      let candidates = await this.resolveCandidates(cat, task.intent.rawText, origin);

      if (routine) {
        const match = candidates.find((c) =>
          c.name.toLowerCase().includes(routine.placeName.toLowerCase())
        );
        const preferred: PlaceCandidate = match ?? {
          id: routine.placeId ?? uid("pref"),
          name: routine.placeName,
          category: cat,
          coordinates: routine.coordinates ?? origin ?? { lat: 37.77, lng: -122.42 },
          isOpen: true,
          closesAt: "9:00 PM",
        };
        candidates = [
          preferred,
          ...candidates.filter((c) => c.id !== preferred.id),
        ];
      }

      if (!candidates.length) {
        candidates = demoFromQuery(task.intent.rawText, origin);
      }

      const chosen = candidates[0];
      const alternatives = candidates.slice(1, 4);
      const hours = await businessHoursService.getHours(chosen.name, chosen.category);
      chosen.isOpen = hours.isOpen;
      chosen.closesAt = hours.closesAt;

      const detour =
        origin && chosen.coordinates
          ? Math.round(distanceMiles(origin, chosen.coordinates) * 12)
          : 8;

      const reasons: string[] = [];
      if (cat === "other") {
        reasons.push(`it matches what you asked for (“${task.intent.rawText}”)`);
      }
      if (routine && chosen.name.toLowerCase().includes(routine.placeName.toLowerCase())) {
        reasons.push(`it matches your preferred ${cat} routine (${routine.placeName})`);
      }
      if (hours.isOpen) {
        reasons.push("it is currently open");
      } else {
        reasons.push("note: hours may be limited — confirming openness");
      }
      reasons.push(`it adds about ${detour} minutes from your current area`);
      reasons.push("parking is typically available nearby");
      if (constraints.arriveByIso) {
        reasons.push("it keeps your itinerary oriented toward your arrival target");
      }
      if (chosen.rating && chosen.rating >= 4) {
        reasons.push(`it is well rated (${chosen.rating.toFixed(1)})`);
      }

      out.push({
        taskId: task.id,
        chosen,
        reasons: reasons.map((r) => (r.startsWith("it ") ? r : r)),
        alternatives,
        detourMinutes: detour,
      });
    }

    return out;
  }

  private async resolveCandidates(
    category: IntentCategory,
    rawText: string,
    origin: { lat: number; lng: number } | null
  ): Promise<PlaceCandidate[]> {
    const query = categorySearchQuery(category, rawText);

    if (this.placeLookup) {
      try {
        const live = await this.placeLookup(query, origin);
        if (live.length) return live;
      } catch {
        // fall through
      }
    }

    if (category === "other") {
      return demoFromQuery(rawText, origin);
    }

    return DEMO_PLACES[category] ?? demoFromQuery(rawText, origin);
  }
}

/** Build a reasonable demo stop from any free-form errand text. */
function demoFromQuery(
  rawText: string,
  origin: { lat: number; lng: number } | null
): PlaceCandidate[] {
  const label = titleCase(
    rawText
      .replace(/^(?:buy|get|pick up|grab|find|go to|visit|drop off)\s+/i, "")
      .trim() || "Nearby stop"
  );
  const base = origin ?? { lat: 37.78, lng: -122.41 };
  // Slight jitter so multiple free-form stops don't stack on one point
  const jitter = (seed: number) => ((seed % 7) - 3) * 0.004;

  return [
    {
      id: uid("demo"),
      name: label,
      category: "Errand",
      coordinates: {
        lat: base.lat + jitter(label.length),
        lng: base.lng + jitter(label.charCodeAt(0) || 1),
      },
      isOpen: true,
      closesAt: "9:00 PM",
      rating: 4.2,
    },
    {
      id: uid("demo"),
      name: `Alternative for ${label}`,
      category: "Errand",
      coordinates: {
        lat: base.lat + jitter(label.length + 3),
        lng: base.lng + jitter((label.charCodeAt(1) || 2) + 2),
      },
      isOpen: true,
      closesAt: "8:00 PM",
      rating: 4.0,
    },
  ];
}

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
