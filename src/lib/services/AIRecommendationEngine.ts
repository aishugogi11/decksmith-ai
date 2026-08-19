import { parsePreferences } from "@/lib/parsePreferences";
import { rankDestinations } from "@/lib/scoring";
import type { Destination, RankedDestination } from "@/lib/types";
import type { SearchIntent } from "@/lib/services/types";

const CATEGORY_PATTERNS: Array<{ pattern: RegExp; category: string; label: string }> = [
  { pattern: /coffee|café|cafe|espresso/, category: "cafe", label: "café" },
  { pattern: /brunch|breakfast/, category: "brunch_restaurant", label: "brunch spot" },
  { pattern: /sushi/, category: "sushi_restaurant", label: "sushi restaurant" },
  { pattern: /pizza/, category: "pizza_restaurant", label: "pizza place" },
  { pattern: /bar|pub|cocktail|drinks/, category: "bar", label: "bar" },
  { pattern: /park(?!ing)/, category: "park", label: "park" },
  { pattern: /museum|gallery/, category: "museum", label: "museum" },
  { pattern: /grocery|supermarket/, category: "grocery_store", label: "grocery store" },
  { pattern: /restaurant|dinner|lunch|food|eat/, category: "restaurant", label: "restaurant" },
  { pattern: /bakery|pastry/, category: "bakery", label: "bakery" },
];

/**
 * AIRecommendationEngine — understands the request and ranks destinations.
 * Intentionally independent of any maps / Places provider.
 */
export class AIRecommendationEngine {
  /**
   * Parse natural language into category + preferences + Places query.
   * Example: "Find a quiet coffee shop" → cafe + wantsQuiet + text query.
   */
  understand(rawQuery: string): SearchIntent {
    const query = rawQuery.trim();
    const preferences = parsePreferences(query);
    const matched = CATEGORY_PATTERNS.find((c) => c.pattern.test(query.toLowerCase()));

    const placesQuery = this.buildPlacesQuery(query, matched?.label);

    return {
      rawQuery: query,
      placesQuery,
      category: matched?.category,
      preferences: {
        ...preferences,
        query,
      },
    };
  }

  /**
   * Rank provider results against extracted preferences.
   */
  rank(destinations: Destination[], intent: SearchIntent): RankedDestination[] {
    const ranked = rankDestinations(destinations, intent.preferences);

    return ranked.map((d, index) => {
      if (index > 2) return d;
      const bits = d.rankReasons.slice(0, 3).join(", ");
      const why = bits
        ? `${bits.charAt(0).toUpperCase()}${bits.slice(1)}.`
        : d.aiExplanation;
      return {
        ...d,
        aiExplanation: why,
      };
    });
  }

  private buildPlacesQuery(query: string, categoryLabel?: string): string {
    // Strip leading command verbs so Places gets a clean local query
    const cleaned = query
      .replace(/^(find|show|search for|look for|get me|i want|i need)\s+/i, "")
      .replace(/\s+/g, " ")
      .trim();

    if (cleaned.length >= 3) return cleaned;
    if (categoryLabel) return categoryLabel;
    return query;
  }
}

export const aiRecommendationEngine = new AIRecommendationEngine();
