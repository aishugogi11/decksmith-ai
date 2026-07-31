import { uid } from "@/lib/utils";
import type {
  FeedbackIssue,
  FeedbackIssueCategory,
  FeedbackSourceKind,
} from "@/features/feedback/types";

type Rule = {
  category: FeedbackIssueCategory;
  label: string;
  severity: FeedbackIssue["severity"];
  patterns: RegExp[];
};

const RULES: Rule[] = [
  {
    category: "too_much_text",
    label: "Too much text",
    severity: "warn",
    patterns: [
      /too much text/i,
      /wall of text/i,
      /dense(ly)? (written|packed)/i,
      /cut (the )?copy/i,
      /less text/i,
      /wordy/i,
      /crowded/i,
    ],
  },
  {
    category: "needs_visuals",
    label: "Needs visuals",
    severity: "warn",
    patterns: [
      /needs? (better )?visuals?/i,
      /add (an? )?(image|photo|visual|graphic)/i,
      /more visual/i,
      /looks? boring/i,
      /no images?/i,
    ],
  },
  {
    category: "needs_chart",
    label: "Needs chart / data visual",
    severity: "warn",
    patterns: [
      /needs? (a )?chart/i,
      /add (a )?(chart|graph)/i,
      /show (the )?data/i,
      /prove (it|this) with (numbers|data)/i,
    ],
  },
  {
    category: "weak_conclusion",
    label: "Weak conclusion",
    severity: "critical",
    patterns: [
      /conclusion (isn'?t|not|isn t) convincing/i,
      /weak (ending|conclusion|close)/i,
      /ending (is|feels) weak/i,
      /no (clear )?call to action/i,
      /lack(s|ing)? (a )?cta/i,
      /close (is|feels) soft/i,
    ],
  },
  {
    category: "weak_intro",
    label: "Weak introduction",
    severity: "warn",
    patterns: [
      /weak (intro|opening|hook)/i,
      /intro(duction)? (is|feels) weak/i,
      /start(s|ing)? slow/i,
      /no hook/i,
    ],
  },
  {
    category: "poor_hierarchy",
    label: "Poor hierarchy",
    severity: "warn",
    patterns: [
      /poor hierarchy/i,
      /hierarchy/i,
      /hard to scan/i,
      /no clear (headline|focus)/i,
      /messy layout/i,
      /inconsistent (spacing|layout)/i,
    ],
  },
  {
    category: "unclear_story",
    label: "Unclear story",
    severity: "warn",
    patterns: [
      /unclear (story|narrative|flow)/i,
      /lost (the )?thread/i,
      /doesn'?t flow/i,
      /confusing structure/i,
    ],
  },
  {
    category: "brand_inconsistent",
    label: "Brand inconsistent",
    severity: "info",
    patterns: [
      /brand (is )?inconsistent/i,
      /off[- ]brand/i,
      /wrong colors?/i,
      /doesn'?t match (our )?brand/i,
    ],
  },
  {
    category: "pacing",
    label: "Pacing issues",
    severity: "info",
    patterns: [
      /too (long|short)/i,
      /pacing/i,
      /rush(ed|ing)/i,
      /drag(s|ging)/i,
      /cut (a few )?slides/i,
    ],
  },
];

export function detectFeedbackSourceKind(text: string): FeedbackSourceKind {
  const t = text.toLowerCase();
  if (/youtube|yt\b|@/.test(t) && /comment/.test(t)) return "youtube";
  if (/instagram|ig\b/.test(t)) return "instagram";
  if (/professor|rubric|grade|marks?\b|thesis/.test(t)) return "professor";
  if (/manager|performance review|okr/.test(t)) return "manager";
  if (/investor|partner meeting|term sheet|yc\b/.test(t)) return "investor";
  if (/customer|nps|user feedback|buyer/.test(t)) return "customer";
  if (/rubric|criterion|criteria|points? out of/.test(t)) return "rubric";
  return "general";
}

/**
 * Step 1 — Parse freeform feedback into structured issues.
 * Rule-based today; swap for an LLM classifier later with same output shape.
 */
export function parseFeedbackIssues(text: string): FeedbackIssue[] {
  const found: FeedbackIssue[] = [];
  const seen = new Set<FeedbackIssueCategory>();

  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text) && !seen.has(rule.category)) {
        seen.add(rule.category);
        const quote = extractQuote(text, pattern);
        found.push({
          id: uid("issue"),
          category: rule.category,
          label: rule.label,
          severity: rule.severity,
          quote,
        });
        break;
      }
    }
  }

  // Slide-specific lines: "Slide 4 needs better visuals"
  const slideLines = text.match(/slide\s+\d+[^\n.!?]*/gi) ?? [];
  for (const line of slideLines) {
    const extra = parseFeedbackIssues(line);
    for (const issue of extra) {
      if (!seen.has(issue.category)) {
        seen.add(issue.category);
        found.push(issue);
      }
    }
  }

  if (!found.length && text.trim().length > 20) {
    found.push({
      id: uid("issue"),
      category: "other",
      label: "General feedback to address",
      severity: "info",
      quote: text.trim().slice(0, 140),
    });
  }

  return found;
}

function extractQuote(text: string, pattern: RegExp): string | undefined {
  const m = text.match(pattern);
  if (!m || m.index == null) return undefined;
  const start = Math.max(0, m.index - 20);
  const end = Math.min(text.length, m.index + m[0].length + 40);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}
