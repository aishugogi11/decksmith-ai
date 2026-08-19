import type { SfStop } from "./sfDayTrip";
import { SF_DAY_STOPS } from "./sfDayTrip";

export interface NearbyPlaceOption {
  id: string;
  name: string;
  neighborhood: string;
  vibe: string;
  why: string;
  tip: string;
  imageUrl: string;
  bestFor: string[];
}

const EXTRA_OPTIONS: NearbyPlaceOption[] = [
  {
    id: "valencia-cafes",
    name: "Valencia Street cafés",
    neighborhood: "Mission",
    vibe: "Local · walkable",
    why: "Independent coffee, bookstores, and murals in a few sunny blocks.",
    tip: "Start at Ritual or Sightglass, then wander toward Dolores Park.",
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80",
    bestFor: ["coffee", "mission", "food", "local", "cafe", "café"],
  },
  {
    id: "dolores-park",
    name: "Dolores Park lawn",
    neighborhood: "Mission",
    vibe: "Sun · people-watching",
    why: "The classic Mission pause — skyline views and picnic energy.",
    tip: "Grab takeout nearby and claim a spot on the west slope.",
    imageUrl:
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=900&q=80",
    bestFor: ["park", "mission", "relax", "picnic", "sunset"],
  },
  {
    id: "palace-fine-arts",
    name: "Palace of Fine Arts",
    neighborhood: "Marina",
    vibe: "Iconic · calm",
    why: "Reflecting lagoon + rotunda — quiet photos without downtown rush.",
    tip: "Pair with Crissy Field if you want the bridge after.",
    imageUrl:
      "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=900&q=80",
    bestFor: ["photo", "views", "marina", "bridge", "quiet", "romantic"],
  },
  {
    id: "alamo-square",
    name: "Alamo Square Painted Ladies",
    neighborhood: "Alamo Square",
    vibe: "Classic SF",
    why: "Postcard row houses with downtown rising behind them.",
    tip: "Best light late afternoon; keep the visit short and stroll Hayes Valley after.",
    imageUrl:
      "https://images.unsplash.com/photo-1506147331759-99dfb9716869?w=900&q=80",
    bestFor: ["photo", "classic", "views", "hayes", "sightseeing"],
  },
  {
    id: "ferry-sunset",
    name: "Embarcadero golden hour",
    neighborhood: "Embarcadero",
    vibe: "Waterfront · easy",
    why: "Bay breeze, ferries, and skyline glow without a hard itinerary.",
    tip: "Walk from Ferry Building toward Pier 7 for fewer crowds.",
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80",
    bestFor: ["waterfront", "sunset", "walk", "embarcadero", "bay"],
  },
  {
    id: "japantown",
    name: "Japan Center & Peace Plaza",
    neighborhood: "Japantown",
    vibe: "Food · culture",
    why: "Compact snack crawl — mochi, ramen, and design shops in one plaza.",
    tip: "Go hungry; leave room for a soft-serve stop.",
    imageUrl:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&q=80",
    bestFor: ["food", "japan", "snack", "indoor", "rain"],
  },
];

function stopToOption(stop: SfStop): NearbyPlaceOption {
  const tags = [
    stop.neighborhood.toLowerCase(),
    ...stop.name.toLowerCase().split(/\s+/),
    ...stop.why.toLowerCase().split(/\W+/).filter((w) => w.length > 4),
  ];
  return {
    id: stop.id,
    name: stop.name,
    neighborhood: stop.neighborhood,
    vibe: "Worth the stop",
    why: stop.why,
    tip: stop.tip,
    imageUrl: stop.imageUrl,
    bestFor: tags,
  };
}

const ALL_OPTIONS: NearbyPlaceOption[] = [
  ...SF_DAY_STOPS.map(stopToOption),
  ...EXTRA_OPTIONS,
];

/** Default map center when the user names San Francisco / no GPS. */
export const SF_CENTER = { lat: 37.7749, lng: -122.4194 };

/**
 * Turn a free-text “where I want to go” into cool nearby options (demo / fallback).
 */
export function buildNearbyOptions(where: string): NearbyPlaceOption[] {
  const q = where.toLowerCase();
  const tokens = q.split(/[^a-z0-9]+/).filter((t) => t.length > 2);

  const scored = ALL_OPTIONS.map((place) => {
    let score = 1;
    for (const token of tokens) {
      if (place.bestFor.some((t) => t.includes(token) || token.includes(t))) {
        score += 3;
      }
      if (place.name.toLowerCase().includes(token)) score += 4;
      if (place.neighborhood.toLowerCase().includes(token)) score += 5;
      if (place.why.toLowerCase().includes(token)) score += 2;
    }

    if (/food|eat|lunch|dinner|hungry|taco|pizza/.test(q)) {
      if (/food|lunch|dinner|mission|beach|japan|café|cafe/.test(place.id + place.neighborhood.toLowerCase())) {
        score += 3;
      }
    }
    if (/view|photo|bridge|sunset|golden/.test(q)) {
      if (/coit|lombard|golden|palace|alamo|ferry|dolores/.test(place.id)) {
        score += 4;
      }
    }
    if (/coffee|cafe|café|work/.test(q)) {
      if (/ferry|valencia|north-beach|japantown/.test(place.id)) score += 4;
    }
    if (/mission/.test(q) && /mission/.test(place.neighborhood.toLowerCase())) {
      score += 6;
    }

    return { place, score };
  });

  const ranked = scored
    .sort((a, b) => b.score - a.score)
    .map((s) => s.place);

  // Prefer diversity: unique neighborhoods first, then fill
  const picked: NearbyPlaceOption[] = [];
  const seenHoods = new Set<string>();

  for (const place of ranked) {
    if (picked.length >= 6) break;
    const hood = place.neighborhood.toLowerCase();
    if (!seenHoods.has(hood) || picked.length < 3) {
      picked.push(place);
      seenHoods.add(hood);
    }
  }

  for (const place of ranked) {
    if (picked.length >= 6) break;
    if (!picked.some((p) => p.id === place.id)) picked.push(place);
  }

  return picked.slice(0, 6);
}

/** Build a Places text query that biases toward nearby discovery. */
export function toPlacesQuery(where: string): string {
  const trimmed = where.trim();
  if (!trimmed) return "interesting places to visit nearby";
  if (/near me|nearby|around here/i.test(trimmed)) {
    return "highly rated places to visit nearby";
  }
  if (/san francisco|s\.?f\.?/i.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed} San Francisco`;
}
