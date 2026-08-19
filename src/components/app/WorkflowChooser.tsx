"use client";

import {
  LayoutTemplate,
  MessageSquareWarning,
  Search,
  Upload,
} from "lucide-react";
import { useImportStore } from "@/features/import/store";
import { useSubscriptionStore } from "@/features/subscription";
import { usePresentationStore } from "@/store/presentation-store";
import { cn } from "@/lib/utils";

const EXAMPLE_PREVIEWS = [
  {
    id: "tpl-seed-pitch",
    name: "Seed Pitch",
    preview: "linear-gradient(135deg,#0f766e,#164e63)",
  },
  {
    id: "tpl-series-a",
    name: "Series A",
    preview: "linear-gradient(135deg,#0f172a,#1d4ed8)",
  },
  {
    id: "tpl-university-lecture",
    name: "Lecture",
    preview: "linear-gradient(135deg,#7c2d12,#b45309)",
  },
  {
    id: "tpl-product-launch",
    name: "Launch",
    preview: "linear-gradient(135deg,#4c1d95,#7c3aed)",
  },
  {
    id: "tpl-case-study",
    name: "Case study",
    preview: "linear-gradient(135deg,#134e4a,#0f766e)",
  },
  {
    id: "tpl-portfolio",
    name: "Portfolio",
    preview: "linear-gradient(135deg,#1e293b,#64748b)",
  },
] as const;

/**
 * Studio home — primary workflows first; templates demoted.
 */
export function WorkflowChooser({ compact }: { compact?: boolean }) {
  const setLibraryTab = usePresentationStore((s) => s.setLibraryTab);
  const setPanelTab = usePresentationStore((s) => s.setPanelTab);
  const setTemplatesOpen = usePresentationStore((s) => s.setTemplatesOpen);
  const browseTemplateExamples = usePresentationStore(
    (s) => s.browseTemplateExamples
  );
  const loadTemplate = usePresentationStore((s) => s.loadTemplate);
  const presentation = usePresentationStore((s) => s.presentation);
  const openImport = useImportStore((s) => s.openModal);
  const hasFeature = useSubscriptionStore((s) => s.hasFeature);
  const openUpgrade = useSubscriptionStore((s) => s.openUpgrade);

  const hasRealDeck = Boolean(
    presentation.importMeta ||
      (presentation.slides.length > 1 &&
        presentation.title !== "Untitled slides") ||
      presentation.slides.some((s) => (s.objects?.length ?? 0) > 0)
  );

  const actions = [
    {
      id: "import",
      label: "Bring existing slides",
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
        : "Import slides first, then paste feedback",
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
      id: "templates",
      label: "Choose template slides",
      hint: "Pick from pitch, lecture, launch, portfolio sets",
      icon: LayoutTemplate,
      primary: true,
      onClick: () => void browseTemplateExamples(),
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

      <div className="rounded-2xl border border-zinc-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Template examples
          </p>
          <button
            type="button"
            onClick={() => void browseTemplateExamples()}
            className="text-[11px] font-semibold text-zinc-800 underline-offset-2 hover:underline"
          >
            See all
          </button>
        </div>
        <div className="-mx-0.5 flex gap-2 overflow-x-auto pb-0.5">
          {EXAMPLE_PREVIEWS.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => {
                void loadTemplate(ex.id).catch(() => {
                  void browseTemplateExamples();
                });
              }}
              className="group w-[4.75rem] shrink-0 text-left"
              title={`Use ${ex.name}`}
            >
              <span
                className="block aspect-[4/3] rounded-lg border border-zinc-200 shadow-sm transition group-hover:border-zinc-400 group-hover:ring-2 group-hover:ring-zinc-900/10"
                style={{ background: ex.preview }}
              />
              <span className="mt-1 block truncate text-[10px] font-medium text-zinc-600 group-hover:text-zinc-950">
                {ex.name}
              </span>
            </button>
          ))}
        </div>
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
