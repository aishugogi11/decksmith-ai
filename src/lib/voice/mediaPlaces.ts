export type MediaPlatform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "blog"
  | "newsletter";

export interface MediaPlace {
  id: string;
  name: string;
  neighborhood: string;
  imageUrl: string;
  why: string;
  platforms: MediaPlatform[];
  hashtags: string[];
  mediaNote: string;
  bestFor: string[];
  /** Public search / explore link — we don't scrape Instagram */
  exploreUrl: string;
}

/**
 * Places that repeatedly show up across Instagram, TikTok, YouTube, and travel media.
 * Instagram's API can't power a general place feed, so this is a curated media index
 * (with outbound explore links) merged into discovery.
 */
export const MEDIA_PLACES: MediaPlace[] = [
  {
    id: "clarion-alley",
    name: "Clarion Alley murals",
    neighborhood: "Mission",
    imageUrl:
      "https://images.unsplash.com/photo-1499781350542-5ec9278d55d7?w=900&q=80",
    why: "Block-long street art that dominates Mission photo dumps.",
    platforms: ["instagram", "tiktok"],
    hashtags: ["#ClarionAlley", "#MissionMurals"],
    mediaNote: "Constantly in Instagram carousels and TikTok walking tours.",
    bestFor: ["mission", "photo", "art", "mural", "instagram", "tiktok"],
    exploreUrl: "https://www.instagram.com/explore/tags/clarionalley/",
  },
  {
    id: "painted-ladies-media",
    name: "Painted Ladies overlook",
    neighborhood: "Alamo Square",
    imageUrl:
      "https://images.unsplash.com/photo-1506147331759-99dfb9716869?w=900&q=80",
    why: "The postcard SF shot — still one of the most posted skyline frames.",
    platforms: ["instagram", "youtube", "blog"],
    hashtags: ["#PaintedLadies", "#AlamoSquare"],
    mediaNote: "Stubborn Instagram classic; every SF highlight reel hits it.",
    bestFor: ["photo", "views", "classic", "alamo", "hayes", "instagram"],
    exploreUrl: "https://www.instagram.com/explore/tags/paintedladies/",
  },
  {
    id: "battery-spencer",
    name: "Battery Spencer bridge view",
    neighborhood: "Marin Headlands",
    imageUrl:
      "https://images.unsplash.com/photo-1521747116042-5a810fda9664?w=900&q=80",
    why: "The elevated Golden Gate angle that fills travel Reels.",
    platforms: ["instagram", "tiktok", "youtube"],
    hashtags: ["#GoldenGateBridge", "#BatterySpencer"],
    mediaNote: "TikTok + Instagram sunset clips love this overlook.",
    bestFor: ["bridge", "golden", "sunset", "photo", "views", "tiktok"],
    exploreUrl: "https://www.instagram.com/explore/tags/batteryspencer/",
  },
  {
    id: "twin-peaks",
    name: "Twin Peaks night panorama",
    neighborhood: "Twin Peaks",
    imageUrl:
      "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=900&q=80",
    why: "City lights grid — a staple in SF YouTube vlogs.",
    platforms: ["instagram", "youtube"],
    hashtags: ["#TwinPeaks", "#SFViews"],
    mediaNote: "YouTube day-in-the-life endings and Instagram night shots.",
    bestFor: ["views", "sunset", "night", "photo", "panorama"],
    exploreUrl: "https://www.instagram.com/explore/tags/twinpeakssf/",
  },
  {
    id: "lotus-dumpling",
    name: "Dumpling + neon alley stops",
    neighborhood: "Chinatown",
    imageUrl:
      "https://images.unsplash.com/photo-1534050359320-028962695360?w=900&q=80",
    why: "Lantern streets and quick bites that read perfectly on camera.",
    platforms: ["instagram", "tiktok", "blog"],
    hashtags: ["#SFChinatown", "#GrantAvenue"],
    mediaNote: "Food TikToks and Instagram Stories loop this corridor constantly.",
    bestFor: ["chinatown", "food", "night", "photo", "tiktok", "instagram"],
    exploreUrl: "https://www.instagram.com/explore/tags/sfchinatown/",
  },
  {
    id: "bi-rite-dolores",
    name: "Bi-Rite + Dolores Park picnic",
    neighborhood: "Mission",
    imageUrl:
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=900&q=80",
    why: "Ice cream + park blanket energy — peak soft-life content.",
    platforms: ["instagram", "newsletter", "blog"],
    hashtags: ["#DoloresPark", "#BiRite"],
    mediaNote: "Instagram weekends and local newsletters still push this combo.",
    bestFor: ["mission", "park", "food", "picnic", "sunny", "instagram"],
    exploreUrl: "https://www.instagram.com/explore/tags/dolorespark/",
  },
  {
    id: "palace-media",
    name: "Palace of Fine Arts reflection",
    neighborhood: "Marina",
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80",
    why: "Symmetry + lagoon reflections that editors and creators chase.",
    platforms: ["instagram", "blog", "youtube"],
    hashtags: ["#PalaceOfFineArts", "#SFPhotography"],
    mediaNote: "Wedding, travel, and architecture feeds all recycle this shot.",
    bestFor: ["marina", "photo", "romantic", "quiet", "instagram", "bridge"],
    exploreUrl: "https://www.instagram.com/explore/tags/palaceoffinearts/",
  },
  {
    id: "ferry-building-media",
    name: "Ferry Building marketplace",
    neighborhood: "Embarcadero",
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80",
    why: "Food-hall flat lays and bay-light walking clips start here.",
    platforms: ["instagram", "tiktok", "newsletter"],
    hashtags: ["#FerryBuilding", "#Embarcadero"],
    mediaNote: "Creator morning routines + food media both park here.",
    bestFor: ["embarcadero", "food", "coffee", "waterfront", "instagram"],
    exploreUrl: "https://www.instagram.com/explore/tags/ferrybuilding/",
  },
  {
    id: "lombard-media",
    name: "Lombard Street crookeds",
    neighborhood: "Russian Hill",
    imageUrl:
      "https://images.unsplash.com/photo-1506147331759-99dfb9716869?w=900&q=80",
    why: "Still one of the most recognized SF clips on short-form video.",
    platforms: ["instagram", "tiktok", "youtube"],
    hashtags: ["#LombardStreet", "#CrookedStreet"],
    mediaNote: "TikTok driving/walking POV + Instagram tourist staples.",
    bestFor: ["lombard", "photo", "classic", "views", "tiktok"],
    exploreUrl: "https://www.instagram.com/explore/tags/lombardstreet/",
  },
  {
    id: "valencia-books-coffee",
    name: "Valencia coffee + bookstore crawl",
    neighborhood: "Mission",
    imageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80",
    why: "Aesthetic storefronts that local Instagram food accounts rotate.",
    platforms: ["instagram", "newsletter", "blog"],
    hashtags: ["#ValenciaStreet", "#MissionSF"],
    mediaNote: "Neighborhood Instagram + Substack city guides keep this warm.",
    bestFor: ["mission", "coffee", "cafe", "café", "local", "instagram"],
    exploreUrl: "https://www.instagram.com/explore/tags/valenciastreet/",
  },
  {
    id: "pier39-seals",
    name: "Pier 39 sea lions",
    neighborhood: "Fisherman’s Wharf",
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80",
    why: "Loud, chaotic, oddly addictive — short-form gold.",
    platforms: ["tiktok", "instagram", "youtube"],
    hashtags: ["#Pier39", "#SeaLions"],
    mediaNote: "Endless TikTok sound-ons and family Instagram Stories.",
    bestFor: ["pier", "wharf", "kids", "waterfront", "tiktok"],
    exploreUrl: "https://www.instagram.com/explore/tags/pier39/",
  },
  {
    id: "ocean-beach-sunset",
    name: "Ocean Beach sunset walk",
    neighborhood: "Outer Sunset",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=80",
    why: "Wide-sky sunsets that feel bigger than downtown SF.",
    platforms: ["instagram", "youtube", "blog"],
    hashtags: ["#OceanBeach", "#OuterSunset"],
    mediaNote: "Moodier Instagram sunset sets and YouTube golden-hour outros.",
    bestFor: ["sunset", "beach", "walk", "photo", "quiet"],
    exploreUrl: "https://www.instagram.com/explore/tags/oceanbeachsf/",
  },
];

export function platformLabel(platform: MediaPlatform): string {
  switch (platform) {
    case "instagram":
      return "Instagram";
    case "tiktok":
      return "TikTok";
    case "youtube":
      return "YouTube";
    case "blog":
      return "Travel media";
    case "newsletter":
      return "Newsletters";
  }
}

/**
 * Rank media-famous places for a free-text destination / vibe.
 */
export function buildMediaOptions(where: string): MediaPlace[] {
  const q = where.toLowerCase();
  const tokens = q.split(/[^a-z0-9]+/).filter((t) => t.length > 2);

  const scored = MEDIA_PLACES.map((place) => {
    let score = 1;
    for (const token of tokens) {
      if (place.bestFor.some((t) => t.includes(token) || token.includes(t))) {
        score += 4;
      }
      if (place.neighborhood.toLowerCase().includes(token)) score += 5;
      if (place.name.toLowerCase().includes(token)) score += 4;
      if (place.hashtags.some((h) => h.toLowerCase().includes(token))) score += 3;
    }
    if (/instagram|tiktok|viral|photo|reel|aesthetic/.test(q)) score += 2;
    if (/mission/.test(q) && /mission/.test(place.neighborhood.toLowerCase())) {
      score += 6;
    }
    if (/bridge|golden/.test(q) && /bridge|golden|battery|palace/.test(place.id)) {
      score += 5;
    }
    return { place, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((s) => s.place);
}

/** Google Places query tuned for photogenic / social-famous spots. */
export function toMediaPlacesQuery(where: string): string {
  const trimmed = where.trim();
  if (!trimmed) return "instagrammable photogenic places San Francisco";
  if (/san francisco|s\.?f\.?/i.test(trimmed)) {
    return `instagrammable photogenic scenic spots ${trimmed}`;
  }
  return `instagrammable photogenic scenic spots ${trimmed} San Francisco`;
}
