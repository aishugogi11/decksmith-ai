import type { ChatMessage, Presentation, Slide, ThemeId } from "@/lib/types";
import { uid } from "@/lib/utils";

/** Mock quantum-computing slides for the demo flow. */
export function createQuantumDeck(themeId: ThemeId = "education"): Presentation {
  const now = new Date().toISOString();
  const slides: Slide[] = [
    {
      id: uid("slide"),
      layout: "hero",
      title: "Quantum Computing",
      subtitle: "Bits to qubits — why the next decade looks different",
      body: "Superposition, entanglement, and real-world impact — without the jargon.",
      notes: "Welcome the class. Ask who has heard of quantum before.",
    },
    {
      id: uid("slide"),
      layout: "section",
      title: "What is a qubit?",
      subtitle: "The building block that changes everything",
      body: "A classical bit is 0 or 1. A qubit can be both — until we measure it.",
      callout: "Think of a spinning coin mid-air — not heads or tails yet.",
      notes: "Use the coin metaphor. Keep it playful.",
    },
    {
      id: uid("slide"),
      layout: "comparison",
      title: "Classical vs Quantum",
      subtitle: "Two ways computers think",
      comparison: [
        {
          title: "Classical",
          items: ["Bits: 0 or 1", "One path at a time", "Great for everyday apps"],
        },
        {
          title: "Quantum",
          items: ["Qubits: 0 and 1", "Many paths at once", "Built for hard puzzles"],
        },
      ],
      notes: "Emphasize complementarity, not replacement.",
    },
    {
      id: uid("slide"),
      layout: "stats",
      title: "Why it matters",
      subtitle: "Numbers that stick",
      stats: [
        { value: "2ⁿ", label: "States with n qubits" },
        { value: "100+", label: "Qubits in lab machines" },
        { value: "2030s", label: "Useful apps expected" },
      ],
      notes: "Explain exponential growth carefully.",
    },
    {
      id: uid("slide"),
      layout: "timeline",
      title: "A short history",
      timeline: [
        { title: "1980s", description: "Ideas of quantum computers appear" },
        { title: "1994", description: "Shor's algorithm shocks cryptography" },
        { title: "2019+", description: "Labs claim quantum milestones" },
        { title: "Today", description: "Still early — but accelerating" },
      ],
      notes: "Keep timeline light; skip deep history.",
    },
    {
      id: uid("slide"),
      layout: "process",
      title: "How a quantum program runs",
      process: [
        { title: "Prepare", description: "Set qubits into a starting state" },
        { title: "Interfere", description: "Apply gates that amplify good answers" },
        { title: "Measure", description: "Collapse to classical bits we can read" },
      ],
      notes: "Measure is the “reveal.”",
    },
    {
      id: uid("slide"),
      layout: "chart",
      title: "Where it could help",
      subtitle: "Problem classes that get hard fast",
      chartHint: "Bar chart: chemistry · logistics · cryptography · AI sampling",
      bullets: [
        "Simulating molecules for new materials",
        "Optimizing complex routes and schedules",
        "Exploring new cryptography frontiers",
      ],
      notes: "Reassure: phones won't be quantum tomorrow.",
    },
    {
      id: uid("slide"),
      layout: "quote",
      title: "Keep this idea",
      quote:
        "Quantum computers don’t try every answer one by one — they let possibilities interfere until the right patterns stand out.",
      quoteAuthor: "EchoFlow coach note",
      notes: "Pause here for questions.",
    },
    {
      id: uid("slide"),
      layout: "image",
      title: "Visual metaphor",
      subtitle: "Waves, not switches",
      imageHint: "Abstract wave interference · cool blues",
      body: "Qubits behave more like waves that can cancel or reinforce — that’s the magic of interference.",
      notes: "Show a simple wave animation if available.",
    },
    {
      id: uid("slide"),
      layout: "bullets",
      title: "Myths to drop",
      bullets: [
        "Myth: Quantum is just “faster Google.”",
        "Myth: It will replace every laptop.",
        "Myth: We fully understand all applications already.",
        "Truth: It’s a new tool for specific hard problems.",
      ],
      callout: "Curiosity > hype.",
      notes: "Invite students to challenge a myth.",
    },
    {
      id: uid("slide"),
      layout: "thankyou",
      title: "Questions?",
      subtitle: "You’re ready to explain quantum without fear.",
      body: "Next step: pick one metaphor and teach a friend in 60 seconds.",
      notes: "End with a challenge.",
    },
  ];

  return {
    id: uid("deck"),
    title: "Quantum Computing 101",
    subtitle: "For high school students",
    themeId,
    slides,
    createdAt: now,
    updatedAt: now,
  };
}

export function emptyPresentation(): Presentation {
  const now = new Date().toISOString();
  return {
    id: uid("deck"),
    title: "Untitled slides",
    subtitle: "Bring existing work — or research something new",
    themeId: "minimal",
    slides: [
      {
        id: uid("slide"),
        layout: "hero",
        title: "Transform slides you already have",
        subtitle: "Import · Redesign from feedback · Research · Coach",
        body: "Try: “Make this look like an Apple Keynote.”",
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

/** Biography / life-story slides — used for Steve Jobs and other subjects. */
export function createBiographyDeck(
  subject: string,
  themeId: ThemeId = "minimal"
): Presentation {
  const now = new Date().toISOString();
  const isJobs = /steve\s*jobs/i.test(subject);

  if (isJobs) {
    const slides: Slide[] = [
      {
        id: uid("slide"),
        layout: "hero",
        title: "Steve Jobs",
        subtitle: "A biography of vision, design, and reinvention",
        body: "1955 – 2011 · Co-founder of Apple",
        notes: "Open with presence — pause before the first title click.",
      },
      {
        id: uid("slide"),
        layout: "section",
        title: "Early life",
        subtitle: "Adopted in San Francisco, raised in Cupertino",
        body: "Jobs grew up around the garage culture of Silicon Valley — curious, restless, and drawn to electronics and design.",
        callout: "He dropped out of Reed College but kept auditing classes that fascinated him — including calligraphy.",
        notes: "Mention calligraphy → Mac typography later.",
      },
      {
        id: uid("slide"),
        layout: "timeline",
        title: "A life in chapters",
        timeline: [
          { title: "1976", description: "Apple founded with Steve Wozniak in a garage" },
          { title: "1984", description: "Macintosh launches — computer for everyone" },
          { title: "1985–96", description: "Leaves Apple; builds NeXT & invests in Pixar" },
          { title: "1997–2011", description: "Returns to Apple; iMac → iPhone era" },
        ],
        notes: "Keep each beat to one sentence aloud.",
      },
      {
        id: uid("slide"),
        layout: "stats",
        title: "Impact in numbers",
        subtitle: "Scale of the companies he shaped",
        stats: [
          { value: "1976", label: "Apple founded" },
          { value: "1B+", label: "iPhones sold (era he began)" },
          { value: "Pixar", label: "From struggling studio to Disney landmark" },
        ],
      },
      {
        id: uid("slide"),
        layout: "comparison",
        title: "How he thought",
        subtitle: "Design as a competitive advantage",
        comparison: [
          {
            title: "Beliefs",
            items: [
              "Simplicity is sophistication",
              "End-to-end control of product",
              "Technology + liberal arts",
            ],
          },
          {
            title: "Practice",
            items: [
              "Obsess over details people feel",
              "Say no to a thousand features",
              "Stage product reveals as theater",
            ],
          },
        ],
      },
      {
        id: uid("slide"),
        layout: "quote",
        title: "In his words",
        quote:
          "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.",
        quoteAuthor: "Steve Jobs · Stanford, 2005",
        notes: "Let the quote land before advancing.",
      },
      {
        id: uid("slide"),
        layout: "bullets",
        title: "What to remember",
        bullets: [
          "He paired taste with engineering — not either/or.",
          "Setbacks (being ousted from Apple) became fuel for NeXT and Pixar.",
          "He rebuilt Apple around a few products done extraordinarily well.",
          "His legacy is a culture of craft as much as a catalog of devices.",
        ],
        callout: "Biography isn’t hero worship — note the intensity and the cost.",
      },
      {
        id: uid("slide"),
        layout: "process",
        title: "Lessons for makers",
        process: [
          { title: "Focus", description: "Cut until the product feels inevitable" },
          { title: "Connect", description: "Join dots across disciplines" },
          { title: "Ship", description: "Taste only matters when it reaches people" },
        ],
      },
      {
        id: uid("slide"),
        layout: "thankyou",
        title: "Questions?",
        subtitle: "Steve Jobs — biography presentation",
        body: "Discuss: which chapter of his life best explains Apple today?",
        notes: "Invite one reflection from the audience.",
      },
    ];

    return {
      id: uid("deck"),
      title: "Steve Jobs — Biography",
      subtitle: "Vision, design, and reinvention",
      themeId,
      slides,
      createdAt: now,
      updatedAt: now,
    };
  }

  const slides: Slide[] = [
    {
      id: uid("slide"),
      layout: "hero",
      title: subject,
      subtitle: "A biography presentation",
      body: "Life · Work · Legacy",
      notes: `Introduce ${subject} and why their story matters today.`,
    },
    {
      id: uid("slide"),
      layout: "section",
      title: "Early life",
      subtitle: "Where the story begins",
      body: `Key formative years, family, and places that shaped ${subject}.`,
      callout: "Replace with verified biographical facts.",
    },
    {
      id: uid("slide"),
      layout: "timeline",
      title: "Milestones",
      timeline: [
        { title: "Beginnings", description: "First steps and early influences" },
        { title: "Breakthrough", description: "The moment that changed the path" },
        { title: "Peak work", description: "Defining achievements" },
        { title: "Legacy", description: "How the world remembers them" },
      ],
    },
    {
      id: uid("slide"),
      layout: "stats",
      title: "Impact at a glance",
      stats: [
        { value: "—", label: "Signature work" },
        { value: "—", label: "Years active" },
        { value: "—", label: "People influenced" },
      ],
    },
    {
      id: uid("slide"),
      layout: "bullets",
      title: "Defining traits",
      bullets: [
        "Core values and how they showed up in their work",
        "Obstacles they faced — and how they responded",
        "What contemporaries said about them",
        "Why this story still matters",
      ],
    },
    {
      id: uid("slide"),
      layout: "quote",
      title: "In their words",
      quote: `Add a memorable quote from ${subject}.`,
      quoteAuthor: subject,
    },
    {
      id: uid("slide"),
      layout: "thankyou",
      title: "Questions?",
      subtitle: `${subject} — biography`,
      body: "What chapter of this life would you want to study next?",
    },
  ];

  return {
    id: uid("deck"),
    title: `${subject} — Biography`,
    subtitle: "Life, work, and legacy",
    themeId,
    slides,
    createdAt: now,
    updatedAt: now,
  };
}

/** Generic topic slides when the prompt isn’t quantum or biography. */
export function createTopicDeck(
  topic: string,
  themeId: ThemeId = "startup"
): Presentation {
  const now = new Date().toISOString();
  const title = topic.length > 60 ? `${topic.slice(0, 57)}…` : topic;

  const slides: Slide[] = [
    {
      id: uid("slide"),
      layout: "hero",
      title,
      subtitle: "A clear narrative for your audience",
      body: "Generated from your brief — edit any line to make it yours.",
    },
    {
      id: uid("slide"),
      layout: "section",
      title: "The big idea",
      subtitle: "Why this matters now",
      body: `Frame the opportunity or story behind “${topic}” in one crisp paragraph.`,
      callout: "Lead with the audience’s problem or curiosity.",
    },
    {
      id: uid("slide"),
      layout: "bullets",
      title: "Key points",
      bullets: [
        "Point one — the hook your audience remembers",
        "Point two — proof, example, or story",
        "Point three — the implication or next step",
        "Point four — a risk or nuance worth naming",
      ],
    },
    {
      id: uid("slide"),
      layout: "stats",
      title: "Proof points",
      subtitle: "Replace with your real numbers",
      stats: [
        { value: "01", label: "Insight" },
        { value: "02", label: "Evidence" },
        { value: "03", label: "Outcome" },
      ],
    },
    {
      id: uid("slide"),
      layout: "process",
      title: "How it works",
      process: [
        { title: "Context", description: "Set the scene" },
        { title: "Insight", description: "What changed" },
        { title: "Action", description: "What to do next" },
      ],
    },
    {
      id: uid("slide"),
      layout: "quote",
      title: "Takeaway",
      quote: "If they remember one sentence, make it this one.",
      quoteAuthor: "EchoFlow outline",
    },
    {
      id: uid("slide"),
      layout: "thankyou",
      title: "Thank you",
      subtitle: "Questions & discussion",
      body: "Tell EchoFlow how to tighten, restyle, or go deeper.",
    },
  ];

  return {
    id: uid("deck"),
    title,
    subtitle: "Draft presentation",
    themeId,
    slides,
    createdAt: now,
    updatedAt: now,
  };
}

function extractBiographySubject(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes("steve jobs") || lower.includes("stevejobs")) {
    return "Steve Jobs";
  }

  const patterns = [
    /biography(?:\s+presentation)?(?:\s+for|\s+of|\s+about)\s+(.+?)(?:\s+template|\s+deck|\s+presentation)?$/i,
    /(?:bio|life\s+story)(?:\s+of|\s+about|\s+for)\s+(.+)$/i,
    /presentation(?:\s+on|\s+about|\s+for)\s+(.+?)(?:\s+template)?$/i,
  ];

  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const subject = m[1]
        .replace(/\b(template|slides?|deck|presentation|biography|bio)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();
      if (subject.length >= 2) return subject.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }

  if (lower.includes("biography") || lower.includes(" life story") || /\bbio\b/.test(lower)) {
    return "Featured Figure";
  }

  return null;
}

function resolveThemeFromPrompt(lower: string, fallback: ThemeId): ThemeId {
  if (lower.includes("apple")) return "apple";
  if (lower.includes("investor") || lower.includes("pitch")) return "startup";
  if (lower.includes("executive") || lower.includes("corporate")) return "corporate";
  if (lower.includes("luxury")) return "luxury";
  if (lower.includes("dark") || lower.includes("bold")) return "dark";
  if (lower.includes("modern") || lower.includes("minimal")) return "minimal";
  if (lower.includes("education") || lower.includes("school") || lower.includes("student")) {
    return "education";
  }
  return fallback;
}

function topicFromPrompt(userText: string): string {
  const cleaned = userText
    .replace(/^(i need|make|create|build|generate|open)\s+/i, "")
    .replace(/\b(a|an|the)\s+/gi, " ")
    .replace(/\b\d+\s*-?\s*slides?\b/gi, "")
    .replace(/\bin\s+\d+\b/gi, "")
    .replace(/\b(slide\s*)?presentation\b/gi, "")
    .replace(/\b(template|deck|slides?)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "New presentation";
}

/** Parse “6 slides”, “6-slide deck”, “in 8 slides”, etc. Clamped 3–16. */
export function extractSlideCount(text: string): number | null {
  const patterns = [
    /\b(\d+)\s*-?\s*slides?\b/i,
    /\bin\s+(\d+)\s+slides?\b/i,
    /\b(\d+)\s+slide\s+(?:presentation|deck|template)\b/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (!m?.[1]) continue;
    const n = Number.parseInt(m[1], 10);
    if (Number.isFinite(n) && n >= 3 && n <= 16) return n;
  }
  return null;
}

/** Trim or pad slides so it matches the requested slide count. */
export function fitSlideCount(deck: Presentation, count: number): Presentation {
  const target = Math.min(16, Math.max(3, count));
  const slides = [...deck.slides];
  if (slides.length === target) return deck;

  if (slides.length > target) {
    if (target === 1) {
      return { ...deck, slides: [{ ...slides[0], id: uid("slide") }], updatedAt: new Date().toISOString() };
    }
    const first = slides[0];
    const last = slides[slides.length - 1];
    if (target === 2) {
      return {
        ...deck,
        slides: [
          { ...first, id: uid("slide") },
          { ...last, id: uid("slide") },
        ],
        updatedAt: new Date().toISOString(),
      };
    }
    const middle = slides.slice(1, -1);
    const need = target - 2;
    const picked: Slide[] = [];
    const used = new Set<number>();
    for (let i = 0; i < need; i++) {
      const idx =
        middle.length === 1
          ? 0
          : Math.round((i / Math.max(need - 1, 1)) * (middle.length - 1));
      let j = idx;
      while (used.has(j) && used.size < middle.length) {
        j = (j + 1) % middle.length;
      }
      used.add(j);
      picked.push({ ...middle[j], id: uid("slide") });
    }
    return {
      ...deck,
      slides: [
        { ...first, id: uid("slide") },
        ...picked,
        { ...last, id: uid("slide") },
      ],
      updatedAt: new Date().toISOString(),
    };
  }

  const padded = [...slides];
  let n = 1;
  while (padded.length < target) {
    const insertAt = Math.max(1, padded.length - 1);
    padded.splice(insertAt, 0, {
      id: uid("slide"),
      layout: n % 2 === 0 ? "bullets" : "section",
      title: `Going deeper · ${n}`,
      subtitle: "Extra beat from your slide count",
      body: "Ask EchoFlow to fill this slide with a specific point.",
      bullets:
        n % 2 === 0
          ? ["Supporting detail", "Example or story", "Why it matters"]
          : undefined,
    });
    n += 1;
  }

  return { ...deck, slides: padded, updatedAt: new Date().toISOString() };
}

export const SUGGESTED_PROMPTS = [
  "Create modern investor pitch slides for a healthcare startup",
  "Steve Jobs biography in 6 slides",
  "Quantum computing for students — 8 slides",
  "Make this more modern — Apple style.",
  "Reduce text and add more visuals.",
];

export const DEMO_RECENTS = [
  { id: "r1", title: "Quantum Computing 101", updatedAt: "2h ago" },
  { id: "r2", title: "Series A Narrative", updatedAt: "Yesterday" },
  { id: "r3", title: "Q3 Product Review", updatedAt: "3d ago" },
  { id: "r4", title: "Brand Workshop", updatedAt: "1w ago" },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Mock streaming AI. Replace with OpenAI / Anthropic / Grok / Gemini later.
 */
export async function* mockStreamAssistant(
  userText: string
): AsyncGenerator<{ type: "token" | "deck" | "done"; value?: string; deck?: Presentation }> {
  const lower = userText.toLowerCase();
  const slideCount = extractSlideCount(userText);
  const bioSubject = extractBiographySubject(userText);
  const wantsQuantum =
    !bioSubject &&
    (lower.includes("quantum") ||
      (lower.includes("high school") && lower.includes("student")));

  let intro: string;
  let deck: Presentation;

  if (bioSubject) {
    intro = `Your biography slides for ${bioSubject}${
      slideCount ? ` in ${slideCount} slides` : ""
    } are on the way — timeline, impact, quotes, and takeaways…`;
    deck = createBiographyDeck(
      bioSubject,
      resolveThemeFromPrompt(lower, bioSubject === "Steve Jobs" ? "apple" : "minimal")
    );
  } else if (wantsQuantum) {
    intro = `Absolutely — clear quantum computing slides${
      slideCount ? ` (${slideCount} slides)` : ""
    } for high school students…`;
    deck = createQuantumDeck(resolveThemeFromPrompt(lower, "education"));
  } else if (lower.includes("investor") || lower.includes("pitch")) {
    intro = `Building an investor-ready narrative${
      slideCount ? ` in ${slideCount} slides` : ""
    } — problem, proof, and a sharp ask…`;
    deck = createTopicDeck("Investor Narrative", "startup");
    deck.subtitle = "Clear story. Sharp proof points.";
  } else {
    const topic = topicFromPrompt(userText);
    intro = `Got it — shaping polished slides on “${topic}”${
      slideCount ? ` with ${slideCount} slides` : ""
    }…`;
    deck = createTopicDeck(topic, resolveThemeFromPrompt(lower, "startup"));
  }

  if (slideCount) {
    deck = fitSlideCount(deck, slideCount);
  }

  for (const word of intro.split(" ")) {
    yield { type: "token", value: word + " " };
    await sleep(28 + Math.random() * 40);
  }

  await sleep(400);

  yield { type: "deck", deck };
  yield {
    type: "token",
    value: slideCount
      ? `\n\nDone — ${deck.slides.length} slides are live on the left. Edit any text, or ask to add/remove slides.`
      : "\n\nDone — the preview on the left is updated. Tip: say “in 6 slides” next time to set length.",
  };
  yield { type: "done" };
}

export function makeUserMessage(content: string): ChatMessage {
  return {
    id: uid("msg"),
    role: "user",
    content,
    createdAt: new Date().toISOString(),
  };
}

export function makeAssistantMessage(content = "", streaming = true): ChatMessage {
  return {
    id: uid("msg"),
    role: "assistant",
    content,
    createdAt: new Date().toISOString(),
    streaming,
  };
}
