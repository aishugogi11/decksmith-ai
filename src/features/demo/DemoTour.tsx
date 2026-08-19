"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  MessageSquareWarning,
  Mic,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyzeImportedPresentation } from "@/features/import/analysis/analyze-import";
import { useImportStore } from "@/features/import/store";
import { useFeedbackStore } from "@/features/feedback/store";
import { useSubscriptionStore } from "@/features/subscription/store";
import {
  createImportedPitchDemo,
  DEMO_FEEDBACK,
  DEMO_VOICE_EXAMPLES,
} from "@/lib/demo/sample-deck";
import { usePresentationStore } from "@/store/presentation-store";
import { cn } from "@/lib/utils";

type StepId = "welcome" | "import" | "redesign" | "voice" | "done";

const STEPS: {
  id: StepId;
  title: string;
  body: string;
  icon: typeof Upload;
}[] = [
  {
    id: "welcome",
    title: "EchoFlow in 60 seconds",
    body: "Most tools generate new slides. We’ll transform ones you already have — Import → Redesign → Voice.",
    icon: Sparkles,
  },
  {
    id: "import",
    title: "1 · Bring existing work",
    body: "We’ve loaded a realistic Series A pitch as if you uploaded NovaCare_SeriesA_v3.pptx — editable objects, not a screenshot.",
    icon: Upload,
  },
  {
    id: "redesign",
    title: "2 · Redesign from feedback",
    body: "Investor comments are prefilled. Analyze to preview deterministic editor actions — then Apply one or all.",
    icon: MessageSquareWarning,
  },
  {
    id: "voice",
    title: "3 · Voice refinement",
    body: "Same command pipeline as the toolbar. Try “Create a textbox” or “Make this look like an Apple Keynote.”",
    icon: Mic,
  },
  {
    id: "done",
    title: "You’re in the editor",
    body: "Explore Research for stats, keep Redesigning, or speak edits. Templates stay available — they’re just not the product.",
    icon: Sparkles,
  },
];

/**
 * High-quality product demo overlay for /app?demo=1
 */
export function DemoTour({ active }: { active: boolean }) {
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [booted, setBooted] = useState(false);

  const loadImportedPresentation = usePresentationStore(
    (s) => s.loadImportedPresentation
  );
  const setPanelTab = usePresentationStore((s) => s.setPanelTab);
  const sendMessage = usePresentationStore((s) => s.sendMessage);
  const setPlan = useSubscriptionStore((s) => s.setPlan);
  const setFeedbackInput = useFeedbackStore((s) => s.setInput);
  const setSourceKind = useFeedbackStore((s) => s.setSourceKind);
  const analyzeFeedback = useFeedbackStore((s) => s.analyze);

  useEffect(() => {
    if (!active || booted) return;
    setBooted(true);
    setPlan("pro");

    const deck = createImportedPitchDemo();
    const analysis = analyzeImportedPresentation(deck);
    useImportStore.setState({
      status: "ready",
      fileName: deck.importMeta?.sourceFileName ?? "demo.pptx",
      format: "pptx",
      result: {
        presentation: deck,
        meta: deck.importMeta!,
        providerId: "pptx",
      },
      analysis,
      error: null,
      progressMessage: "Demo slides ready",
      modalOpen: false,
    });

    loadImportedPresentation(deck, {
      sourceLabel: "NovaCare_SeriesA_v3.pptx",
      openAnalysis: true,
    });
    setPanelTab("import");
  }, [active, booted, loadImportedPresentation, setPanelTab, setPlan]);

  if (!active || dismissed) return null;

  const current = STEPS[step]!;
  const Icon = current.icon;
  const isLast = step >= STEPS.length - 1;

  async function goNext() {
    if (isLast) {
      setDismissed(true);
      setPanelTab("chat");
      return;
    }

    const next = step + 1;
    const nextId = STEPS[next]!.id;

    if (nextId === "import") {
      setPanelTab("import");
    }
    if (nextId === "redesign") {
      setSourceKind(DEMO_FEEDBACK.source);
      setFeedbackInput(DEMO_FEEDBACK.text);
      setPanelTab("feedback");
      const presentation = usePresentationStore.getState().presentation;
      void analyzeFeedback(presentation);
    }
    if (nextId === "voice") {
      setPanelTab("chat");
    }
    if (nextId === "done") {
      setPanelTab("import");
    }

    setStep(next);
  }

  function skip() {
    setDismissed(true);
    setPanelTab("import");
  }

  async function tryVoiceSample() {
    setPanelTab("chat");
    await sendMessage(DEMO_VOICE_EXAMPLES[1]!);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[85] flex justify-center p-4 sm:bottom-6 sm:justify-end sm:p-6"
      >
        <div className="pointer-events-auto w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-[0_28px_80px_rgba(0,0,0,0.22)]">
          <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-zinc-950 text-white">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                  Live demo · {step + 1}/{STEPS.length}
                </p>
                <p className="text-sm font-bold text-zinc-950">{current.title}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={skip}
              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              aria-label="Close demo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 px-4 py-3">
            <p className="text-sm leading-relaxed text-zinc-600">
              {current.body}
            </p>

            {current.id === "redesign" && (
              <div className="rounded-xl bg-zinc-50 px-3 py-2 text-[11px] leading-snug text-zinc-600">
                Prefill: “{DEMO_FEEDBACK.text.split("\n")[0]}…”
              </div>
            )}

            {current.id === "voice" && (
              <div className="flex flex-wrap gap-1.5">
                {DEMO_VOICE_EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => void sendMessage(ex)}
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[10px] font-medium text-zinc-700 hover:border-zinc-400"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-1.5 pt-1">
              {STEPS.map((s, i) => (
                <div
                  key={s.id}
                  className={cn(
                    "h-1 flex-1 rounded-full",
                    i <= step ? "bg-zinc-950" : "bg-zinc-200"
                  )}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {step > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                >
                  Back
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                className="flex-1"
                onClick={() => void goNext()}
              >
                {isLast ? "Start exploring" : "Next"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            {current.id === "voice" && (
              <button
                type="button"
                onClick={() => void tryVoiceSample()}
                className="w-full text-center text-[11px] font-medium text-zinc-500 hover:text-zinc-800"
              >
                Run sample: create a textbox now
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
