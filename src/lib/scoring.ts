import type {
  Destination,
  RankedDestination,
  SearchPreferences,
} from "./types";

/**
 * Weighted ranking — travel, parking, reviews, price, open status, amenities.
 * Weights are intentional so results feel reasoned, not random.
 */
const WEIGHTS = {
  travelTime: 0.22,
  parking: 0.2,
  reviews: 0.15,
  price: 0.1,
  openNow: 0.1,
  amenities: 0.13,
  preferences: 0.1,
} as const;

function clamp(n: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, n));
}

/** Faster travel → higher score (assume 5–35 min range) */
function travelScore(minutes: number): number {
  return clamp(100 - (minutes - 5) * 3.5);
}

/** Lower price level is better when user wants value */
function priceScore(
  level: Destination["priceLevel"],
  prefs: SearchPreferences
): number {
  const base = { 1: 95, 2: 80, 3: 55, 4: 30 }[level];
  if (prefs.maxPrice && level > prefs.maxPrice) return base * 0.35;
  if (prefs.wantsValue) return base;
  // Neutral preference: mid-range is fine
  return { 1: 75, 2: 90, 3: 70, 4: 50 }[level];
}

function preferenceBoost(
  place: Destination,
  prefs: SearchPreferences
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let hits = 0;
  let checks = 0;

  const check = (wanted: boolean | undefined, tag: string, label: string) => {
    if (!wanted) return;
    checks += 1;
    if (place.tags.includes(tag as never)) {
      hits += 1;
      reasons.push(label);
    }
  };

  check(prefs.wantsQuiet, "Quiet", "Matches your quiet preference");
  check(prefs.wantsWifi, "Wi-Fi", "Reliable Wi-Fi");
  check(prefs.wantsOutdoor, "Outdoor Seating", "Outdoor seating available");
  check(prefs.wantsLaptop, "Laptop-Friendly", "Laptop-friendly space");
  check(prefs.wantsLate, "Late Night", "Open late");
  check(prefs.wantsBrunch, "Brunch", "Strong brunch offering");
  check(prefs.wantsEv, "EV Charging", "EV charging nearby");
  check(prefs.wantsParking, "Free Parking", "Free or easy parking");

  if (prefs.wantsParking && place.parkingScore >= 80) {
    checks += 1;
    hits += 1;
    if (!reasons.some((r) => r.toLowerCase().includes("parking"))) {
      reasons.push("Excellent parking convenience");
    }
  }

  if (checks === 0) return { score: 70, reasons };

  return { score: clamp((hits / checks) * 100), reasons };
}

/**
 * Rank destinations for a query. Returns sorted list with match scores + reasons.
 */
export function rankDestinations(
  destinations: Destination[],
  prefs: SearchPreferences
): RankedDestination[] {
  const ranked = destinations.map((place) => {
    const travel = travelScore(place.travelMinutes);
    const parking = place.parkingScore;
    const reviews = place.signals.reviewQuality;
    const price = priceScore(place.priceLevel, prefs);
    const open = place.isOpen ? 100 : 15;
    const amenities = place.signals.amenityCoverage;
    const pref = preferenceBoost(place, prefs);

    const matchScore = Math.round(
      travel * WEIGHTS.travelTime +
        parking * WEIGHTS.parking +
        reviews * WEIGHTS.reviews +
        price * WEIGHTS.price +
        open * WEIGHTS.openNow +
        amenities * WEIGHTS.amenities +
        pref.score * WEIGHTS.preferences
    );

    const rankReasons: string[] = [];
    if (travel >= 80) rankReasons.push(`Only ${place.travelMinutes} min away`);
    if (parking >= 85) rankReasons.push("Top parking score nearby");
    if (place.isOpen) rankReasons.push("Open now");
    if (reviews >= 88) rankReasons.push(`Rated ${place.rating.toFixed(1)}★`);
    rankReasons.push(...pref.reasons.slice(0, 3));

    return {
      ...place,
      matchScore: clamp(matchScore),
      rankReasons: rankReasons.slice(0, 5),
    };
  });

  return ranked.sort((a, b) => b.matchScore - a.matchScore);
}
