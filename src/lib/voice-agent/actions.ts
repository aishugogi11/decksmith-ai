import type { ThemeId } from "@/lib/types";
import { uid } from "@/lib/utils";
import { resolveImageSrcFromHint } from "@/features/visual-assistant/resolve-src";
import { redesignForInstagram } from "@/lib/redesign/instagram";
import {
  anchorToXY,
  clamp,
  clonePresentation,
  makeObject,
  num,
  patchObject,
  resolveObjectId,
  resolveSlideIndex,
  selectionFor,
  str,
  updateSlide,
} from "@/lib/voice-agent/helpers";
import { registerEditorAction } from "@/lib/voice-agent/registry";

let registered = false;

/** Idempotent — call once at pipeline startup. */
export function ensureEditorActionsRegistered(): void {
  if (registered) return;
  registered = true;

  registerEditorAction({
    name: "create_textbox",
    description: "Create a textbox object on a slide.",
    params: [
      { name: "slide", type: "number", description: "1-based slide number" },
      { name: "text", type: "string", description: "Initial text content" },
      { name: "x", type: "number", description: "Left % (0-100)" },
      { name: "y", type: "number", description: "Top % (0-100)" },
      { name: "w", type: "number", description: "Width %" },
      { name: "h", type: "number", description: "Height %" },
      { name: "fontSize", type: "number", description: "Font size in px" },
      { name: "anchor", type: "string", description: "e.g. top right" },
    ],
    examples: ["Create a textbox on slide two.", "Add a text box saying Hello"],
    execute: (params, ctx) => {
      const i = resolveSlideIndex(params, ctx);
      const slide = ctx.presentation.slides[i];
      const anchor = str(params.anchor);
      const pos = anchor ? anchorToXY(anchor) : null;
      const obj = makeObject("textbox", {
        text: str(params.text, "Type here"),
        fontSize: num(params.fontSize, 28),
        x: num(params.x, pos?.x ?? 18),
        y: num(params.y, pos?.y ?? 28),
        w: num(params.w, 55),
        h: num(params.h, 16),
      });
      const presentation = updateSlide(clonePresentation(ctx.presentation), i, (s) => ({
        ...s,
        objects: [...(s.objects ?? []), obj],
      }));
      return {
        presentation,
        selectedSlideId: slide.id,
        selection: selectionFor(slide.id, obj, "create_textbox"),
        detail: `Created textbox on slide ${i + 1}`,
      };
    },
  });

  registerEditorAction({
    name: "create_image",
    description:
      "Create an image object on a slide (optional src URL from Visual Assistant).",
    params: [
      { name: "slide", type: "number", description: "1-based slide number" },
      { name: "imageHint", type: "string", description: "What the image should show" },
      { name: "src", type: "string", description: "Image URL or data URL" },
      { name: "anchor", type: "string", description: "Position anchor" },
      { name: "x", type: "number", description: "Left %" },
      { name: "y", type: "number", description: "Top %" },
      { name: "w", type: "number", description: "Width %" },
      { name: "h", type: "number", description: "Height %" },
    ],
    examples: ["Add an image on slide 1", "Create an image of a product demo"],
    execute: (params, ctx) => {
      const i = resolveSlideIndex(params, ctx);
      const slide = ctx.presentation.slides[i];
      const pos = str(params.anchor) ? anchorToXY(str(params.anchor)) : null;
      const hint = str(params.imageHint, "Product photo · soft daylight");
      const src =
        str(params.src) || resolveImageSrcFromHint(hint) || undefined;
      const obj = makeObject("image", {
        imageHint: hint,
        ...(src ? { src } : {}),
        x: num(params.x, pos?.x ?? 55),
        y: num(params.y, pos?.y ?? 20),
        w: num(params.w, 38),
        h: num(params.h, 50),
      });
      const presentation = updateSlide(clonePresentation(ctx.presentation), i, (s) => ({
        ...s,
        layout: s.layout === "hero" ? s.layout : "image",
        imageHint: obj.imageHint,
        objects: [...(s.objects ?? []), obj],
      }));
      return {
        presentation,
        selectedSlideId: slide.id,
        selection: selectionFor(slide.id, obj, "create_image"),
        detail: src
          ? `Placed image on slide ${i + 1}`
          : `Created image on slide ${i + 1}`,
      };
    },
  });

  registerEditorAction({
    name: "create_icon",
    description: "Create an icon object on a slide.",
    params: [
      { name: "slide", type: "number", description: "1-based slide number" },
      { name: "iconName", type: "string", description: "Icon name" },
      {
        name: "iconStyle",
        type: "enum",
        enumValues: ["filled", "outlined"],
        description: "Icon style",
      },
    ],
    examples: ["Add an outlined check icon"],
    execute: (params, ctx) => {
      const i = resolveSlideIndex(params, ctx);
      const slide = ctx.presentation.slides[i];
      const style =
        str(params.iconStyle) === "filled" ? "filled" : "outlined";
      const obj = makeObject("icon", {
        iconName: str(params.iconName, "sparkles"),
        iconStyle: style,
        x: num(params.x, 12),
        y: num(params.y, 18),
        w: 10,
        h: 12,
      });
      const presentation = updateSlide(clonePresentation(ctx.presentation), i, (s) => ({
        ...s,
        objects: [...(s.objects ?? []), obj],
      }));
      return {
        presentation,
        selectedSlideId: slide.id,
        selection: selectionFor(slide.id, obj, "create_icon"),
        detail: `Created ${style} icon on slide ${i + 1}`,
      };
    },
  });

  registerEditorAction({
    name: "add_slide",
    description: "Insert a new slide after the current or specified slide.",
    params: [
      { name: "after", type: "number", description: "1-based slide to insert after" },
      { name: "title", type: "string", description: "New slide title" },
      { name: "layout", type: "string", description: "Layout name" },
    ],
    examples: ["Add a slide", "Add a new slide after slide 2"],
    execute: (params, ctx) => {
      const after = typeof params.after === "number"
        ? Math.floor(params.after) - 1
        : resolveSlideIndex(params, ctx);
      const newSlide = {
        id: uid("slide"),
        layout: (str(params.layout, "section") as "section"),
        title: str(params.title, "New slide"),
        objects: [] as never[],
      };
      const presentation = clonePresentation(ctx.presentation);
      const at = clamp(after + 1, 0, presentation.slides.length);
      presentation.slides.splice(at, 0, newSlide);
      presentation.updatedAt = new Date().toISOString();
      return {
        presentation,
        selectedSlideId: newSlide.id,
        selection: selectionFor(newSlide.id, null, "add_slide"),
        detail: `Added slide at position ${at + 1}`,
      };
    },
  });

  registerEditorAction({
    name: "duplicate_slide",
    description: "Duplicate a slide.",
    params: [
      { name: "slide", type: "number", description: "1-based slide number" },
    ],
    examples: ["Duplicate this slide", "Duplicate slide 3"],
    execute: (params, ctx) => {
      const i = resolveSlideIndex(params, ctx);
      const presentation = clonePresentation(ctx.presentation);
      const copy = {
        ...structuredClone(presentation.slides[i]),
        id: uid("slide"),
        title: `${presentation.slides[i].title} (copy)`,
      };
      if (copy.objects) {
        copy.objects = copy.objects.map((o) => ({ ...o, id: uid("obj") }));
      }
      presentation.slides.splice(i + 1, 0, copy);
      presentation.updatedAt = new Date().toISOString();
      return {
        presentation,
        selectedSlideId: copy.id,
        selection: selectionFor(copy.id, null, "duplicate_slide"),
        detail: `Duplicated slide ${i + 1}`,
      };
    },
  });

  registerEditorAction({
    name: "delete_slide",
    description: "Delete a slide (keeps at least one).",
    params: [{ name: "slide", type: "number", description: "1-based slide number" }],
    examples: ["Delete slide 4"],
    execute: (params, ctx) => {
      if (ctx.presentation.slides.length <= 1) {
        throw new Error("Cannot delete the only slide");
      }
      const i = resolveSlideIndex(params, ctx);
      const presentation = clonePresentation(ctx.presentation);
      const removed = presentation.slides[i];
      presentation.slides.splice(i, 1);
      presentation.updatedAt = new Date().toISOString();
      const next = presentation.slides[Math.min(i, presentation.slides.length - 1)];
      return {
        presentation,
        selectedSlideId: next.id,
        selection: selectionFor(next.id, null, "delete_slide"),
        detail: `Deleted “${removed.title}”`,
      };
    },
  });

  registerEditorAction({
    name: "delete_object",
    description: "Delete the selected or specified object.",
    params: [
      { name: "objectId", type: "string", description: "Object id" },
      { name: "slide", type: "number", description: "1-based slide number" },
    ],
    examples: ["Delete it", "Delete the textbox"],
    execute: (params, ctx) => {
      const i = resolveSlideIndex(params, ctx);
      const slide = ctx.presentation.slides[i];
      const objectId = resolveObjectId(params, ctx, slide);
      if (!objectId) throw new Error("No object selected to delete");
      const presentation = updateSlide(clonePresentation(ctx.presentation), i, (s) => ({
        ...s,
        objects: (s.objects ?? []).filter((o) => o.id !== objectId),
      }));
      return {
        presentation,
        selectedSlideId: slide.id,
        selection: selectionFor(slide.id, null, "delete_object"),
        detail: `Deleted object ${objectId}`,
      };
    },
  });

  registerEditorAction({
    name: "move_object",
    description:
      "Move the selected object. Use anchor (top right) or dx/dy percent deltas or absolute x/y.",
    params: [
      { name: "objectId", type: "string", description: "Object id; omit to use selection" },
      { name: "anchor", type: "string", description: "Named position e.g. top right" },
      { name: "x", type: "number", description: "Absolute left %" },
      { name: "y", type: "number", description: "Absolute top %" },
      { name: "dx", type: "number", description: "Delta left %" },
      { name: "dy", type: "number", description: "Delta top %" },
      { name: "slide", type: "number", description: "1-based slide number" },
    ],
    examples: ["Move it to the top right.", "Move it left", "Move the chart to slide 3"],
    execute: (params, ctx) => {
      let presentation = clonePresentation(ctx.presentation);
      const i = resolveSlideIndex(params, ctx);
      let slide = presentation.slides[i];
      let objectId = resolveObjectId(params, ctx, slide);

      // Move object across slides if target differs from selection slide
      if (
        ctx.selection.objectId &&
        ctx.selection.slideId &&
        typeof params.slide === "number"
      ) {
        const from = presentation.slides.findIndex(
          (s) => s.id === ctx.selection.slideId
        );
        const to = resolveSlideIndex(params, ctx);
        if (from >= 0 && to !== from) {
          const src = presentation.slides[from];
          const obj = src.objects?.find((o) => o.id === ctx.selection.objectId);
          if (obj) {
            presentation = updateSlide(presentation, from, (s) => ({
              ...s,
              objects: (s.objects ?? []).filter((o) => o.id !== obj.id),
              chartHint: obj.type === "chart" ? undefined : s.chartHint,
            }));
            const moved = { ...obj };
            if (str(params.anchor)) {
              const pos = anchorToXY(str(params.anchor));
              if (pos) {
                moved.x = pos.x;
                moved.y = pos.y;
              }
            }
            presentation = updateSlide(presentation, to, (s) => ({
              ...s,
              objects: [...(s.objects ?? []), moved],
              chartHint: obj.type === "chart" ? obj.chartHint || s.chartHint : s.chartHint,
            }));
            const dest = presentation.slides[to];
            return {
              presentation,
              selectedSlideId: dest.id,
              selection: selectionFor(dest.id, moved, "move_object"),
              detail: `Moved object to slide ${to + 1}`,
            };
          }
        }
      }

      // If targeting a chart/image that only exists as a layout hint, materialize it
      if (!objectId && (params.type === "chart" || /chart|graph|revenue/.test(str(params.type)))) {
        const hint = slide.chartHint || "Revenue chart";
        const materialised = makeObject("chart", {
          chartHint: hint,
          x: 50,
          y: 25,
          w: 42,
          h: 48,
        });
        presentation = updateSlide(presentation, i, (s) => ({
          ...s,
          layout: "chart",
          chartHint: hint,
          objects: [...(s.objects ?? []), materialised],
        }));
        objectId = materialised.id;
        slide = presentation.slides[i];
      }

      if (!objectId) throw new Error("No object selected to move");
      const obj = slide.objects?.find((o) => o.id === objectId);
      if (!obj) throw new Error("Object not found");

      let x = obj.x;
      let y = obj.y;
      if (str(params.anchor)) {
        const pos = anchorToXY(str(params.anchor));
        if (pos) {
          x = pos.x;
          y = pos.y;
        }
      }
      if (typeof params.x === "number") x = params.x;
      if (typeof params.y === "number") y = params.y;
      if (typeof params.dx === "number") x = clamp(x + params.dx, 0, 95);
      if (typeof params.dy === "number") y = clamp(y + params.dy, 0, 95);

      // Directional words without dx
      if (params.direction === "left") x = clamp(x - 12, 0, 95);
      if (params.direction === "right") x = clamp(x + 12, 0, 95);
      if (params.direction === "up") y = clamp(y - 12, 0, 95);
      if (params.direction === "down") y = clamp(y + 12, 0, 95);

      presentation = updateSlide(presentation, i, (s) =>
        patchObject(s, objectId!, { x, y })
      );
      const next = presentation.slides[i].objects?.find((o) => o.id === objectId) ?? null;
      return {
        presentation,
        selectedSlideId: slide.id,
        selection: selectionFor(slide.id, next, "move_object"),
        detail: `Moved object to (${Math.round(x)}, ${Math.round(y)})`,
      };
    },
  });

  registerEditorAction({
    name: "resize_object",
    description: "Resize the selected object. Use scale, or w/h, or bigger/smaller.",
    params: [
      { name: "scale", type: "number", description: "Multiply size (e.g. 1.25)" },
      { name: "w", type: "number", description: "Width %" },
      { name: "h", type: "number", description: "Height %" },
      { name: "bigger", type: "boolean", description: "Make larger" },
      { name: "smaller", type: "boolean", description: "Make smaller" },
    ],
    examples: ["Make it bigger", "Make it larger", "Resize to 50% width"],
    execute: (params, ctx) => {
      const i = resolveSlideIndex(params, ctx);
      const slide = ctx.presentation.slides[i];
      const objectId = resolveObjectId(params, ctx, slide);
      if (!objectId) throw new Error("No object selected to resize");
      const obj = slide.objects?.find((o) => o.id === objectId);
      if (!obj) throw new Error("Object not found");

      let scale = num(params.scale, 1);
      if (params.bigger === true || params.size === "bigger" || params.size === "larger")
        scale = 1.35;
      if (params.smaller === true || params.size === "smaller") scale = 0.75;

      const w = typeof params.w === "number" ? params.w : clamp(obj.w * scale, 5, 100);
      const h = typeof params.h === "number" ? params.h : clamp(obj.h * scale, 5, 100);
      let fontSize = obj.fontSize;
      if (obj.type === "textbox" && fontSize) {
        fontSize = Math.round(clamp(fontSize * scale, 10, 96));
      }

      const presentation = updateSlide(clonePresentation(ctx.presentation), i, (s) =>
        patchObject(s, objectId, { w, h, fontSize })
      );
      const next = presentation.slides[i].objects?.find((o) => o.id === objectId) ?? null;
      return {
        presentation,
        selectedSlideId: slide.id,
        selection: selectionFor(slide.id, next, "resize_object"),
        detail: `Resized object (${Math.round(w)}×${Math.round(h)})`,
      };
    },
  });

  registerEditorAction({
    name: "set_text",
    description: "Set text on the selected textbox or on slide title/body.",
    params: [
      { name: "text", type: "string", required: true, description: "New text" },
      {
        name: "target",
        type: "enum",
        enumValues: ["object", "title", "subtitle", "body"],
        description: "Where to write",
      },
      { name: "slide", type: "number", description: "1-based slide" },
    ],
    examples: ["Set the text to Q3 Results", "Change title to Welcome"],
    execute: (params, ctx) => {
      const text = str(params.text);
      if (!text) throw new Error("Missing text");
      const i = resolveSlideIndex(params, ctx);
      const slide = ctx.presentation.slides[i];
      const target = str(params.target, "object");

      if (target === "title" || target === "subtitle" || target === "body") {
        const presentation = updateSlide(clonePresentation(ctx.presentation), i, (s) => ({
          ...s,
          [target]: text,
        }));
        return {
          presentation,
          selectedSlideId: slide.id,
          selection: selectionFor(slide.id, null, "set_text"),
          detail: `Set ${target} on slide ${i + 1}`,
        };
      }

      const objectId = resolveObjectId(params, ctx, slide);
      if (!objectId) {
        // Fallback: create textbox
        const obj = makeObject("textbox", { text, fontSize: 24 });
        const presentation = updateSlide(clonePresentation(ctx.presentation), i, (s) => ({
          ...s,
          objects: [...(s.objects ?? []), obj],
        }));
        return {
          presentation,
          selectedSlideId: slide.id,
          selection: selectionFor(slide.id, obj, "set_text"),
          detail: "Created textbox with new text",
        };
      }
      const presentation = updateSlide(clonePresentation(ctx.presentation), i, (s) =>
        patchObject(s, objectId, { text })
      );
      const next = presentation.slides[i].objects?.find((o) => o.id === objectId) ?? null;
      return {
        presentation,
        selectedSlideId: slide.id,
        selection: selectionFor(slide.id, next, "set_text"),
        detail: "Updated textbox text",
      };
    },
  });

  registerEditorAction({
    name: "set_font_size",
    description: "Set font size on the selected textbox.",
    params: [
      { name: "fontSize", type: "number", required: true, description: "Size in px" },
    ],
    examples: ["Make the font 32", "Set font size to 28"],
    execute: (params, ctx) => {
      const fontSize = num(params.fontSize, 0);
      if (!fontSize) throw new Error("Missing fontSize");
      const i = resolveSlideIndex(params, ctx);
      const slide = ctx.presentation.slides[i];
      const objectId = resolveObjectId(
        { ...params, type: "textbox" },
        ctx,
        slide
      );
      if (!objectId) throw new Error("No textbox selected");
      const presentation = updateSlide(clonePresentation(ctx.presentation), i, (s) =>
        patchObject(s, objectId, { fontSize: clamp(fontSize, 10, 96) })
      );
      const next = presentation.slides[i].objects?.find((o) => o.id === objectId) ?? null;
      return {
        presentation,
        selectedSlideId: slide.id,
        selection: selectionFor(slide.id, next, "set_font_size"),
        detail: `Font size set to ${fontSize}`,
      };
    },
  });

  registerEditorAction({
    name: "adjust_textbox",
    description:
      "Minimize or adjust a textbox: size, font, width/height. Prefers the selected textbox, else the latest textbox on the slide.",
    params: [
      {
        name: "mode",
        type: "enum",
        enumValues: [
          "minimize",
          "expand",
          "bigger",
          "smaller",
          "wider",
          "narrower",
          "taller",
          "shorter",
        ],
        description: "Preset adjustment",
      },
      { name: "fontSize", type: "number", description: "Absolute font size px" },
      { name: "w", type: "number", description: "Width %" },
      { name: "h", type: "number", description: "Height %" },
      { name: "scale", type: "number", description: "Scale factor for box + font" },
      { name: "slide", type: "number", description: "1-based slide number" },
    ],
    examples: [
      "Minimize the textbox",
      "Make the textbox smaller",
      "Adjust the textbox — font 18",
      "Make the text box wider",
      "Minimize it",
    ],
    execute: (params, ctx) => {
      const i = resolveSlideIndex(params, ctx);
      const slide = ctx.presentation.slides[i];
      const objectId = resolveObjectId(
        { ...params, type: "textbox" },
        ctx,
        slide
      );
      if (!objectId) throw new Error("No textbox to adjust — add one first");
      const obj = slide.objects?.find((o) => o.id === objectId);
      if (!obj || obj.type !== "textbox") {
        throw new Error("Selected object is not a textbox");
      }

      const mode = str(params.mode);
      let w = obj.w;
      let h = obj.h;
      let fontSize = obj.fontSize ?? 24;
      let detail = "Adjusted textbox";

      if (mode === "minimize") {
        w = clamp(obj.w * 0.55, 12, 100);
        h = clamp(obj.h * 0.55, 8, 100);
        fontSize = Math.round(clamp(fontSize * 0.7, 12, 96));
        detail = "Minimized textbox";
      } else if (mode === "expand") {
        w = clamp(obj.w * 1.4, 12, 95);
        h = clamp(obj.h * 1.35, 8, 90);
        fontSize = Math.round(clamp(fontSize * 1.2, 12, 96));
        detail = "Expanded textbox";
      } else if (mode === "bigger") {
        w = clamp(obj.w * 1.25, 12, 95);
        h = clamp(obj.h * 1.25, 8, 90);
        fontSize = Math.round(clamp(fontSize * 1.2, 12, 96));
        detail = "Made textbox bigger";
      } else if (mode === "smaller") {
        w = clamp(obj.w * 0.8, 12, 100);
        h = clamp(obj.h * 0.8, 8, 100);
        fontSize = Math.round(clamp(fontSize * 0.85, 12, 96));
        detail = "Made textbox smaller";
      } else if (mode === "wider") {
        w = clamp(obj.w * 1.3, 12, 95);
        detail = "Made textbox wider";
      } else if (mode === "narrower") {
        w = clamp(obj.w * 0.7, 12, 100);
        detail = "Made textbox narrower";
      } else if (mode === "taller") {
        h = clamp(obj.h * 1.35, 8, 90);
        detail = "Made textbox taller";
      } else if (mode === "shorter") {
        h = clamp(obj.h * 0.7, 8, 100);
        detail = "Made textbox shorter";
      }

      if (typeof params.scale === "number") {
        const scale = params.scale;
        w = clamp(obj.w * scale, 12, 95);
        h = clamp(obj.h * scale, 8, 90);
        fontSize = Math.round(clamp((obj.fontSize ?? 24) * scale, 12, 96));
        detail = `Scaled textbox ×${scale}`;
      }
      if (typeof params.w === "number") w = clamp(params.w, 8, 100);
      if (typeof params.h === "number") h = clamp(params.h, 6, 100);
      if (typeof params.fontSize === "number") {
        fontSize = clamp(params.fontSize, 10, 96);
        detail = `Set textbox font to ${fontSize}`;
      }

      // Keep on-slide
      w = clamp(w, 8, 100 - obj.x);
      h = clamp(h, 6, 100 - obj.y);

      const presentation = updateSlide(clonePresentation(ctx.presentation), i, (s) =>
        patchObject(s, objectId, { w, h, fontSize })
      );
      const next = presentation.slides[i].objects?.find((o) => o.id === objectId) ?? null;
      return {
        presentation,
        selectedSlideId: slide.id,
        selection: selectionFor(slide.id, next, "adjust_textbox"),
        detail: `${detail} (${Math.round(w)}×${Math.round(h)}, ${fontSize}px)`,
      };
    },
  });

  registerEditorAction({
    name: "change_theme",
    description: "Change the slides theme / brand colors.",
    params: [
      {
        name: "themeId",
        type: "enum",
        required: true,
        enumValues: [
          "apple",
          "microsoft",
          "google",
          "minimal",
          "startup",
          "corporate",
          "education",
          "luxury",
          "dark",
          "gradient",
          "instagram",
        ],
        description: "Theme id",
      },
    ],
    examples: ["Use my company colors", "Switch to dark mode", "Use Apple style"],
    execute: (params, ctx) => {
      const themeId = str(params.themeId, "minimal") as ThemeId;
      const presentation = {
        ...clonePresentation(ctx.presentation),
        themeId,
        format:
          themeId === "instagram"
            ? ("instagram" as const)
            : ctx.presentation.format === "instagram"
              ? ("widescreen" as const)
              : ctx.presentation.format,
        updatedAt: new Date().toISOString(),
      };
      const personality =
        themeId === "apple" || themeId === "minimal"
          ? "minimal"
          : themeId === "dark"
            ? "bold"
            : themeId === "startup" || themeId === "instagram"
              ? "playful"
              : "professional";
      return {
        presentation,
        selectedSlideId: ctx.selectedSlideId,
        selection: {
          ...ctx.selection,
          lastAction: "change_theme",
        },
        detail: `Theme → ${themeId}`,
        themePersonality: personality,
        themeId,
      };
    },
  });

  registerEditorAction({
    name: "select_object",
    description: "Select an object by type or id for follow-up commands.",
    params: [
      { name: "type", type: "string", description: "textbox|image|icon|chart|shape" },
      { name: "objectId", type: "string", description: "Object id" },
      { name: "slide", type: "number", description: "1-based slide" },
    ],
    examples: ["Select the chart", "Select the textbox"],
    execute: (params, ctx) => {
      const i = resolveSlideIndex(params, ctx);
      const slide = ctx.presentation.slides[i];
      const objectId = resolveObjectId(params, ctx, slide);
      if (!objectId) throw new Error("Nothing to select");
      const obj = slide.objects?.find((o) => o.id === objectId);
      if (!obj) throw new Error("Object not found");
      return {
        presentation: ctx.presentation,
        selectedSlideId: slide.id,
        selection: selectionFor(slide.id, obj, "select_object"),
        detail: `Selected ${obj.type}`,
      };
    },
  });

  registerEditorAction({
    name: "replace_icons_style",
    description: "Replace every icon’s style across the slides (filled ↔ outlined).",
    params: [
      {
        name: "iconStyle",
        type: "enum",
        required: true,
        enumValues: ["filled", "outlined"],
        description: "Target icon style",
      },
    ],
    examples: ["Replace every icon with outlined icons"],
    execute: (params, ctx) => {
      const iconStyle =
        str(params.iconStyle) === "filled" ? "filled" : "outlined";
      const presentation = clonePresentation(ctx.presentation);
      let count = 0;
      presentation.slides = presentation.slides.map((s) => ({
        ...s,
        objects: (s.objects ?? []).map((o) => {
          if (o.type !== "icon") return o;
          count += 1;
          return { ...o, iconStyle };
        }),
      }));
      // Also tag notes for layout icons
      presentation.slides = presentation.slides.map((s) => ({
        ...s,
        notes: `${s.notes || ""} Icons: ${iconStyle}.`.trim(),
      }));
      presentation.updatedAt = new Date().toISOString();
      return {
        presentation,
        selectedSlideId: ctx.selectedSlideId,
        selection: { ...ctx.selection, lastAction: "replace_icons_style" },
        detail: `Set ${count} icon(s) to ${iconStyle}`,
      };
    },
  });

  registerEditorAction({
    name: "set_slide_field",
    description: "Patch a slide layout field (title, body, chartHint, imageHint, notes).",
    params: [
      { name: "slide", type: "number", description: "1-based slide" },
      { name: "field", type: "string", required: true, description: "Field name" },
      { name: "value", type: "string", required: true, description: "New value" },
    ],
    examples: ["Set chart hint to bar chart", "Update notes on this slide"],
    execute: (params, ctx) => {
      const field = str(params.field);
      const value = str(params.value);
      const allowed = [
        "title",
        "subtitle",
        "body",
        "callout",
        "notes",
        "imageHint",
        "chartHint",
      ];
      if (!allowed.includes(field)) throw new Error(`Unsupported field ${field}`);
      const i = resolveSlideIndex(params, ctx);
      const slide = ctx.presentation.slides[i];
      const presentation = updateSlide(clonePresentation(ctx.presentation), i, (s) => ({
        ...s,
        [field]: value,
      }));
      return {
        presentation,
        selectedSlideId: slide.id,
        selection: selectionFor(slide.id, null, "set_slide_field"),
        detail: `Set ${field} on slide ${i + 1}`,
      };
    },
  });

  registerEditorAction({
    name: "create_chart",
    description: "Create a chart object / chart slide content.",
    params: [
      { name: "slide", type: "number", description: "1-based slide" },
      { name: "chartHint", type: "string", description: "Chart description" },
      { name: "anchor", type: "string", description: "Position" },
    ],
    examples: ["Add a revenue chart", "Create a bar chart on the last slide"],
    execute: (params, ctx) => {
      const i = resolveSlideIndex(params, ctx);
      const slide = ctx.presentation.slides[i];
      const pos = str(params.anchor) ? anchorToXY(str(params.anchor)) : null;
      const obj = makeObject("chart", {
        chartHint: str(params.chartHint, "Bar chart · key metrics"),
        x: num(params.x, pos?.x ?? 50),
        y: num(params.y, pos?.y ?? 25),
        w: 42,
        h: 48,
      });
      const presentation = updateSlide(clonePresentation(ctx.presentation), i, (s) => ({
        ...s,
        layout: "chart",
        chartHint: obj.chartHint,
        objects: [...(s.objects ?? []), obj],
      }));
      return {
        presentation,
        selectedSlideId: slide.id,
        selection: selectionFor(slide.id, obj, "create_chart"),
        detail: `Created chart on slide ${i + 1}`,
      };
    },
  });

  registerEditorAction({
    name: "replace_text_with_bullets",
    description: "Convert dense body copy into short bullets on a slide.",
    params: [
      { name: "slide", type: "number", description: "1-based slide number" },
    ],
    examples: ["Replace text with bullets on slide 4"],
    execute: (params, ctx) => {
      const i = resolveSlideIndex(params, ctx);
      const slide = ctx.presentation.slides[i];
      const fromBody = (slide.body || "")
        .split(/[.!?]\s+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 4);
      const bullets =
        fromBody.length >= 2
          ? fromBody
          : (slide.bullets ?? []).slice(0, 3).map((b) =>
              b.length > 72 ? `${b.slice(0, 69)}…` : b
            );
      const nextBullets =
        bullets.length >= 2
          ? bullets
          : [
              "One clear idea",
              "Supporting proof point",
              "What we want them to remember",
            ];
      const presentation = updateSlide(clonePresentation(ctx.presentation), i, (s) => ({
        ...s,
        layout: "bullets",
        body: undefined,
        bullets: nextBullets,
        callout: undefined,
      }));
      return {
        presentation,
        selectedSlideId: slide.id,
        selection: selectionFor(slide.id, null, "replace_text_with_bullets"),
        detail: `Replaced dense text with bullets on slide ${i + 1}`,
      };
    },
  });

  registerEditorAction({
    name: "insert_image",
    description:
      "Insert an image on a slide from a search query / hint (optional src).",
    params: [
      { name: "slide", type: "number", description: "1-based slide" },
      { name: "query", type: "string", description: "Image search query" },
      { name: "imageHint", type: "string", description: "Visual hint" },
      { name: "src", type: "string", description: "Image URL or data URL" },
      { name: "anchor", type: "string", description: "Position anchor" },
      { name: "x", type: "number", description: "Left %" },
      { name: "y", type: "number", description: "Top %" },
      { name: "w", type: "number", description: "Width %" },
      { name: "h", type: "number", description: "Height %" },
    ],
    examples: ["Insert image business growth illustration"],
    execute: (params, ctx) => {
      const i = resolveSlideIndex(params, ctx);
      const slide = ctx.presentation.slides[i];
      const hint = str(
        params.imageHint || params.query,
        "Product / context photo · soft daylight"
      );
      const pos = str(params.anchor) ? anchorToXY(str(params.anchor)) : null;
      const src =
        str(params.src) ||
        resolveImageSrcFromHint(str(params.query) || hint) ||
        undefined;
      const obj = makeObject("image", {
        imageHint: hint,
        ...(src ? { src } : {}),
        x: num(params.x, pos?.x ?? 55),
        y: num(params.y, pos?.y ?? 18),
        w: num(params.w, 38),
        h: num(params.h, 55),
      });
      const presentation = updateSlide(clonePresentation(ctx.presentation), i, (s) => ({
        ...s,
        imageHint: hint,
        objects: [...(s.objects ?? []), obj],
      }));
      return {
        presentation,
        selectedSlideId: slide.id,
        selection: selectionFor(slide.id, obj, "insert_image"),
        detail: src
          ? `Inserted image on slide ${i + 1}`
          : `Inserted image placeholder on slide ${i + 1}`,
      };
    },
  });

  registerEditorAction({
    name: "redesign_for_instagram",
    description:
      "Restyle the open slides as an Instagram carousel — square frames, short captions, bold type.",
    params: [],
    examples: [
      "Redesign this for Instagram",
      "Make this suitable as an Instagram post",
      "Turn this into an Instagram carousel",
    ],
    execute: (_params, ctx) => {
      const presentation = redesignForInstagram(clonePresentation(ctx.presentation));
      return {
        presentation,
        selectedSlideId: presentation.slides[0]?.id ?? ctx.selectedSlideId,
        selection: {
          ...ctx.selection,
          objectId: null,
          lastAction: "redesign_for_instagram",
        },
        detail: `Instagram carousel · ${presentation.slides.length} frames`,
        themePersonality: "playful",
      };
    },
  });

  registerEditorAction({
    name: "improve_layout",
    description: "Apply a cleaner layout style (e.g. apple) and trim density.",
    params: [
      {
        name: "style",
        type: "enum",
        enumValues: ["apple", "minimal", "corporate", "instagram"],
        description: "Layout style",
      },
      { name: "slide", type: "number", description: "Optional focus slide" },
    ],
    examples: ["Improve layout apple style"],
    execute: (params, ctx) => {
      const style = str(params.style, "apple");
      if (style === "instagram") {
        const presentation = redesignForInstagram(
          clonePresentation(ctx.presentation)
        );
        return {
          presentation,
          selectedSlideId: presentation.slides[0]?.id ?? ctx.selectedSlideId,
          selection: { ...ctx.selection, lastAction: "improve_layout" },
          detail: `Improved layout → instagram`,
          themePersonality: "playful",
        };
      }
      const themeId =
        style === "corporate"
          ? "corporate"
          : style === "minimal"
            ? "minimal"
            : "apple";
      let presentation = {
        ...clonePresentation(ctx.presentation),
        themeId: themeId as ThemeId,
        updatedAt: new Date().toISOString(),
      };
      if (typeof params.slide === "number") {
        const i = resolveSlideIndex(params, ctx);
        presentation = updateSlide(presentation, i, (s) => ({
          ...s,
          bullets: s.bullets?.slice(0, 4),
          body:
            s.body && s.body.length > 120
              ? `${s.body.slice(0, 117)}…`
              : s.body,
        }));
      }
      return {
        presentation,
        selectedSlideId: ctx.selectedSlideId,
        selection: { ...ctx.selection, lastAction: "improve_layout" },
        detail: `Improved layout → ${themeId}`,
        themePersonality: themeId === "apple" ? "minimal" : "professional",
      };
    },
  });

  registerEditorAction({
    name: "rewrite_conclusion",
    description: "Rewrite the closing slide with a clearer ask / next step.",
    params: [{ name: "slide", type: "number", description: "1-based slide" }],
    examples: ["Rewrite the conclusion"],
    execute: (params, ctx) => {
      const i = resolveSlideIndex(params, ctx);
      const slide = ctx.presentation.slides[i];
      const presentation = updateSlide(clonePresentation(ctx.presentation), i, (s) => ({
        ...s,
        layout: s.layout === "thankyou" ? "thankyou" : "section",
        title: /ask|join|invest|next/i.test(s.title) ? s.title : "What happens next",
        subtitle: "One clear ask. One next step. One reason to believe.",
        body: "Leave them with a decision, not a summary.",
        bullets: [
          "The ask — specific and time-bound",
          "Why now — the cost of waiting",
          "How to follow up — one channel",
        ],
        callout: "Make the close impossible to miss.",
      }));
      return {
        presentation,
        selectedSlideId: slide.id,
        selection: selectionFor(slide.id, null, "rewrite_conclusion"),
        detail: `Rewrote conclusion on slide ${i + 1}`,
      };
    },
  });
}
