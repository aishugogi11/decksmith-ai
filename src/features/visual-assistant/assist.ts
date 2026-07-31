import { searchCatalog } from "./catalog";
import type {
  VisualAssistTurn,
  VisualClarifyOption,
  VisualDeckContext,
  VisualRecommendation,
} from "./types";

const AMBIGUOUS =
  /^(add|find|get|need|want|show|insert|put|give me)?\s*(an?\s+)?(image|photo|picture|visual|graphic|art)?\s*(please)?\.?$/i;

const VAGUE_ONLY =
  /^(something|anything)?\s*(nice|good|cool|professional|modern|pretty|relevant|better)?\s*(please)?\.?$/i;

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function extractSubject(text: string): string | null {
  const t = normalize(text);
  const m =
    t.match(
      /(?:image|photo|picture|visual|shot|stock)\s+(?:of|showing|with|for)\s+(.+)/i
    ) ||
    t.match(/(?:find|search|show|get|add|insert)\s+(?:me\s+)?(?:an?\s+)?(.+)/i) ||
    t.match(/^(.+)$/);
  if (!m?.[1]) return null;
  let subject = m[1]
    .replace(/\b(please|thanks|thank you)\b/gi, "")
    .replace(/\b(on (this|the) slide|here|now)\b/gi, "")
    .replace(/\b(image|photo|picture|visual)\b/gi, "")
    .trim();
  if (subject.length < 3) return null;
  if (/^(an?|the|some)$/i.test(subject)) return null;
  return subject;
}

function isAmbiguous(text: string): boolean {
  const t = normalize(text);
  if (!t) return true;
  if (AMBIGUOUS.test(t)) return true;
  if (VAGUE_ONLY.test(t)) return true;
  if (
    /^(add|find|need)\s+(an?\s+)?(image|photo|picture|visual)\.?$/i.test(t)
  ) {
    return true;
  }
  const subject = extractSubject(t);
  if (!subject) return true;
  // Subject is only a style word
  if (
    /^(professional|modern|minimal|clean|corporate|nice|cool|abstract)$/i.test(
      subject
    )
  ) {
    return true;
  }
  return false;
}

function styleTokens(ctx: VisualDeckContext): string[] {
  const theme = ctx.themeId;
  if (theme === "apple") return ["soft daylight", "minimal", "clean product"];
  if (theme === "minimal") return ["editorial", "quiet", "documentary"];
  if (theme === "corporate") return ["professional office", "polished"];
  if (theme === "academic") return ["research", "campus", "credible"];
  return ["modern", "clear"];
}

/** Build high-quality search queries from request + slide/deck context. */
export function buildSearchQueries(
  request: string,
  ctx: VisualDeckContext
): string[] {
  const subject = extractSubject(request) ?? request;
  const slide = ctx.slide;
  const style = styleTokens(ctx);
  const queries: string[] = [];

  queries.push(`${subject} ${style[0]}`.trim());

  if (slide?.title) {
    queries.push(`${subject} ${slide.title}`.trim());
  }

  const bulletHook = slide?.bullets?.[0];
  if (bulletHook) {
    const short = bulletHook.split(/\s+/).slice(0, 6).join(" ");
    queries.push(`${subject} ${short}`.trim());
  }

  if (ctx.audienceHint) {
    queries.push(`${subject} for ${ctx.audienceHint}`.trim());
  }

  // Prefer illustration language when user asked for illustration / graphic
  if (/illustrat|graphic|abstract|vector/i.test(request)) {
    queries.unshift(`${subject} abstract illustration`);
  }

  // Dedupe
  const seen = new Set<string>();
  return queries
    .map((q) => q.replace(/\s+/g, " ").trim())
    .filter((q) => {
      const k = q.toLowerCase();
      if (seen.has(k) || q.length < 4) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 4);
}

function recommendAlternatives(
  request: string,
  ctx: VisualDeckContext
): VisualRecommendation[] {
  const slide = ctx.slide;
  const blob = [
    request,
    slide?.title,
    ...(slide?.bullets ?? []),
    slide?.body,
    slide?.hasChart ? "chart metrics" : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const out: VisualRecommendation[] = [];

  const wantsPhotoExplicit =
    /\b(photo|photograph|stock image|picture of)\b/i.test(request);

  if (
    !slide?.hasChart &&
    /\b(\d+%|growth|revenue|metrics?|kpi|compare|versus|vs\.?|trend|increase|decrease|roi)\b/i.test(
      blob
    )
  ) {
    out.push({
      kind: "chart",
      title: "Use a chart instead",
      reason:
        "This slide talks about numbers or comparison — a chart usually lands harder than a stock photo.",
      hint: slide?.title
        ? `${slide.title} — key metric comparison`
        : "Key metric comparison",
      cta: "Add a chart placeholder",
    });
  }

  if (
    !slide?.hasTimeline &&
    /\b(timeline|roadmap|phases?|milestones?|steps?|process|then|next|journey)\b/i.test(
      blob
    )
  ) {
    out.push({
      kind: "timeline",
      title: "Use a timeline",
      reason:
        "Sequence and milestones read more clearly as a timeline than as a photograph.",
      hint: "Phased roadmap · 3–5 milestones",
      cta: "Suggest timeline layout",
    });
  }

  if (
    /\b(feature|benefits?|pillars?|capabilities|icons?)\b/i.test(blob) &&
    (slide?.bullets?.length ?? 0) >= 3
  ) {
    out.push({
      kind: "icon",
      title: "Use icons for each point",
      reason:
        "Multiple parallel ideas work better with a small icon set than one hero photo.",
      hint: "Feature icons · outlined",
      cta: "Add an icon",
    });
  }

  if (
    /\b(architecture|funnel|framework|system|flow|diagram|model)\b/i.test(blob)
  ) {
    out.push({
      kind: "diagram",
      title: "Use a diagram",
      reason:
        "Relationships and systems communicate better as a diagram than as a lifestyle photo.",
      hint: "Simple system diagram · 3–4 nodes",
      cta: "Add a diagram placeholder",
    });
  }

  if (
    !wantsPhotoExplicit &&
    (/\b(concept|abstract|metaphor|vision|future)\b/i.test(blob) ||
      ctx.themeId === "minimal")
  ) {
    out.push({
      kind: "illustration",
      title: "Prefer an illustration",
      reason:
        "Abstract or conceptual slides often feel sharper with illustration than literal photography.",
      hint: "Abstract illustration · brand-aligned",
      cta: "Show illustrations",
    });
  }

  return out.slice(0, 2);
}

function clarifyOptions(ctx: VisualDeckContext): VisualClarifyOption[] {
  const slide = ctx.slide;
  const opts: VisualClarifyOption[] = [];

  if (slide?.title) {
    opts.push({
      id: "from-title",
      label: `Something that shows “${slide.title.slice(0, 42)}”`,
    });
  }
  opts.push(
    { id: "product", label: "Product / app in use" },
    { id: "people", label: "People collaborating" },
    { id: "abstract", label: "Abstract / brand mood" },
    { id: "data", label: "Actually… a chart would be better" }
  );
  return opts.slice(0, 5);
}

function resolveClarifyChoice(
  text: string,
  ctx: VisualDeckContext
): string | null {
  const t = text.toLowerCase();
  if (t.includes("product") || t.includes("app")) return "product app in use soft daylight";
  if (t.includes("people") || t.includes("collaborat"))
    return "team collaboration office meeting";
  if (t.includes("abstract") || t.includes("mood") || t.includes("brand"))
    return "abstract brand mood illustration";
  if (t.includes("chart") || t.includes("data")) return "__chart__";
  if (t.includes("title") || t.startsWith("something that shows")) {
    return ctx.slide?.title
      ? `${ctx.slide.title} ${styleTokens(ctx)[0]}`
      : "professional presentation visual";
  }
  return null;
}

/**
 * Conversational Visual Assistant turn:
 * clarify when ambiguous → else search + optional non-photo recommendations.
 */
export function runVisualAssist(
  userText: string,
  ctx: VisualDeckContext,
  opts?: { forceSearch?: boolean }
): VisualAssistTurn {
  const text = normalize(userText);
  const clarified = resolveClarifyChoice(text, ctx);

  if (clarified === "__chart__") {
    return {
      type: "recommend",
      message:
        "Got it — a chart will communicate this more clearly than a photo. I can drop a chart placeholder on this slide, or you can still browse photos below.",
      recommendations: [
        {
          kind: "chart",
          title: "Chart placeholder",
          reason: "You asked for a data-led visual.",
          hint: ctx.slide?.title
            ? `${ctx.slide.title} — key metrics`
            : "Key metrics",
          cta: "Add a chart placeholder",
        },
      ],
      candidates: searchCatalog(
        buildSearchQueries(ctx.slide?.title || "business metrics", ctx),
        { limit: 4 }
      ),
      queries: buildSearchQueries(ctx.slide?.title || "business metrics", ctx),
    };
  }

  if (!opts?.forceSearch && isAmbiguous(text) && !clarified) {
    const slideBit = ctx.slide
      ? `You’re on “${ctx.slide.title}”. `
      : "";
    return {
      type: "clarify",
      message: `${slideBit}What should this visual communicate? A quick hint helps me search with your slide title, bullets, and ${ctx.themeId} style in mind.`,
      options: clarifyOptions(ctx),
    };
  }

  const request = clarified ?? text;
  const queries = buildSearchQueries(request, ctx);
  const preferIllustration =
    /illustrat|abstract|graphic|vector/i.test(request) ||
    /illustration/i.test(queries.join(" "));
  const candidates = searchCatalog(queries, {
    preferIllustration,
    limit: 8,
  });
  const recommendations = recommendAlternatives(request, ctx);

  const queryLine = queries[0] ? `“${queries[0]}”` : "your request";
  const recNote =
    recommendations.length > 0
      ? " I also have a non-photo option that may fit better."
      : "";

  if (
    recommendations.length > 0 &&
    recommendations[0].kind !== "illustration" &&
    !/photo|picture|image of/i.test(text)
  ) {
    return {
      type: "recommend",
      message: `${recommendations[0].reason} Here are photo options from ${queryLine} if you still want a still.${recNote}`,
      recommendations,
      candidates,
      queries,
    };
  }

  return {
    type: "gallery",
    message: `I searched for ${queryLine} using this slide’s context and your ${ctx.themeId} design style. Pick one to place on the slide.${recNote}`,
    queries,
    candidates,
    recommendations: recommendations.length ? recommendations : undefined,
  };
}
