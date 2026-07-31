import { searchCatalog } from "./catalog";

/** Resolve a natural-language hint to a catalog image URL when no src is given. */
export function resolveImageSrcFromHint(hint: string): string | undefined {
  const q = hint.trim();
  if (!q || q.length < 4) return undefined;
  if (/placeholder|soft daylight|product \/ context/i.test(q) && q.length < 40) {
    // Generic defaults — don't auto-pick a random photo
    return undefined;
  }
  const hits = searchCatalog([q], { limit: 1 });
  return hits[0]?.src;
}
