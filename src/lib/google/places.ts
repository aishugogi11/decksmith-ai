import {
  distanceMiles,
  estimateTravelMinutes,
  metersBetween,
  walkingMinutesFromMeters,
} from "@/lib/geo";
import type {
  AmenityTag,
  Destination,
  GeoPoint,
  ParkingOption,
  PriceLevel,
} from "@/lib/types";

const PLACES_BASE = "https://places.googleapis.com/v1";

const PLACE_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.types",
  "places.photos",
  "places.currentOpeningHours",
  "places.regularOpeningHours",
  "places.parkingOptions",
  "places.accessibilityOptions",
  "places.outdoorSeating",
  "places.allowsDogs",
  "places.editorialSummary",
  "places.googleMapsUri",
  "places.primaryType",
  "places.primaryTypeDisplayName",
].join(",");

const PARKING_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.location",
  "places.formattedAddress",
  "places.types",
  "places.parkingOptions",
  "places.accessibilityOptions",
].join(",");

type GooglePriceLevel =
  | "PRICE_LEVEL_UNSPECIFIED"
  | "PRICE_LEVEL_FREE"
  | "PRICE_LEVEL_INEXPENSIVE"
  | "PRICE_LEVEL_MODERATE"
  | "PRICE_LEVEL_EXPENSIVE"
  | "PRICE_LEVEL_VERY_EXPENSIVE";

interface GooglePlace {
  id?: string;
  name?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: GooglePriceLevel;
  types?: string[];
  photos?: Array<{ name?: string }>;
  currentOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  regularOpeningHours?: {
    weekdayDescriptions?: string[];
  };
  parkingOptions?: {
    freeParkingLot?: boolean;
    paidParkingLot?: boolean;
    freeStreetParking?: boolean;
    paidStreetParking?: boolean;
    valetParking?: boolean;
    freeGarageParking?: boolean;
    paidGarageParking?: boolean;
  };
  accessibilityOptions?: {
    wheelchairAccessibleParking?: boolean;
    wheelchairAccessibleEntrance?: boolean;
  };
  outdoorSeating?: boolean;
  allowsDogs?: boolean;
  editorialSummary?: { text?: string };
  googleMapsUri?: string;
  primaryType?: string;
  primaryTypeDisplayName?: { text?: string };
}

function getApiKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured");
  }
  return key;
}

async function placesPost<T>(
  path: string,
  body: Record<string, unknown>,
  fieldMask: string
): Promise<T> {
  const res = await fetch(`${PLACES_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": getApiKey(),
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Google Places error ${res.status}: ${detail.slice(0, 400)}`);
  }

  return res.json() as Promise<T>;
}

function mapPriceLevel(level?: GooglePriceLevel): PriceLevel {
  switch (level) {
    case "PRICE_LEVEL_FREE":
    case "PRICE_LEVEL_INEXPENSIVE":
      return 1;
    case "PRICE_LEVEL_MODERATE":
      return 2;
    case "PRICE_LEVEL_EXPENSIVE":
      return 3;
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return 4;
    default:
      return 2;
  }
}

function humanizeType(place: GooglePlace): string {
  const raw =
    place.primaryTypeDisplayName?.text ||
    (place.primaryType
      ? place.primaryType
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : null) ||
    (() => {
      const t = place.types?.find(
        (x) =>
          !["point_of_interest", "establishment", "food", "store"].includes(x)
      );
      if (!t) return null;
      return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    })();

  if (!raw) return "Place";
  // Prefer “Pharmacy” over Google’s “Drugstore” label
  if (/drug\s*store/i.test(raw) || place.types?.includes("drugstore")) {
    return "Pharmacy";
  }
  if (place.types?.includes("pharmacy")) return "Pharmacy";
  return raw;
}

function extractClosesAt(place: GooglePlace): string | undefined {
  const descriptions =
    place.currentOpeningHours?.weekdayDescriptions ??
    place.regularOpeningHours?.weekdayDescriptions;
  if (!descriptions?.length) return undefined;

  const today = descriptions[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  if (!today) return undefined;
  const parts = today.split(": ");
  const hours = parts.slice(1).join(": ").trim();
  if (!hours || /closed/i.test(hours)) return undefined;
  const end = hours.split("–").pop()?.split("-").pop()?.trim();
  return end;
}

function tagsFromPlace(place: GooglePlace, prefsQuery: string): AmenityTag[] {
  const tags = new Set<AmenityTag>();
  const types = new Set(place.types ?? []);
  const parking = place.parkingOptions;
  const q = prefsQuery.toLowerCase();

  if (parking?.freeParkingLot || parking?.freeStreetParking || parking?.freeGarageParking) {
    tags.add("Free Parking");
  }
  if (parking?.paidParkingLot || parking?.paidGarageParking || parking?.paidStreetParking) {
    // still useful signal for parking convenience scoring
  }
  if (place.outdoorSeating) tags.add("Outdoor Seating");
  if (place.allowsDogs) tags.add("Pet Friendly");
  if (place.accessibilityOptions?.wheelchairAccessibleEntrance) tags.add("Accessible");
  if (types.has("cafe") || types.has("library") || /quiet|focus|work|laptop/.test(q)) {
    if (/quiet|calm|peaceful|focus/.test(q)) tags.add("Quiet");
  }
  if (types.has("cafe") || types.has("coffee_shop") || /wifi|wi-fi|laptop|work/.test(q)) {
    tags.add("Wi-Fi");
    tags.add("Laptop-Friendly");
  }
  if (place.currentOpeningHours?.openNow && /late|night|evening/.test(q)) {
    tags.add("Late Night");
  }
  if (mapPriceLevel(place.priceLevel) <= 2) tags.add("Great Value");
  if (/brunch|breakfast/.test(q) || types.has("brunch_restaurant")) tags.add("Brunch");

  return Array.from(tags);
}

function parkingScoreFromOptions(place: GooglePlace): number {
  const p = place.parkingOptions;
  if (!p) return 55;
  let score = 45;
  if (p.freeParkingLot || p.freeGarageParking) score += 35;
  else if (p.paidParkingLot || p.paidGarageParking) score += 22;
  if (p.freeStreetParking) score += 15;
  else if (p.paidStreetParking) score += 8;
  if (p.valetParking) score += 5;
  if (place.accessibilityOptions?.wheelchairAccessibleParking) score += 8;
  return Math.min(100, score);
}

function photoUrl(photoName?: string): string {
  if (!photoName) {
    return "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80";
  }
  return `/api/photo?name=${encodeURIComponent(photoName)}&max=900`;
}

function synthesizeParkingFromPlace(place: GooglePlace, coords: GeoPoint): ParkingOption[] {
  const p = place.parkingOptions;
  const options: ParkingOption[] = [];

  if (p?.freeParkingLot || p?.paidParkingLot || p?.freeGarageParking || p?.paidGarageParking) {
    const free = Boolean(p.freeParkingLot || p.freeGarageParking);
    options.push({
      id: `${place.id ?? "place"}-lot`,
      name: free ? "On-site free parking" : "On-site paid parking",
      type: p.freeGarageParking || p.paidGarageParking ? "garage" : "lot",
      walkingMinutes: 1,
      walkingMeters: 40,
      estimatedCost: free ? "Free" : "Paid",
      hasEvCharging: false,
      accessible: Boolean(place.accessibilityOptions?.wheelchairAccessibleParking),
      score: free ? 92 : 74,
      coordinates: {
        lat: coords.lat + 0.00035,
        lng: coords.lng - 0.00025,
      },
    });
  }

  if (p?.freeStreetParking || p?.paidStreetParking) {
    const free = Boolean(p.freeStreetParking);
    options.push({
      id: `${place.id ?? "place"}-street`,
      name: free ? "Street parking nearby" : "Paid street parking",
      type: "street",
      walkingMinutes: 2,
      walkingMeters: 120,
      estimatedCost: free ? "Free" : "Metered",
      hasEvCharging: false,
      accessible: false,
      score: free ? 78 : 62,
      coordinates: {
        lat: coords.lat - 0.00028,
        lng: coords.lng + 0.00032,
      },
    });
  }

  return options;
}

function attachNearbyParking(
  destinationCoords: GeoPoint,
  destinationId: string,
  parkingPlaces: GooglePlace[],
  fallback: ParkingOption[]
): ParkingOption[] {
  const nearby = parkingPlaces
    .map((p) => {
      const lat = p.location?.latitude;
      const lng = p.location?.longitude;
      if (lat == null || lng == null) return null;
      const coords = { lat, lng };
      const meters = metersBetween(destinationCoords, coords);
      if (meters > 900) return null;
      const free =
        p.parkingOptions?.freeParkingLot ||
        p.parkingOptions?.freeStreetParking ||
        p.parkingOptions?.freeGarageParking;
      const isGarage =
        p.types?.includes("parking_garage") ||
        Boolean(p.parkingOptions?.freeGarageParking || p.parkingOptions?.paidGarageParking);

      const option: ParkingOption = {
        id: p.id ?? `${destinationId}-park-${coords.lat}`,
        name: p.displayName?.text ?? "Nearby parking",
        type: isGarage ? "garage" : "lot",
        walkingMinutes: walkingMinutesFromMeters(meters),
        walkingMeters: Math.round(meters),
        estimatedCost: free ? "Free" : "Paid",
        hasEvCharging: false,
        accessible: Boolean(p.accessibilityOptions?.wheelchairAccessibleParking),
        score: Math.max(40, Math.round(100 - meters / 12 + (free ? 10 : 0))),
        coordinates: coords,
      };
      return option;
    })
    .filter((x): x is ParkingOption => Boolean(x))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  if (nearby.length) return nearby;
  if (fallback.length) return fallback;

  return [
    {
      id: `${destinationId}-estimate`,
      name: "Street parking (estimated)",
      type: "street",
      walkingMinutes: 3,
      walkingMeters: 200,
      estimatedCost: "Varies",
      hasEvCharging: false,
      accessible: false,
      score: 50,
      coordinates: {
        lat: destinationCoords.lat + 0.0004,
        lng: destinationCoords.lng - 0.0003,
      },
    },
  ];
}

function toDestination(
  place: GooglePlace,
  origin: GeoPoint | null,
  query: string,
  parkingPool: GooglePlace[]
): Destination | null {
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  const name = place.displayName?.text;
  if (lat == null || lng == null || !name) return null;

  const coords = { lat, lng };
  const miles = origin ? distanceMiles(origin, coords) : 0;
  const tags = tagsFromPlace(place, query);
  const parkingScore = parkingScoreFromOptions(place);
  const synthesized = synthesizeParkingFromPlace(place, coords);
  const parking = attachNearbyParking(
    coords,
    place.id ?? name,
    parkingPool,
    synthesized
  );
  const bestParking = Math.max(parkingScore, ...parking.map((p) => p.score));
  const rating = place.rating ?? 4;
  const reviews = place.userRatingCount ?? 0;
  const priceLevel = mapPriceLevel(place.priceLevel);
  const isOpen = place.currentOpeningHours?.openNow ?? true;

  const amenityCoverage = Math.min(100, 40 + tags.length * 12);
  const reviewQuality = Math.min(
    100,
    Math.round(rating * 18 + Math.min(20, Math.log10(reviews + 1) * 8))
  );
  const valueScore = { 1: 92, 2: 78, 3: 55, 4: 35 }[priceLevel];

  const summary =
    place.editorialSummary?.text ??
    (origin
      ? `${humanizeType(place)} nearby — ${miles.toFixed(1)} mi away${
          place.formattedAddress ? `, ${place.formattedAddress}` : ""
        }.`
      : `${humanizeType(place)}${
          place.formattedAddress ? ` — ${place.formattedAddress}` : ""
        }.`);

  return {
    id: place.id ?? `${name}-${lat}`,
    name,
    category: humanizeType(place),
    imageUrl: photoUrl(place.photos?.[0]?.name),
    rating,
    reviewCount: reviews,
    distanceMiles: Number(miles.toFixed(2)),
    travelMinutes: origin ? estimateTravelMinutes(miles) : 0,
    parkingScore: Math.round(bestParking),
    priceLevel,
    isOpen,
    closesAt: extractClosesAt(place),
    tags,
    coordinates: coords,
    aiExplanation: summary,
    parking,
    googleMapsUri: place.googleMapsUri,
    address: place.formattedAddress,
    signals: {
      reviewQuality,
      valueScore,
      amenityCoverage,
    },
  };
}

export async function searchTextNearby(options: {
  query: string;
  origin?: GeoPoint | null;
  radiusMeters?: number;
  pageSize?: number;
  openNow?: boolean;
}): Promise<GooglePlace[]> {
  const radius =
    options.radiusMeters ??
    Number(process.env.GOOGLE_SEARCH_RADIUS_METERS ?? 10_000);

  const body: Record<string, unknown> = {
    textQuery: options.query,
    pageSize: options.pageSize ?? 12,
    ...(options.openNow ? { openNow: true } : {}),
    rankPreference: options.origin ? "DISTANCE" : "RELEVANCE",
  };

  if (options.origin) {
    body.locationBias = {
      circle: {
        center: {
          latitude: options.origin.lat,
          longitude: options.origin.lng,
        },
        radius,
      },
    };
  }

  const data = await placesPost<{ places?: GooglePlace[] }>(
    "/places:searchText",
    body,
    PLACE_FIELD_MASK
  );

  return data.places ?? [];
}

export interface GooglePlaceFetchOptions {
  query: string;
  origin?: GeoPoint | null;
  radiusMeters?: number;
  openNow?: boolean;
}

/**
 * Fetch + map Google Places into Destination records (no ranking).
 * Ranking belongs in AIRecommendationEngine.
 * Origin is optional — without it, Google ranks by relevance (not distance).
 */
export async function runGooglePlaceFetch(
  options: GooglePlaceFetchOptions
): Promise<Destination[]> {
  const radius =
    options.radiusMeters ??
    Number(process.env.GOOGLE_SEARCH_RADIUS_METERS ?? 10_000);
  const origin = options.origin ?? null;

  const [places, parkingPool] = await Promise.all([
    searchTextNearby({
      query: options.query,
      origin,
      radiusMeters: radius,
      openNow: options.openNow,
    }),
    origin
      ? searchNearbyParking(origin).catch(() => [] as GooglePlace[])
      : Promise.resolve([] as GooglePlace[]),
  ]);

  return places
    .map((p) => toDestination(p, origin, options.query, parkingPool))
    .filter((d): d is Destination => Boolean(d));
}

export async function searchNearbyParking(
  origin: GeoPoint,
  radiusMeters = 2000
): Promise<GooglePlace[]> {
  const data = await placesPost<{ places?: GooglePlace[] }>(
    "/places:searchNearby",
    {
      includedTypes: ["parking"],
      maxResultCount: 12,
      rankPreference: "DISTANCE",
      locationRestriction: {
        circle: {
          center: {
            latitude: origin.lat,
            longitude: origin.lng,
          },
          radius: radiusMeters,
        },
      },
    },
    PARKING_FIELD_MASK
  );

  return data.places ?? [];
}

