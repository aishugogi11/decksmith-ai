import type { PriceLevel, SearchPreferences } from "./types";

/**
 * Lightweight preference extraction from natural language.
 * Easy to replace with an LLM intent parser later.
 */
export function parsePreferences(query: string): SearchPreferences {
  const q = query.toLowerCase();

  let maxPrice: PriceLevel | undefined;
  if (/under\s*£?\s*15|cheap|budget/.test(q)) maxPrice = 1;
  else if (/under\s*£?\s*20|affordable/.test(q)) maxPrice = 2;
  else if (/under\s*£?\s*35/.test(q)) maxPrice = 3;

  return {
    query,
    wantsQuiet: /quiet|calm|peaceful|focus|work/.test(q),
    wantsParking: /parking|park|garage/.test(q),
    wantsOutdoor: /outdoor|patio|terrace|outside|garden/.test(q),
    wantsWifi: /wi-?fi|internet/.test(q),
    wantsLaptop: /laptop|remote|work|study/.test(q),
    wantsLate: /late|night|evening|open late/.test(q),
    wantsBrunch: /brunch|breakfast/.test(q),
    wantsValue: /value|cheap|budget|under|affordable/.test(q),
    wantsEv: /ev|electric|charging/.test(q),
    maxPrice,
    openNow: /open now|open late|tonight/.test(q),
  };
}
