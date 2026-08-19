/**
 * Core domain types for Lumen — AI place discovery.
 * Designed so mock data can be swapped for live APIs later.
 */

export type AmenityTag =
  | "Quiet"
  | "Wi-Fi"
  | "Outdoor Seating"
  | "EV Charging"
  | "Laptop-Friendly"
  | "Free Parking"
  | "Accessible"
  | "Late Night"
  | "Great Value"
  | "Pet Friendly"
  | "Brunch"
  | "Reservations";

export type PriceLevel = 1 | 2 | 3 | 4;

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface ParkingOption {
  id: string;
  name: string;
  type: "garage" | "street" | "lot";
  walkingMinutes: number;
  walkingMeters: number;
  estimatedCost: string;
  hasEvCharging: boolean;
  accessible: boolean;
  score: number; // 0–100 parking convenience
  coordinates: GeoPoint;
}

export interface Destination {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  distanceMiles: number;
  travelMinutes: number;
  parkingScore: number;
  priceLevel: PriceLevel;
  isOpen: boolean;
  closesAt?: string;
  tags: AmenityTag[];
  coordinates: GeoPoint;
  /** Short AI rationale shown on the card */
  aiExplanation: string;
  parking: ParkingOption[];
  /** Google Maps deep link when results come from Places */
  googleMapsUri?: string;
  address?: string;
  /** Raw signals used by the ranking engine */
  signals: {
    reviewQuality: number; // 0–100
    valueScore: number; // 0–100
    amenityCoverage: number; // 0–100
  };
}

export interface RankedDestination extends Destination {
  matchScore: number; // 0–100
  rankReasons: string[];
}

export interface SearchPreferences {
  query: string;
  wantsQuiet?: boolean;
  wantsParking?: boolean;
  wantsOutdoor?: boolean;
  wantsWifi?: boolean;
  wantsLaptop?: boolean;
  wantsLate?: boolean;
  wantsBrunch?: boolean;
  wantsValue?: boolean;
  wantsEv?: boolean;
  maxPrice?: PriceLevel;
  openNow?: boolean;
  /** Extracted place category hint (e.g. cafe, restaurant) */
  category?: string;
}

export type AppPhase = "landing" | "thinking" | "results" | "voice";

export interface SearchResult {
  query: string;
  destinations: RankedDestination[];
  selectedId: string | null;
  /** demo = local sample data; google = live Places API */
  source?: "demo" | "google";
  /** User location used for nearby ranking (live searches) */
  origin?: GeoPoint;
  /** True when origin comes from live GPS */
  searchingNearYou?: boolean;
  /** "Near you" or saved city/ZIP label */
  locationLabel?: string;
  /** Search radius in meters */
  radiusMeters?: number;
}
