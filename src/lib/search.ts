import { DEMO_DESTINATIONS } from "./demoData";
import { parsePreferences } from "./parsePreferences";
import { rankDestinations } from "./scoring";
import type { RankedDestination, SearchResult } from "./types";

/**
 * Runs a local AI-style search against demo inventory.
 * Swap this module for a live Places + LLM pipeline later.
 */
export async function runSearch(
  query: string,
  options?: { delayMs?: number }
): Promise<SearchResult> {
  const delay = options?.delayMs ?? 1600;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const prefs = parsePreferences(query);
  const destinations = rankDestinations(DEMO_DESTINATIONS, prefs);

  // Lightly tailor AI explanations for top matches
  const tailored: RankedDestination[] = destinations.map((d, index) => {
    if (index > 2) return d;
    const bits = d.rankReasons.slice(0, 3).join(", ");
    return {
      ...d,
      aiExplanation: bits
        ? `${bits.charAt(0).toUpperCase()}${bits.slice(1)}.`
        : d.aiExplanation,
    };
  });

  return {
    query,
    destinations: tailored,
    selectedId: tailored[0]?.id ?? null,
  };
}
