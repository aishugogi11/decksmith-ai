export interface SfStop {
  id: string;
  time: string;
  name: string;
  neighborhood: string;
  why: string;
  tip: string;
  imageUrl: string;
}

export interface VoiceReply {
  spoken: string;
  headline: string;
  summary: string;
  stops: SfStop[];
  followUps: string[];
}

/** Curated one-day San Francisco mock itinerary for the voice guide. */
export const SF_DAY_STOPS: SfStop[] = [
  {
    id: "ferry-building",
    time: "9:00 AM",
    name: "Ferry Building Marketplace",
    neighborhood: "Embarcadero",
    why: "Coffee, pastries, and bay light before the crowds thicken.",
    tip: "Grab Blue Bottle, then walk the Embarcadero south.",
    imageUrl:
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=900&q=80",
  },
  {
    id: "chinatown",
    time: "10:30 AM",
    name: "Chinatown Gate & Grant Ave",
    neighborhood: "Chinatown",
    why: "Dense, walkable, and unmistakably San Francisco in one corridor.",
    tip: "Detour into Fortune Cookie Factory if the line is short.",
    imageUrl:
      "https://images.unsplash.com/photo-1534050359320-028962695360?w=900&q=80",
  },
  {
    id: "north-beach",
    time: "12:15 PM",
    name: "North Beach lunch",
    neighborhood: "North Beach",
    why: "Italian cafés and park benches — easy mid-day reset.",
    tip: "Tony’s Pizza Napoletana or a quick focaccia nearby.",
    imageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80",
  },
  {
    id: "coit",
    time: "1:30 PM",
    name: "Coit Tower viewpoints",
    neighborhood: "Telegraph Hill",
    why: "City + bay panorama without leaving the northeast cluster.",
    tip: "If the tower line is long, the hillside paths are enough.",
    imageUrl:
      "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=900&q=80",
  },
  {
    id: "lombard",
    time: "2:30 PM",
    name: "Lombard Street overlook",
    neighborhood: "Russian Hill",
    why: "Classic SF photo moment, then downhill toward the water.",
    tip: "Stay on the sidewalk overlook — skip driving the curves.",
    imageUrl:
      "https://images.unsplash.com/photo-1506147331759-99dfb9716869?w=900&q=80",
  },
  {
    id: "pier-39",
    time: "3:30 PM",
    name: "Fisherman’s Wharf & sea lions",
    neighborhood: "Pier 39",
    why: "Touristy, yes — but the sea lions and bay breeze earn the stop.",
    tip: "Keep it to 45 minutes, then head west for golden hour.",
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80",
  },
  {
    id: "golden-gate",
    time: "5:15 PM",
    name: "Golden Gate Bridge welcome vista",
    neighborhood: "Presidio / Crissy Field",
    why: "The one image you came for — best late afternoon light.",
    tip: "Crissy Field East Beach is easier than Battery Spencer traffic.",
    imageUrl:
      "https://images.unsplash.com/photo-1521747116042-5a810fda9664?w=900&q=80",
  },
  {
    id: "sunset-dinner",
    time: "7:00 PM",
    name: "Sunset dinner in the Mission",
    neighborhood: "Mission",
    why: "Warm evening energy, great food, and an easy nightcap stroll.",
    tip: "Tacos + a walk down Valencia beats another waterfront queue.",
    imageUrl:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&q=80",
  },
];

export type VoiceIntent =
  | "sf_day_trip"
  | "greeting"
  | "parking"
  | "food"
  | "bridge"
  | "unknown";

export function detectVoiceIntent(transcript: string): VoiceIntent {
  const q = transcript.toLowerCase();

  if (
    /(san\s*francisco|s\.?f\.?|bay area)/.test(q) &&
    /(one day|1 day|day trip|itinerary|what should i see|what to see|visit|visiting|things to do|sightseeing)/.test(
      q
    )
  ) {
    return "sf_day_trip";
  }

  if (
    /(what should i see|what to see|things to do|itinerary|one day|day in)/.test(q) &&
    /(francisco|sf|city|here|visit)/.test(q)
  ) {
    return "sf_day_trip";
  }

  if (
    /(what should i see|show me|plan my day|one day plan|day trip)/.test(q)
  ) {
    return "sf_day_trip";
  }

  if (/parking|park the car|where to park/.test(q)) return "parking";
  if (/food|eat|lunch|dinner|hungry|restaurant/.test(q)) return "food";
  if (/golden gate|bridge|photo/.test(q)) return "bridge";
  if (/hello|hi lumen|hey|good morning|good afternoon/.test(q)) return "greeting";

  return "unknown";
}

export function buildVoiceReply(transcript: string): VoiceReply {
  const intent = detectVoiceIntent(transcript);

  switch (intent) {
    case "sf_day_trip":
      return {
        headline: "One perfect day in San Francisco",
        summary:
          "A walkable northeast start, a classic postcard finish, and dinner where locals actually go.",
        spoken:
          "For one day in San Francisco, I’d keep you on a tight scenic loop. Start at the Ferry Building for coffee and bay light. Walk through Chinatown into North Beach for lunch, then Coit Tower and Lombard for the views. Hit the sea lions at Pier 39, catch golden hour at the Golden Gate from Crissy Field, and end with dinner in the Mission. I’ll put the stops on your screen.",
        stops: SF_DAY_STOPS,
        followUps: [
          "Where should I park?",
          "Make it more food-focused",
          "Just the bridge and views",
        ],
      };

    case "parking":
      return {
        headline: "Parking for a one-day SF loop",
        summary:
          "Park once near Embarcadero early, then rideshare west for the bridge.",
        spoken:
          "For this day plan, park once near the Embarcadero or Portsmouth Square in the morning. Walk the northeast cluster on foot, then rideshare to Crissy Field for the bridge so you skip Presidio parking stress. At night, street parking in the Mission is usually easier than downtown.",
        stops: SF_DAY_STOPS.slice(0, 3),
        followUps: [
          "What should I see?",
          "Best sunset spot?",
          "Where should I eat?",
        ],
      };

    case "food":
      return {
        headline: "Eat your way through the day",
        summary: "Ferry Building breakfast, North Beach lunch, Mission dinner.",
        spoken:
          "Food-first version: breakfast at the Ferry Building, lunch in North Beach — pizza or focaccia — snack near the Wharf only if you need it, then dinner and a stroll in the Mission. That keeps the best bites without wasting the day in lines.",
        stops: [
          SF_DAY_STOPS[0],
          SF_DAY_STOPS[2],
          SF_DAY_STOPS[5],
          SF_DAY_STOPS[7],
        ],
        followUps: [
          "Full sightseeing day",
          "Where should I park?",
          "Sunset viewpoint?",
        ],
      };

    case "bridge":
      return {
        headline: "Views-first San Francisco",
        summary: "Coit, Lombard, then Golden Gate golden hour.",
        spoken:
          "If you mainly want the views: Coit Tower, Lombard Street overlook, then Crissy Field for Golden Gate at golden hour. That trio gives you city, hill, and bridge without a frantic schedule.",
        stops: [SF_DAY_STOPS[3], SF_DAY_STOPS[4], SF_DAY_STOPS[6]],
        followUps: [
          "Add food stops",
          "Full one-day plan",
          "Where should I park?",
        ],
      };

    case "greeting":
      return {
        headline: "I’m listening",
        summary: "Ask me what to see on a one-day San Francisco visit.",
        spoken:
          "Hey — I’m Lumen. Ask me something like: I’m visiting San Francisco for one day, what should I see?",
        stops: [],
        followUps: [
          "I’m visiting San Francisco for one day. What should I see?",
          "Where should I park?",
          "Food-focused day",
        ],
      };

    default:
      return {
        headline: "Try asking about your SF day",
        summary:
          "I can plan a one-day San Francisco visit — sights, food, parking, or views.",
        spoken:
          "I heard you. For this mockup, ask: I’m visiting San Francisco for one day — what should I see? I can also help with parking, food, or bridge views.",
        stops: [],
        followUps: [
          "I’m visiting San Francisco for one day. What should I see?",
          "Where should I park?",
          "Golden Gate sunset plan",
        ],
      };
  }
}
