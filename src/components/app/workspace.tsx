"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import {
  Briefcase,
  Crown,
  FolderKanban,
  LayoutTemplate,
  MessageSquareWarning,
  Palette,
  Search,
  Type,
  Upload,
} from "lucide-react";
import { DesignLibrary } from "@/components/app/design-library";
import { RecommendedTemplatesPanel } from "@/components/app/recommended-templates-panel";
import { StudioCanvas } from "@/components/app/studio-canvas";
import { StudioPanel } from "@/components/app/studio-panel";
import { EditorDebugPanel } from "@/features/editor/EditorDebugPanel";
import { ImportModal } from "@/features/import";
import { useImportStore } from "@/features/import/store";
import {
  hydrateSubscription,
  ProLockIcon,
  UpgradeModal,
  useSubscriptionStore,
} from "@/features/subscription";
import {
  usePresentationStore,
  type LibraryTab,
} from "@/store/presentation-store";
import { cn } from "@/lib/utils";

type RailId =
  | "research"
  | "redesign"
  | "import"
  | "templates"
  | "themes"
  | "text"
  | "brand"
  | "projects";

const RAIL_PRIMARY: {
  id: RailId;
  label: string;
  icon: ComponentType<{ className?: string }>;
  pro?: boolean;
}[] = [
  { id: "research", label: "Research", icon: Search, pro: true },
  { id: "redesign", label: "Redesign", icon: MessageSquareWarning, pro: true },
  { id: "import", label: "Import", icon: Upload },
];

const RAIL_SECONDARY: {
  id: RailId;
  label: string;
  icon: ComponentType<{ className?: string }>;
  pro?: boolean;
}[] = [
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "themes", label: "Themes", icon: Palette },
  { id: "text", label: "Text", icon: Type },
  { id: "brand", label: "Brand", icon: Briefcase, pro: true },
  { id: "projects", label: "Projects", icon: FolderKanban },
];

/**
 * Studio shell — Research / Redesign / Import first; templates demoted.
 */
export function Workspace() {
  const rowRef = useRef<HTMLDivElement>(null);
  const [chatHeight, setChatHeight] = useState<number | null>(null);
  const [chatOffset, setChatOffset] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  const libraryTab = usePresentationStore((s) => s.libraryTab);
  const templatesOpen = usePresentationStore((s) => s.templatesOpen);
  const recommendationsOpen = usePresentationStore((s) => s.recommendationsOpen);
  const panelTab = usePresentationStore((s) => s.panelTab);
  const setLibraryTab = usePresentationStore((s) => s.setLibraryTab);
  const setPanelTab = usePresentationStore((s) => s.setPanelTab);
  const setTemplatesOpen = usePresentationStore((s) => s.setTemplatesOpen);
  const presentation = usePresentationStore((s) => s.presentation);
  const openImportModal = useImportStore((s) => s.openModal);
  const plan = useSubscriptionStore((s) => s.plan);
  const openUpgrade = useSubscriptionStore((s) => s.openUpgrade);
  const usage = useSubscriptionStore((s) => s.usage);
  const hasFeature = useSubscriptionStore((s) => s.hasFeature);

  useEffect(() => {
    hydrateSubscription();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      setChatHeight(null);
      setChatOffset(0);
      return;
    }

    let cancelled = false;
    let raf = 0;
    let observer: ResizeObserver | null = null;

    const update = () => {
      const presentationFrame = document.querySelector<HTMLElement>(
        "[data-presentation-frame='true']"
      );
      const row = rowRef.current;
      if (!presentationFrame || !row) return;

      const frameRect = presentationFrame.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      const nextHeight = Math.round(frameRect.height);
      const nextOffset = Math.max(0, Math.round(frameRect.top - rowRect.top));

      if (nextHeight > 0) setChatHeight(nextHeight);
      setChatOffset(nextOffset);
    };

    const attach = () => {
      if (cancelled) return;
      const presentationFrame = document.querySelector<HTMLElement>(
        "[data-presentation-frame='true']"
      );
      const row = rowRef.current;
      if (!presentationFrame || !row) {
        raf = window.requestAnimationFrame(attach);
        return;
      }
      update();
      observer = new ResizeObserver(update);
      observer.observe(presentationFrame);
      observer.observe(row);
    };

    attach();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      observer?.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [isDesktop]);

  function isActive(id: RailId): boolean {
    if (id === "redesign") return !templatesOpen && panelTab === "feedback";
    if (id === "import") return !templatesOpen && panelTab === "import";
    if (id === "research") return templatesOpen && libraryTab === "research";
    if (id === "templates")
      return (
        recommendationsOpen ||
        (templatesOpen && libraryTab === "templates")
      );
    return templatesOpen && libraryTab === (id as LibraryTab);
  }

  function onRailClick(id: RailId, pro?: boolean) {
    if (pro) {
      const flag =
        id === "research"
          ? "research_mode"
          : id === "redesign"
            ? "feedback_redesign"
            : id === "brand"
              ? "brand_kit"
              : null;
      if (flag && !hasFeature(flag)) {
        openUpgrade(
          id === "research"
            ? "Research Mode is a Pro feature."
            : id === "redesign"
              ? "Feedback → Redesign is a Pro feature."
              : "Brand Kit is a Pro feature."
        );
        return;
      }
    }

    if (id === "import") {
      openImportModal();
      return;
    }
    if (id === "redesign") {
      setTemplatesOpen(false);
      setPanelTab("feedback");
      return;
    }
    if (id === "templates") {
      void usePresentationStore.getState().browseTemplateExamples();
      return;
    }
    setLibraryTab(id as LibraryTab);
  }

  const contextLabel = presentation.importMeta
    ? "Imported slides · Feedback · Research"
    : "Feedback · Research · Voice";

  function renderRailItem(item: (typeof RAIL_PRIMARY)[number]) {
    const Icon = item.icon;
    const active = isActive(item.id);
    const locked =
      item.pro &&
      ((item.id === "research" && !hasFeature("research_mode")) ||
        (item.id === "redesign" && !hasFeature("feedback_redesign")) ||
        (item.id === "brand" && !hasFeature("brand_kit")));

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onRailClick(item.id, item.pro)}
        className={cn(
          "relative flex w-[56px] flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[9px] font-semibold tracking-wide transition sm:w-[64px] sm:text-[10px]",
          active
            ? "bg-zinc-950 text-white shadow-sm"
            : "text-zinc-600 hover:bg-white hover:text-zinc-950"
        )}
      >
        <Icon className="h-5 w-5" />
        {item.label}
        {locked && (
          <ProLockIcon className="absolute right-1 top-1 h-3 w-3 text-current opacity-70" />
        )}
      </button>
    );
  }

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden text-zinc-950">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl brightness-95 saturate-[0.85]"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1800&q=60)",
          }}
        />
        <div className="absolute inset-0 bg-zinc-200/55 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 flex h-full min-h-0 w-full flex-1">
        <nav className="z-30 flex h-full w-[64px] shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-white/40 bg-white/75 py-3 backdrop-blur-md sm:w-[72px]">
          <a
            href="/app"
            className="mb-2 grid h-9 w-9 place-items-center rounded-xl bg-zinc-950 text-[10px] font-bold text-white"
            aria-label="EchoFlow home"
          >
            EF
          </a>
          {RAIL_PRIMARY.map(renderRailItem)}
          <div className="my-2 h-px w-8 bg-zinc-300/80" aria-hidden />
          {RAIL_SECONDARY.map(renderRailItem)}
        </nav>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex shrink-0 items-center justify-between gap-3 bg-zinc-200/40 px-4 py-3 backdrop-blur-md sm:px-6">
            <p className="text-xs font-medium text-zinc-600">{contextLabel}</p>
            <button
              type="button"
              onClick={() => openUpgrade()}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition",
                plan === "pro"
                  ? "bg-amber-100 text-amber-900"
                  : "bg-zinc-950 text-white hover:bg-zinc-800"
              )}
            >
              <Crown className="h-3.5 w-3.5" />
              {plan === "pro"
                ? "Pro"
                : `Free · ${usage.aiRequestsToday}/10 edits`}
            </button>
          </header>

          <div
            ref={rowRef}
            className="mx-auto flex w-full min-h-0 max-w-[1600px] flex-1 flex-col items-stretch gap-4 overflow-hidden px-4 pb-4 sm:px-6 sm:pb-6 lg:flex-row lg:items-start lg:gap-8 lg:px-8 lg:pb-8 lg:pt-2"
          >
            <div className="flex h-[42vh] min-h-[280px] min-w-0 flex-1 items-stretch justify-center lg:h-[calc(100dvh-5.5rem)] lg:min-h-0">
              <StudioCanvas />
            </div>

            <div
              className="relative z-20 flex w-full shrink-0 overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.12)] lg:w-[min(380px,32vw)]"
              style={
                isDesktop && chatHeight
                  ? {
                      height: `${chatHeight}px`,
                      maxHeight: `${chatHeight}px`,
                      minHeight: `${chatHeight}px`,
                      marginTop: `${chatOffset}px`,
                    }
                  : {
                      height: "46vh",
                      minHeight: "320px",
                    }
              }
            >
              <StudioPanel compact />
            </div>
          </div>
        </div>
      </div>

      <DesignLibrary />
      <RecommendedTemplatesPanel />
      <ImportModal />
      <UpgradeModal />
      <EditorDebugPanel />
    </div>
  );
}
