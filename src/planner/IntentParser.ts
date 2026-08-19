import type { Intent, IntentCategory, Task } from "@/models";
import { uid } from "@/models/helpers";

const PATTERNS: { category: IntentCategory; re: RegExp; priority: number }[] = [
  {
    category: "grocery",
    re: /\b(grocer(?:y|ies)|trader joe|whole foods|supermarket|food shopping|buy food|go to (?:the )?grocer)/i,
    priority: 2,
  },
  {
    category: "pharmacy",
    re: /\b(prescription|pharmacy|cvs|walgreens|pick(?:\s*|-)?up (?:my )?meds?|medicine|pick up my prescription)\b/i,
    priority: 1,
  },
  { category: "dinner", re: /\b(dinner|grab dinner|eat dinner|chipotle|sushi|takeout|take-out)\b/i, priority: 3 },
  { category: "lunch", re: /\b(lunch|grab lunch)\b/i, priority: 3 },
  { category: "coffee", re: /\b(coffee|espresso|cafe|café|blue bottle|latte)\b/i, priority: 2 },
  { category: "gas", re: /\b(gas|fuel|fill up|petrol)\b/i, priority: 2 },
  { category: "gym", re: /\b(gym|workout|exercise)\b/i, priority: 2 },
  {
    category: "home",
    re: /\b(home|get(?:ting)? home|back home|head home|head back home|go home|heading home)\b/i,
    priority: 99,
  },
  { category: "work", re: /\b(work|office|commute to work)\b/i, priority: 50 },
];

const FILLER =
  /^(?:i\s+)?(?:need\s+to|wanna|want\s+to|have\s+to|gotta|please|also|then|next|finally|go\s+to)?\s*/i;

/**
 * Extract every errand phrase as its own intent — any plan, not one fixed scenario.
 * Known categories when matched; otherwise free-form "other" using the phrase as search text.
 */
export class IntentParser {
  parse(utterance: string): Intent[] {
    const text = utterance.trim();
    if (!text) return [];

    const chunks = splitErrands(text);
    const found: Intent[] = [];
    const seen = new Set<IntentCategory>();

    const add = (category: IntentCategory, rawText: string, priority: number) => {
      if (seen.has(category) && category !== "other") return;
      if (category !== "other") seen.add(category);
      found.push({
        id: uid("intent"),
        category,
        rawText,
        priority,
      });
    };

    for (const chunk of chunks) {
      const cleaned = cleanChunk(chunk);
      if (!cleaned || isNoise(cleaned)) continue;

      const matches = matchAllCategories(cleaned);
      if (matches.length) {
        for (const m of matches) {
          add(m.category, cleaned, m.priority);
        }
      } else {
        add("other", cleaned, 5);
      }
    }

    // Whole-utterance pass catches intents jammed into one breath
    // e.g. "groceries pick up my prescription and head home"
    for (const p of PATTERNS) {
      if (p.re.test(text)) {
        add(p.category, text, p.priority);
      }
    }

    if (
      !seen.has("home") &&
      /\b(?:before|then|and)?\s*(?:getting\s+|heading\s+|head(?:ing)?\s+back\s+)?home\b/i.test(
        text
      )
    ) {
      add("home", "home", 99);
    }

    if (!found.length) {
      add("other", text, 5);
    }

    return found.sort((a, b) => a.priority - b.priority);
  }

  toTasks(intents: Intent[]): Task[] {
    return intents.map((intent) => ({
      id: uid("task"),
      intent,
      status: "pending" as const,
    }));
  }
}

export const intentParser = new IntentParser();

function splitErrands(text: string): string[] {
  // Split on and / then / commas / semicolons / plus — keep each goal separate
  return text
    .split(/\s+(?:and then|and also|then|plus)\s+|,\s*|\s+and\s+|;\s*|\/\s*/i)
    .map((c) => c.trim())
    .filter(Boolean);
}

function cleanChunk(chunk: string): string {
  return chunk
    .replace(FILLER, "")
    .replace(/^(?:to\s+)/i, "")
    .replace(/[.!?]+$/g, "")
    .trim();
}

function isNoise(text: string): boolean {
  return (
    text.length < 2 ||
    /^(?:please|thanks|thank you|ok|okay|um+|uh+)$/i.test(text)
  );
}

function matchAllCategories(
  text: string
): { category: IntentCategory; priority: number }[] {
  const hits: { category: IntentCategory; priority: number }[] = [];
  for (const p of PATTERNS) {
    if (p.re.test(text)) {
      hits.push({ category: p.category, priority: p.priority });
    }
  }
  return hits;
}

/** Places / demo search query for any intent. */
export function categorySearchQuery(
  category: IntentCategory,
  rawText: string
): string {
  switch (category) {
    case "grocery":
      return "grocery store supermarket";
    case "pharmacy":
      return "pharmacy prescription";
    case "dinner":
      return "dinner restaurant";
    case "lunch":
      return "lunch restaurant";
    case "coffee":
      return "coffee shop";
    case "gas":
      return "gas station";
    case "gym":
      return "gym";
    case "home":
      return "home";
    case "work":
      return "office";
    default: {
      // Free-form: use the user's words as the place search
      const cleaned = rawText.replace(FILLER, "").trim();
      return cleaned || "place nearby";
    }
  }
}

export function dwellMinutesFor(category: IntentCategory): number {
  switch (category) {
    case "grocery":
      return 25;
    case "pharmacy":
      return 10;
    case "dinner":
    case "lunch":
      return 35;
    case "coffee":
      return 15;
    case "gas":
      return 8;
    case "gym":
      return 60;
    case "home":
    case "work":
      return 0;
    default:
      return 20;
  }
}
