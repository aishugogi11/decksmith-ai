import type { VisualCandidate } from "./types";

/**
 * Curated in-product visual library (Unsplash CDN).
 * Keeps users inside Decksmith without an external search UI.
 */
type CatalogEntry = Omit<VisualCandidate, "query"> & {
  tags: string[];
  style: Array<"photo" | "illustration" | "abstract" | "people" | "product" | "nature" | "office" | "tech" | "medical" | "finance">;
};

const U = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const ENTRIES: CatalogEntry[] = [
  {
    id: "team-collab",
    kind: "photo",
    src: U("photo-1522071820081-009f0129c71c"),
    thumb: U("photo-1522071820081-009f0129c71c", 480),
    alt: "Team collaborating around a table",
    photographer: "Annie Spratt",
    tags: ["team", "collaboration", "meeting", "office", "startup", "people", "workshop"],
    style: ["photo", "people", "office"],
  },
  {
    id: "handshake",
    kind: "photo",
    src: U("photo-1521791136064-7986c2920216"),
    thumb: U("photo-1521791136064-7986c2920216", 480),
    alt: "Business handshake partnership",
    photographer: "Cytonn Photography",
    tags: ["handshake", "deal", "partnership", "business", "investor", "agreement"],
    style: ["photo", "people", "office"],
  },
  {
    id: "laptop-desk",
    kind: "photo",
    src: U("photo-1498050108023-c5249f4df085"),
    thumb: U("photo-1498050108023-c5249f4df085", 480),
    alt: "Laptop coding workspace",
    photographer: "Christopher Gower",
    tags: ["laptop", "code", "tech", "product", "developer", "saas", "software"],
    style: ["photo", "tech", "product"],
  },
  {
    id: "product-phone",
    kind: "photo",
    src: U("photo-1512941937669-90a1b58e7e9c"),
    thumb: U("photo-1512941937669-90a1b58e7e9c", 480),
    alt: "Person using smartphone app",
    photographer: "William Iven",
    tags: ["phone", "mobile", "app", "product", "ux", "consumer"],
    style: ["photo", "product", "tech"],
  },
  {
    id: "city-skyline",
    kind: "photo",
    src: U("photo-1449824913935-59a10b8d2000"),
    thumb: U("photo-1449824913935-59a10b8d2000", 480),
    alt: "Modern city skyline at dusk",
    photographer: "Pedro Lastra",
    tags: ["city", "skyline", "growth", "market", "urban", "global"],
    style: ["photo"],
  },
  {
    id: "abstract-wave",
    kind: "illustration",
    src: U("photo-1618005182384-a83a8bd57fbe"),
    thumb: U("photo-1618005182384-a83a8bd57fbe", 480),
    alt: "Abstract fluid wave gradients",
    photographer: "Milad Fakurian",
    tags: ["abstract", "gradient", "wave", "background", "modern", "creative"],
    style: ["illustration", "abstract"],
  },
  {
    id: "soft-geometry",
    kind: "illustration",
    src: U("photo-1557682250-33bd709cbe85"),
    thumb: U("photo-1557682250-33bd709cbe85", 480),
    alt: "Soft purple geometric abstraction",
    photographer: "Gradienta",
    tags: ["abstract", "geometry", "minimal", "background", "brand"],
    style: ["illustration", "abstract"],
  },
  {
    id: "healthcare",
    kind: "photo",
    src: U("photo-1576091160399-112ba8d25d1d"),
    thumb: U("photo-1576091160399-112ba8d25d1d", 480),
    alt: "Doctor reviewing patient charts",
    photographer: "National Cancer Institute",
    tags: ["healthcare", "medical", "doctor", "hospital", "health", "care", "clinic"],
    style: ["photo", "medical"],
  },
  {
    id: "lab-research",
    kind: "photo",
    src: U("photo-1532187863486-abf9dbad1b69"),
    thumb: U("photo-1532187863486-abf9dbad1b69", 480),
    alt: "Scientist working in a laboratory",
    photographer: "National Cancer Institute",
    tags: ["lab", "research", "science", "biotech", "experiment", "innovation"],
    style: ["photo", "medical", "tech"],
  },
  {
    id: "finance-charts",
    kind: "photo",
    src: U("photo-1611974789855-9c2a0a7236a3"),
    thumb: U("photo-1611974789855-9c2a0a7236a3", 480),
    alt: "Stock charts on a trading screen",
    photographer: "Nick Chong",
    tags: ["finance", "charts", "stocks", "investment", "growth", "revenue", "metrics"],
    style: ["photo", "finance", "office"],
  },
  {
    id: "whiteboard",
    kind: "photo",
    src: U("photo-1552664730-d307ca884978"),
    thumb: U("photo-1552664730-d307ca884978", 480),
    alt: "Team planning on a whiteboard",
    photographer: "You X Ventures",
    tags: ["whiteboard", "strategy", "planning", "brainstorm", "workshop", "process"],
    style: ["photo", "people", "office"],
  },
  {
    id: "nature-calm",
    kind: "photo",
    src: U("photo-1506905925346-21bda4d32df4"),
    thumb: U("photo-1506905925346-21bda4d32df4", 480),
    alt: "Mountain landscape over misty valley",
    photographer: "Quin Stevenson",
    tags: ["nature", "mountain", "calm", "landscape", "outdoor", "wellness"],
    style: ["photo", "nature"],
  },
  {
    id: "customer-smile",
    kind: "photo",
    src: U("photo-1551836022-d5d88e9218df"),
    thumb: U("photo-1551836022-d5d88e9218df", 480),
    alt: "Customer smiling during conversation",
    photographer: "Christina @ wocintechchat.com",
    tags: ["customer", "smile", "service", "people", "support", "retail"],
    style: ["photo", "people"],
  },
  {
    id: "data-center",
    kind: "photo",
    src: U("photo-1558494949-ef010cbdcc31"),
    thumb: U("photo-1558494949-ef010cbdcc31", 480),
    alt: "Server racks in a data center",
    photographer: "Taylor Vick",
    tags: ["server", "cloud", "infrastructure", "data", "enterprise", "security"],
    style: ["photo", "tech"],
  },
  {
    id: "education",
    kind: "photo",
    src: U("photo-1503676260728-1c00da094a0b"),
    thumb: U("photo-1503676260728-1c00da094a0b", 480),
    alt: "Students studying with notebooks",
    photographer: "Element5 Digital",
    tags: ["education", "students", "learning", "classroom", "school", "university"],
    style: ["photo", "people"],
  },
  {
    id: "product-packaging",
    kind: "photo",
    src: U("photo-1556228578-0d85b1a4d571"),
    thumb: U("photo-1556228578-0d85b1a4d571", 480),
    alt: "Minimal product packaging on desk",
    photographer: "Devin Avery",
    tags: ["product", "packaging", "brand", "consumer", "retail", "design"],
    style: ["photo", "product"],
  },
  {
    id: "remote-work",
    kind: "photo",
    src: U("photo-1588196749597-9ff075ee6b5b"),
    thumb: U("photo-1588196749597-9ff075ee6b5b", 480),
    alt: "Video call on laptop at home",
    photographer: "Chris Montgomery",
    tags: ["remote", "video", "home", "work", "zoom", "hybrid"],
    style: ["photo", "people", "office"],
  },
  {
    id: "architecture",
    kind: "photo",
    src: U("photo-1486406146926-c627a92ad1ab"),
    thumb: U("photo-1486406146926-c627a92ad1ab", 480),
    alt: "Glass skyscraper architecture",
    photographer: "Sean Pollock",
    tags: ["architecture", "building", "corporate", "enterprise", "modern"],
    style: ["photo", "office"],
  },
  {
    id: "ai-network",
    kind: "illustration",
    src: U("photo-1677442136019-21780ecad995"),
    thumb: U("photo-1677442136019-21780ecad995", 480),
    alt: "Abstract AI neural network visualization",
    photographer: "Google DeepMind",
    tags: ["ai", "network", "machine learning", "future", "technology", "digital"],
    style: ["illustration", "tech", "abstract"],
  },
  {
    id: "coffee-notes",
    kind: "photo",
    src: U("photo-1434030216411-0b793f4b4173"),
    thumb: U("photo-1434030216411-0b793f4b4173", 480),
    alt: "Notebook and coffee on wooden desk",
    photographer: "Green Chameleon",
    tags: ["notes", "writing", "planning", "desk", "minimal", "focus"],
    style: ["photo", "office"],
  },
];

export function searchCatalog(
  queries: string[],
  opts?: { preferIllustration?: boolean; limit?: number }
): VisualCandidate[] {
  const limit = opts?.limit ?? 8;
  const tokens = queries
    .join(" ")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);

  const scored = ENTRIES.map((entry) => {
    let score = 0;
    const hay = `${entry.alt} ${entry.tags.join(" ")} ${entry.style.join(" ")}`.toLowerCase();
    for (const t of tokens) {
      if (hay.includes(t)) score += 3;
      if (entry.tags.some((tag) => tag.includes(t) || t.includes(tag))) score += 2;
    }
    if (opts?.preferIllustration && entry.kind === "illustration") score += 4;
    if (!opts?.preferIllustration && entry.kind === "photo") score += 1;
    return { entry, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const primaryQuery = queries[0] ?? "presentation visual";
  const picks = (scored.length ? scored : ENTRIES.map((entry) => ({ entry, score: 0 })))
    .slice(0, limit)
    .map(({ entry }) => ({
      id: entry.id,
      kind: entry.kind,
      src: entry.src,
      thumb: entry.thumb,
      alt: entry.alt,
      photographer: entry.photographer,
      tags: entry.tags,
      query: primaryQuery,
    }));

  return picks;
}

export function catalogSize(): number {
  return ENTRIES.length;
}
