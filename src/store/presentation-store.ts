"use client";

import { create } from "zustand";
import type { ChatMessage, Presentation, Slide, ThemeId } from "@/lib/types";
import {
  emptyPresentation,
  makeAssistantMessage,
  makeUserMessage,
  mockStreamAssistant,
} from "@/lib/mock-ai";
import {
  emptyCollaboratorState,
  type CollaboratorState,
} from "@/lib/ai/collaborator";
import type { CoachReport } from "@/lib/ai/coach";
import {
  applyDesignSuggestion,
  buildDesignSuggestions,
  type DesignSuggestion,
} from "@/lib/ai/design-assistant";
import {
  CITATION_STYLES,
  createCitation,
  detectCitationsInText,
  mergeDuplicateCitations,
  parseCitationChatIntent,
  reformatCitations,
  upsertReferencesSlide,
  type CitationEntry,
  type CitationStyle,
} from "@/lib/ai/citations";
import {
  emptyEditContext,
  type EditConversationContext,
  type EditHistoryEntry,
} from "@/lib/ai/edit-engine";
import {
  emptyEditorSelection,
  type EditorSelectionState,
  type VoiceDebugLogEntry,
} from "@/lib/voice-agent";
import {
  loadSavedProjects,
  persistSavedProjects,
  presentationToSavedProject,
  upsertSavedProject,
  type SavedProject,
} from "@/lib/projects";
import {
  dispatchEditorCommands,
  selectionForSlideChange,
  useEditorDebugStore,
  type EditorCommand,
  type EditorCommandSource,
  type EditorHistorySnapshot,
} from "@/lib/editor";
import { useEditorFocusStore } from "@/lib/editor/focus";
import type { VoiceCommand } from "@/lib/voice-agent/types";
import { customizeTemplateWithAI } from "@/lib/ai/customize-template";
import { analyzePresentationIntent } from "@/lib/ai/intent";
import { runOrchestrator } from "@/lib/ai/orchestrator";
import { recommendTemplates } from "@/lib/ai/recommend";
import {
  getTemplateRecordById,
  listAllTemplates,
  templateRecordToPresentation,
  userTemplateProvider,
  type PresentationIntent,
  type TemplateMatch,
  type TemplateRecord,
} from "@/lib/template-engine";
import { BRAND_PERSONALITIES } from "@/lib/personalities";
import { uid } from "@/lib/utils";

export type LibraryTab =
  | "templates"
  | "themes"
  | "text"
  | "brand"
  | "uploads"
  | "tools"
  | "projects"
  | "apps"
  | "research"
  | "media";

type HistorySnapshot = EditorHistorySnapshot;

/** Lightweight match shape stored in client state (no full slide payloads). */
export type RecommendationMatch = {
  score: number;
  reasons: string[];
  template: {
    id: string;
    source: string;
    name: string;
    description: string;
    presentationType: string;
    industry: string[];
    audience: string[];
    visualStyle: string[];
    tone: string[];
    tags: string[];
    themeId: ThemeId;
    slideCount: number;
    preview: string;
    colorPalette: string[];
    layoutStyle: string;
  };
};

interface PresentationState {
  presentation: Presentation;
  selectedSlideId: string | null;
  messages: ChatMessage[];
  isGenerating: boolean;
  zoom: number;
  sidebarOpen: boolean;
  templatesOpen: boolean;
  /** Canva-style design library left-nav section */
  libraryTab: LibraryTab;
  recentTemplateIds: string[];
  importedTemplates: TemplateRecord[];
  catalogCache: TemplateRecord[];
  personalityId: string;
  autoSpeakReplies: boolean;
  past: HistorySnapshot[];
  future: HistorySnapshot[];

  /** AI template recommendation layer */
  recommendationsOpen: boolean;
  recommendations: RecommendationMatch[];
  recommendPrompt: string;
  recommendIntent: PresentationIntent | null;
  selectedRecommendationId: string | null;
  isRecommending: boolean;
  isCustomizingTemplate: boolean;

  /** Multi-turn creative collaborator */
  collaborator: CollaboratorState;
  suggestionChips: string[];
  coachReport: CoachReport | null;

  /** Conversational edit engine + assistant panels */
  editContext: EditConversationContext;
  editHistory: EditHistoryEntry[];
  designSuggestions: DesignSuggestion[];
  citations: CitationEntry[];
  citationStyle: CitationStyle;
  voiceStatus: "idle" | "listening" | "processing" | "speaking";
  panelTab:
    | "chat"
    | "visuals"
    | "suggestions"
    | "citations"
    | "history"
    | "debug"
    | "feedback"
    | "coach"
    | "import";
  /** Last selected editor object for follow-up voice commands */
  editorSelection: EditorSelectionState;
  /** Developer logs: transcript → JSON → executed actions */
  voiceDebugLogs: VoiceDebugLogEntry[];

  setSidebarOpen: (open: boolean) => void;
  setTemplatesOpen: (open: boolean) => void;
  setLibraryTab: (tab: LibraryTab) => void;
  setRecommendationsOpen: (open: boolean) => void;
  setAutoSpeakReplies: (enabled: boolean) => void;
  setPersonality: (personalityId: string, themeId: ThemeId) => void;
  setDeckTitle: (title: string) => void;
  savedProjects: SavedProject[];
  hydrateProjects: () => void;
  saveCurrentProject: (name?: string) => { ok: boolean; detail: string };
  loadProject: (id: string) => { ok: boolean; detail: string };
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;
  setZoom: (zoom: number) => void;
  selectSlide: (id: string) => void;
  newPresentation: () => void;
  loadTemplate: (templateId: string) => Promise<void>;
  /** Load a fully parsed imported presentation onto the canvas */
  loadImportedPresentation: (
    presentation: Presentation,
    opts?: { sourceLabel?: string; openAnalysis?: boolean }
  ) => void;
  refreshCatalog: () => Promise<void>;
  importTemplateRecord: (record: TemplateRecord) => void;
  setTheme: (themeId: ThemeId) => void;
  exportPptx: () => Promise<void>;
  exportJson: () => void;
  exportPdf: () => Promise<void>;
  updateSlide: (id: string, patch: Partial<Slide>) => void;
  addSlide: () => void;
  duplicateSlide: (id: string) => void;
  deleteSlide: (id: string) => void;
  undo: () => void;
  redo: () => void;
  sendMessage: (
    text: string,
    opts?: { silent?: boolean }
  ) => Promise<void>;
  /** Reload the demo slides (original version). */
  restoreOriginalDeck: () => Promise<void>;
  applyDemoDeck: () => Promise<void>;
  findTemplates: (
    prompt: string,
    opts?: { reuseChat?: boolean }
  ) => Promise<void>;
  /** Open the recommendations carousel with curated template examples (no AI search). */
  browseTemplateExamples: () => Promise<void>;
  selectRecommendation: (templateId: string) => void;
  customizeRecommendation: (
    templateId: string,
    opts?: { loadOnly?: boolean }
  ) => Promise<void>;
  setVoiceStatus: (status: PresentationState["voiceStatus"]) => void;
  setPanelTab: (tab: PresentationState["panelTab"]) => void;
  refreshDesignSuggestions: () => void;
  applySuggestion: (suggestionId: string) => Promise<void>;
  setCitationStyle: (style: CitationStyle) => void;
  addCitationFromText: (
    text: string,
    opts?: { syncSlide?: "References" | "Works Cited" | null }
  ) => void;
  removeCitation: (id: string) => void;
  createReferencesSlide: (title?: "References" | "Works Cited") => void;
  dismissSuggestion: (id: string) => void;
  clearVoiceDebugLogs: () => void;
  selectEditorObject: (slideId: string, objectId: string | null) => void;
  addTextbox: (opts?: { text?: string; slideId?: string }) => void;
  /** Delete the currently selected canvas object (textbox, image, …) */
  deleteSelectedObject: () => { ok: boolean; detail: string };
  /** Unified editor command entry — UI / AI / shortcuts should prefer this */
  runEditorCommands: (
    commands: EditorCommand[] | VoiceCommand[],
    opts?: {
      source?: EditorCommandSource;
      voiceTranscript?: string;
      skipHistory?: boolean;
    }
  ) => { ok: boolean; detail: string };
}

function pushHistory(state: PresentationState): Partial<PresentationState> {
  return {
    past: [
      ...state.past,
      {
        presentation: structuredClone(state.presentation),
        selectedSlideId: state.selectedSlideId,
        editorSelection: structuredClone(state.editorSelection),
      },
    ].slice(-40),
    future: [],
  };
}

/** Voice/chat: restore the original demo slides. */
function isRestoreOriginalIntent(text: string): boolean {
  const t = text.toLowerCase().replace(/[’']/g, "'");
  return (
    /\bgo back to (the )?original\b/.test(t) ||
    /\brestore (the )?(original|demo|novacare)\b/.test(t) ||
    /\breset (to )?(the )?(original|demo)\b/.test(t) ||
    /\boriginal version\b/.test(t) ||
    /\bback to (the )?demo\b/.test(t) ||
    /\bback to novacare\b/.test(t)
  );
}

function mirrorDebug(state: {
  selectedSlideId: string | null;
  editorSelection: EditorSelectionState;
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  lastVoiceTranscript?: string | null;
}) {
  useEditorDebugStore.getState().mirror({
    currentSlideId: state.selectedSlideId,
    selection: state.editorSelection,
    undoDepth: state.past.length,
    redoDepth: state.future.length,
    lastVoiceTranscript: state.lastVoiceTranscript,
  });
}

function toRecommendationMatches(matches: TemplateMatch[]): RecommendationMatch[] {
  return matches.map((m) => ({
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
  }));
}

export const usePresentationStore = create<PresentationState>((set, get) => ({
  presentation: emptyPresentation(),
  selectedSlideId: null,
  messages: [
    {
      id: uid("msg"),
      role: "assistant",
      content:
        "Hi — I'm EchoFlow. Bring existing slides, research a topic, or paste feedback to redesign. Voice works anytime — try “Make this look like an Apple Keynote.”",
      createdAt: new Date().toISOString(),
    },
  ],
  isGenerating: false,
  zoom: 0.92,
  sidebarOpen: true,
  templatesOpen: false,
  libraryTab: "research",
  recentTemplateIds: [],
  importedTemplates: [],
  catalogCache: [],
  savedProjects: [],
  personalityId: "professional",
  autoSpeakReplies: false,
  past: [],
  future: [],

  recommendationsOpen: false,
  recommendations: [],
  recommendPrompt: "",
  recommendIntent: null,
  selectedRecommendationId: null,
  isRecommending: false,
  isCustomizingTemplate: false,
  collaborator: emptyCollaboratorState(),
  suggestionChips: [],
  coachReport: null,
  editContext: emptyEditContext(),
  editHistory: [],
  designSuggestions: [],
  citations: [],
  citationStyle: "APA",
  voiceStatus: "idle",
  panelTab: "chat",
  editorSelection: emptyEditorSelection(),
  voiceDebugLogs: [],

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setVoiceStatus: (status) => set({ voiceStatus: status }),
  setPanelTab: (tab) => set({ panelTab: tab }),
  clearVoiceDebugLogs: () => set({ voiceDebugLogs: [] }),
  selectEditorObject: (slideId, objectId) =>
    set((state) => {
      const slide = state.presentation.slides.find((s) => s.id === slideId);
      const obj = objectId
        ? slide?.objects?.find((o) => o.id === objectId)
        : null;
      const next = {
        selectedSlideId: slideId,
        editorSelection: {
          slideId,
          objectId: obj?.id ?? null,
          objectType: obj?.type ?? null,
          lastAction: state.editorSelection.lastAction,
        },
      };
      mirrorDebug({
        selectedSlideId: next.selectedSlideId,
        editorSelection: next.editorSelection,
        past: state.past,
        future: state.future,
      });
      return next;
    }),

  runEditorCommands: (commands, opts) => {
    const state = get();
    if (!commands.length) return { ok: false, detail: "No commands" };

    const result = dispatchEditorCommands({
      presentation: state.presentation,
      selectedSlideId: state.selectedSlideId,
      selection: state.editorSelection,
      commands,
      source: opts?.source ?? "system",
      voiceTranscript: opts?.voiceTranscript,
    });

    for (const entry of result.debugEntries) {
      useEditorDebugStore.getState().push(entry);
    }

    if (!result.ok && !result.executed.some((e) => e.ok)) {
      mirrorDebug({
        selectedSlideId: state.selectedSlideId,
        editorSelection: state.editorSelection,
        past: state.past,
        future: state.future,
        lastVoiceTranscript: opts?.voiceTranscript ?? null,
      });
      return {
        ok: false,
        detail: result.executed.map((e) => e.detail).join("; ") || "Failed",
      };
    }

    set((s) => ({
      ...(opts?.skipHistory ? {} : pushHistory(s)),
      presentation: result.presentation,
      selectedSlideId: result.selectedSlideId,
      editorSelection: result.selection,
    }));

    const after = get();
    mirrorDebug({
      selectedSlideId: after.selectedSlideId,
      editorSelection: after.editorSelection,
      past: after.past,
      future: after.future,
      lastVoiceTranscript: opts?.voiceTranscript ?? null,
    });

    if (result.focusObjectId) {
      useEditorFocusStore.getState().requestFocus(result.focusObjectId);
    }

    const okCount = result.executed.filter((e) => e.ok).length;
    return {
      ok: okCount > 0,
      detail: result.executed.map((e) => e.detail).join(" · "),
    };
  },

  addTextbox: (opts) => {
    const state = get();
    const slideId =
      opts?.slideId ??
      state.selectedSlideId ??
      state.presentation.slides[0]?.id;
    if (!slideId) return;
    const slideNum =
      state.presentation.slides.findIndex((s) => s.id === slideId) + 1;
    get().runEditorCommands(
      [
        {
          type: "CREATE_TEXTBOX",
          params: {
            slide: Math.max(1, slideNum),
            text: opts?.text?.trim() || "Type here",
            fontSize: 28,
            x: 18,
            y: 28,
            w: 55,
            h: 16,
          },
          source: "ui",
        },
      ],
      { source: "ui" }
    );
  },

  deleteSelectedObject: () => {
    const state = get();
    const objectId = state.editorSelection.objectId;
    const slideId =
      state.editorSelection.slideId ?? state.selectedSlideId;
    if (!objectId || !slideId) {
      return { ok: false, detail: "No text or object selected" };
    }
    const slideNum =
      state.presentation.slides.findIndex((s) => s.id === slideId) + 1;
    if (slideNum < 1) {
      return { ok: false, detail: "Slide not found" };
    }
    return get().runEditorCommands(
      [
        {
          type: "DELETE_OBJECT",
          params: { slide: slideNum, objectId },
          source: "ui",
        },
      ],
      { source: "ui" }
    );
  },

  dismissSuggestion: (id) =>
    set((state) => ({
      designSuggestions: state.designSuggestions.filter((s) => s.id !== id),
    })),

  refreshDesignSuggestions: () => {
    const { presentation, coachReport } = get();
    if (!presentation.slides.length) {
      set({ designSuggestions: [] });
      return;
    }
    set({
      designSuggestions: buildDesignSuggestions(presentation, coachReport),
    });
  },

  applySuggestion: async (suggestionId) => {
    const suggestion = get().designSuggestions.find((s) => s.id === suggestionId);
    if (!suggestion) return;
    const applied = applyDesignSuggestion(
      get().presentation,
      suggestion,
      get().selectedSlideId
    );
    if (!applied) return;

    if (applied.command) {
      if (applied.selectedSlideId) {
        set({ selectedSlideId: applied.selectedSlideId });
      }
      await get().sendMessage(applied.command);
      set((state) => ({
        designSuggestions: state.designSuggestions.filter(
          (s) => s.id !== suggestionId
        ),
      }));
      return;
    }

    set((state) => ({
      ...pushHistory(state),
      presentation: applied.presentation,
      selectedSlideId: applied.selectedSlideId,
      designSuggestions: buildDesignSuggestions(
        applied.presentation,
        state.coachReport
      ).filter((s) => s.id !== suggestionId),
      messages: [
        ...state.messages,
        {
          id: uid("msg"),
          role: "assistant",
          content: `Applied: ${suggestion.title}`,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  },

  setCitationStyle: (style) => {
    if (!CITATION_STYLES.includes(style)) return;
    set((state) => ({
      citationStyle: style,
      citations: reformatCitations(state.citations, style),
    }));
  },

  addCitationFromText: (text, opts) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const style = get().citationStyle;
    const found = detectCitationsInText(trimmed, style);
    const created = found.length ? found : [createCitation(trimmed, style)];
    const syncSlide = opts?.syncSlide ?? null;

    set((state) => {
      const citations = mergeDuplicateCitations([
        ...state.citations,
        ...created,
      ]);
      const presentation = syncSlide
        ? upsertReferencesSlide(state.presentation, citations, syncSlide)
        : state.presentation;
      const selectedSlideId = syncSlide
        ? presentation.slides.find((s) =>
            new RegExp(`^${syncSlide}$`, "i").test(s.title)
          )?.id ?? state.selectedSlideId
        : state.selectedSlideId;

      return {
        ...(syncSlide ? pushHistory(state) : {}),
        citations,
        presentation,
        selectedSlideId,
        panelTab: "citations",
        messages: [
          ...state.messages,
          {
            id: uid("msg"),
            role: "assistant",
            content: [
              `Added ${created.length} citation(s) in ${style}.`,
              syncSlide
                ? ` Updated the ${syncSlide} slide.`
                : " Open Cite to add them to Works Cited, or say “add this to works cited.”",
              created.some((c) => c.missing.length)
                ? " Warning: some metadata is missing."
                : "",
            ]
              .filter(Boolean)
              .join(""),
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });
  },

  removeCitation: (id) =>
    set((state) => ({
      citations: state.citations.filter((c) => c.id !== id),
    })),

  createReferencesSlide: (title = "References") => {
    const { citations, presentation } = get();
    const next = upsertReferencesSlide(presentation, citations, title);
    set((state) => ({
      ...pushHistory(state),
      presentation: next,
      selectedSlideId:
        next.slides.find((s) =>
          /^(references|works cited)$/i.test(s.title)
        )?.id ?? state.selectedSlideId,
      panelTab: "citations",
      messages: [
        ...state.messages,
        {
          id: uid("msg"),
          role: "assistant",
          content: `Created a ${title} slide with ${citations.length} source(s).`,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  },
  setTemplatesOpen: (open) => set({ templatesOpen: open }),
  setLibraryTab: (tab) => set({ libraryTab: tab, templatesOpen: true }),
  setRecommendationsOpen: (open) => set({ recommendationsOpen: open }),
  setAutoSpeakReplies: (enabled) => set({ autoSpeakReplies: enabled }),
  setPersonality: (personalityId, themeId) =>
    set((state) => ({
      ...pushHistory(state),
      personalityId,
      presentation: {
        ...state.presentation,
        themeId,
        updatedAt: new Date().toISOString(),
      },
    })),
  setDeckTitle: (title) =>
    set((state) => ({
      presentation: {
        ...state.presentation,
        title: title.slice(0, 100) || "Untitled project",
        updatedAt: new Date().toISOString(),
      },
    })),

  hydrateProjects: () => {
    set({ savedProjects: loadSavedProjects() });
  },

  saveCurrentProject: (name) => {
    const presentation = get().presentation;
    if (!presentation.slides.length) {
      return { ok: false, detail: "Add at least one slide before saving." };
    }
    const project = presentationToSavedProject(presentation, name);
    const savedProjects = upsertSavedProject(get().savedProjects, project);
    persistSavedProjects(savedProjects);
    set({
      savedProjects,
      presentation: {
        ...presentation,
        title: project.name,
        updatedAt: project.updatedAt,
      },
    });
    return { ok: true, detail: `Saved “${project.name}”` };
  },

  loadProject: (id) => {
    const project = get().savedProjects.find((p) => p.id === id);
    if (!project) return { ok: false, detail: "Project not found." };
    const presentation = structuredClone(project.presentation);
    set({
      presentation,
      selectedSlideId: presentation.slides[0]?.id ?? null,
      past: [],
      future: [],
      editorSelection: emptyEditorSelection(),
      editContext: emptyEditContext(),
      templatesOpen: false,
      messages: [
        ...get().messages,
        makeAssistantMessage(
          `Opened project “${project.name}” (${presentation.slides.length} slides).`,
          false
        ),
      ],
    });
    return { ok: true, detail: `Opened “${project.name}”` };
  },

  renameProject: (id, name) => {
    const trimmed = name.trim().slice(0, 100) || "Untitled project";
    const savedProjects = get().savedProjects.map((p) =>
      p.id === id
        ? {
            ...p,
            name: trimmed,
            updatedAt: new Date().toISOString(),
            presentation: {
              ...p.presentation,
              title: trimmed,
              updatedAt: new Date().toISOString(),
            },
          }
        : p
    );
    persistSavedProjects(savedProjects);
    const current = get().presentation;
    set({
      savedProjects,
      ...(current.id === id
        ? {
            presentation: {
              ...current,
              title: trimmed,
              updatedAt: new Date().toISOString(),
            },
          }
        : {}),
    });
  },

  deleteProject: (id) => {
    const savedProjects = get().savedProjects.filter((p) => p.id !== id);
    persistSavedProjects(savedProjects);
    set({ savedProjects });
  },

  setZoom: (zoom) => set({ zoom: Math.min(1.4, Math.max(0.5, zoom)) }),

  selectSlide: (id) =>
    set((state) => {
      const next = {
        selectedSlideId: id,
        editorSelection: selectionForSlideChange(id, state.editorSelection),
      };
      mirrorDebug({
        selectedSlideId: next.selectedSlideId,
        editorSelection: next.editorSelection,
        past: state.past,
        future: state.future,
      });
      return next;
    }),

  newPresentation: () => {
    const presentation = emptyPresentation();
    set({
      presentation,
      selectedSlideId: presentation.slides[0]?.id ?? null,
      messages: [
        {
          id: uid("msg"),
          role: "assistant",
          content: "New canvas ready. Bring existing slides, research a topic, or start from a template if you need a shell.",
          createdAt: new Date().toISOString(),
        },
      ],
      past: [],
      future: [],
      recommendations: [],
      recommendIntent: null,
      selectedRecommendationId: null,
      collaborator: emptyCollaboratorState(),
      suggestionChips: [],
      coachReport: null,
      editContext: emptyEditContext(),
      editHistory: [],
      designSuggestions: [],
      citations: [],
      voiceStatus: "idle",
      panelTab: "chat",
      editorSelection: emptyEditorSelection(),
      voiceDebugLogs: [],
    });
  },

  refreshCatalog: async () => {
    userTemplateProvider.setTemplates(get().importedTemplates);
    const catalog = await listAllTemplates();
    set({ catalogCache: catalog });
  },

  importTemplateRecord: (record) => {
    set((state) => {
      const importedTemplates = [record, ...state.importedTemplates].slice(0, 40);
      userTemplateProvider.setTemplates(importedTemplates);
      try {
        localStorage.setItem(
          "echoflow-imported-templates",
          JSON.stringify(importedTemplates)
        );
      } catch {
        /* ignore quota */
      }
      return {
        importedTemplates,
        messages: [
          ...state.messages,
          {
            id: uid("msg"),
            role: "assistant",
            content: `Imported “${record.name}”. Open Design library → Uploads, or Customize to redesign it.`,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });
    void get().refreshCatalog();
  },

  loadTemplate: async (templateId) => {
    userTemplateProvider.setTemplates(get().importedTemplates);
    const template = await getTemplateRecordById(templateId);
    if (!template) return;
    const presentation = templateRecordToPresentation(template);
    const personality =
      BRAND_PERSONALITIES.find((p) => p.themeId === template.themeId)?.id ??
      "professional";
    set((state) => ({
      ...pushHistory(state),
      personalityId: personality,
      presentation,
      selectedSlideId: presentation.slides[0]?.id ?? null,
      templatesOpen: false,
      recentTemplateIds: [
        templateId,
        ...state.recentTemplateIds.filter((id) => id !== templateId),
      ].slice(0, 8),
      messages: [
        ...state.messages,
        {
          id: uid("msg"),
          role: "assistant",
          content: `Loaded “${template.name}”. Edit any text, or use Customize to redesign it from your brief.`,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  },

  exportPptx: async () => {
    const { exportPresentationToPptx } = await import("@/lib/export/pptx");
    await exportPresentationToPptx(get().presentation);
  },

  exportJson: () => {
    void import("@/lib/export/json").then(({ exportPresentationToJson }) => {
      exportPresentationToJson(get().presentation);
    });
  },

  exportPdf: async () => {
    const { exportPresentationToPdf } = await import("@/lib/export/pdf");
    await exportPresentationToPdf(get().presentation);
  },

  loadImportedPresentation: (presentation, opts) => {
    const label = opts?.sourceLabel || presentation.title || "imported slides";
    set((state) => ({
      ...pushHistory(state),
      presentation: {
        ...presentation,
        updatedAt: new Date().toISOString(),
      },
      selectedSlideId: presentation.slides[0]?.id ?? null,
      templatesOpen: false,
      // Transform hub (Import tab) — not Templates
      panelTab: "import",
      editorSelection: emptyEditorSelection(),
      messages: [
        ...state.messages,
        {
          id: uid("msg"),
          role: "assistant",
          content: `Imported “${label}” (${presentation.slides.length} slides). Next: Redesign from feedback, Research for evidence — or say “Make this look like an Apple Keynote.”`,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  },

  setTheme: (themeId) =>
    set((state) => ({
      ...pushHistory(state),
      presentation: {
        ...state.presentation,
        themeId,
        updatedAt: new Date().toISOString(),
      },
    })),

  updateSlide: (id, patch) =>
    set((state) => ({
      ...pushHistory(state),
      presentation: {
        ...state.presentation,
        updatedAt: new Date().toISOString(),
        slides: state.presentation.slides.map((s) =>
          s.id === id ? { ...s, ...patch } : s
        ),
      },
    })),

  addSlide: () =>
    set((state) => {
      const slide: Slide = {
        id: uid("slide"),
        layout: "section",
        title: "New slide",
        subtitle: "Double-click text to edit",
        body: "Tell the chat how this slide should feel.",
      };
      return {
        ...pushHistory(state),
        presentation: {
          ...state.presentation,
          slides: [...state.presentation.slides, slide],
          updatedAt: new Date().toISOString(),
        },
        selectedSlideId: slide.id,
      };
    }),

  duplicateSlide: (id) =>
    set((state) => {
      const idx = state.presentation.slides.findIndex((s) => s.id === id);
      if (idx < 0) return state;
      const copy = { ...structuredClone(state.presentation.slides[idx]), id: uid("slide") };
      const slides = [...state.presentation.slides];
      slides.splice(idx + 1, 0, copy);
      return {
        ...pushHistory(state),
        presentation: {
          ...state.presentation,
          slides,
          updatedAt: new Date().toISOString(),
        },
        selectedSlideId: copy.id,
      };
    }),

  deleteSlide: (id) =>
    set((state) => {
      if (state.presentation.slides.length <= 1) return state;
      const slides = state.presentation.slides.filter((s) => s.id !== id);
      return {
        ...pushHistory(state),
        presentation: {
          ...state.presentation,
          slides,
          updatedAt: new Date().toISOString(),
        },
        selectedSlideId:
          state.selectedSlideId === id ? slides[0]?.id ?? null : state.selectedSlideId,
      };
    }),

  undo: () =>
    set((state) => {
      const prev = state.past[state.past.length - 1];
      if (!prev) return state;
      const currentSnap: HistorySnapshot = {
        presentation: structuredClone(state.presentation),
        selectedSlideId: state.selectedSlideId,
        editorSelection: structuredClone(state.editorSelection),
      };
      const next = {
        past: state.past.slice(0, -1),
        future: [currentSnap, ...state.future].slice(0, 40),
        presentation: prev.presentation,
        selectedSlideId:
          prev.selectedSlideId ?? prev.presentation.slides[0]?.id ?? null,
        editorSelection: prev.editorSelection ?? emptyEditorSelection(),
      };
      mirrorDebug({
        selectedSlideId: next.selectedSlideId,
        editorSelection: next.editorSelection,
        past: next.past,
        future: next.future,
      });
      return next;
    }),

  redo: () =>
    set((state) => {
      const nxt = state.future[0];
      if (!nxt) return state;
      const currentSnap: HistorySnapshot = {
        presentation: structuredClone(state.presentation),
        selectedSlideId: state.selectedSlideId,
        editorSelection: structuredClone(state.editorSelection),
      };
      const next = {
        future: state.future.slice(1),
        past: [...state.past, currentSnap].slice(-40),
        presentation: nxt.presentation,
        selectedSlideId:
          nxt.selectedSlideId ?? nxt.presentation.slides[0]?.id ?? null,
        editorSelection: nxt.editorSelection ?? emptyEditorSelection(),
      };
      mirrorDebug({
        selectedSlideId: next.selectedSlideId,
        editorSelection: next.editorSelection,
        past: next.past,
        future: next.future,
      });
      return next;
    }),

  browseTemplateExamples: async () => {
    set({ isRecommending: true, recommendationsOpen: true });
    try {
      const catalog = await listAllTemplates();
      const byType = new Map<string, TemplateRecord[]>();
      for (const t of catalog) {
        const list = byType.get(t.presentationType) ?? [];
        list.push(t);
        byType.set(t.presentationType, list);
      }
      // Diverse set: one+ from each type, then fill to 12
      const featured: TemplateRecord[] = [];
      const seen = new Set<string>();
      for (const list of byType.values()) {
        const first = list[0];
        if (first && !seen.has(first.id)) {
          featured.push(first);
          seen.add(first.id);
        }
        if (featured.length >= 12) break;
      }
      for (const t of catalog) {
        if (featured.length >= 12) break;
        if (!seen.has(t.id)) {
          featured.push(t);
          seen.add(t.id);
        }
      }
      const matches: TemplateMatch[] = featured.map((template, i) => ({
        template,
        score: 1 - i * 0.02,
        reasons: [
          template.presentationType,
          ...template.tags.slice(0, 2),
          template.layoutStyle,
        ].filter(Boolean),
      }));
      set({
        isRecommending: false,
        recommendations: toRecommendationMatches(matches),
        recommendationsOpen: true,
        recommendPrompt: "Slide template examples",
        recommendIntent: {
          raw: "examples",
          industry: [],
          audience: [],
          visualStyle: [],
          tone: [],
          keywords: [],
          summary: "Choose template slides",
        },
        selectedRecommendationId: matches[0]?.template.id ?? null,
        libraryTab: "templates",
        templatesOpen: false,
      });
    } catch {
      set({
        isRecommending: false,
        recommendationsOpen: true,
        recommendations: [],
        recommendPrompt: "Slide template examples",
        recommendIntent: {
          raw: "examples",
          industry: [],
          audience: [],
          visualStyle: [],
          tone: [],
          keywords: [],
          summary: "Choose template slides",
        },
      });
    }
  },

  findTemplates: async (prompt, opts) => {
    const trimmed = prompt.trim();
    if (!trimmed || get().isRecommending) return;

    if (opts?.reuseChat) {
      set({
        isRecommending: true,
        recommendationsOpen: true,
        recommendPrompt: trimmed,
        recommendations: [],
        selectedRecommendationId: null,
      });
    } else {
      set({
        isRecommending: true,
        recommendationsOpen: true,
        recommendPrompt: trimmed,
        recommendations: [],
        selectedRecommendationId: null,
        messages: [
          ...get().messages,
          makeUserMessage(trimmed),
          {
            ...makeAssistantMessage(
              "Analyzing your brief and ranking templates from the library…",
              true
            ),
          },
        ],
      });
    }

    try {
      const result = await recommendTemplates(trimmed, 8);
      let matches = toRecommendationMatches(result.matches);

      // Always surface something in the carousel — never leave the panel empty
      if (!matches.length) {
        const catalog = await listAllTemplates();
        const type = result.intent.presentationType;
        const preferred = type
          ? catalog.filter((t) => t.presentationType === type)
          : catalog;
        const pool = preferred.length ? preferred : catalog;
        matches = toRecommendationMatches(
          pool.slice(0, 8).map((template, i) => ({
            template,
            score: 0.55 - i * 0.03,
            reasons: [
              type ? `related: ${type}` : "library pick",
              ...template.tags.slice(0, 2),
            ],
          }))
        );
      }

      const topNames = matches
        .slice(0, 3)
        .map((m) => m.template.name)
        .join(", ");
      const content = matches.length
        ? `Found ${matches.length} templates${
            result.intent.summary ? ` for “${result.intent.summary}”` : ""
          }. Top picks: ${topNames}. Preview them, then Customize.`
        : "Browse the full library from Templates if you want more options.";

      set((state) => ({
        isRecommending: false,
        recommendationsOpen: true,
        recommendations: matches,
        recommendIntent: result.intent,
        selectedRecommendationId: matches[0]?.template.id ?? null,
        messages: state.messages.map((m, i, arr) =>
          i === arr.length - 1
            ? {
                ...m,
                streaming: false,
                content: opts?.reuseChat
                  ? `${m.content}\n\n${content}`
                  : content,
              }
            : m
        ),
      }));
    } catch (err) {
      set((state) => ({
        isRecommending: false,
        recommendationsOpen: true,
        messages: state.messages.map((m, i, arr) =>
          i === arr.length - 1
            ? {
                ...m,
                streaming: false,
                content:
                  err instanceof Error
                    ? err.message
                    : "Template recommendation failed. Try again.",
              }
            : m
        ),
      }));
    }
  },

  selectRecommendation: (templateId) =>
    set({ selectedRecommendationId: templateId }),

  customizeRecommendation: async (templateId, opts) => {
    const prompt = get().recommendPrompt || get().presentation.title;
    const record = await getTemplateRecordById(templateId);
    if (!record) return;

    if (opts?.loadOnly) {
      get().loadTemplate(templateId);
      set({ recommendationsOpen: false });
      return;
    }

    set({ isCustomizingTemplate: true });
    try {
      const intent =
        get().recommendIntent ?? analyzePresentationIntent(prompt);
      let presentation = customizeTemplateWithAI(record, intent);
      const { gatherResearch, applyResearchToPresentation, formatResearchReply } =
        await import("@/lib/ai/research");
      const { coachPresentation, formatCoachReply } = await import("@/lib/ai/coach");
      const research = await gatherResearch(intent);
      presentation = applyResearchToPresentation(presentation, research);
      const coach = coachPresentation(presentation, {
        audienceHint: intent.audience.join(" "),
      });
      const personality =
        BRAND_PERSONALITIES.find((p) => p.themeId === presentation.themeId)?.id ??
        get().personalityId;

      set((state) => ({
        ...pushHistory(state),
        isCustomizingTemplate: false,
        recommendationsOpen: false,
        personalityId: personality,
        presentation,
        selectedSlideId: presentation.slides[0]?.id ?? null,
        coachReport: coach,
        designSuggestions: buildDesignSuggestions(presentation, coach),
        suggestionChips: [
          "Make this slide more minimal.",
          "Use Apple-style design.",
          "Add a chart.",
        ],
        messages: [
          ...state.messages,
          {
            id: uid("msg"),
            role: "assistant",
            content: [
              `Customized “${record.name}” — layouts preserved, research + coach applied.`,
              "",
              formatResearchReply(research),
              "",
              formatCoachReply(coach),
            ].join("\n"),
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    } catch (err) {
      set({
        isCustomizingTemplate: false,
        messages: [
          ...get().messages,
          {
            id: uid("msg"),
            role: "assistant",
            content:
              err instanceof Error
                ? err.message
                : "Couldn’t customize that template. Try another match.",
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }
  },

  sendMessage: async (text, opts) => {
    const trimmed = text.trim();
    if (!trimmed || get().isGenerating || get().isRecommending) return;
    const silent = opts?.silent === true;

    // Restore original demo slides
    if (isRestoreOriginalIntent(trimmed)) {
      set((state) => ({
        voiceStatus: "processing",
        messages: silent
          ? state.messages
          : [
              ...state.messages,
              makeUserMessage(trimmed),
              makeAssistantMessage("Restoring the original demo slides…", true),
            ],
      }));
      await get().restoreOriginalDeck();
      set((state) => ({
        voiceStatus: "idle",
        messages: silent
          ? [
              ...state.messages,
              makeAssistantMessage("Restored the original demo slides."),
            ]
          : state.messages.map((m, i, arr) =>
              i === arr.length - 1 && m.role === "assistant"
                ? {
                    ...m,
                    content: "Restored the original demo slides.",
                    streaming: false,
                  }
                : m
            ),
      }));
      return;
    }

    // Citation / Works Cited requests from chat or voice (not counted as AI gen)
    const citeIntent = parseCitationChatIntent(trimmed);
    if (citeIntent) {
      if (!silent) {
        const userMsg = makeUserMessage(trimmed);
        set((state) => ({
          messages: [...state.messages, userMsg],
        }));
      }
      if (citeIntent.kind === "slide-only") {
        get().createReferencesSlide(citeIntent.slideTitle);
        return;
      }
      get().addCitationFromText(
        citeIntent.sourceText || get().presentation.title,
        { syncSlide: citeIntent.slideTitle }
      );
      return;
    }

    // Free-plan AI usage gate (Pro unlimited)
    try {
      const { useSubscriptionStore } = await import(
        "@/features/subscription/store"
      );
      if (!useSubscriptionStore.getState().recordAiRequest()) return;
    } catch {
      /* subscription optional at boot */
    }

    const assistantId = uid("msg");
    const assistant = { ...makeAssistantMessage("", true), id: assistantId };

    set((state) => ({
      messages: silent
        ? [...state.messages, assistant]
        : [...state.messages, makeUserMessage(trimmed), assistant],
      isGenerating: true,
      voiceStatus:
        state.voiceStatus === "listening" ? "processing" : state.voiceStatus,
      suggestionChips: [],
    }));

    const result = await runOrchestrator({
      text: trimmed,
      presentation: get().presentation,
      selectedSlideId: get().selectedSlideId,
      collaborator: get().collaborator,
      editContext: get().editContext,
      editorSelection: get().editorSelection,
    });

    // Silent voice edits: apply changes without keeping a chat transcript of the request.
    // Drop the placeholder assistant bubble on success; keep it only for clarifications.
    const dropAssistant = () =>
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== assistantId),
      }));

    const finishAssistant = (content: string) =>
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === assistantId
            ? { ...m, content, streaming: false }
            : m
        ),
      }));

    if (result.type === "clarify") {
      set((state) => ({
        isGenerating: false,
        voiceStatus: "idle",
        collaborator: result.collaborator,
        editorSelection: result.editorSelection,
        suggestionChips: result.chips,
        voiceDebugLogs: result.voiceLog
          ? [result.voiceLog, ...state.voiceDebugLogs].slice(0, 80)
          : state.voiceDebugLogs,
        messages: state.messages.map((m) =>
          m.id === assistantId
            ? { ...m, content: result.reply, streaming: false }
            : m
        ),
      }));
      return;
    }

    if (result.type === "edit") {
      const personality = result.themePersonality;
      const historyEntry: EditHistoryEntry = {
        id: uid("edit"),
        at: new Date().toISOString(),
        userText: trimmed,
        reply: result.reply,
        commandIds: result.commandIds,
        changedSlideIds: result.changedSlideIds,
      };
      set((state) => ({
        ...pushHistory(state),
        isGenerating: false,
        voiceStatus: "idle",
        collaborator: result.collaborator,
        presentation: result.presentation,
        selectedSlideId: result.selectedSlideId,
        editContext: result.editContext,
        editorSelection: result.editorSelection,
        editHistory: [historyEntry, ...state.editHistory].slice(0, 40),
        voiceDebugLogs: result.voiceLog
          ? [result.voiceLog, ...state.voiceDebugLogs].slice(0, 80)
          : state.voiceDebugLogs,
        personalityId: personality ?? state.personalityId,
        designSuggestions: buildDesignSuggestions(
          result.presentation,
          state.coachReport
        ),
        suggestionChips: silent
          ? state.suggestionChips
          : [
              "Move it to the top right.",
              "Make it bigger.",
              "Make the font 32.",
            ],
        messages: silent
          ? state.messages.filter((m) => m.id !== assistantId)
          : state.messages.map((m) =>
              m.id === assistantId
                ? { ...m, content: result.reply, streaming: false }
                : m
            ),
      }));
      return;
    }

    if (result.type === "collaborate") {
      if (silent) {
        set((state) => ({
          isGenerating: false,
          voiceStatus: "idle",
          collaborator: result.collaborator,
          suggestionChips: result.chips,
          messages: state.messages.map((m) =>
            m.id === assistantId
              ? { ...m, content: result.reply, streaming: false }
              : m
          ),
        }));
        return;
      }
      set((state) => ({
        isGenerating: false,
        voiceStatus: "idle",
        collaborator: result.collaborator,
        suggestionChips: result.chips,
        messages: state.messages.map((m) =>
          m.id === assistantId
            ? { ...m, content: result.reply, streaming: false }
            : m
        ),
      }));
      return;
    }

    if (result.type === "build") {
      const personality =
        BRAND_PERSONALITIES.find((p) => p.themeId === result.presentation.themeId)
          ?.id ?? get().personalityId;
      set((state) => ({
        ...pushHistory(state),
        isGenerating: false,
        voiceStatus: "idle",
        collaborator: result.collaborator,
        presentation: result.presentation,
        selectedSlideId: result.selectedSlideId,
        personalityId: personality,
        coachReport: result.coach,
        designSuggestions: buildDesignSuggestions(
          result.presentation,
          result.coach
        ),
        editContext: emptyEditContext(),
        recommendPrompt: trimmed,
        suggestionChips: silent
          ? []
          : [
              "Make this slide more minimal.",
              "Use Apple-style design.",
              "What might investors ask?",
            ],
        messages: silent
          ? state.messages.filter((m) => m.id !== assistantId)
          : state.messages.map((m) =>
              m.id === assistantId
                ? { ...m, content: result.reply, streaming: false }
                : m
            ),
      }));
      return;
    }

    if (result.type === "recommend") {
      set((state) => ({
        isGenerating: false,
        voiceStatus: "idle",
        collaborator: result.collaborator,
        messages: state.messages.map((m) =>
          m.id === assistantId
            ? { ...m, content: result.reply, streaming: false }
            : m
        ),
      }));
      await get().findTemplates(result.prompt, { reuseChat: true });
      return;
    }

    // Coach Q&A shortcut
    if (/what might (investors|they|professors) ask|coach me|review (my )?deck/i.test(trimmed)) {
      const { coachPresentation, formatCoachReply } = await import("@/lib/ai/coach");
      const coach = coachPresentation(get().presentation, {
        audienceHint: get().collaborator.brief.audience || get().recommendPrompt,
      });
      set((state) => ({
        isGenerating: false,
        voiceStatus: "idle",
        coachReport: coach,
        panelTab: "coach",
        messages: state.messages.map((m) =>
          m.id === assistantId
            ? { ...m, content: formatCoachReply(coach), streaming: false }
            : m
        ),
      }));
      return;
    }

    // Fall through — stream a generic assistant reply
    let content = "";
    for await (const event of mockStreamAssistant(trimmed)) {
      if (event.type === "token" && event.value) {
        content += event.value;
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantId ? { ...m, content } : m
          ),
        }));
      }
      if (event.type === "deck" && event.deck) {
        set((state) => ({
          ...pushHistory(state),
          presentation: event.deck!,
          selectedSlideId: event.deck!.slides[0]?.id ?? null,
        }));
      }
    }

    set((state) => ({
      isGenerating: false,
      voiceStatus: "idle",
      messages: silent
        ? state.messages.filter((m) => m.id !== assistantId)
        : state.messages.map((m) =>
            m.id === assistantId ? { ...m, content, streaming: false } : m
          ),
    }));
  },

  restoreOriginalDeck: async () => {
    const { createImportedPitchDemo } = await import("@/lib/demo/sample-deck");
    const { analyzeImportedPresentation } = await import(
      "@/features/import/analysis/analyze-import"
    );
    const { useImportStore } = await import("@/features/import/store");
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
      progressMessage: "Original demo restored",
      modalOpen: false,
    });
    set((state) => ({
      ...pushHistory(state),
      presentation: {
        ...deck,
        updatedAt: new Date().toISOString(),
      },
      selectedSlideId: deck.slides[0]?.id ?? null,
      editorSelection: emptyEditorSelection(),
      editContext: emptyEditContext(),
      future: [],
    }));
  },

  applyDemoDeck: async () => {
    const { createImportedPitchDemo } = await import("@/lib/demo/sample-deck");
    const { analyzeImportedPresentation } = await import(
      "@/features/import/analysis/analyze-import"
    );
    const { useImportStore } = await import("@/features/import/store");
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
    get().loadImportedPresentation(deck, {
      sourceLabel: deck.importMeta?.sourceFileName,
      openAnalysis: true,
    });
  },
}));
