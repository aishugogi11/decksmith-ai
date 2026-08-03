import type { Slide, SlideLayout, ThemeId } from "@/lib/types";
import { uid } from "@/lib/utils";
import { emptyPatch } from "@/lib/ai/edit-engine/apply-patch";
import type { EditCommandHandler, EditPatch } from "@/lib/ai/edit-engine/types";
import {
  isInstagramRedesignIntent,
  redesignForInstagram,
} from "@/lib/redesign/instagram";

function minimizeSlide(slide: Slide, aggressive: boolean): Partial<Slide> {
  const bullets = slide.bullets
    ?.slice(0, aggressive ? 3 : 4)
    .map((b) => (b.length > 72 ? `${b.slice(0, 69)}…` : b));
  return {
    body:
      slide.body && slide.body.length > 140
        ? `${slide.body.slice(0, 137)}…`
        : slide.body,
    bullets,
    subtitle:
      slide.subtitle && slide.subtitle.length > 80
        ? `${slide.subtitle.slice(0, 77)}…`
        : slide.subtitle,
    callout: aggressive ? undefined : slide.callout,
  };
}

function rewriteProfessional(slide: Slide): Partial<Slide> {
  const polish = (s?: string) =>
    s
      ?.replace(/\bgotta\b/gi, "need to")
      .replace(/\bkinda\b/gi, "somewhat")
      .replace(/!+/g, ".")
      .replace(/\s+/g, " ")
      .trim();
  return {
    title: polish(slide.title) || slide.title,
    subtitle: polish(slide.subtitle),
    body: polish(slide.body),
    bullets: slide.bullets?.map((b) => polish(b) || b),
    callout: polish(slide.callout),
    notes: polish(slide.notes),
  };
}

function toTimeline(slide: Slide): Slide {
  const fromBullets =
    slide.bullets?.map((b, i) => ({
      title: `Step ${i + 1}`,
      description: b,
    })) ?? [];
  return {
    ...slide,
    layout: "timeline" satisfies SlideLayout,
    timeline:
      fromBullets.length >= 2
        ? fromBullets
        : [
            { title: "Start", description: slide.body || "Beginning" },
            { title: "Middle", description: "Turning point" },
            { title: "Now", description: slide.title },
            { title: "Next", description: "Where it goes" },
          ],
  };
}

function patchSlide(id: string, patch: Partial<Slide>): EditPatch {
  return { slidePatches: [{ id, patch }] };
}

/** Modular command registry — add new commands here without touching the runner. */
export const EDIT_COMMANDS: EditCommandHandler[] = [
  {
    id: "redesign.instagram",
    description: "Redesign deck as an Instagram carousel / post set",
    match: (t) => (isInstagramRedesignIntent(t) ? 0.98 : 0),
    apply: (_t, presentation, target) => {
      const next = redesignForInstagram(presentation);
      return {
        patch: {
          ...emptyPatch(),
          themeId: next.themeId,
          format: next.format,
          title: next.title,
          subtitle: next.subtitle,
          slides: next.slides,
        },
        reply: `Redesigned as an Instagram carousel (${next.slides.length} square frames) — short captions, bold type.`,
        referent: { kind: "theme", slideId: target.slideId },
        themePersonality: "playful",
      };
    },
  },
  {
    id: "theme.apple",
    description: "Apple-style / company minimal theme",
    match: (t) =>
      /apple|company colors|brand colors|our brand/.test(t) ? 0.9 : 0,
    apply: (_t, _p, target) => ({
      patch: { ...emptyPatch(), themeId: "apple" as ThemeId },
      reply: "Applied Apple-style / brand-forward colors across the deck.",
      referent: { kind: "theme", slideId: target.slideId },
      themePersonality: "minimal",
    }),
  },
  {
    id: "theme.dark",
    description: "Dark mode",
    match: (t) => (/dark mode|dark theme|make it dark/.test(t) ? 0.95 : 0),
    apply: (_t, _p, target) => ({
      patch: { ...emptyPatch(), themeId: "dark" },
      reply: "Applied dark mode across the deck.",
      referent: { kind: "theme", slideId: target.slideId },
      themePersonality: "bold",
    }),
  },
  {
    id: "theme.startup",
    description: "Startup / YC look",
    match: (t) => (/\bstartup\b|yc style/.test(t) ? 0.9 : 0),
    apply: (_t, _p, target) => ({
      patch: { ...emptyPatch(), themeId: "startup" },
      reply: "Applied a startup pitch look.",
      referent: { kind: "theme", slideId: target.slideId },
      themePersonality: "playful",
    }),
  },
  {
    id: "theme.corporate",
    description: "Corporate theme",
    match: (t) => (/corporate|executive/.test(t) ? 0.9 : 0),
    apply: (_t, _p, target) => ({
      patch: { ...emptyPatch(), themeId: "corporate" },
      reply: "Restyled for a corporate boardroom feel.",
      referent: { kind: "theme", slideId: target.slideId },
      themePersonality: "professional",
    }),
  },
  {
    id: "theme.bold",
    description: "Bolder theme",
    match: (t) => (/more (bold|dramatic)/.test(t) ? 0.85 : 0),
    apply: (_t, _p, target) => ({
      patch: { ...emptyPatch(), themeId: "gradient" },
      reply: "Pushed toward a bolder visual theme.",
      referent: { kind: "theme", slideId: target.slideId },
    }),
  },
  {
    id: "layout.minimal",
    description: "More minimal / less clutter",
    match: (t) =>
      /more minimal|make (this|it) minimal|simplify|less clutter/.test(t)
        ? 0.92
        : 0,
    apply: (t, presentation, target) => {
      const thisOnly = /\b(this slide|the slide|this one)\b/.test(t);
      if (thisOnly) {
        return {
          patch: {
            ...emptyPatch(),
            themeId: "minimal",
            slidePatches: [
              { id: target.slideId, patch: minimizeSlide(target.slide, true) },
            ],
          },
          reply: "Made this slide more minimal.",
          referent: { kind: "slide", slideId: target.slideId },
          themePersonality: "minimal",
        };
      }
      return {
        patch: {
          ...emptyPatch(),
          themeId: "minimal",
          slidePatches: presentation.slides.map((s) => ({
            id: s.id,
            patch: minimizeSlide(s, s.id === target.slideId),
          })),
        },
        reply: "Leaned minimal and trimmed dense copy.",
        referent: { kind: "slide", slideId: target.slideId },
        themePersonality: "minimal",
      };
    },
  },
  {
    id: "layout.timeline",
    description: "Turn into timeline",
    match: (t) =>
      /turn (this|it) into a timeline|make (this|it) a timeline/.test(t)
        ? 0.95
        : 0,
    apply: (_t, _p, target) => ({
      patch: {
        ...emptyPatch(),
        replaceSlides: [{ id: target.slideId, slide: toTimeline(target.slide) }],
      },
      reply: "Converted this slide into a timeline.",
      referent: { kind: "slide", slideId: target.slideId },
    }),
  },
  {
    id: "layout.quote",
    description: "Turn into quote",
    match: (t) => (/turn (this|it) into (a )?quote/.test(t) ? 0.95 : 0),
    apply: (_t, _p, target) => {
      const s = target.slide;
      return {
        patch: patchSlide(target.slideId, {
          layout: "quote",
          quote: s.quote || s.body || s.title,
          quoteAuthor: s.quoteAuthor || "Speaker",
        }),
        reply: "Turned this slide into a quote layout.",
        referent: { kind: "slide", slideId: target.slideId },
      };
    },
  },
  {
    id: "layout.stats",
    description: "Turn into stats",
    match: (t) =>
      /turn (this|it) into (a )?stats|metric cards/.test(t) ? 0.95 : 0,
    apply: (_t, _p, target) => {
      const s = target.slide;
      return {
        patch: patchSlide(target.slideId, {
          layout: "stats",
          stats: s.stats?.length
            ? s.stats
            : [
                { value: "—", label: "Metric A" },
                { value: "—", label: "Metric B" },
                { value: "—", label: "Metric C" },
              ],
        }),
        reply: "Converted this slide to a stats layout.",
        referent: { kind: "slide", slideId: target.slideId },
      };
    },
  },
  {
    id: "chart.move",
    description: "Move chart to slide / side",
    match: (t) =>
      /move (the )?(revenue )?(chart|graph)|move it\b|put (the )?(revenue )?(chart|graph|it) on/.test(
        t
      )
        ? 0.9
        : 0,
    apply: (t, presentation, target) => {
      const lastIdx = presentation.slides.length - 1;
      const toLast =
        /\b(last|final)\s+slide\b/.test(t) || /\bto the (last|end)\b/.test(t);
      const slideNum = t.match(/\bon slide\s+(\d+)\b/) || t.match(/\bslide\s+(\d+)\b/);
      let destIndex = target.slideIndex;
      if (toLast) destIndex = lastIdx;
      else if (slideNum) {
        const n = Number(slideNum[1]) - 1;
        if (n >= 0 && n < presentation.slides.length) destIndex = n;
      }

      const dest = presentation.slides[destIndex];
      if (!dest) return null;

      const alignRight = /to the right/.test(t);
      const alignLeft = /to the left/.test(t);
      const larger = /larger|bigger|enlarge|make it large/.test(t);
      const hintBase =
        presentation.slides.find((s) => s.chartHint)?.chartHint ||
        target.slide.chartHint ||
        "Revenue chart";

      let chartHint = hintBase;
      if (alignRight) chartHint = `${hintBase} · align right`;
      if (alignLeft) chartHint = `${hintBase} · align left`;
      if (larger) chartHint = `${chartHint} · larger · dominant visual`;

      const sourceWithChart =
        presentation.slides.find(
          (s) => s.layout === "chart" || Boolean(s.chartHint)
        ) ?? target.slide;

      const patches: EditPatch = {
        slidePatches: [
          {
            id: dest.id,
            patch: {
              layout:
                dest.layout === "hero" || dest.layout === "section"
                  ? "chart"
                  : dest.layout === "chart"
                    ? "chart"
                    : dest.layout,
              chartHint,
              notes: `${dest.notes || ""} Chart placed here.`.trim(),
            },
          },
        ],
      };

      // Clear chart from previous slide if moving across slides
      if (sourceWithChart.id !== dest.id && sourceWithChart.chartHint) {
        patches.slidePatches.push({
          id: sourceWithChart.id,
          patch: {
            chartHint: undefined,
            layout:
              sourceWithChart.layout === "chart" ? "bullets" : sourceWithChart.layout,
          },
        });
      }

      const where =
        destIndex === lastIdx
          ? "the last slide"
          : `slide ${destIndex + 1}`;
      return {
        patch: patches,
        reply: larger
          ? `Made the chart larger on ${where}.`
          : `Moved the chart to ${where}.`,
        referent: { kind: "chart", slideId: dest.id, label: chartHint },
      };
    },
  },
  {
    id: "chart.enlarge",
    description: "Make chart larger",
    match: (t, target) => {
      if (/make (it|the chart|the graph) (larger|bigger)|enlarge/.test(t))
        return 0.93;
      if (
        target.referent?.kind === "chart" &&
        /larger|bigger|enlarge|make it large/.test(t)
      )
        return 0.95;
      return 0;
    },
    apply: (_t, _p, target) => {
      const slideId = target.referent?.slideId || target.slideId;
      const slide =
        target.slide.id === slideId
          ? target.slide
          : _p.slides.find((s) => s.id === slideId) || target.slide;
      return {
        patch: patchSlide(slide.id, {
          chartHint: `${slide.chartHint || "Chart"} · larger · dominant visual`,
          notes: `${slide.notes || ""} Emphasize chart size.`.trim(),
        }),
        reply: "Made the chart larger.",
        referent: { kind: "chart", slideId: slide.id },
      };
    },
  },
  {
    id: "chart.bar",
    description: "Prefer bar chart",
    match: (t) => (/bar chart|make (it|this) a bar/.test(t) ? 0.9 : 0),
    apply: (_t, _p, target) => ({
      patch: patchSlide(target.slideId, {
        layout: "chart",
        chartHint: "Bar chart · key metrics",
      }),
      reply: "Switched this to a bar chart.",
      referent: { kind: "chart", slideId: target.slideId },
    }),
  },
  {
    id: "image.replace",
    description: "Replace image",
    match: (t) =>
      /replace (this |the )?image|new (photo|image|picture)|change (the )?image/.test(
        t
      )
        ? 0.92
        : 0,
    apply: (_t, _p, target) => ({
      patch: patchSlide(target.slideId, {
        layout: target.slide.layout === "hero" ? "hero" : "image",
        imageHint: "Fresh product / context photo · soft daylight · no stock cliché",
        notes: `${target.slide.notes || ""} Replace image asset.`.trim(),
      }),
      reply: "Marked this slide for a new image — update the visual hint.",
      referent: { kind: "image", slideId: target.slideId },
    }),
  },
  {
    id: "typography.spacing",
    description: "Increase spacing",
    match: (t) =>
      /increase spacing|more (space|whitespace|padding)|airier|looser/.test(t)
        ? 0.9
        : 0,
    apply: (_t, _p, target) => ({
      patch: patchSlide(target.slideId, {
        notes: `${target.slide.notes || ""} Design: increase spacing / whitespace.`.trim(),
        callout: target.slide.callout,
        subtitle: target.slide.subtitle,
        bullets: target.slide.bullets?.slice(0, 4),
      }),
      reply: "Increased spacing on this slide (more breathing room).",
      referent: { kind: "spacing", slideId: target.slideId },
    }),
  },
  {
    id: "text.less",
    description: "Less text / shorten",
    match: (t) =>
      /less text|too much text|shorten|cut (the )?copy/.test(t) ? 0.9 : 0,
    apply: (_t, _p, target) => ({
      patch: patchSlide(target.slideId, minimizeSlide(target.slide, true)),
      reply: "Cut the copy on this slide.",
      referent: { kind: "text", slideId: target.slideId },
    }),
  },
  {
    id: "text.rewrite",
    description: "Rewrite professionally",
    match: (t) =>
      /rewrite|more professional|polish (the )?copy|tighten (the )?language/.test(
        t
      )
        ? 0.9
        : 0,
    apply: (_t, _p, target) => ({
      patch: patchSlide(target.slideId, rewriteProfessional(target.slide)),
      reply: "Rewrote this slide in a more professional tone.",
      referent: { kind: "text", slideId: target.slideId },
    }),
  },
  {
    id: "notes.set",
    description: "Speaker notes",
    match: (t) =>
      /speaker notes|add notes|notes:|script for this/.test(t) ? 0.85 : 0,
    apply: (t, _p, target) => {
      const extracted =
        t.replace(/^.*?(speaker notes|add notes|notes:)\s*/i, "").trim() ||
        `Talk track for “${target.slide.title}”.`;
      return {
        patch: patchSlide(target.slideId, { notes: extracted }),
        reply: "Updated speaker notes on this slide.",
        referent: { kind: "notes", slideId: target.slideId },
      };
    },
  },
  {
    id: "slide.add-chart",
    description: "Add a chart slide",
    match: (t) => (/add (a )?chart|include (a )?chart/.test(t) ? 0.88 : 0),
    apply: (_t, _p, target) => {
      const chartSlide: Slide = {
        id: uid("slide"),
        layout: "chart",
        title: "The numbers",
        subtitle: "Refresh with live research anytime",
        chartHint: "Bar chart · key metrics",
        bullets: ["Baseline", "Today", "Target"],
      };
      return {
        patch: {
          ...emptyPatch(),
          insertAfter: [{ afterId: target.slideId, slides: [chartSlide] }],
        },
        reply: "Added a chart slide after the current one.",
        referent: { kind: "chart", slideId: chartSlide.id },
      };
    },
  },
  {
    id: "slide.reorder-last",
    description: "Move current slide to end",
    match: (t) =>
      /move (this|the) slide to (the )?(end|last)/.test(t) ? 0.9 : 0,
    apply: (_t, presentation, target) => {
      const ids = presentation.slides.map((s) => s.id).filter((id) => id !== target.slideId);
      ids.push(target.slideId);
      return {
        patch: { ...emptyPatch(), reorder: ids },
        reply: "Moved this slide to the end of the deck.",
        referent: { kind: "slide", slideId: target.slideId },
      };
    },
  },
  {
    id: "animation.hint",
    description: "Slide transition / animation hint",
    match: (t) =>
      /transition|animate|fade in|build.?in/.test(t) ? 0.8 : 0,
    apply: (t, _p, target) => {
      const style = /fade/.test(t)
        ? "fade"
        : /build/.test(t)
          ? "build-in"
          : "subtle";
      return {
        patch: patchSlide(target.slideId, {
          notes: `${target.slide.notes || ""} Transition: ${style}.`.trim(),
        }),
        reply: `Noted a ${style} transition for this slide.`,
        referent: { kind: "animation", slideId: target.slideId },
      };
    },
  },
  {
    id: "align.center",
    description: "Center alignment hint",
    match: (t) => (/center (align|this)|align center/.test(t) ? 0.85 : 0),
    apply: (_t, _p, target) => ({
      patch: patchSlide(target.slideId, {
        notes: `${target.slide.notes || ""} Alignment: center content.`.trim(),
      }),
      reply: "Centered content on this slide.",
      referent: { kind: "slide", slideId: target.slideId },
    }),
  },
];

export function registerEditCommand(command: EditCommandHandler) {
  EDIT_COMMANDS.push(command);
}
