import type { Presentation, Slide } from "@/lib/types";
import { uid } from "@/lib/utils";

export type CitationStyle =
  | "APA"
  | "MLA"
  | "Chicago"
  | "IEEE"
  | "Harvard"
  | "Vancouver"
  | "BibTeX";

export const CITATION_STYLES: CitationStyle[] = [
  "APA",
  "MLA",
  "Chicago",
  "IEEE",
  "Harvard",
  "Vancouver",
  "BibTeX",
];

export type CitationSourceType =
  | "url"
  | "paper"
  | "book"
  | "pdf"
  | "unknown";

export type CitationEntry = {
  id: string;
  sourceType: CitationSourceType;
  title: string;
  authors: string[];
  year?: string;
  url?: string;
  publisher?: string;
  journal?: string;
  doi?: string;
  accessed?: string;
  missing: string[];
  inText: string;
  bibliography: string;
  bibtex?: string;
};

const URL_RE = /https?:\/\/[^\s<>"')\]]+/gi;
const DOI_RE = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/i;
const PDF_RE = /\.pdf(\?|#|$)/i;

export function detectSourceType(text: string): CitationSourceType {
  if (PDF_RE.test(text) || /\bpdf\b/i.test(text)) return "pdf";
  if (
    /arxiv|doi\.org|pubmed|springer|ieee|acm|nature\.com|science\.org/i.test(
      text
    ) ||
    DOI_RE.test(text)
  ) {
    return "paper";
  }
  if (/\bisbn\b|\bpress\b|university press|hardcover|paperback/i.test(text)) {
    return "book";
  }
  if (URL_RE.test(text)) return "url";
  return "unknown";
}

export function extractUrls(text: string): string[] {
  return [...new Set((text.match(URL_RE) || []).map((u) => u.replace(/[.,;]+$/, "")))];
}

/** Extract lightweight metadata from free text / URLs (mock enrichment). */
export function extractCitationMetadata(raw: string): {
  title: string;
  authors: string[];
  year?: string;
  url?: string;
  publisher?: string;
  journal?: string;
  doi?: string;
  sourceType: CitationSourceType;
  missing: string[];
} {
  const url = extractUrls(raw)[0];
  const doi = raw.match(DOI_RE)?.[0];
  const year =
    raw.match(/\b(19|20)\d{2}\b/)?.[0] ||
    new Date().getFullYear().toString();
  const sourceType = detectSourceType(raw);

  let title = raw
    .replace(URL_RE, "")
    .replace(DOI_RE, "")
    .replace(/\s+/g, " ")
    .trim();

  if (url && (!title || title.length < 4)) {
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      title = host
        .split(".")
        .slice(0, -1)
        .join(" ")
        .replace(/[-_]/g, " ");
      title = title.charAt(0).toUpperCase() + title.slice(1);
    } catch {
      title = "Untitled source";
    }
  }

  if (!title) title = "Untitled source";

  const authorsMatch = raw.match(
    /(?:by|author[s]?:?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)(?:\s+(?:and|&)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)?)/
  );
  const authors = authorsMatch
    ? authorsMatch[1]
        .split(/\s+and\s+|\s*&\s*/)
        .map((a) => a.trim())
        .filter(Boolean)
    : [];

  const missing: string[] = [];
  if (!authors.length) missing.push("author");
  if (!year) missing.push("year");
  if (sourceType === "paper" && !doi && !url) missing.push("DOI or URL");
  if (sourceType === "book" && !/press|publisher/i.test(raw))
    missing.push("publisher");
  if (!url && sourceType === "url") missing.push("URL");

  let publisher: string | undefined;
  let journal: string | undefined;
  if (sourceType === "book") publisher = "Publisher TBD";
  if (sourceType === "paper") journal = "Journal TBD";

  return {
    title: title.slice(0, 160),
    authors,
    year,
    url,
    publisher,
    journal,
    doi,
    sourceType,
    missing,
  };
}

function authorApa(authors: string[]): string {
  if (!authors.length) return "n.d.";
  if (authors.length === 1) {
    const parts = authors[0].split(/\s+/);
    const last = parts[parts.length - 1];
    const initials = parts
      .slice(0, -1)
      .map((p) => `${p[0]}.`)
      .join(" ");
    return initials ? `${last}, ${initials}` : last;
  }
  if (authors.length === 2) {
    return `${authorApa([authors[0]])} & ${authorApa([authors[1]])}`;
  }
  return `${authorApa([authors[0]])} et al.`;
}

function authorMla(authors: string[]): string {
  if (!authors.length) return "Unknown";
  if (authors.length === 1) {
    const parts = authors[0].split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(" ")}`;
  }
  return `${authorMla([authors[0]])}, et al.`;
}

export function formatCitation(
  meta: ReturnType<typeof extractCitationMetadata>,
  style: CitationStyle
): Pick<CitationEntry, "inText" | "bibliography" | "bibtex"> {
  const year = meta.year || "n.d.";
  const authorShort = meta.authors[0]
    ? meta.authors[0].split(/\s+/).slice(-1)[0]
    : "Unknown";
  const accessed = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const bibtex = `@${meta.sourceType === "book" ? "book" : "misc"}{${authorShort.toLowerCase()}${year},
  title = {${meta.title}},
  author = {${meta.authors.join(" and ") || "Unknown"}},
  year = {${year}},
  url = {${meta.url || ""}},
  doi = {${meta.doi || ""}}
}`;

  switch (style) {
    case "APA":
      return {
        inText: `(${authorShort}, ${year})`,
        bibliography: `${authorApa(meta.authors)} (${year}). ${meta.title}. ${
          meta.publisher || meta.journal || "Online source"
        }.${meta.url ? ` ${meta.url}` : ""}`,
        bibtex,
      };
    case "MLA":
      return {
        inText: `(${authorShort})`,
        bibliography: `${authorMla(meta.authors)}. “${meta.title}.” ${
          meta.journal || meta.publisher || "Web"
        }, ${year}.${meta.url ? ` ${meta.url}.` : ""}`,
        bibtex,
      };
    case "Chicago":
      return {
        inText: `(${authorShort} ${year})`,
        bibliography: `${meta.authors.join(", ") || "Unknown"}. “${meta.title}.” ${
          meta.publisher || "Online"
        }, ${year}.${meta.url ? ` ${meta.url}.` : ""}`,
        bibtex,
      };
    case "IEEE":
      return {
        inText: `[n]`,
        bibliography: `${meta.authors.join(", ") || "Unknown"}, “${meta.title},” ${
          meta.journal || "Online"
        }, ${year}.${meta.url ? ` Available: ${meta.url}` : ""}`,
        bibtex,
      };
    case "Harvard":
      return {
        inText: `(${authorShort}, ${year})`,
        bibliography: `${authorShort}${
          meta.authors.length > 1 ? " et al." : ""
        } ${year}, '${meta.title}', ${meta.publisher || "Online"}.${
          meta.url ? ` Available at: ${meta.url}` : ""
        }`,
        bibtex,
      };
    case "Vancouver":
      return {
        inText: `(n)`,
        bibliography: `${meta.authors.join(", ") || "Unknown"}. ${meta.title}. ${
          meta.publisher || "Internet"
        }; ${year}.${meta.url ? ` Available from: ${meta.url}` : ""}`,
        bibtex,
      };
    case "BibTeX":
      return {
        inText: `\\cite{${authorShort.toLowerCase()}${year}}`,
        bibliography: bibtex,
        bibtex,
      };
  }
}

export function createCitation(
  raw: string,
  style: CitationStyle
): CitationEntry {
  const meta = extractCitationMetadata(raw);
  const formatted = formatCitation(meta, style);
  return {
    id: uid("cite"),
    sourceType: meta.sourceType,
    title: meta.title,
    authors: meta.authors,
    year: meta.year,
    url: meta.url,
    publisher: meta.publisher,
    journal: meta.journal,
    doi: meta.doi,
    accessed: new Date().toISOString().slice(0, 10),
    missing: meta.missing,
    ...formatted,
  };
}

export function mergeDuplicateCitations(
  entries: CitationEntry[]
): CitationEntry[] {
  const out: CitationEntry[] = [];
  for (const e of entries) {
    const key = (e.doi || e.url || e.title).toLowerCase();
    const existing = out.find(
      (x) => (x.doi || x.url || x.title).toLowerCase() === key
    );
    if (!existing) out.push(e);
  }
  return out;
}

export function reformatCitations(
  entries: CitationEntry[],
  style: CitationStyle
): CitationEntry[] {
  return entries.map((e) => {
    const formatted = formatCitation(
      {
        title: e.title,
        authors: e.authors,
        year: e.year,
        url: e.url,
        publisher: e.publisher,
        journal: e.journal,
        doi: e.doi,
        sourceType: e.sourceType,
        missing: e.missing,
      },
      style
    );
    return { ...e, ...formatted };
  });
}

export function buildReferencesSlide(
  entries: CitationEntry[],
  opts?: { title?: "References" | "Works Cited" }
): Slide {
  const title = opts?.title ?? "References";
  const bullets = entries.length
    ? entries.map((e, i) => {
        const warn = e.missing.length
          ? ` ⚠ missing: ${e.missing.join(", ")}`
          : "";
        return `${i + 1}. ${e.bibliography}${warn}`;
      })
    : ["No citations yet — highlight text or paste a URL to cite."];

  return {
    id: uid("slide"),
    layout: "bullets",
    title,
    subtitle: "Generated by Decksmith Citation Engine",
    bullets: bullets.slice(0, 12),
    notes: entries
      .filter((e) => e.missing.length)
      .map((e) => `Incomplete: ${e.title} (${e.missing.join(", ")})`)
      .join(" · "),
  };
}

export function upsertReferencesSlide(
  presentation: Presentation,
  entries: CitationEntry[],
  title: "References" | "Works Cited" = "References"
): Presentation {
  const slide = buildReferencesSlide(entries, { title });
  const idx = presentation.slides.findIndex((s) =>
    /^(references|works cited)$/i.test(s.title)
  );
  const slides = [...presentation.slides];
  if (idx >= 0) {
    slides[idx] = { ...slide, id: slides[idx].id };
  } else {
    // Insert before thank-you if present
    const thankIdx = slides.findIndex((s) => s.layout === "thankyou");
    if (thankIdx >= 0) slides.splice(thankIdx, 0, slide);
    else slides.push(slide);
  }
  return {
    ...presentation,
    slides,
    updatedAt: new Date().toISOString(),
  };
}

export function detectCitationsInText(
  text: string,
  style: CitationStyle
): CitationEntry[] {
  const urls = extractUrls(text);
  if (urls.length) {
    return mergeDuplicateCitations(urls.map((u) => createCitation(u, style)));
  }
  if (text.trim().length > 8) {
    return [createCitation(text.trim(), style)];
  }
  return [];
}

export type CitationChatIntent =
  | {
      kind: "add";
      sourceText: string;
      slideTitle: "References" | "Works Cited" | null;
    }
  | {
      kind: "slide-only";
      slideTitle: "References" | "Works Cited";
    };

/**
 * Parse chat/voice requests like:
 * “Add citation to works cited: https://…”
 * “Put this on the works cited slide”
 * “Create a works cited page”
 */
export function parseCitationChatIntent(
  text: string
): CitationChatIntent | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();

  const wantsWorksCited =
    /\bworks cited\b/.test(lower) || /\bwork cited\b/.test(lower);
  const wantsReferences =
    /\breferences?\b/.test(lower) &&
    /\b(slide|page|list|section|add|create|generate|cite|citation)\b/.test(
      lower
    );
  const slideTitle: "References" | "Works Cited" | null = wantsWorksCited
    ? "Works Cited"
    : wantsReferences
      ? "References"
      : null;

  const isCiteVerb =
    /\b(cite|citation|bibliography|works cited|references)\b/.test(lower) &&
    /\b(add|create|generate|put|include|insert|make|append)\b/.test(lower);

  const isLegacyPrefix =
    /^(generate citation|cite this|add citation|cite)\b/i.test(trimmed);

  // Slide only — no source payload
  if (
    slideTitle &&
    /^(create|add|make|generate|insert)\b/.test(lower) &&
    /\b(works cited|references)\b/.test(lower) &&
    !extractUrls(trimmed).length &&
    !/:\s*\S/.test(trimmed) &&
    trimmed.length < 80
  ) {
    return { kind: "slide-only", slideTitle };
  }

  if (!isCiteVerb && !isLegacyPrefix && !slideTitle) return null;
  if (!isCiteVerb && !isLegacyPrefix && slideTitle && !/\bcitat/.test(lower)) {
    // “add to works cited: url” still counts
    if (!/add .+ to (the )?(works cited|references)/i.test(trimmed)) {
      return null;
    }
  }

  // “Add https://… to works cited”
  const urlFirst = trimmed.match(
    /\b(add|put|include)\s+(https?:\/\/\S+)\s+(to|on|in)\s+(the\s+)?(works cited|references)/i
  );

  let sourceText = urlFirst
    ? urlFirst[2]
    : trimmed
        .replace(
          /^(please\s+)?(can you\s+)?(add|put|include|insert|append)\s+(a\s+)?(citation|cite|source)\s+(to|on|in)\s+(the\s+)?(works cited|references)(\s+slide)?\s*[:\-]?\s*/i,
          ""
        )
        .replace(
          /^(please\s+)?(can you\s+)?(generate citation|cite this|add citation|cite)\s*[:\-]?\s*/i,
          ""
        )
        .replace(
          /\b(and\s+)?(add|put|include|insert|append)\s+(it|this|them|the citation)?\s*(to|on|in)\s+(the\s+)?(works cited|references)(\s+slide)?\b/gi,
          " "
        )
        .replace(
          /\b(to|on|in)\s+(the\s+)?(works cited|references)(\s+slide)?\b/gi,
          " "
        )
        .replace(/^[:\-\s]+/, "")
        .replace(/\s+/g, " ")
        .trim();

  // Prefer explicit URL anywhere in the message
  const urls = extractUrls(trimmed);
  if (urls.length === 1 && (!sourceText || sourceText.length < 8)) {
    sourceText = urls[0];
  } else if (urls.length >= 1 && /works cited|references/i.test(lower)) {
    sourceText = urls.join(" ");
  }

  if (!sourceText || sourceText.length < 3) {
    if (slideTitle) return { kind: "slide-only", slideTitle };
    return null;
  }

  return {
    kind: "add",
    sourceText,
    slideTitle,
  };
}
