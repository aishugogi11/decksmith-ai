"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  ChevronLeft,
  FolderKanban,
  Grid3X3,
  ImageIcon,
  LayoutTemplate,
  Loader2,
  Mic,
  MicOff,
  Palette,
  PanelLeftClose,
  Sparkles,
  Type,
  Upload,
  Wand2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { recommendTemplates } from "@/lib/ai/recommend";
import { OPEN_PACK_LICENSE } from "@/lib/template-packs/open-pack";
import type { TemplateRecord } from "@/lib/template-engine/types";
import { TEMPLATE_CATEGORIES, type TemplateCategory } from "@/lib/templates";
import {
  usePresentationStore,
  type LibraryTab,
  type RecommendationMatch,
} from "@/store/presentation-store";
import { ResearchPanel } from "@/features/research";
import { useImportStore } from "@/features/import/store";
import { cn } from "@/lib/utils";

const NAV: {
  id: LibraryTab;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { id: "research", label: "Research", icon: Search },
  { id: "uploads", label: "Import", icon: Upload },
  { id: "media", label: "Visuals", icon: ImageIcon },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "themes", label: "Themes", icon: Palette },
  { id: "text", label: "Text", icon: Type },
  { id: "brand", label: "Brand", icon: Briefcase },
  { id: "tools", label: "Tools", icon: Wand2 },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "apps", label: "Apps", icon: Grid3X3 },
];

/**
 * Canva-inspired design library — open MIT pack + curated + user imports.
 */
export function DesignLibrary() {
  const open = usePresentationStore((s) => s.templatesOpen);
  const setTemplatesOpen = usePresentationStore((s) => s.setTemplatesOpen);
  const libraryTab = usePresentationStore((s) => s.libraryTab);
  const setLibraryTab = usePresentationStore((s) => s.setLibraryTab);
  const loadTemplate = usePresentationStore((s) => s.loadTemplate);
  const findTemplates = usePresentationStore((s) => s.findTemplates);
  const isRecommending = usePresentationStore((s) => s.isRecommending);
  const recentTemplateIds = usePresentationStore((s) => s.recentTemplateIds);
  const catalogCache = usePresentationStore((s) => s.catalogCache);
  const importedTemplates = usePresentationStore((s) => s.importedTemplates);
  const refreshCatalog = usePresentationStore((s) => s.refreshCatalog);
  const customizeRecommendation = usePresentationStore(
    (s) => s.customizeRecommendation
  );
  const addTextbox = usePresentationStore((s) => s.addTextbox);
  const setPanelTab = usePresentationStore((s) => s.setPanelTab);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "open-pack" | "decksmith" | "user">(
    "all"
  );
  const [aiMatches, setAiMatches] = useState<RecommendationMatch[] | null>(null);
  const [searching, setSearching] = useState(false);
  const openImportModal = useImportStore((s) => s.openModal);
  const speech = useSpeechRecognition();
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    try {
      const raw = localStorage.getItem("decksmith-imported-templates");
      if (raw) {
        const parsed = JSON.parse(raw) as TemplateRecord[];
        if (Array.isArray(parsed) && parsed.length) {
          usePresentationStore.setState({ importedTemplates: parsed });
        }
      }
    } catch {
      /* ignore */
    }
    void refreshCatalog();
  }, [refreshCatalog]);

  useEffect(() => {
    if (open) void refreshCatalog();
  }, [open, refreshCatalog]);

  const catalog = catalogCache;

  const recent = useMemo(
    () =>
      recentTemplateIds
        .map((id) => catalog.find((t) => t.id === id))
        .filter((t): t is TemplateRecord => Boolean(t)),
    [recentTemplateIds, catalog]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((t) => {
      if (sourceFilter !== "all" && t.source !== sourceFilter) return false;
      if (category !== "all" && t.presentationType !== category && t.industry[0] !== category) {
        // map category via tags/industry loosely
        const blob = `${t.presentationType} ${t.tags.join(" ")} ${t.semanticText}`.toLowerCase();
        if (!blob.includes(category)) return false;
      }
      if (!q || aiMatches) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [catalog, category, query, sourceFilter, aiMatches]);

  const byType = useMemo(() => {
    const map = new Map<string, TemplateRecord[]>();
    for (const t of catalog) {
      if (t.source === "user") continue;
      const key = t.presentationType;
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    }
    return map;
  }, [catalog]);

  useEffect(() => {
    if (!open) {
      setAiMatches(null);
      if (speech.listening) speech.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function runSearch(e?: FormEvent) {
    e?.preventDefault();
    const text = query.trim();
    if (!text) {
      setAiMatches(null);
      return;
    }
    setSearching(true);
    try {
      const result = await recommendTemplates(text, 12);
      setAiMatches(
        result.matches.map((m) => ({
          score: m.score,
          reasons: m.reasons,
          template: {
            id: m.template.id,
            source: m.template.source,
            name: m.template.name,
            description: m.template.description,
            presentationType: m.template.presentationType,
            industry: m.template.industry,
            audience: m.template.audience,
            visualStyle: m.template.visualStyle,
            tone: m.template.tone,
            tags: m.template.tags,
            themeId: m.template.themeId,
            slideCount: m.template.slideCount,
            preview: m.template.preview,
            colorPalette: m.template.colorPalette,
            layoutStyle: m.template.layoutStyle,
          },
        }))
      );
      setCategory("all");
    } finally {
      setSearching(false);
    }
  }

  async function runGenerate() {
    const text =
      query.trim() ||
      "Create a modern investor pitch deck for an AI healthcare startup";
    setQuery(text);
    await findTemplates(text);
    setTemplatesOpen(false);
  }

  function toggleMic() {
    if (speech.listening) {
      speech.stop();
      return;
    }
    speech.start((transcript) => setQuery(transcript));
  }

  async function useAndCustomize(id: string) {
    setTemplatesOpen(false);
    usePresentationStore.setState({
      recommendPrompt: query.trim() || "Redesign this template for my brief",
    });
    await customizeRecommendation(id);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close design library"
            className="fixed inset-0 z-40 bg-zinc-950/25 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setTemplatesOpen(false)}
          />

          <motion.aside
            role="dialog"
            aria-modal
            aria-label="Design library"
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className="fixed bottom-3 left-3 top-3 z-50 flex w-[min(920px,calc(100vw-1.5rem))] overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.18)]"
          >
            <nav className="flex w-[72px] shrink-0 flex-col items-center gap-1 border-r border-zinc-100 bg-zinc-50/80 py-3">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active = libraryTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLibraryTab(item.id)}
                    className={cn(
                      "flex w-[64px] flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition",
                      active
                        ? "bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200"
                        : "text-zinc-500 hover:bg-white/70 hover:text-zinc-800"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 sm:px-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                    Design library · {catalog.length} templates
                  </p>
                  <h2 className="text-lg font-bold tracking-tight text-zinc-950">
                    {NAV.find((n) => n.id === libraryTab)?.label ?? "Templates"}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTemplatesOpen(false)}
                  aria-label="Collapse library"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>

              {libraryTab === "templates" && (
                <>
                  <form
                    onSubmit={runSearch}
                    className="space-y-3 border-b border-zinc-100 px-4 py-4 sm:px-5"
                  >
                    <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 focus-within:border-zinc-400 focus-within:bg-white">
                      <Search className="h-4 w-4 shrink-0 text-zinc-400" />
                      <input
                        value={query}
                        onChange={(e) => {
                          setQuery(e.target.value);
                          if (aiMatches) setAiMatches(null);
                        }}
                        placeholder="Describe your ideal design"
                        className="min-w-0 flex-1 bg-transparent text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none"
                      />
                      {speech.supported && (
                        <button
                          type="button"
                          onClick={toggleMic}
                          className={cn(
                            "inline-flex h-9 w-9 items-center justify-center rounded-xl transition",
                            speech.listening
                              ? "bg-zinc-950 text-white"
                              : "text-zinc-500 hover:bg-zinc-200/80"
                          )}
                          aria-label={
                            speech.listening ? "Stop listening" : "Voice search"
                          }
                        >
                          {speech.listening ? (
                            <MicOff className="h-4 w-4" />
                          ) : (
                            <Mic className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => void runGenerate()}
                        disabled={isRecommending}
                      >
                        {isRecommending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        Generate
                      </Button>
                      <Button type="submit" disabled={searching || !query.trim()}>
                        {searching ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                        Search
                      </Button>
                      <p className="text-[11px] text-zinc-400">
                        {OPEN_PACK_LICENSE.spdx} open pack + curated · AI customizes
                      </p>
                    </div>
                  </form>

                  <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
                    {aiMatches ? (
                      <section>
                        <SectionHeader
                          title="Best matches"
                          meta={`${aiMatches.length} ranked`}
                        />
                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {aiMatches.map((m) => {
                            const full = catalog.find((t) => t.id === m.template.id);
                            if (!full) return null;
                            return (
                              <TemplateCard
                                key={m.template.id}
                                template={full}
                                badge={`${Math.round(m.score * 100)}%`}
                                onUse={() => void loadTemplate(m.template.id)}
                                onCustomize={() => void useAndCustomize(m.template.id)}
                              />
                            );
                          })}
                        </div>
                      </section>
                    ) : (
                      <>
                        {recent.length > 0 && (
                          <section className="mb-8">
                            <SectionHeader title="Recently used" />
                            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                              {recent.map((t) => (
                                <div key={t.id} className="w-[200px] shrink-0">
                                  <TemplateCard
                                    template={t}
                                    wide
                                    onUse={() => void loadTemplate(t.id)}
                                    onCustomize={() => void useAndCustomize(t.id)}
                                  />
                                </div>
                              ))}
                            </div>
                          </section>
                        )}

                        <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
                          {(
                            [
                              ["all", "All sources"],
                              ["open-pack", "Open pack"],
                              ["decksmith", "Curated"],
                              ["user", "Imports"],
                            ] as const
                          ).map(([id, label]) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setSourceFilter(id)}
                              className={cn(
                                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
                                sourceFilter === id
                                  ? "bg-zinc-950 text-white"
                                  : "bg-zinc-100 text-zinc-600"
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>

                        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
                          {TEMPLATE_CATEGORIES.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setCategory(c.id)}
                              className={cn(
                                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
                                category === c.id
                                  ? "bg-zinc-800 text-white"
                                  : "bg-zinc-100 text-zinc-600"
                              )}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>

                        {category === "all" &&
                        sourceFilter === "all" &&
                        !query.trim() ? (
                          [...byType.entries()].map(([type, items]) => (
                            <section key={type} className="mb-8">
                              <SectionHeader
                                title={type}
                                meta={`${items.length} templates`}
                              />
                              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {items.slice(0, 6).map((t) => (
                                  <TemplateCard
                                    key={t.id}
                                    template={t}
                                    onUse={() => void loadTemplate(t.id)}
                                    onCustomize={() => void useAndCustomize(t.id)}
                                  />
                                ))}
                              </div>
                            </section>
                          ))
                        ) : (
                          <section>
                            <SectionHeader
                              title="Templates"
                              meta={`${filtered.length} results`}
                            />
                            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                              {filtered.map((t) => (
                                <TemplateCard
                                  key={t.id}
                                  template={t}
                                  onUse={() => void loadTemplate(t.id)}
                                  onCustomize={() => void useAndCustomize(t.id)}
                                />
                              ))}
                            </div>
                          </section>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}

              {libraryTab === "research" && <ResearchPanel />}

              {libraryTab === "text" && (
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6">
                  <div>
                    <h3 className="text-base font-bold text-zinc-950">Text</h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      Add a clean textbox to the current slide — no dashed box,
                      just editable type.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      addTextbox();
                      setTemplatesOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-left transition hover:border-zinc-400 hover:bg-white"
                  >
                    <Type className="h-5 w-5 text-zinc-700" />
                    <div>
                      <p className="text-sm font-semibold text-zinc-950">
                        Add textbox
                      </p>
                      <p className="text-xs text-zinc-500">
                        Insert on the selected slide
                      </p>
                    </div>
                  </button>
                </div>
              )}

              {libraryTab === "media" && (
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6">
                  <div>
                    <h3 className="text-base font-bold text-zinc-950">
                      AI Visual Assistant
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      Ask for images in chat or voice. Decksmith clarifies,
                      searches from slide context, and places visuals — no
                      external image tabs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTemplatesOpen(false);
                      setPanelTab("visuals");
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-left transition hover:border-zinc-400 hover:bg-white"
                  >
                    <ImageIcon className="h-5 w-5 text-zinc-700" />
                    <div>
                      <p className="text-sm font-semibold text-zinc-950">
                        Open Visual Assistant
                      </p>
                      <p className="text-xs text-zinc-500">
                        Conversational search · gallery · smart placement
                      </p>
                    </div>
                  </button>
                  <ul className="space-y-2 text-xs text-zinc-600">
                    <li>· Clarifies ambiguous requests before searching</li>
                    <li>· Uses slide title, bullets, audience, and theme</li>
                    <li>· Recommends charts, icons, or timelines when better</li>
                  </ul>
                </div>
              )}

              {libraryTab === "uploads" && (
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6">
                  <div>
                    <h3 className="text-base font-bold text-zinc-950">
                      Bring existing work
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      Upload a deck you already have. Decksmith becomes an AI
                      editor — redesign from feedback, research stronger evidence,
                      or voice-transform the whole story. Only import files you
                      have rights to use.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      openImportModal();
                      setTemplatesOpen(false);
                    }}
                    className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center transition hover:border-zinc-900 hover:bg-white"
                  >
                    <Upload className="h-7 w-7 text-zinc-800" />
                    <div>
                      <p className="text-sm font-semibold text-zinc-950">
                        Import PPTX, PDF, or JSON
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Then: Feedback → Redesign · Research Mode · Voice edit
                      </p>
                    </div>
                  </button>

                  <section>
                    <SectionHeader
                      title="Saved template imports"
                      meta={`${importedTemplates.length} saved locally`}
                    />
                    {importedTemplates.length === 0 ? (
                      <p className="mt-4 text-sm text-zinc-500">
                        Template library imports (legacy) appear here after AI fill workflows.
                      </p>
                    ) : (
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {importedTemplates.map((t) => (
                          <TemplateCard
                            key={t.id}
                            template={t}
                            badge="Imported"
                            onUse={() => void loadTemplate(t.id)}
                            onCustomize={() => void useAndCustomize(t.id)}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              )}

              {libraryTab !== "templates" &&
                libraryTab !== "uploads" &&
                libraryTab !== "text" &&
                libraryTab !== "research" &&
                libraryTab !== "media" && (
                <PlaceholderTab tab={libraryTab} />
              )}
            </div>

            <button
              type="button"
              onClick={() => setTemplatesOpen(false)}
              className="absolute -right-3 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-md md:grid"
              aria-label="Close"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function SectionHeader({
  title,
  meta,
}: {
  title: string;
  meta?: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold capitalize text-zinc-950">{title}</h3>
      {meta && <p className="text-[11px] text-zinc-500">{meta}</p>}
    </div>
  );
}

function TemplateCard({
  template,
  badge,
  wide,
  onUse,
  onCustomize,
}: {
  template: TemplateRecord;
  badge?: string;
  wide?: boolean;
  onUse: () => void;
  onCustomize: () => void;
}) {
  return (
    <div
      className={cn(
        "group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md",
        wide && "w-full"
      )}
    >
      <button type="button" onClick={onUse} className="block w-full text-left">
        <div
          className={cn("relative w-full", wide ? "h-28" : "aspect-[16/10]")}
          style={{ background: template.preview }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
          <div className="absolute bottom-2.5 left-2.5 right-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/75">
              {template.slideCount} slides · {template.source}
            </p>
            <p className="truncate text-sm font-bold text-white">{template.name}</p>
          </div>
          {badge && (
            <span className="absolute left-2 top-2 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-800">
              {badge}
            </span>
          )}
          <span className="absolute right-2 top-2 rounded-md bg-black/35 p-1 text-white/90 opacity-0 transition group-hover:opacity-100">
            <ImageIcon className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className="p-2.5">
          <p className="line-clamp-2 text-[11px] leading-snug text-zinc-500">
            {template.description}
          </p>
        </div>
      </button>
      <div className="flex gap-1 border-t border-zinc-100 p-2">
        <button
          type="button"
          onClick={onUse}
          className="flex-1 rounded-lg bg-zinc-100 px-2 py-1.5 text-[11px] font-semibold text-zinc-800 hover:bg-zinc-200"
        >
          Use
        </button>
        <button
          type="button"
          onClick={onCustomize}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-zinc-950 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-zinc-800"
        >
          <Sparkles className="h-3 w-3" />
          AI fill
        </button>
      </div>
    </div>
  );
}

function PlaceholderTab({ tab }: { tab: LibraryTab }) {
  const copy: Record<
    Exclude<LibraryTab, "templates" | "uploads" | "text" | "research" | "media">,
    { title: string; body: string }
  > = {
      themes: {
        title: "Themes",
        body: "Use brand personality in chat to switch themes. A full theme browser is next.",
      },
      brand: {
        title: "Brand kit",
        body: "Save logos and colors here later. Personality controls set tone today.",
      },
      tools: {
        title: "Tools",
        body: "Export PPTX, PDF, or Decksmith JSON from the canvas toolbar. Universal import lives under Uploads.",
      },
      projects: {
        title: "Projects",
        body: "Recent templates appear under Templates → Recently used.",
      },
      apps: {
        title: "Apps",
        body: "Connect chart and asset apps in a future release.",
      },
    };
  const item =
    copy[
      tab as Exclude<
        LibraryTab,
        "templates" | "uploads" | "text" | "research" | "media"
      >
    ];
  return (
    <div className="flex flex-1 flex-col items-start justify-center gap-2 px-8 py-16">
      <h3 className="text-xl font-bold text-zinc-950">{item.title}</h3>
      <p className="max-w-md text-sm leading-relaxed text-zinc-500">{item.body}</p>
    </div>
  );
}
