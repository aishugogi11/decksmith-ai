import type { DeckTemplate, TemplateCategory } from "@/lib/templates";
import type { Slide, SlideLayout, ThemeId } from "@/lib/types";

/**
 * Open EchoFlow template pack — original layouts under MIT (see LICENSE note).
 * Not scraped from Canva/Beautiful.ai. Generated programmatically so we can
 * ship 100+ high-quality skeletons for AI customization.
 */

type Recipe = {
  slug: string;
  name: string;
  category: TemplateCategory;
  description: string;
  tags: string[];
  layouts: SlideLayout[];
  themes: ThemeId[];
};

const PREVIEWS: Record<ThemeId, string> = {
  apple: "linear-gradient(135deg,#f5f5f7,#a1a1aa)",
  microsoft: "linear-gradient(135deg,#e7eef8,#0078d4)",
  google: "linear-gradient(135deg,#ffffff,#1a73e8)",
  minimal: "linear-gradient(135deg,#fafafa,#737373)",
  startup: "linear-gradient(135deg,#0b1220,#0f766e)",
  corporate: "linear-gradient(135deg,#0f172a,#38bdf8)",
  education: "linear-gradient(135deg,#fff7ed,#ea580c)",
  luxury: "linear-gradient(135deg,#0c0a09,#d6b25e)",
  dark: "linear-gradient(135deg,#09090b,#a3e635)",
  gradient: "linear-gradient(135deg,#020617,#22d3ee)",
  instagram: "linear-gradient(135deg,#1a0a12,#c13584,#f77737)",
};

const RECIPES: Recipe[] = [
  {
    slug: "seed-pitch",
    name: "Seed Pitch",
    category: "pitch",
    description: "Classic fundraising narrative for early-stage startups.",
    tags: ["investor", "seed", "fundraising", "open"],
    layouts: ["hero", "section", "section", "stats", "process", "comparison", "timeline", "thankyou"],
    themes: ["startup", "dark", "gradient"],
  },
  {
    slug: "series-a",
    name: "Series A Narrative",
    category: "pitch",
    description: "Traction-led story for growth rounds.",
    tags: ["series a", "venture", "pitch", "open"],
    layouts: ["hero", "stats", "section", "chart", "process", "timeline", "quote", "thankyou"],
    themes: ["startup", "corporate", "minimal"],
  },
  {
    slug: "investor-update",
    name: "Investor Update",
    category: "pitch",
    description: "Monthly / quarterly update for existing investors.",
    tags: ["update", "investors", "metrics", "open"],
    layouts: ["hero", "stats", "bullets", "timeline", "section", "thankyou"],
    themes: ["corporate", "minimal", "apple"],
  },
  {
    slug: "board-deck",
    name: "Board Meeting Deck",
    category: "business",
    description: "Executive board narrative with decisions and asks.",
    tags: ["board", "executive", "strategy", "open"],
    layouts: ["hero", "section", "stats", "timeline", "comparison", "bullets", "thankyou"],
    themes: ["corporate", "microsoft", "dark"],
  },
  {
    slug: "strategy-offsite",
    name: "Strategy Offsite",
    category: "business",
    description: "Facilitation deck for planning workshops.",
    tags: ["strategy", "workshop", "planning", "open"],
    layouts: ["hero", "section", "process", "bullets", "quote", "thankyou"],
    themes: ["minimal", "apple", "education"],
  },
  {
    slug: "okr-cycle",
    name: "OKR Cycle Review",
    category: "reports",
    description: "Objectives, key results, and next-cycle bets.",
    tags: ["okr", "goals", "review", "open"],
    layouts: ["hero", "section", "stats", "bullets", "timeline", "thankyou"],
    themes: ["dark", "startup", "corporate"],
  },
  {
    slug: "qbr",
    name: "Quarterly Business Review",
    category: "reports",
    description: "QBR structure for GTM and product leadership.",
    tags: ["qbr", "quarterly", "gtm", "open"],
    layouts: ["hero", "stats", "chart", "section", "timeline", "process", "thankyou"],
    themes: ["microsoft", "corporate", "minimal"],
  },
  {
    slug: "product-launch",
    name: "Product Launch",
    category: "product",
    description: "Launch day story: problem, product, proof, plan.",
    tags: ["launch", "product", "saas", "open"],
    layouts: ["hero", "section", "image", "process", "stats", "quote", "thankyou"],
    themes: ["google", "startup", "gradient", "apple"],
  },
  {
    slug: "roadmap",
    name: "Product Roadmap",
    category: "product",
    description: "Now / next / later planning for product teams.",
    tags: ["roadmap", "product", "planning", "open"],
    layouts: ["hero", "timeline", "process", "bullets", "comparison", "thankyou"],
    themes: ["minimal", "startup", "microsoft"],
  },
  {
    slug: "feature-brief",
    name: "Feature Brief",
    category: "product",
    description: "Lightweight brief for a single feature ship.",
    tags: ["feature", "brief", "pm", "open"],
    layouts: ["hero", "section", "bullets", "process", "thankyou"],
    themes: ["apple", "google", "minimal"],
  },
  {
    slug: "marketing-plan",
    name: "Marketing Plan",
    category: "marketing",
    description: "Campaign goals, channels, and creative direction.",
    tags: ["marketing", "campaign", "growth", "open"],
    layouts: ["hero", "section", "stats", "process", "bullets", "image", "thankyou"],
    themes: ["gradient", "google", "startup", "education"],
  },
  {
    slug: "brand-story",
    name: "Brand Story",
    category: "marketing",
    description: "Narrative brand deck for partners and press.",
    tags: ["brand", "story", "identity", "open"],
    layouts: ["hero", "quote", "section", "image", "timeline", "thankyou"],
    themes: ["luxury", "minimal", "apple"],
  },
  {
    slug: "go-to-market",
    name: "Go-to-Market",
    category: "marketing",
    description: "GTM motion for a new segment or product.",
    tags: ["gtm", "sales", "marketing", "open"],
    layouts: ["hero", "section", "comparison", "process", "stats", "thankyou"],
    themes: ["startup", "corporate", "dark"],
  },
  {
    slug: "sales-enablement",
    name: "Sales Enablement",
    category: "business",
    description: "Talk track and proof points for sales teams.",
    tags: ["sales", "enablement", "pipeline", "open"],
    layouts: ["hero", "bullets", "comparison", "stats", "quote", "thankyou"],
    themes: ["microsoft", "corporate", "startup"],
  },
  {
    slug: "classroom-lesson",
    name: "Classroom Lesson",
    category: "education",
    description: "Clear lesson structure for teachers and coaches.",
    tags: ["lesson", "education", "students", "open"],
    layouts: ["hero", "section", "bullets", "process", "quote", "thankyou"],
    themes: ["education", "google", "apple", "minimal"],
  },
  {
    slug: "workshop",
    name: "Learning Workshop",
    category: "education",
    description: "Interactive workshop agenda and activities.",
    tags: ["workshop", "training", "education", "open"],
    layouts: ["hero", "timeline", "process", "bullets", "section", "thankyou"],
    themes: ["education", "startup", "minimal"],
  },
  {
    slug: "research-talk",
    name: "Research Talk",
    category: "education",
    description: "Academic-style talk with findings and implications.",
    tags: ["research", "academic", "talk", "open"],
    layouts: ["hero", "section", "chart", "bullets", "quote", "thankyou"],
    themes: ["minimal", "corporate", "apple"],
  },
  {
    slug: "webinar",
    name: "Webinar Session",
    category: "events",
    description: "Online session opener, agenda, and CTA.",
    tags: ["webinar", "event", "online", "open"],
    layouts: ["hero", "timeline", "section", "bullets", "quote", "thankyou"],
    themes: ["gradient", "google", "startup"],
  },
  {
    slug: "conference-keynote",
    name: "Conference Keynote",
    category: "events",
    description: "Bold stage deck with few words per slide.",
    tags: ["keynote", "conference", "stage", "open"],
    layouts: ["hero", "section", "quote", "image", "bullets", "thankyou"],
    themes: ["dark", "luxury", "gradient", "apple"],
  },
  {
    slug: "meetup",
    name: "Community Meetup",
    category: "events",
    description: "Friendly meetup intro and agenda.",
    tags: ["meetup", "community", "event", "open"],
    layouts: ["hero", "timeline", "bullets", "section", "thankyou"],
    themes: ["education", "google", "startup"],
  },
  {
    slug: "portfolio",
    name: "Creative Portfolio",
    category: "creative",
    description: "Case-study style portfolio for designers and studios.",
    tags: ["portfolio", "creative", "case study", "product design", "ux", "ui", "open"],
    layouts: ["hero", "image", "section", "process", "quote", "thankyou"],
    themes: ["minimal", "luxury", "apple", "dark"],
  },
  {
    slug: "product-design-pitch",
    name: "Product Design Pitch",
    category: "pitch",
    description: "Pitch a product design vision — problem, craft, system, impact.",
    tags: [
      "product design",
      "ux",
      "ui",
      "design",
      "pitch",
      "portfolio",
      "open",
    ],
    layouts: [
      "hero",
      "section",
      "process",
      "comparison",
      "stats",
      "image",
      "thankyou",
    ],
    themes: ["apple", "minimal", "startup", "google"],
  },
  {
    slug: "agency-pitch",
    name: "Agency Pitch",
    category: "creative",
    description: "Capabilities and process for creative agencies.",
    tags: ["agency", "creative", "pitch", "product design", "open"],
    layouts: ["hero", "section", "process", "stats", "image", "thankyou"],
    themes: ["gradient", "dark", "luxury"],
  },
  {
    slug: "personal-brand",
    name: "Personal Brand",
    category: "personal",
    description: "About you, offers, and proof for creators.",
    tags: ["personal", "brand", "creator", "open"],
    layouts: ["hero", "bullets", "process", "stats", "quote", "thankyou"],
    themes: ["apple", "minimal", "google"],
  },
  {
    slug: "interview",
    name: "Interview Story",
    category: "personal",
    description: "Career narrative for interviews and promotions.",
    tags: ["interview", "career", "resume", "open"],
    layouts: ["hero", "timeline", "stats", "section", "thankyou"],
    themes: ["microsoft", "minimal", "corporate"],
  },
  {
    slug: "biography",
    name: "Biography Outline",
    category: "personal",
    description: "Life-story structure for historical or personal bios.",
    tags: ["biography", "history", "life story", "open"],
    layouts: ["hero", "section", "timeline", "stats", "quote", "bullets", "thankyou"],
    themes: ["apple", "education", "luxury", "minimal"],
  },
  {
    slug: "nonprofit-impact",
    name: "Nonprofit Impact",
    category: "nonprofit",
    description: "Mission, impact metrics, and donor ask.",
    tags: ["nonprofit", "impact", "donor", "open"],
    layouts: ["hero", "section", "stats", "timeline", "quote", "thankyou"],
    themes: ["education", "minimal", "corporate"],
  },
  {
    slug: "grant-proposal",
    name: "Grant Proposal",
    category: "nonprofit",
    description: "Problem, approach, outcomes for grant readers.",
    tags: ["grant", "proposal", "nonprofit", "open"],
    layouts: ["hero", "section", "process", "stats", "bullets", "thankyou"],
    themes: ["corporate", "education", "minimal"],
  },
  {
    slug: "healthcare-pitch",
    name: "Healthcare Pitch",
    category: "pitch",
    description: "Regulated-industry startup pitch for health tech.",
    tags: ["healthcare", "ai", "pitch", "open"],
    layouts: ["hero", "section", "comparison", "stats", "process", "timeline", "thankyou"],
    themes: ["startup", "corporate", "minimal", "apple"],
  },
  {
    slug: "climate-pitch",
    name: "Climate Tech Pitch",
    category: "pitch",
    description: "Climate / sustainability fundraising narrative.",
    tags: ["climate", "sustainability", "pitch", "open"],
    layouts: ["hero", "section", "stats", "chart", "process", "thankyou"],
    themes: ["startup", "education", "gradient"],
  },
  {
    slug: "fintech-pitch",
    name: "Fintech Pitch",
    category: "pitch",
    description: "Trust-forward pitch for financial products.",
    tags: ["fintech", "finance", "pitch", "open"],
    layouts: ["hero", "section", "stats", "comparison", "process", "thankyou"],
    themes: ["corporate", "microsoft", "dark"],
  },
  {
    slug: "all-hands",
    name: "Company All-Hands",
    category: "business",
    description: "Internal all-hands with wins and priorities.",
    tags: ["all-hands", "internal", "company", "open"],
    layouts: ["hero", "stats", "bullets", "timeline", "quote", "thankyou"],
    themes: ["google", "startup", "apple"],
  },
  {
    slug: "retro",
    name: "Team Retro",
    category: "business",
    description: "What went well, what to improve, actions.",
    tags: ["retro", "agile", "team", "open"],
    layouts: ["hero", "comparison", "bullets", "process", "thankyou"],
    themes: ["minimal", "startup", "education"],
  },
  {
    slug: "case-study",
    name: "Customer Case Study",
    category: "marketing",
    description: "Before / after customer success story.",
    tags: ["case study", "customer", "proof", "open"],
    layouts: ["hero", "section", "stats", "quote", "process", "thankyou"],
    themes: ["apple", "microsoft", "startup"],
  },
  {
    slug: "pricing-review",
    name: "Pricing Review",
    category: "product",
    description: "Packaging and pricing recommendation deck.",
    tags: ["pricing", "packaging", "product", "open"],
    layouts: ["hero", "comparison", "stats", "bullets", "section", "thankyou"],
    themes: ["minimal", "corporate", "dark"],
  },
  {
    slug: "security-overview",
    name: "Security Overview",
    category: "business",
    description: "Trust and security overview for prospects.",
    tags: ["security", "trust", "enterprise", "open"],
    layouts: ["hero", "bullets", "process", "stats", "section", "thankyou"],
    themes: ["corporate", "microsoft", "dark"],
  },
  {
    slug: "onboarding",
    name: "Employee Onboarding",
    category: "business",
    description: "First-week orientation for new hires.",
    tags: ["onboarding", "hr", "people", "open"],
    layouts: ["hero", "timeline", "process", "bullets", "quote", "thankyou"],
    themes: ["education", "google", "apple"],
  },
  {
    slug: "design-critique",
    name: "Design Critique",
    category: "creative",
    description: "Structured critique for design reviews.",
    tags: ["design", "critique", "review", "product design", "ux", "open"],
    layouts: ["hero", "image", "bullets", "comparison", "section", "thankyou"],
    themes: ["minimal", "dark", "apple"],
  },
  {
    slug: "fundraising-nonprofit",
    name: "Fundraising Gala",
    category: "nonprofit",
    description: "Event fundraising narrative for galas.",
    tags: ["gala", "fundraising", "event", "open"],
    layouts: ["hero", "section", "stats", "timeline", "quote", "thankyou"],
    themes: ["luxury", "education", "minimal"],
  },
  {
    slug: "startup-demo",
    name: "Startup Demo Day",
    category: "pitch",
    description: "Tight demo-day timing with punchy slides.",
    tags: ["demo day", "startup", "pitch", "open"],
    layouts: ["hero", "section", "stats", "process", "thankyou"],
    themes: ["startup", "gradient", "dark", "apple"],
  },
  {
    slug: "ai-product",
    name: "Product Story",
    category: "product",
    description: "Explain a product without the hype.",
    tags: ["ai", "product", "llm", "open"],
    layouts: ["hero", "section", "comparison", "process", "chart", "quote", "thankyou"],
    themes: ["gradient", "startup", "minimal", "dark"],
  },
];

function skeletonFor(
  layout: SlideLayout,
  index: number,
  recipe: Recipe
): Omit<Slide, "id"> {
  const label = recipe.name;
  switch (layout) {
    case "hero":
      return {
        layout,
        title: label,
        subtitle: recipe.description,
        body: "Open template · customize from your brief",
        notes: "Introduce the narrative in one breath.",
      };
    case "section":
      return {
        layout,
        title: index === 1 ? "The problem" : "The opportunity",
        subtitle: "Replace with your specifics",
        body: "One clear paragraph. Customize will rewrite this from your brief.",
        callout: "Keep the audience’s pain visible.",
      };
    case "bullets":
      return {
        layout,
        title: "Key points",
        bullets: [
          "Point one — hook",
          "Point two — proof",
          "Point three — implication",
          "Point four — next step",
        ],
      };
    case "stats":
      return {
        layout,
        title: "Traction & proof",
        subtitle: "Swap in real numbers",
        stats: [
          { value: "—", label: "Metric A" },
          { value: "—", label: "Metric B" },
          { value: "—", label: "Metric C" },
        ],
      };
    case "timeline":
      return {
        layout,
        title: "Timeline",
        timeline: [
          { title: "Now", description: "Current focus" },
          { title: "Next", description: "Near-term milestone" },
          { title: "Later", description: "Scale chapter" },
          { title: "Vision", description: "North star" },
        ],
      };
    case "comparison":
      return {
        layout,
        title: "Before vs after",
        comparison: [
          { title: "Status quo", items: ["Friction", "Cost", "Risk"] },
          { title: "With you", items: ["Speed", "Clarity", "Outcomes"] },
        ],
      };
    case "process":
      return {
        layout,
        title: "How it works",
        process: [
          { title: "Discover", description: "Understand the job to be done" },
          { title: "Deliver", description: "Ship the wedge experience" },
          { title: "Expand", description: "Grow with proof" },
        ],
      };
    case "quote":
      return {
        layout,
        title: "Voice of the customer",
        quote: "Add a memorable line from a customer, founder, or expert.",
        quoteAuthor: "Name · Role",
      };
    case "image":
      return {
        layout,
        title: "Visual moment",
        subtitle: label,
        body: "Describe the image you want — EchoFlow suggests a hint.",
        imageHint: `${recipe.category} · ${label} · editorial photo`,
      };
    case "chart":
      return {
        layout,
        title: "The shape of the opportunity",
        chartHint: `Bar or line chart for ${label}`,
        bullets: ["Baseline", "With change", "At scale"],
      };
    case "thankyou":
      return {
        layout,
        title: "Thank you",
        subtitle: "Questions & discussion",
        body: "Clear ask or next step goes here.",
      };
    default:
      return { layout: "section", title: label, body: recipe.description };
  }
}

/** Builds the open MIT template pack (recipe × theme variations). */
export function buildOpenTemplatePack(): DeckTemplate[] {
  const pack: DeckTemplate[] = [];

  for (const recipe of RECIPES) {
    for (const themeId of recipe.themes) {
      pack.push({
        id: `open-${recipe.slug}-${themeId}`,
        name: `${recipe.name} · ${themeId}`,
        category: recipe.category,
        description: `${recipe.description} (Open EchoFlow pack · MIT)`,
        themeId,
        tags: [...recipe.tags, themeId, "mit", "open-source"],
        preview: PREVIEWS[themeId],
        slides: recipe.layouts.map((layout, index) =>
          skeletonFor(layout, index, recipe)
        ),
      });
    }
  }

  return pack;
}

export const OPEN_TEMPLATE_PACK = buildOpenTemplatePack();

export const OPEN_PACK_LICENSE = {
  name: "EchoFlow Open Template Pack",
  spdx: "MIT",
  note: "Original programmatic layouts by EchoFlow. Not derived from Canva or other proprietary template marketplaces.",
};
