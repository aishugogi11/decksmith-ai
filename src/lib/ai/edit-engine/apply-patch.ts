import type { Presentation, Slide } from "@/lib/types";
import type { EditPatch } from "@/lib/ai/edit-engine/types";

/** Apply a partial edit patch — only touched slides / fields change. */
export function applyEditPatch(
  presentation: Presentation,
  patch: EditPatch
): { presentation: Presentation; changedSlideIds: string[] } {
  const changed = new Set<string>();
  let slides = presentation.slides.map((s) => ({ ...s }));

  if (patch.replaceSlides?.length) {
    for (const { id, slide } of patch.replaceSlides) {
      const i = slides.findIndex((s) => s.id === id);
      if (i >= 0) {
        slides[i] = slide;
        changed.add(id);
      }
    }
  }

  for (const { id, patch: sp } of patch.slidePatches) {
    const i = slides.findIndex((s) => s.id === id);
    if (i < 0) continue;
    slides[i] = { ...slides[i], ...sp };
    changed.add(id);
  }

  if (patch.insertAfter?.length) {
    for (const { afterId, slides: incoming } of patch.insertAfter) {
      const insertAt =
        afterId == null
          ? slides.length
          : slides.findIndex((s) => s.id === afterId) + 1;
      if (insertAt <= 0 && afterId != null) continue;
      slides.splice(Math.max(0, insertAt), 0, ...incoming.map((s) => ({ ...s })));
      incoming.forEach((s) => changed.add(s.id));
    }
  }

  if (patch.removeSlideIds?.length) {
    const remove = new Set(patch.removeSlideIds);
    if (slides.length - remove.size >= 1) {
      slides = slides.filter((s) => {
        if (remove.has(s.id)) {
          changed.add(s.id);
          return false;
        }
        return true;
      });
    }
  }

  if (patch.reorder?.length) {
    const byId = new Map(slides.map((s) => [s.id, s]));
    const next: Slide[] = [];
    for (const id of patch.reorder) {
      const s = byId.get(id);
      if (s) {
        next.push(s);
        byId.delete(id);
      }
    }
    for (const s of byId.values()) next.push(s);
    if (next.length === slides.length) {
      const orderChanged = next.some((s, i) => s.id !== slides[i]?.id);
      slides = next;
      if (orderChanged) slides.forEach((s) => changed.add(s.id));
    }
  }

  const nextPresentation: Presentation = {
    ...presentation,
    themeId: patch.themeId ?? presentation.themeId,
    title: patch.title ?? presentation.title,
    subtitle: patch.subtitle ?? presentation.subtitle,
    slides,
    updatedAt: new Date().toISOString(),
  };

  return { presentation: nextPresentation, changedSlideIds: [...changed] };
}

export function emptyPatch(): EditPatch {
  return { slidePatches: [] };
}

export function mergePatches(...patches: EditPatch[]): EditPatch {
  const out = emptyPatch();
  const replaceMap = new Map<string, Slide>();
  const patchMap = new Map<string, Partial<Slide>>();

  for (const p of patches) {
    if (p.themeId) out.themeId = p.themeId;
    if (p.title) out.title = p.title;
    if (p.subtitle) out.subtitle = p.subtitle;
    if (p.reorder) out.reorder = p.reorder;
    if (p.removeSlideIds) {
      out.removeSlideIds = [...(out.removeSlideIds ?? []), ...p.removeSlideIds];
    }
    if (p.insertAfter) {
      out.insertAfter = [...(out.insertAfter ?? []), ...p.insertAfter];
    }
    for (const r of p.replaceSlides ?? []) replaceMap.set(r.id, r.slide);
    for (const sp of p.slidePatches) {
      patchMap.set(sp.id, { ...(patchMap.get(sp.id) ?? {}), ...sp.patch });
    }
  }

  out.replaceSlides = [...replaceMap.entries()].map(([id, slide]) => ({ id, slide }));
  out.slidePatches = [...patchMap.entries()].map(([id, patch]) => ({ id, patch }));
  return out;
}
