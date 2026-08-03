import type { PresentationIntent } from "@/lib/template-engine/types";

/** Slots filled through multi-turn creative collaboration. */
export type CollaboratorBrief = {
  topic?: string;
  audience?: string;
  focus?: "investor" | "technical" | "general";
  darkMode?: boolean;
  wantCharts?: boolean;
  slideCount?: number;
};

export type CollaboratorState = {
  active: boolean;
  brief: CollaboratorBrief;
  asked: (keyof CollaboratorBrief)[];
};

export type CollaboratorTurn =
  | { kind: "question"; question: string; chips: string[]; state: CollaboratorState }
  | { kind: "ready"; prompt: string; state: CollaboratorState; intentHint: string };

const QUESTION_ORDER: {
  key: keyof CollaboratorBrief;
  ask: (brief: CollaboratorBrief) => string;
  chips: string[];
  parse: (answer: string, brief: CollaboratorBrief) => CollaboratorBrief;
}[] = [
  {
    key: "audience",
    ask: () => "Who is your audience?",
    chips: ["Investors / YC", "Engineers", "Executives", "Students", "Customers"],
    parse: (answer, brief) => ({
      ...brief,
      audience: answer.trim(),
      focus: /yc|investor|vc|venture/i.test(answer)
        ? "investor"
        : /engineer|technical|dev/i.test(answer)
          ? "technical"
          : brief.focus,
    }),
  },
  {
    key: "focus",
    ask: (brief) =>
      brief.focus
        ? "Should we lean investor-focused or more technical?"
        : "Should it be investor-focused or technical?",
    chips: ["Investor-focused", "Technical", "Balanced for both"],
    parse: (answer, brief) => {
      const lower = answer.toLowerCase();
      let focus: CollaboratorBrief["focus"] = "general";
      if (/investor|yc|fundraising|pitch/.test(lower)) focus = "investor";
      else if (/technical|engineer|product/.test(lower)) focus = "technical";
      return { ...brief, focus };
    },
  },
  {
    key: "darkMode",
    ask: () => "Do you want a dark, modern look — or keep it light?",
    chips: ["Dark mode", "Light / clean", "Apple-style minimal"],
    parse: (answer, brief) => {
      const lower = answer.toLowerCase();
      return {
        ...brief,
        darkMode: /dark|night|high contrast/.test(lower)
          ? true
          : /light|clean|apple|minimal/.test(lower)
            ? false
            : brief.darkMode,
      };
    },
  },
  {
    key: "wantCharts",
    ask: () => "Would you like charts and hard numbers on a few slides?",
    chips: ["Yes — add charts", "Light on data", "Skip charts"],
    parse: (answer, brief) => ({
      ...brief,
      wantCharts: /yes|chart|data|number|metric|stat/.test(answer.toLowerCase())
        ? true
        : /skip|no|light/.test(answer.toLowerCase())
          ? false
          : brief.wantCharts,
    }),
  },
];

export function emptyCollaboratorState(): CollaboratorState {
  return { active: false, brief: {}, asked: [] };
}

/** Vague create requests that should open the interview, not one-shot generate. */
export function isVagueCreateRequest(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (t.length > 120) return false;
  if (
    /who is|should it|do you want|would you like|audience|dark mode|charts\?/.test(
      t
    )
  ) {
    return false;
  }
  // Enough topic signal → show template picker instead of interviewing
  if (
    /\b(for|about|on)\b\s+[\w][\w\s-]{1,40}/.test(t) ||
    /\b(product design|investor|startup|healthcare|saas|ux|ui)\b/.test(t)
  ) {
    return false;
  }
  const vague =
    /^(make|create|build|generate|i need|i want)\b/.test(t) &&
    /\b(pitch|deck|presentation|slides?)\b/.test(t);
  const thinDetail = t.split(/\s+/).length < 8;
  return vague && thinDetail;
}

export function startCollaboration(seed: string): CollaboratorTurn {
  const brief: CollaboratorBrief = {
    topic: seed.trim(),
  };
  if (/yc|y combinator/i.test(seed)) {
    brief.audience = "YC partners / investors";
    brief.focus = "investor";
  }
  if (/investor|pitch/i.test(seed)) brief.focus = brief.focus ?? "investor";
  if (/dark/i.test(seed)) brief.darkMode = true;
  if (/chart|data|metric/i.test(seed)) brief.wantCharts = true;

  const state: CollaboratorState = {
    active: true,
    brief,
    asked: Object.keys(brief).filter(
      (k) => brief[k as keyof CollaboratorBrief] !== undefined
    ) as (keyof CollaboratorBrief)[],
  };

  return nextCollaboratorTurn(state);
}

export function continueCollaboration(
  state: CollaboratorState,
  answer: string
): CollaboratorTurn {
  const pending = nextMissingSlot(state);
  if (!pending) {
    return readyTurn(state);
  }

  const def = QUESTION_ORDER.find((q) => q.key === pending)!;
  const brief = def.parse(answer, state.brief);
  const asked = Array.from(new Set([...state.asked, pending]));
  return nextCollaboratorTurn({ active: true, brief, asked });
}

export function nextCollaboratorTurn(state: CollaboratorState): CollaboratorTurn {
  const pending = nextMissingSlot(state);
  if (!pending) return readyTurn(state);

  const def = QUESTION_ORDER.find((q) => q.key === pending)!;
  return {
    kind: "question",
    question: def.ask(state.brief),
    chips: def.chips,
    state: { ...state, active: true },
  };
}

function nextMissingSlot(
  state: CollaboratorState
): keyof CollaboratorBrief | null {
  for (const q of QUESTION_ORDER) {
    if (state.brief[q.key] === undefined && !state.asked.includes(q.key)) {
      return q.key;
    }
  }
  // Required minimum: audience + one of focus/visual/charts
  if (state.brief.audience === undefined) return "audience";
  if (state.brief.focus === undefined && state.brief.darkMode === undefined) {
    return "focus";
  }
  if (state.brief.wantCharts === undefined && state.asked.length < 3) {
    return "wantCharts";
  }
  return null;
}

function readyTurn(state: CollaboratorState): CollaboratorTurn {
  const prompt = briefToPrompt(state.brief);
  const intentHint = [
    state.brief.focus === "investor" && "investor pitch",
    /yc/i.test(state.brief.audience || "") && "YC startup",
    state.brief.darkMode && "dark modern",
    state.brief.wantCharts && "charts metrics",
    state.brief.topic,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    kind: "ready",
    prompt,
    intentHint,
    state: { ...state, active: false },
  };
}

export function briefToPrompt(brief: CollaboratorBrief): string {
  const parts = [
    brief.topic || "a presentation",
    brief.audience && `for ${brief.audience}`,
    brief.focus === "investor" && "investor-focused pitch",
    brief.focus === "technical" && "technical deep-dive",
    brief.darkMode === true && "dark modern visual style",
    brief.darkMode === false && "light clean Apple-style design",
    brief.wantCharts === true && "include charts and statistics",
    brief.wantCharts === false && "keep visuals light — minimal charts",
    brief.slideCount && `in ${brief.slideCount} slides`,
  ].filter(Boolean);
  return `Create ${parts.join(", ")}.`;
}

export function mergeBriefIntoIntent(
  intent: PresentationIntent,
  brief: CollaboratorBrief
): PresentationIntent {
  const audience = [...intent.audience];
  if (brief.audience && !audience.length) {
    audience.push(brief.audience.toLowerCase());
  }
  if (brief.focus === "investor" && !audience.includes("investors")) {
    audience.push("investors");
  }

  const visualStyle = [...intent.visualStyle];
  if (brief.darkMode === true && !visualStyle.includes("bold")) {
    visualStyle.push("bold", "modern");
  }
  if (brief.darkMode === false && !visualStyle.includes("minimal")) {
    visualStyle.push("minimal", "modern");
  }

  return {
    ...intent,
    audience,
    visualStyle,
    presentationType:
      intent.presentationType ||
      (brief.focus === "investor" ? "pitch" : intent.presentationType),
    themeHint:
      intent.themeHint ||
      (brief.darkMode
        ? "dark"
        : brief.darkMode === false
          ? "apple"
          : brief.focus === "investor"
            ? "startup"
            : intent.themeHint),
    slideCount: brief.slideCount ?? intent.slideCount,
    keywords: Array.from(
      new Set([
        ...intent.keywords,
        ...(brief.topic ? brief.topic.toLowerCase().split(/\s+/).slice(0, 6) : []),
        brief.focus === "investor" ? "yc" : "",
        brief.wantCharts ? "charts" : "",
      ].filter(Boolean))
    ),
    summary: briefToPrompt(brief),
  };
}
