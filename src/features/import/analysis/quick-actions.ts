import type { ImportIssue, ImportQuickAction } from "@/features/import/types";
import type { Presentation } from "@/lib/types";
import type { VoiceCommand } from "@/lib/voice-agent/types";

/**
 * One-click post-import actions → deterministic editor commands only.
 */
export function buildImportQuickActions(
  presentation: Presentation,
  issues: ImportIssue[]
): ImportQuickAction[] {
  const n = presentation.slides.length;
  const denseSlides = issues
    .filter((i) => i.slideIndex != null && /crowded|text/i.test(i.label))
    .map((i) => (i.slideIndex ?? 0) + 1);

  const reduceCommands: VoiceCommand[] = (
    denseSlides.length
      ? denseSlides
      : presentation.slides
          .map((s, i) => ({
            i: i + 1,
            w: (s.body?.length ?? 0) + (s.bullets?.join("").length ?? 0),
          }))
          .sort((a, b) => b.w - a.w)
          .slice(0, 3)
          .map((x) => x.i)
  ).map((slide) => ({
    action: "replace_text_with_bullets",
    params: { slide },
  }));

  return [
    {
      id: "improve_layout",
      label: "Improve Layout",
      description: "Apple-style hierarchy + trim density",
      commands: [{ action: "improve_layout", params: { style: "apple" } }],
    },
    {
      id: "reduce_text",
      label: "Reduce Text",
      description: "Convert dense slides to short bullets",
      commands: reduceCommands.length
        ? reduceCommands
        : [{ action: "replace_text_with_bullets", params: { slide: 1 } }],
    },
    {
      id: "modernize",
      label: "Modernize Design",
      description: "Minimal theme + cleaner spacing",
      commands: [
        { action: "change_theme", params: { themeId: "minimal" } },
        { action: "improve_layout", params: { style: "minimal" } },
      ],
    },
    {
      id: "style_instagram",
      label: "Instagram Carousel",
      description: "Square frames · short captions · bold type",
      commands: [{ action: "redesign_for_instagram", params: {} }],
    },
    {
      id: "style_apple",
      label: "Apple Keynote Style",
      description: "Airy Apple-style theme",
      commands: [
        { action: "change_theme", params: { themeId: "apple" } },
        { action: "improve_layout", params: { style: "apple" } },
      ],
    },
    {
      id: "style_startup",
      label: "Startup Pitch Style",
      description: "Bold startup pitch look",
      commands: [{ action: "change_theme", params: { themeId: "startup" } }],
    },
    {
      id: "style_corporate",
      label: "Corporate Style",
      description: "Boardroom-ready corporate theme",
      commands: [
        { action: "change_theme", params: { themeId: "corporate" } },
        { action: "improve_layout", params: { style: "corporate" } },
      ],
    },
    {
      id: "style_academic",
      label: "Academic Style",
      description: "Education theme + clearer structure",
      commands: [{ action: "change_theme", params: { themeId: "education" } }],
    },
    {
      id: "add_speaker_notes",
      label: "Add Speaker Notes",
      description: "Draft talk tracks on key slides",
      commands: presentation.slides.slice(0, 6).map((s, i) => ({
        action: "set_slide_field",
        params: {
          slide: i + 1,
          field: "notes",
          value: `Talk track for “${s.title}”: one idea, one proof, one pause.`,
        },
      })),
    },
    {
      id: "improve_accessibility",
      label: "Improve Accessibility",
      description: "Larger type + clearer hierarchy",
      commands: [
        { action: "improve_layout", params: { style: "minimal" } },
        {
          action: "adjust_textbox",
          params: { mode: "bigger", type: "textbox", slide: 1 },
        },
      ],
    },
    {
      id: "generate_citations",
      label: "Generate Missing Citations",
      description: "Add a References slide scaffold",
      commands: [
        {
          action: "add_slide",
          params: { title: "References", layout: "bullets" },
        },
      ],
    },
    {
      id: "improve_hierarchy",
      label: "Improve Visual Hierarchy",
      description: "Tighten layout and emphasize titles",
      commands: [{ action: "improve_layout", params: { style: "apple" } }],
    },
    {
      id: "shorten_10",
      label: "Shorten to 10 Slides",
      description: "Keep opening, proof, and close — trim middle density",
      commands: buildShortenCommands(n, 10),
    },
    {
      id: "expand_20",
      label: "Expand into 20 Slides",
      description: "Add section beats for breathing room",
      commands: buildExpandCommands(n, 20),
    },
  ];
}

function buildShortenCommands(n: number, target: number): VoiceCommand[] {
  if (n <= target) {
    return [{ action: "replace_text_with_bullets", params: { slide: 2 } }];
  }
  const cmds: VoiceCommand[] = [];
  // Delete from the end of the middle section (1-based slide indices), keep open + close
  const toRemove = Math.min(n - target, Math.max(0, n - 3));
  for (let k = 0; k < toRemove; k++) {
    // Always delete current middle slide (index 2 while slides shrink)
    cmds.push({ action: "delete_slide", params: { slide: Math.min(3, n - k - 1) } });
  }
  cmds.push({
    action: "rewrite_conclusion",
    params: { slide: Math.max(1, n - toRemove) },
  });
  return cmds;
}

function buildExpandCommands(n: number, target: number): VoiceCommand[] {
  const cmds: VoiceCommand[] = [];
  const need = Math.max(0, Math.min(target - n, 8));
  for (let i = 0; i < need; i++) {
    cmds.push({
      action: "add_slide",
      params: {
        after: Math.min(n, i + 1),
        title: `Deep dive ${i + 1}`,
        layout: "section",
      },
    });
  }
  return cmds.length
    ? cmds
    : [{ action: "add_slide", params: { title: "Appendix", layout: "section" } }];
}
