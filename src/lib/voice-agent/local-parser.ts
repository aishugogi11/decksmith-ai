import type {
  VoiceAgentContext,
  VoiceCommand,
  VoiceCommandEnvelope,
} from "@/lib/voice-agent/types";

/**
 * Deterministic speech → JSON command parser.
 * Used when no LLM key is set, and as a validation fallback.
 * Same envelope schema as the LLM path.
 */
export function parseVoiceLocally(
  transcript: string,
  ctx: VoiceAgentContext
): VoiceCommandEnvelope {
  const raw = transcript.trim();
  const t = raw.toLowerCase().replace(/[’']/g, "'");

  if (!t) {
    return {
      confidence: 0,
      clarification: "I didn’t catch that — try again?",
      intent: "empty",
      commands: [],
    };
  }

  const slide = parseSlideNumber(t);
  const commands: VoiceCommand[] = [];
  let intent = "unknown";
  let confidence = 0.55;
  let clarification: string | null = null;

  // Theme / brand / transform style
  if (
    /\bas (an? )?instagram|for instagram|instagram(-| )?ready|instagram (post|carousel|story|reel)|redesign.*(instagram|ig|insta)|(instagram|ig|insta).*(redesign|post|carousel|suitable|format)/.test(
      t
    )
  ) {
    intent = "redesign_for_instagram";
    confidence = 0.96;
    commands.push({ action: "redesign_for_instagram", params: {} });
  } else if (
    /apple(-| )?(keynote )?style|look like (an? )?apple|use apple|company colors|our (company )?brand|brand colors/.test(
      t
    )
  ) {
    intent = "change_theme";
    confidence = 0.93;
    commands.push({
      action: "change_theme",
      params: { themeId: /corporate|boardroom/.test(t) ? "corporate" : "apple" },
    });
    if (/layout|hierarchy|look|style|keynote/.test(t)) {
      commands.push({
        action: "improve_layout",
        params: { style: "apple" },
      });
    }
  } else if (/dark mode|dark theme|make it dark/.test(t)) {
    intent = "change_theme";
    confidence = 0.95;
    commands.push({ action: "change_theme", params: { themeId: "dark" } });
  } else if (/startup|yc style/.test(t) && /theme|style|look|use|pitch/.test(t)) {
    intent = "change_theme";
    confidence = 0.9;
    commands.push({ action: "change_theme", params: { themeId: "startup" } });
  } else if (
    /improve (the )?layout|visual hierarchy|modernize (the )?(design|deck|look)/.test(
      t
    )
  ) {
    intent = "improve_layout";
    confidence = 0.92;
    const style = /corporate/.test(t)
      ? "corporate"
      : /minimal/.test(t)
        ? "minimal"
        : "apple";
    commands.push({ action: "improve_layout", params: { style } });
  } else if (
    /reduce (the )?text|too much text|shorten (the )?text|convert .* bullets|text(-| )heavy/.test(
      t
    )
  ) {
    intent = "replace_text_with_bullets";
    confidence = 0.9;
    const slideIdx =
      slide ??
      Math.max(
        1,
        ctx.presentation.slides.findIndex((s) => s.id === ctx.selectedSlideId) +
          1
      );
    commands.push({
      action: "replace_text_with_bullets",
      params: { slide: slideIdx || 1 },
    });
  } else if (
    /reduce (this |the )?(deck|presentation|slides?).*(to|=)\s*(\d{1,2})\s*slides?|shorten (this |the )?(deck|presentation).*(\d{1,2})\s*slides?|condense (this |the )?(deck|presentation)/.test(
      t
    )
  ) {
    intent = "shorten_deck";
    confidence = 0.88;
    const m = t.match(/(\d{1,2})\s*slides?/);
    const target = Math.max(3, Number(m?.[1] ?? 10));
    const n = ctx.presentation.slides.length;
    const toRemove = Math.min(Math.max(0, n - target), Math.max(0, n - 3));
    for (let k = 0; k < toRemove; k++) {
      commands.push({
        action: "delete_slide",
        params: { slide: Math.min(3, n - k - 1) },
      });
    }
    if (!commands.length) {
      clarification = `Already at ${n} slides — try reducing text on dense slides instead.`;
    }
  }

  // Icons
  else if (/outlined icons|outline icons|replace every icon/.test(t)) {
    intent = "replace_icons_style";
    confidence = 0.94;
    commands.push({
      action: "replace_icons_style",
      params: {
        iconStyle: /filled/.test(t) && !/outlined|outline/.test(t)
          ? "filled"
          : "outlined",
      },
    });
  }

  // Create textbox
  else if (/create (a )?text ?box|add (a )?text ?box|new text ?box/.test(t)) {
    intent = "create_textbox";
    confidence = 0.92;
    const textMatch = t.match(
      /(?:saying|that says|with text|reading)\s+["']?(.+?)["']?$/
    );
    const params: Record<string, unknown> = {
      text: textMatch?.[1]?.trim() || "New text",
      fontSize: 24,
    };
    if (slide) params.slide = slide;
    const anchor = parseAnchor(t);
    if (anchor) params.anchor = anchor;
    commands.push({ action: "create_textbox", params });
  }

  // Create image
  else if (/create (an? )?image|add (an? )?image|new (photo|picture)/.test(t)) {
    intent = "create_image";
    confidence = 0.9;
    const params: Record<string, unknown> = {
      imageHint: extractAfter(t, /(?:image|photo|picture)(?: of| showing)?\s+/) ||
        "Product photo · soft daylight",
    };
    if (slide) params.slide = slide;
    const anchor = parseAnchor(t);
    if (anchor) params.anchor = anchor;
    commands.push({ action: "create_image", params });
  }

  // Create chart
  else if (/create (a )?chart|add (a )?(revenue )?chart|add (a )?graph/.test(t)) {
    intent = "create_chart";
    confidence = 0.91;
    const params: Record<string, unknown> = {
      chartHint: /bar/.test(t)
        ? "Bar chart · key metrics"
        : /revenue/.test(t)
          ? "Revenue chart"
          : "Chart · key metrics",
    };
    if (slide) params.slide = slide;
    else if (/last slide/.test(t)) params.slide = ctx.presentation.slides.length;
    const anchor = parseAnchor(t);
    if (anchor) params.anchor = anchor;
    commands.push({ action: "create_chart", params });
  }

  // Create icon
  else if (/add (an? )?icon|create (an? )?icon/.test(t)) {
    intent = "create_icon";
    confidence = 0.9;
    commands.push({
      action: "create_icon",
      params: {
        iconStyle: /outline/.test(t) ? "outlined" : "filled",
        iconName: "sparkles",
        ...(slide ? { slide } : {}),
      },
    });
  }

  // Slides
  else if (/duplicate (this |the )?slide/.test(t)) {
    intent = "duplicate_slide";
    confidence = 0.93;
    commands.push({
      action: "duplicate_slide",
      params: slide ? { slide } : {},
    });
  } else if (/delete (this |the )?slide|remove (this |the )?slide/.test(t)) {
    intent = "delete_slide";
    confidence = 0.9;
    commands.push({
      action: "delete_slide",
      params: slide ? { slide } : {},
    });
  } else if (/add (a )?slide|new slide|create (a )?slide/.test(t)) {
    intent = "add_slide";
    confidence = 0.9;
    commands.push({
      action: "add_slide",
      params: {
        title: "New slide",
        ...(slide ? { after: slide } : {}),
      },
    });
  }

  // Minimize / adjust textbox (voice)
  else if (
    /\b(minimize|minimise|shrink|compact)\b/.test(t) &&
    (/\b(text ?box|text|it|that|this)\b/.test(t) ||
      ctx.selection.objectType === "textbox" ||
      ctx.selection.objectId)
  ) {
    intent = "adjust_textbox";
    const hasTextbox =
      ctx.selection.objectType === "textbox" ||
      ctx.selection.objectId ||
      /\btext ?box\b/.test(t) ||
      slideHasTextbox(ctx);
    confidence = hasTextbox ? 0.94 : 0.45;
    if (!hasTextbox) {
      clarification = "Add or select a textbox first, then say “minimize the textbox.”";
    } else {
      commands.push({
        action: "adjust_textbox",
        params: {
          mode: "minimize",
          type: "textbox",
          ...(slide ? { slide } : {}),
        },
      });
    }
  } else if (
    /\b(adjust|resize|make)\b/.test(t) &&
    /\btext ?box\b/.test(t)
  ) {
    intent = "adjust_textbox";
    confidence = 0.92;
    const params: Record<string, unknown> = { type: "textbox" };
    if (slide) params.slide = slide;
    const font = t.match(/\bfont(?:\s*size)?\s*(?:to\s*)?(\d{1,3})\b/);
    if (font) params.fontSize = Number(font[1]);
    const width = t.match(/\b(?:width|wide)\s*(?:to\s*)?(\d{1,3})\b/);
    if (width) params.w = Number(width[1]);
    const height = t.match(/\bheight\s*(?:to\s*)?(\d{1,3})\b/);
    if (height) params.h = Number(height[1]);

    if (/minimi[sz]e|compact|shrink/.test(t)) params.mode = "minimize";
    else if (/expand|enlarge/.test(t)) params.mode = "expand";
    else if (/bigger|larger/.test(t)) params.mode = "bigger";
    else if (/smaller/.test(t)) params.mode = "smaller";
    else if (/wider|wide/.test(t) && !width) params.mode = "wider";
    else if (/narrower|narrow/.test(t)) params.mode = "narrower";
    else if (/taller|tall/.test(t)) params.mode = "taller";
    else if (/shorter|short/.test(t)) params.mode = "shorter";
    else if (!params.fontSize && !params.w && !params.h) {
      // “adjust the textbox” alone — slight compact tweak
      params.mode = "smaller";
    }
    commands.push({ action: "adjust_textbox", params });
  }

  // Font size
  else if (/font (size )?(to )?(\d{1,3})|make the font (\d{1,3})/.test(t)) {
    intent = "set_font_size";
    confidence = 0.94;
    const m = t.match(/\b(\d{1,3})\b/);
    const params: Record<string, unknown> = {
      fontSize: Number(m?.[1] ?? 24),
      type: "textbox",
    };
    // Prefer adjust_textbox when targeting a textbox explicitly or by selection
    if (
      /\btext ?box\b/.test(t) ||
      ctx.selection.objectType === "textbox"
    ) {
      commands.push({
        action: "adjust_textbox",
        params,
      });
    } else {
      commands.push({
        action: "set_font_size",
        params,
      });
    }
  }

  // Resize follow-up (generic objects / “make it bigger”)
  else if (
    /make (it|that|this|the (textbox|image|chart|icon|text)) (bigger|larger|smaller)|enlarge it|shrink it|resize it/.test(
      t
    )
  ) {
    const aboutTextbox =
      /\btext ?box\b|\btext\b/.test(t) ||
      ctx.selection.objectType === "textbox";
    if (aboutTextbox) {
      intent = "adjust_textbox";
      confidence =
        ctx.selection.objectId || slideHasTextbox(ctx) ? 0.93 : 0.5;
      if (confidence < 0.7) {
        clarification =
          "Select a textbox first, or say “make the textbox smaller.”";
      } else {
        commands.push({
          action: "adjust_textbox",
          params: {
            type: "textbox",
            mode: /bigger|larger|enlarge/.test(t) ? "bigger" : "smaller",
          },
        });
      }
    } else {
      intent = "resize_object";
      confidence = ctx.selection.objectId ? 0.93 : 0.55;
      if (!ctx.selection.objectId) {
        clarification =
          "Which object should I resize — the last textbox, image, or chart?";
      } else {
        commands.push({
          action: "resize_object",
          params: {
            bigger: /bigger|larger|enlarge/.test(t),
            smaller: /smaller|shrink/.test(t),
          },
        });
      }
    }
  }

  // Move
  else if (/move (it|that|this|the (textbox|image|chart|icon|object))/.test(t) || /^move it\b/.test(t)) {
    intent = "move_object";
    const anchor = parseAnchor(t);
    const direction = parseDirection(t);
    confidence = ctx.selection.objectId || slide ? 0.92 : 0.5;
    if (!ctx.selection.objectId && !/(chart|textbox|image|icon)/.test(t)) {
      clarification =
        "What should I move — select an object first, or say “move the chart…”?";
    } else {
      const params: Record<string, unknown> = {};
      if (anchor) params.anchor = anchor;
      if (direction) params.direction = direction;
      if (slide) params.slide = slide;
      if (/last slide/.test(t)) params.slide = ctx.presentation.slides.length;
      if (/(chart|graph)/.test(t)) params.type = "chart";
      if (/textbox|text box/.test(t)) params.type = "textbox";
      if (/image|photo/.test(t)) params.type = "image";
      commands.push({ action: "move_object", params });
    }
  }

  // Delete object / text
  else if (
    /delete (it|that|this|the (textbox|text|image|chart|icon|object))|remove (it|that|this|the (textbox|text))|delete text/.test(
      t
    )
  ) {
    intent = "delete_object";
    confidence = ctx.selection.objectId ? 0.92 : 0.5;
    if (!ctx.selection.objectId) {
      clarification = "Select the text you want to delete, then try again.";
    } else {
      commands.push({ action: "delete_object", params: {} });
    }
  }

  // Set text
  else if (/set (the )?text|change (the )?text to|update (the )?text/.test(t)) {
    intent = "set_text";
    confidence = 0.88;
    const text =
      extractAfter(t, /(?:text to|text:|saying)\s+/) ||
      raw.replace(/.*?(set|change|update)\s+(the\s+)?text\s*(to|:)?\s*/i, "").trim();
    if (!text) {
      clarification = "What text should I set?";
      confidence = 0.4;
    } else {
      commands.push({
        action: "set_text",
        params: { text, target: /title/.test(t) ? "title" : "object" },
      });
    }
  }

  // Select
  else if (/select (the )?(textbox|image|chart|icon)/.test(t)) {
    intent = "select_object";
    confidence = 0.9;
    const type = t.match(/select (the )?(textbox|image|chart|icon)/)?.[2] ?? "textbox";
    commands.push({
      action: "select_object",
      params: { type: type === "textbox" ? "textbox" : type, ...(slide ? { slide } : {}) },
    });
  }

  // Ambiguous leftover
  if (!commands.length && !clarification) {
    clarification =
      "Try a transform — “Make this look like an Apple Keynote,” “Reduce the text,” or “Reduce this to 15 slides.”";
    confidence = 0.35;
    intent = "ambiguous";
  }

  // If clarification set, don't execute
  if (clarification) {
    return { confidence, clarification, intent, commands: [] };
  }

  return { confidence, clarification: null, intent, commands };
}

function slideHasTextbox(ctx: VoiceAgentContext): boolean {
  const slideId = ctx.selection.slideId ?? ctx.selectedSlideId;
  const slide =
    ctx.presentation.slides.find((s) => s.id === slideId) ??
    ctx.presentation.slides[0];
  return Boolean(slide?.objects?.some((o) => o.type === "textbox"));
}

function parseSlideNumber(t: string): number | null {
  const digit = t.match(/\bslide\s+(\d+)\b/);
  if (digit) return Number(digit[1]);
  const words: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
    fifth: 5,
  };
  const word = t.match(
    /\bslide\s+(one|two|three|four|five|six|seven|eight|nine|ten|first|second|third|fourth|fifth)\b/
  );
  if (word) return words[word[1]] ?? null;
  return null;
}

function parseAnchor(t: string): string | null {
  const m = t.match(
    /\b(top left|top right|top center|bottom left|bottom right|bottom center|center)\b/
  );
  return m?.[1] ?? null;
}

function parseDirection(t: string): string | null {
  if (/\bleft\b/.test(t) && !/top left|bottom left/.test(t)) return "left";
  if (/\bright\b/.test(t) && !/top right|bottom right/.test(t)) return "right";
  if (/\bup\b/.test(t)) return "up";
  if (/\bdown\b/.test(t)) return "down";
  return null;
}

function extractAfter(t: string, re: RegExp): string | null {
  const m = t.match(re);
  if (!m) return null;
  const idx = m.index ?? 0;
  const rest = t.slice(idx + m[0].length).trim();
  return rest || null;
}
