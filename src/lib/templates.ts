import type { Presentation, Slide, ThemeId } from "@/lib/types";
import { uid } from "@/lib/utils";

/**
 * Template catalog inspired by popular Canva / Beautiful.ai / Gamma categories.
 * Original EchoFlow layouts & copy — not copies of third-party designs.
 */

export type TemplateCategory =
  | "pitch"
  | "business"
  | "education"
  | "marketing"
  | "product"
  | "creative"
  | "events"
  | "personal"
  | "nonprofit"
  | "reports";

export interface DeckTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  themeId: ThemeId;
  tags: string[];
  /** Preview gradient for gallery cards */
  preview: string;
  slides: Omit<Slide, "id">[];
}

export const TEMPLATE_CATEGORIES: {
  id: TemplateCategory | "all";
  label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "pitch", label: "Pitch slides" },
  { id: "business", label: "Business" },
  { id: "education", label: "Education" },
  { id: "marketing", label: "Marketing" },
  { id: "product", label: "Product" },
  { id: "creative", label: "Creative" },
  { id: "events", label: "Events" },
  { id: "personal", label: "Personal" },
  { id: "nonprofit", label: "Nonprofit" },
  { id: "reports", label: "Reports" },
];

function slides(...defs: Omit<Slide, "id">[]): Omit<Slide, "id">[] {
  return defs;
}

export const DECK_TEMPLATES: DeckTemplate[] = [
  // ——— Pitch ———
  {
    id: "tpl-seed-pitch",
    name: "Seed Round Pitch",
    category: "pitch",
    description: "Classic startup narrative: problem → solution → traction → ask.",
    themeId: "startup",
    tags: ["investor", "fundraising", "startup"],
    preview: "linear-gradient(135deg,#0f766e,#164e63)",
    slides: slides(
      {
        layout: "hero",
        title: "Company Name",
        subtitle: "One-line value proposition",
        body: "Seed round · Confidential",
      },
      {
        layout: "section",
        title: "The problem",
        subtitle: "Who hurts, and how often",
        body: "Describe the pain in plain language. Quantify if you can.",
        callout: "Customers already spend time / money on broken workarounds.",
      },
      {
        layout: "section",
        title: "Our solution",
        body: "What you built and why it’s 10× better for a specific user.",
      },
      {
        layout: "stats",
        title: "Traction",
        subtitle: "Proof you’re early — not empty",
        stats: [
          { value: "$0", label: "MRR (update me)" },
          { value: "0", label: "Paying customers" },
          { value: "0%", label: "MoM growth" },
        ],
      },
      {
        layout: "process",
        title: "Go-to-market",
        process: [
          { title: "Wedge", description: "First beachhead segment" },
          { title: "Channel", description: "How you reach them" },
          { title: "Expand", description: "Next segments" },
        ],
      },
      {
        layout: "comparison",
        title: "Why now",
        comparison: [
          { title: "Old world", items: ["Manual", "Fragmented tools", "Slow feedback"] },
          { title: "New world", items: ["Automated", "Unified", "Real-time loops"] },
        ],
      },
      {
        layout: "bullets",
        title: "The ask",
        bullets: [
          "Raising $X on a SAFE / priced round",
          "18-month runway to Series A milestones",
          "Use of funds: product, GTM, key hires",
        ],
      },
      {
        layout: "thankyou",
        title: "Let’s build this",
        subtitle: "Questions welcome",
        body: "founder@company.com",
      }
    ),
  },
  {
    id: "tpl-series-a",
    name: "Series A Narrative",
    category: "pitch",
    description: "Growth story with market, moat, and unit economics.",
    themeId: "corporate",
    tags: ["investor", "growth", "saas"],
    preview: "linear-gradient(135deg,#0f172a,#1d4ed8)",
    slides: slides(
      {
        layout: "hero",
        title: "Series A",
        subtitle: "From product-market fit to category leadership",
      },
      {
        layout: "stats",
        title: "Where we are",
        stats: [
          { value: "$1.2M", label: "ARR" },
          { value: "120%", label: "NDR" },
          { value: "4.2", label: "LTV:CAC" },
        ],
      },
      {
        layout: "chart",
        title: "Market",
        subtitle: "TAM / SAM / SOM",
        chartHint: "Market sizing bars",
        bullets: ["TAM: category", "SAM: ICP", "SOM: 3-year target"],
      },
      {
        layout: "bullets",
        title: "Moat",
        bullets: ["Data network effects", "Workflow lock-in", "Brand in the niche"],
      },
      {
        layout: "timeline",
        title: "Roadmap",
        timeline: [
          { title: "Now", description: "Core wedge" },
          { title: "+6m", description: "Platform layer" },
          { title: "+12m", description: "Expansion SKUs" },
          { title: "+18m", description: "International" },
        ],
      },
      { layout: "thankyou", title: "Join us", subtitle: "Series A conversation" }
    ),
  },
  {
    id: "tpl-investor-update",
    name: "Investor Update",
    category: "pitch",
    description: "Monthly/quarterly update: wins, metrics, asks.",
    themeId: "minimal",
    tags: ["investor", "update", "metrics"],
    preview: "linear-gradient(135deg,#fafafa,#e4e4e7)",
    slides: slides(
      {
        layout: "hero",
        title: "Investor update",
        subtitle: "Month · Year",
        body: "Highlights in 5 minutes",
      },
      {
        layout: "stats",
        title: "Key metrics",
        stats: [
          { value: "—", label: "Revenue" },
          { value: "—", label: "Users" },
          { value: "—", label: "Runway" },
        ],
      },
      {
        layout: "bullets",
        title: "Wins",
        bullets: ["Win 1", "Win 2", "Win 3"],
      },
      {
        layout: "bullets",
        title: "Challenges",
        bullets: ["Challenge 1", "What we’re doing about it"],
      },
      {
        layout: "section",
        title: "Asks",
        body: "Intros, hires, customer leads — be specific.",
        callout: "One clear ask beats five vague ones.",
      }
    ),
  },

  // ——— Business ———
  {
    id: "tpl-board-meeting",
    name: "Board Meeting",
    category: "business",
    description: "Executive board pack: strategy, finance, risks.",
    themeId: "corporate",
    tags: ["board", "executive", "strategy"],
    preview: "linear-gradient(135deg,#1e293b,#334155)",
    slides: slides(
      { layout: "hero", title: "Board meeting", subtitle: "Q· YYYY" },
      {
        layout: "section",
        title: "Agenda",
        body: "Strategy · Performance · Risks · Decisions",
      },
      {
        layout: "stats",
        title: "Performance",
        stats: [
          { value: "—", label: "Revenue vs plan" },
          { value: "—", label: "Gross margin" },
          { value: "—", label: "Cash" },
        ],
      },
      {
        layout: "comparison",
        title: "Strategic options",
        comparison: [
          { title: "Option A", items: ["Upside", "Risk", "Investment"] },
          { title: "Option B", items: ["Upside", "Risk", "Investment"] },
        ],
      },
      {
        layout: "bullets",
        title: "Decisions needed",
        bullets: ["Decision 1", "Decision 2"],
      },
      { layout: "thankyou", title: "Discussion", subtitle: "Open floor" }
    ),
  },
  {
    id: "tpl-sales-deck",
    name: "Sales Slides",
    category: "business",
    description: "Discovery → value → proof → next step.",
    themeId: "microsoft",
    tags: ["sales", "b2b", "demo"],
    preview: "linear-gradient(135deg,#0078d4,#50e6ff)",
    slides: slides(
      {
        layout: "hero",
        title: "How we help [Customer]",
        subtitle: "Outcome-focused conversation",
      },
      {
        layout: "section",
        title: "What we heard",
        body: "Mirror their goals and constraints.",
        callout: "Accuracy builds trust faster than features.",
      },
      {
        layout: "process",
        title: "How it works",
        process: [
          { title: "Connect", description: "Systems & data" },
          { title: "Automate", description: "Workflows that matter" },
          { title: "Measure", description: "Prove ROI" },
        ],
      },
      {
        layout: "quote",
        title: "Social proof",
        quote: "Insert customer quote about a measurable outcome.",
        quoteAuthor: "Title, Company",
      },
      {
        layout: "bullets",
        title: "Proposed next step",
        bullets: ["Pilot scope", "Success criteria", "Timeline"],
      },
      { layout: "thankyou", title: "Ready when you are", subtitle: "Let’s schedule the pilot" }
    ),
  },
  {
    id: "tpl-team-allhands",
    name: "All-Hands",
    category: "business",
    description: "Company update: wins, priorities, culture.",
    themeId: "google",
    tags: ["internal", "all-hands", "culture"],
    preview: "linear-gradient(135deg,#ea4335,#fbbc04,#34a853,#4285f4)",
    slides: slides(
      { layout: "hero", title: "All-hands", subtitle: "Month · Year" },
      {
        layout: "stats",
        title: "This month in numbers",
        stats: [
          { value: "—", label: "Customers" },
          { value: "—", label: "NPS" },
          { value: "—", label: "Ship velocity" },
        ],
      },
      {
        layout: "bullets",
        title: "Wins to celebrate",
        bullets: ["Team win", "Customer win", "Product win"],
      },
      {
        layout: "section",
        title: "Focus for next month",
        body: "3 priorities max. Protect deep work.",
      },
      {
        layout: "quote",
        title: "Values in action",
        quote: "A short story that shows the culture you want.",
        quoteAuthor: "Someone on the team",
      },
      { layout: "thankyou", title: "Q&A", subtitle: "Ask us anything" }
    ),
  },
  {
    id: "tpl-consulting",
    name: "Consulting Proposal",
    category: "business",
    description: "Client proposal: findings, plan, investment.",
    themeId: "luxury",
    tags: ["consulting", "proposal", "services"],
    preview: "linear-gradient(135deg,#1c1917,#d6b25e)",
    slides: slides(
      {
        layout: "hero",
        title: "Proposal for [Client]",
        subtitle: "Engagement overview",
      },
      {
        layout: "section",
        title: "Situation",
        body: "Current state and why change matters now.",
      },
      {
        layout: "process",
        title: "Approach",
        process: [
          { title: "Discover", description: "Workshops & data" },
          { title: "Design", description: "Recommendations" },
          { title: "Deliver", description: "Implementation support" },
        ],
      },
      {
        layout: "timeline",
        title: "Timeline",
        timeline: [
          { title: "Wk 1–2", description: "Discovery" },
          { title: "Wk 3–5", description: "Design" },
          { title: "Wk 6–8", description: "Enablement" },
          { title: "Wk 9+", description: "Optional retain" },
        ],
      },
      {
        layout: "stats",
        title: "Investment",
        stats: [
          { value: "$—", label: "Fixed fee" },
          { value: "—", label: "Weeks" },
          { value: "—", label: "Team size" },
        ],
      },
      { layout: "thankyou", title: "Next step", subtitle: "Align on scope & kickoff" }
    ),
  },

  // ——— Education ———
  {
    id: "tpl-lesson-plan",
    name: "Lesson Plan",
    category: "education",
    description: "Classroom lesson: objective, teach, practice, exit.",
    themeId: "education",
    tags: ["school", "teacher", "lesson"],
    preview: "linear-gradient(135deg,#ffedd5,#ea580c)",
    slides: slides(
      {
        layout: "hero",
        title: "Lesson title",
        subtitle: "Grade · Subject · Duration",
      },
      {
        layout: "section",
        title: "Learning objective",
        body: "By the end, students will be able to…",
        callout: "One objective beats five fuzzy goals.",
      },
      {
        layout: "bullets",
        title: "Warm-up (5 min)",
        bullets: ["Hook question", "Prior knowledge check"],
      },
      {
        layout: "section",
        title: "Teach",
        body: "Core explanation + worked example.",
      },
      {
        layout: "process",
        title: "Practice",
        process: [
          { title: "Guided", description: "We do" },
          { title: "Paired", description: "You do together" },
          { title: "Independent", description: "You do alone" },
        ],
      },
      {
        layout: "bullets",
        title: "Exit ticket",
        bullets: ["1 check question", "1 reflection"],
      },
      { layout: "thankyou", title: "Great work today", subtitle: "See you next class" }
    ),
  },
  {
    id: "tpl-science-explainer",
    name: "Science Explainer",
    category: "education",
    description: "Make a hard topic clear for curious teens.",
    themeId: "education",
    tags: ["STEM", "explainer", "students"],
    preview: "linear-gradient(135deg,#fff7ed,#0ea5e9)",
    slides: slides(
      {
        layout: "hero",
        title: "Topic title",
        subtitle: "A clear guide for curious minds",
      },
      {
        layout: "section",
        title: "Big idea",
        body: "One sentence a 15-year-old can repeat.",
        callout: "Metaphor first, jargon later.",
      },
      {
        layout: "comparison",
        title: "Before vs after understanding",
        comparison: [
          { title: "Common myth", items: ["Myth A", "Myth B"] },
          { title: "Better model", items: ["Truth A", "Truth B"] },
        ],
      },
      {
        layout: "timeline",
        title: "How we got here",
        timeline: [
          { title: "Then", description: "Early idea" },
          { title: "Breakthrough", description: "Key discovery" },
          { title: "Now", description: "Current view" },
          { title: "Next", description: "Open questions" },
        ],
      },
      {
        layout: "image",
        title: "Visual metaphor",
        subtitle: "Show, don’t stack paragraphs",
        imageHint: "Diagram / illustration placeholder",
        body: "Caption the metaphor in one line.",
      },
      {
        layout: "quote",
        title: "Remember this",
        quote: "A sticky one-liner students can take home.",
        quoteAuthor: "Class takeaway",
      },
      { layout: "thankyou", title: "Questions?", subtitle: "Challenge a myth" }
    ),
  },
  {
    id: "tpl-workshop",
    name: "Workshop Facilitation",
    category: "education",
    description: "Interactive workshop agenda and activities.",
    themeId: "startup",
    tags: ["workshop", "training", "facilitation"],
    preview: "linear-gradient(135deg,#134e4a,#2dd4bf)",
    slides: slides(
      {
        layout: "hero",
        title: "Workshop title",
        subtitle: "Half-day · Outcomes first",
      },
      {
        layout: "bullets",
        title: "Outcomes",
        bullets: ["Outcome 1", "Outcome 2", "Outcome 3"],
      },
      {
        layout: "timeline",
        title: "Agenda",
        timeline: [
          { title: "0:00", description: "Context" },
          { title: "0:20", description: "Activity 1" },
          { title: "1:00", description: "Activity 2" },
          { title: "1:40", description: "Debrief" },
        ],
      },
      {
        layout: "process",
        title: "Activity format",
        process: [
          { title: "Solo", description: "2 minutes" },
          { title: "Pair", description: "5 minutes" },
          { title: "Share", description: "8 minutes" },
        ],
      },
      {
        layout: "section",
        title: "Parking lot",
        body: "Capture off-topic ideas without derailing.",
      },
      { layout: "thankyou", title: "Close", subtitle: "Commitments & next steps" }
    ),
  },
  {
    id: "tpl-university-lecture",
    name: "University Lecture",
    category: "education",
    description: "Lecture structure with reading and discussion.",
    themeId: "apple",
    tags: ["university", "lecture", "academic"],
    preview: "linear-gradient(135deg,#f5f5f7,#0071e3)",
    slides: slides(
      { layout: "hero", title: "Lecture title", subtitle: "Course · Week N" },
      {
        layout: "bullets",
        title: "Today’s roadmap",
        bullets: ["Concept A", "Evidence", "Debate", "Assignment"],
      },
      {
        layout: "section",
        title: "Core concept",
        body: "Definition + why it matters in the field.",
      },
      {
        layout: "chart",
        title: "Evidence",
        chartHint: "Data or study summary",
        bullets: ["Finding 1", "Finding 2", "Limitation"],
      },
      {
        layout: "quote",
        title: "Discussion prompt",
        quote: "A question with no single right answer.",
        quoteAuthor: "Take 3 minutes",
      },
      {
        layout: "bullets",
        title: "For next week",
        bullets: ["Reading", "Problem set", "Office hours"],
      }
    ),
  },

  // ——— Marketing ———
  {
    id: "tpl-campaign-brief",
    name: "Campaign Brief",
    category: "marketing",
    description: "Audience, message, channels, KPIs.",
    themeId: "gradient",
    tags: ["marketing", "campaign", "brand"],
    preview: "linear-gradient(135deg,#4c1d95,#22d3ee)",
    slides: slides(
      { layout: "hero", title: "Campaign name", subtitle: "Brief · Season / Year" },
      {
        layout: "section",
        title: "Objective",
        body: "Awareness · Consideration · Conversion — pick one primary.",
      },
      {
        layout: "comparison",
        title: "Audience",
        comparison: [
          { title: "Primary", items: ["Who", "Job to be done", "Objection"] },
          { title: "Secondary", items: ["Who", "Trigger", "Channel"] },
        ],
      },
      {
        layout: "quote",
        title: "Single-minded message",
        quote: "One sentence the creative must land.",
        quoteAuthor: "Brand voice: …",
      },
      {
        layout: "bullets",
        title: "Channels & assets",
        bullets: ["Paid social", "Email", "Landing page", "Partners"],
      },
      {
        layout: "stats",
        title: "Success metrics",
        stats: [
          { value: "—", label: "Reach" },
          { value: "—", label: "CTR" },
          { value: "—", label: "CPA" },
        ],
      },
      { layout: "thankyou", title: "Go / no-go", subtitle: "Approve creative direction" }
    ),
  },
  {
    id: "tpl-brand-guidelines",
    name: "Brand Guidelines Lite",
    category: "marketing",
    description: "Voice, visuals, and do/don’t for teams.",
    themeId: "minimal",
    tags: ["brand", "guidelines", "design"],
    preview: "linear-gradient(135deg,#111111,#a3e635)",
    slides: slides(
      { layout: "hero", title: "Brand guidelines", subtitle: "Lite edition" },
      {
        layout: "section",
        title: "Personality",
        body: "3 adjectives that describe how we sound and look.",
      },
      {
        layout: "comparison",
        title: "Voice",
        comparison: [
          { title: "We are", items: ["Clear", "Warm", "Confident"] },
          { title: "We aren’t", items: ["Jargony", "Cold", "Hypey"] },
        ],
      },
      {
        layout: "image",
        title: "Visual system",
        subtitle: "Color · Type · Photography",
        imageHint: "Moodboard placeholder",
        body: "Link to full Figma / brand kit.",
      },
      {
        layout: "bullets",
        title: "Quick rules",
        bullets: ["Logo clear space", "Don’t stretch mark", "Prefer real photography"],
      },
      { layout: "thankyou", title: "Questions?", subtitle: "brand@company.com" }
    ),
  },
  {
    id: "tpl-social-strategy",
    name: "Social Strategy",
    category: "marketing",
    description: "Platforms, pillars, and content cadence.",
    themeId: "startup",
    tags: ["social", "content", "strategy"],
    preview: "linear-gradient(135deg,#0b1220,#f472b6)",
    slides: slides(
      { layout: "hero", title: "Social strategy", subtitle: "Q· focus" },
      {
        layout: "bullets",
        title: "Content pillars",
        bullets: ["Educate", "Prove", "Humanize", "Promote (sparingly)"],
      },
      {
        layout: "process",
        title: "Weekly cadence",
        process: [
          { title: "Plan", description: "Themes" },
          { title: "Create", description: "Batch" },
          { title: "Engage", description: "Daily" },
        ],
      },
      {
        layout: "chart",
        title: "What we’ll measure",
        chartHint: "Engagement mix",
        bullets: ["Saves", "Shares", "Profile visits"],
      },
      { layout: "thankyou", title: "Ship the calendar", subtitle: "First 2 weeks drafted" }
    ),
  },

  // ——— Product ———
  {
    id: "tpl-product-launch",
    name: "Product Launch",
    category: "product",
    description: "Announce a feature with story, demo, and CTA.",
    themeId: "apple",
    tags: ["launch", "product", "announcement"],
    preview: "linear-gradient(135deg,#e8e8ed,#0071e3)",
    slides: slides(
      {
        layout: "hero",
        title: "Introducing…",
        subtitle: "Feature name",
        body: "One benefit line",
      },
      {
        layout: "section",
        title: "Why we built this",
        body: "Customer moment that triggered the build.",
      },
      {
        layout: "image",
        title: "See it",
        subtitle: "Product UI",
        imageHint: "Screenshot / demo still",
        body: "Caption the aha moment.",
      },
      {
        layout: "process",
        title: "How to use it",
        process: [
          { title: "Open", description: "Where it lives" },
          { title: "Configure", description: "Key settings" },
          { title: "Share", description: "Who benefits" },
        ],
      },
      {
        layout: "stats",
        title: "Early results",
        stats: [
          { value: "—", label: "Time saved" },
          { value: "—", label: "Adoption" },
          { value: "—", label: "CSAT" },
        ],
      },
      {
        layout: "thankyou",
        title: "Try it today",
        subtitle: "Docs · Demo · Feedback",
      }
    ),
  },
  {
    id: "tpl-roadmap",
    name: "Product Roadmap",
    category: "product",
    description: "Now / Next / Later with themes.",
    themeId: "dark",
    tags: ["roadmap", "product", "planning"],
    preview: "linear-gradient(135deg,#09090b,#a3e635)",
    slides: slides(
      { layout: "hero", title: "Roadmap", subtitle: "H1 / H2" },
      {
        layout: "section",
        title: "North star",
        body: "The user outcome we’re optimizing for.",
      },
      {
        layout: "timeline",
        title: "Now · Next · Later",
        timeline: [
          { title: "Now", description: "Committed" },
          { title: "Next", description: "Likely" },
          { title: "Later", description: "Exploring" },
          { title: "Parked", description: "Not now" },
        ],
      },
      {
        layout: "bullets",
        title: "Themes",
        bullets: ["Reliability", "Activation", "Expansion"],
      },
      {
        layout: "comparison",
        title: "Tradeoffs",
        comparison: [
          { title: "Doing", items: ["Focus A", "Focus B"] },
          { title: "Not doing", items: ["Scope cut", "Deferred idea"] },
        ],
      },
      { layout: "thankyou", title: "Feedback welcome", subtitle: "Product council" }
    ),
  },
  {
    id: "tpl-prd-review",
    name: "PRD Review",
    category: "product",
    description: "Lightweight PRD for stakeholder alignment.",
    themeId: "microsoft",
    tags: ["prd", "specs", "alignment"],
    preview: "linear-gradient(135deg,#f3f6fb,#0078d4)",
    slides: slides(
      { layout: "hero", title: "PRD: Feature name", subtitle: "Status: Review" },
      {
        layout: "section",
        title: "Problem & goal",
        body: "User problem + success metric.",
      },
      {
        layout: "bullets",
        title: "Requirements",
        bullets: ["Must-have 1", "Must-have 2", "Nice-to-have"],
      },
      {
        layout: "process",
        title: "User flow",
        process: [
          { title: "Entry", description: "Trigger" },
          { title: "Core", description: "Action" },
          { title: "Exit", description: "Success state" },
        ],
      },
      {
        layout: "bullets",
        title: "Open questions",
        bullets: ["Question for eng", "Question for design", "Question for legal"],
      },
      { layout: "thankyou", title: "Approve?", subtitle: "Comments in doc" }
    ),
  },

  // ——— Creative ———
  {
    id: "tpl-portfolio",
    name: "Creative Portfolio",
    category: "creative",
    description: "Showcase selected work with case highlights.",
    themeId: "luxury",
    tags: ["portfolio", "design", "creative"],
    preview: "linear-gradient(135deg,#0c0a09,#d6b25e)",
    slides: slides(
      {
        layout: "hero",
        title: "Your Name",
        subtitle: "Designer · Director · Maker",
        body: "Selected work",
      },
      {
        layout: "image",
        title: "Project one",
        subtitle: "Role · Year",
        imageHint: "Hero project still",
        body: "Outcome in one line.",
      },
      {
        layout: "image",
        title: "Project two",
        subtitle: "Role · Year",
        imageHint: "Hero project still",
        body: "Outcome in one line.",
      },
      {
        layout: "process",
        title: "How I work",
        process: [
          { title: "Listen", description: "Context" },
          { title: "Explore", description: "Options" },
          { title: "Craft", description: "Ship" },
        ],
      },
      {
        layout: "thankyou",
        title: "Let’s collaborate",
        subtitle: "email@studio.com",
      }
    ),
  },
  {
    id: "tpl-case-study",
    name: "Case Study",
    category: "creative",
    description: "Challenge → approach → results story.",
    themeId: "minimal",
    tags: ["case study", "agency", "results"],
    preview: "linear-gradient(135deg,#fafafa,#737373)",
    slides: slides(
      { layout: "hero", title: "Case study", subtitle: "Client · Industry" },
      {
        layout: "section",
        title: "Challenge",
        body: "Business goal and constraints.",
      },
      {
        layout: "process",
        title: "Approach",
        process: [
          { title: "Research", description: "Insights" },
          { title: "Concept", description: "Direction" },
          { title: "Launch", description: "Rollout" },
        ],
      },
      {
        layout: "stats",
        title: "Results",
        stats: [
          { value: "+—%", label: "Metric A" },
          { value: "+—%", label: "Metric B" },
          { value: "—", label: "Metric C" },
        ],
      },
      {
        layout: "quote",
        title: "Client voice",
        quote: "Short endorsement.",
        quoteAuthor: "Name, Title",
      },
      { layout: "thankyou", title: "More work", subtitle: "View full portfolio" }
    ),
  },
  {
    id: "tpl-moodboard",
    name: "Creative Direction",
    category: "creative",
    description: "Mood, references, and art direction.",
    themeId: "gradient",
    tags: ["moodboard", "art direction", "creative"],
    preview: "linear-gradient(135deg,#7c3aed,#22d3ee,#f472b6)",
    slides: slides(
      { layout: "hero", title: "Creative direction", subtitle: "Project name" },
      {
        layout: "section",
        title: "Feeling words",
        body: "Bold · Quiet · Optimistic — pick three.",
      },
      {
        layout: "image",
        title: "References",
        imageHint: "Mood collage",
        body: "What to steal / what to avoid.",
      },
      {
        layout: "comparison",
        title: "Do / Don’t",
        comparison: [
          { title: "Do", items: ["Natural light", "Real texture", "Sparse type"] },
          { title: "Don’t", items: ["Stock smiles", "Heavy gradients", "Clip art"] },
        ],
      },
      { layout: "thankyou", title: "Align & produce", subtitle: "Next: shot list" }
    ),
  },

  // ——— Events ———
  {
    id: "tpl-conference-keynote",
    name: "Conference Keynote",
    category: "events",
    description: "Stage talk with big ideas and a close.",
    themeId: "dark",
    tags: ["keynote", "conference", "talk"],
    preview: "linear-gradient(135deg,#09090b,#38bdf8)",
    slides: slides(
      {
        layout: "hero",
        title: "Talk title",
        subtitle: "Your name · Event",
      },
      {
        layout: "section",
        title: "The tension",
        body: "The industry belief you’re challenging.",
      },
      {
        layout: "bullets",
        title: "Three ideas",
        bullets: ["Idea 1", "Idea 2", "Idea 3"],
      },
      {
        layout: "section",
        title: "Story beat",
        body: "A concrete story that proves idea 1.",
      },
      {
        layout: "quote",
        title: "Line they remember",
        quote: "Your most shareable sentence.",
        quoteAuthor: "",
      },
      {
        layout: "thankyou",
        title: "Thank you",
        subtitle: "@handle · QR / link",
      }
    ),
  },
  {
    id: "tpl-webinar",
    name: "Webinar",
    category: "events",
    description: "Hosted webinar: agenda, teaching, CTA.",
    themeId: "google",
    tags: ["webinar", "online", "lead gen"],
    preview: "linear-gradient(135deg,#ffffff,#1a73e8)",
    slides: slides(
      {
        layout: "hero",
        title: "Webinar title",
        subtitle: "Live · 30–45 min",
      },
      {
        layout: "bullets",
        title: "You’ll leave with",
        bullets: ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
      },
      {
        layout: "section",
        title: "Segment 1",
        body: "Teach one concept clearly.",
      },
      {
        layout: "section",
        title: "Segment 2",
        body: "Demo or deep dive.",
      },
      {
        layout: "bullets",
        title: "Q&A prompts",
        bullets: ["Question A", "Question B"],
      },
      {
        layout: "thankyou",
        title: "CTA",
        subtitle: "Resource + next session",
      }
    ),
  },
  {
    id: "tpl-meetup",
    name: "Meetup / Community",
    category: "events",
    description: "Local event welcome and logistics.",
    themeId: "startup",
    tags: ["meetup", "community", "event"],
    preview: "linear-gradient(135deg,#132033,#2dd4bf)",
    slides: slides(
      { layout: "hero", title: "Welcome", subtitle: "Meetup name · City" },
      {
        layout: "bullets",
        title: "House rules",
        bullets: ["Be kind", "Questions anytime", "Share the mic"],
      },
      {
        layout: "timeline",
        title: "Tonight",
        timeline: [
          { title: "6:30", description: "Doors" },
          { title: "7:00", description: "Talks" },
          { title: "8:00", description: "Mingle" },
          { title: "8:45", description: "Close" },
        ],
      },
      {
        layout: "section",
        title: "Speakers",
        body: "Name · Topic · Bio line",
      },
      { layout: "thankyou", title: "See you next month", subtitle: "Join the Slack / Discord" }
    ),
  },

  // ——— Personal ———
  {
    id: "tpl-personal-brand",
    name: "Personal Brand Intro",
    category: "personal",
    description: "About you, offers, and proof.",
    themeId: "apple",
    tags: ["personal brand", "about", "creator"],
    preview: "linear-gradient(135deg,#f5f5f7,#a78bfa)",
    slides: slides(
      {
        layout: "hero",
        title: "Hi, I’m [Name]",
        subtitle: "I help [audience] do [outcome]",
      },
      {
        layout: "bullets",
        title: "What I believe",
        bullets: ["Belief 1", "Belief 2", "Belief 3"],
      },
      {
        layout: "process",
        title: "How we can work",
        process: [
          { title: "Speak", description: "Stages & podcasts" },
          { title: "Advise", description: "Retainers" },
          { title: "Create", description: "Content / products" },
        ],
      },
      {
        layout: "stats",
        title: "Proof",
        stats: [
          { value: "—", label: "Audience" },
          { value: "—", label: "Clients" },
          { value: "—", label: "Years" },
        ],
      },
      { layout: "thankyou", title: "Say hello", subtitle: "link-in-bio" }
    ),
  },
  {
    id: "tpl-interview",
    name: "Job Interview Slides",
    category: "personal",
    description: "Present your story for interviews or promotions.",
    themeId: "microsoft",
    tags: ["career", "interview", "resume"],
    preview: "linear-gradient(135deg,#e7eef8,#0078d4)",
    slides: slides(
      {
        layout: "hero",
        title: "[Your name]",
        subtitle: "Role you’re interviewing for",
      },
      {
        layout: "timeline",
        title: "Path",
        timeline: [
          { title: "Then", description: "Foundation" },
          { title: "Growth", description: "Key chapter" },
          { title: "Now", description: "Current impact" },
          { title: "Next", description: "Why this role" },
        ],
      },
      {
        layout: "stats",
        title: "Impact highlights",
        stats: [
          { value: "—", label: "Outcome 1" },
          { value: "—", label: "Outcome 2" },
          { value: "—", label: "Outcome 3" },
        ],
      },
      {
        layout: "section",
        title: "Why this team",
        body: "Specific, researched, sincere.",
      },
      { layout: "thankyou", title: "Happy to go deeper", subtitle: "Questions" }
    ),
  },
  {
    id: "tpl-life-update",
    name: "Life / Family Update",
    category: "personal",
    description: "Warm personal update for friends & family.",
    themeId: "education",
    tags: ["personal", "family", "update"],
    preview: "linear-gradient(135deg,#ffedd5,#fb7185)",
    slides: slides(
      { layout: "hero", title: "A year in moments", subtitle: "YYYY" },
      {
        layout: "image",
        title: "Highlight",
        imageHint: "Photo placeholder",
        body: "Caption",
      },
      {
        layout: "bullets",
        title: "Grateful for",
        bullets: ["People", "Places", "Lessons"],
      },
      {
        layout: "section",
        title: "Looking ahead",
        body: "Hopes for next year — keep it light.",
      },
      { layout: "thankyou", title: "Love you all", subtitle: "Stay in touch" }
    ),
  },
  {
    id: "tpl-biography-steve-jobs",
    name: "Steve Jobs Biography",
    category: "personal",
    description: "Life story template — early years, milestones, impact, and legacy.",
    themeId: "apple",
    tags: ["biography", "steve jobs", "history", "education", "personal"],
    preview: "linear-gradient(135deg,#111111,#a1a1aa)",
    slides: slides(
      {
        layout: "hero",
        title: "Steve Jobs",
        subtitle: "A biography of vision, design, and reinvention",
        body: "1955 – 2011 · Co-founder of Apple",
      },
      {
        layout: "section",
        title: "Early life",
        subtitle: "Adopted in San Francisco, raised in Cupertino",
        body: "Jobs grew up around Silicon Valley garage culture — curious, restless, drawn to electronics and design.",
        callout: "He audited calligraphy at Reed — a seed for Mac typography.",
      },
      {
        layout: "timeline",
        title: "A life in chapters",
        timeline: [
          { title: "1976", description: "Apple founded with Steve Wozniak" },
          { title: "1984", description: "Macintosh — a computer for everyone" },
          { title: "1985–96", description: "NeXT and Pixar after leaving Apple" },
          { title: "1997–2011", description: "Return to Apple · iMac to iPhone" },
        ],
      },
      {
        layout: "stats",
        title: "Impact in numbers",
        stats: [
          { value: "1976", label: "Apple founded" },
          { value: "1B+", label: "iPhones in the era he began" },
          { value: "Pixar", label: "Studio turned cultural landmark" },
        ],
      },
      {
        layout: "quote",
        title: "In his words",
        quote:
          "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.",
        quoteAuthor: "Steve Jobs · Stanford, 2005",
      },
      {
        layout: "bullets",
        title: "What to remember",
        bullets: [
          "Taste paired with engineering — not either/or",
          "Setbacks became fuel for NeXT and Pixar",
          "Few products, done extraordinarily well",
          "Legacy is craft as much as devices",
        ],
      },
      {
        layout: "thankyou",
        title: "Questions?",
        subtitle: "Steve Jobs — biography",
        body: "Which chapter best explains Apple today?",
      }
    ),
  },

  // ——— Nonprofit ———
  {
    id: "tpl-nonprofit-pitch",
    name: "Nonprofit Impact Pitch",
    category: "nonprofit",
    description: "Mission, impact, and donor ask.",
    themeId: "education",
    tags: ["nonprofit", "fundraising", "impact"],
    preview: "linear-gradient(135deg,#ecfccb,#16a34a)",
    slides: slides(
      {
        layout: "hero",
        title: "Organization name",
        subtitle: "Mission in one line",
      },
      {
        layout: "section",
        title: "The need",
        body: "Who is underserved and what’s at stake.",
      },
      {
        layout: "stats",
        title: "Impact so far",
        stats: [
          { value: "—", label: "People served" },
          { value: "—", label: "Communities" },
          { value: "—", label: "Outcomes" },
        ],
      },
      {
        layout: "process",
        title: "How your gift works",
        process: [
          { title: "Give", description: "Funds programs" },
          { title: "Deliver", description: "On the ground" },
          { title: "Report", description: "Transparent updates" },
        ],
      },
      {
        layout: "bullets",
        title: "The ask",
        bullets: ["$X funds Y", "Recognition options", "How to give"],
      },
      { layout: "thankyou", title: "Thank you", subtitle: "Together we…" }
    ),
  },
  {
    id: "tpl-grant-report",
    name: "Grant Report",
    category: "nonprofit",
    description: "Report outcomes to funders clearly.",
    themeId: "corporate",
    tags: ["grant", "report", "funders"],
    preview: "linear-gradient(135deg,#0f172a,#4ade80)",
    slides: slides(
      { layout: "hero", title: "Grant report", subtitle: "Period · Funder" },
      {
        layout: "section",
        title: "Activities delivered",
        body: "What you said you’d do — and did.",
      },
      {
        layout: "stats",
        title: "Outcomes",
        stats: [
          { value: "—", label: "KPI 1" },
          { value: "—", label: "KPI 2" },
          { value: "—", label: "KPI 3" },
        ],
      },
      {
        layout: "bullets",
        title: "Learnings",
        bullets: ["What worked", "What we’ll change"],
      },
      {
        layout: "section",
        title: "Budget snapshot",
        body: "Spent vs planned (high level).",
      },
      { layout: "thankyou", title: "Partnership", subtitle: "Next period priorities" }
    ),
  },

  // ——— Reports ———
  {
    id: "tpl-quarterly-business",
    name: "Quarterly Business Review",
    category: "reports",
    description: "QBR for customers or leadership.",
    themeId: "corporate",
    tags: ["qbr", "report", "metrics"],
    preview: "linear-gradient(135deg,#1e293b,#38bdf8)",
    slides: slides(
      { layout: "hero", title: "QBR", subtitle: "Customer · Quarter" },
      {
        layout: "stats",
        title: "Health",
        stats: [
          { value: "—", label: "Usage" },
          { value: "—", label: "Outcomes" },
          { value: "—", label: "Support" },
        ],
      },
      {
        layout: "chart",
        title: "Trend",
        chartHint: "Usage over time",
        bullets: ["Insight 1", "Insight 2"],
      },
      {
        layout: "bullets",
        title: "Wins & risks",
        bullets: ["Win", "Risk", "Mitigation"],
      },
      {
        layout: "process",
        title: "Next quarter plan",
        process: [
          { title: "Adopt", description: "Feature focus" },
          { title: "Expand", description: "Teams / seats" },
          { title: "Optimize", description: "ROI proof" },
        ],
      },
      { layout: "thankyou", title: "Align & act", subtitle: "Owners & dates" }
    ),
  },
  {
    id: "tpl-annual-report",
    name: "Annual Highlights",
    category: "reports",
    description: "Year-in-review for company or community.",
    themeId: "luxury",
    tags: ["annual", "recap", "highlights"],
    preview: "linear-gradient(135deg,#1c1917,#fbbf24)",
    slides: slides(
      { layout: "hero", title: "YYYY in review", subtitle: "Highlights" },
      {
        layout: "stats",
        title: "By the numbers",
        stats: [
          { value: "—", label: "Growth" },
          { value: "—", label: "People" },
          { value: "—", label: "Milestones" },
        ],
      },
      {
        layout: "timeline",
        title: "Moments",
        timeline: [
          { title: "Q1", description: "…" },
          { title: "Q2", description: "…" },
          { title: "Q3", description: "…" },
          { title: "Q4", description: "…" },
        ],
      },
      {
        layout: "quote",
        title: "What we’re proud of",
        quote: "A human story from the year.",
        quoteAuthor: "Team member",
      },
      {
        layout: "section",
        title: "Looking to next year",
        body: "Three priorities.",
      },
      { layout: "thankyou", title: "Thank you", subtitle: "Onward" }
    ),
  },
  {
    id: "tpl-okr-review",
    name: "OKR Review",
    category: "reports",
    description: "Objectives, key results, and learnings.",
    themeId: "dark",
    tags: ["okr", "goals", "planning"],
    preview: "linear-gradient(135deg,#18181b,#a3e635)",
    slides: slides(
      { layout: "hero", title: "OKR review", subtitle: "Cycle" },
      {
        layout: "section",
        title: "Objective 1",
        body: "Why it mattered.",
      },
      {
        layout: "stats",
        title: "Key results",
        stats: [
          { value: "0.0", label: "KR1 score" },
          { value: "0.0", label: "KR2 score" },
          { value: "0.0", label: "KR3 score" },
        ],
      },
      {
        layout: "comparison",
        title: "What we learned",
        comparison: [
          { title: "Keep", items: ["Practice A"] },
          { title: "Change", items: ["Practice B"] },
        ],
      },
      {
        layout: "bullets",
        title: "Next cycle draft",
        bullets: ["O1 direction", "O2 direction"],
      },
      { layout: "thankyou", title: "Commit", subtitle: "Owners assigned" }
    ),
  },
];

export function templateToPresentation(template: DeckTemplate): Presentation {
  const now = new Date().toISOString();
  return {
    id: uid("deck"),
    title: template.name,
    subtitle: template.description,
    themeId: template.themeId,
    createdAt: now,
    updatedAt: now,
    slides: template.slides.map((s) => ({ ...structuredClone(s), id: uid("slide") })),
  };
}

export function getTemplateById(id: string): DeckTemplate | undefined {
  return DECK_TEMPLATES.find((t) => t.id === id);
}

export function filterTemplates(
  category: TemplateCategory | "all",
  query: string
): DeckTemplate[] {
  const q = query.trim().toLowerCase();
  return DECK_TEMPLATES.filter((t) => {
    if (category !== "all" && t.category !== category) return false;
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });
}
