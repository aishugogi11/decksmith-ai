"use client";

import {
  GraduationCap,
  LayoutTemplate,
  MessageSquareWarning,
  Search,
  Upload,
} from "lucide-react";
import { useImportStore } from "@/features/import/store";
import { useSubscriptionStore } from "@/features/subscription";
import { usePresentationStore } from "@/store/presentation-store";
import { cn } from "@/lib/utils";

/**
 * Studio home — primary workflows first; templates demoted.
 */
export function WorkflowChooser({ compact }: { compact?: boolean }) {
  const setLibraryTab = usePresentationStore((s) => s.setLibraryTab);
  const setPanelTab = usePresentationStore((s) => s.setPanelTab);
  const setTemplatesOpen = usePresentationStore((s) => s.setTemplatesOpen);
  const presentation = usePresentationStore((s) => s.presentation);
  const openImport = useImportStore((s) => s.openModal);
  const hasFeature = useSubscriptionStore((s) => s.hasFeature);
  const openUpgrade = useSubscriptionStore((s) => s.openUpgrade);

  const hasRealDeck = Boolean(
    presentation.importMeta ||
      (presentation.slides.length > 1 &&
        presentation.title !== "Untitled deck") ||
      presentation.slides.some((s) => (s.objects?.length ?? 0) > 0)
  );

  const actions = [
    {
      id: "import",
      label: "Bring existing deck",
      hint: "Upload PPTX or PDF — then transform it",
      icon: Upload,
      primary: true,
      onClick: () => openImport(),
    },
    {
      id: "research",
      label: "Research a topic",
      hint: "Sources → stats → citations → outline",
      icon: Search,
      primary: true,
      onClick: () => {
        if (!hasFeature("research_mode")) {
          openUpgrade("Research Mode is a Pro feature.");
          return;
        }
        setLibraryTab("research");
      },
    },
    {
      id: "redesign",
      label: "Redesign from feedback",
      hint: hasRealDeck
        ? "Paste professor, client, or investor comments"
        : "Import a deck first, then paste feedback",
      icon: MessageSquareWarning,
      primary: true,
      onClick: () => {
        if (!hasRealDeck) {
          openImport();
          return;
        }
        if (!hasFeature("feedback_redesign")) {
          openUpgrade("Feedback → Redesign is a Pro feature.");
          return;
        }
        setTemplatesOpen(false);
        setPanelTab("feedback");
      },
    },
    {
      id: "coach",
      label: "Presentation Coach",
      hint: hasRealDeck
        ? "Check delivery readiness on this deck"
        : "Import or research a deck first",
      icon: GraduationCap,
      primary: false,
      onClick: () => {
        if (!hasRealDeck) {
          openImport();
          return;
        }
        if (!hasFeature("presentation_coach")) {
          openUpgrade("Presentation Coach is a Pro feature.");
          return;
        }
        setTemplatesOpen(false);
        setPanelTab("coach");
      },
    },
    {
      id: "templates",
      label: "Start from a template",
      hint: "Optional shell — not the main path",
      icon: LayoutTemplate,
      primary: false,
      secondary: true,
      onClick: () => setLibraryTab("templates"),
    },
  ] as const;

  return (
    <section className={cn("space-y-3", compact && "space-y-2")}>
      <div>
        <p className="text-sm font-semibold text-zinc-950">
          What do you want to do?
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">
          Transform existing work — or research something new
        </p>
      </div>
      <div className="space-y-2">
        {actions.map(
          ({ id, label, hint, icon: Icon, primary, onClick, ...rest }) => {
            const secondary = "secondary" in rest && rest.secondary;
            return (
              <button
                key={id}
                type="button"
                onClick={onClick}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition",
                  primary && !secondary
                    ? "border-zinc-200 bg-white hover:border-zinc-900 hover:bg-zinc-50"
                    : secondary
                      ? "border-transparent bg-zinc-50/80 hover:border-zinc-200 hover:bg-zinc-50"
                      : "border-zinc-200 bg-white hover:border-zinc-400"
                )}
              >
                <Icon
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    secondary ? "text-zinc-400" : "text-zinc-800"
                  )}
                />
                <span>
                  <span
                    className={cn(
                      "block text-sm font-semibold",
                      secondary ? "text-zinc-600" : "text-zinc-950"
                    )}
                  >
                    {label}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">
                    {hint}
                  </span>
                </span>
              </button>
            );
          }
        )}
      </div>
    </section>
  );
}
