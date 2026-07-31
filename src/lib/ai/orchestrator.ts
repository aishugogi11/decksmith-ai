import {
  continueCollaboration,
  emptyCollaboratorState,
  isVagueCreateRequest,
  mergeBriefIntoIntent,
  startCollaboration,
  type CollaboratorState,
} from "@/lib/ai/collaborator";
import { coachPresentation, formatCoachReply, type CoachReport } from "@/lib/ai/coach";
import { customizeTemplateWithAI } from "@/lib/ai/customize-template";
import { analyzePresentationIntent, isTemplateDiscoveryIntent } from "@/lib/ai/intent";
import { recommendTemplates } from "@/lib/ai/recommend";
import {
  applyResearchToPresentation,
  formatResearchReply,
  gatherResearch,
} from "@/lib/ai/research";
import {
  emptyEditContext,
  type EditConversationContext,
} from "@/lib/ai/edit-engine";
import {
  emptyEditorSelection,
  runVoiceAgent,
  type EditorSelectionState,
  type VoiceDebugLogEntry,
} from "@/lib/voice-agent";
import type { Presentation } from "@/lib/types";

export type OrchestratorContext = {
  text: string;
  presentation: Presentation;
  selectedSlideId: string | null;
  collaborator: CollaboratorState;
  editContext?: EditConversationContext;
  editorSelection?: EditorSelectionState;
};

export type OrchestratorResult =
  | {
      type: "edit";
      presentation: Presentation;
      selectedSlideId: string | null;
      reply: string;
      themePersonality?: string;
      collaborator: CollaboratorState;
      editContext: EditConversationContext;
      editorSelection: EditorSelectionState;
      changedSlideIds: string[];
      commandIds: string[];
      voiceLog?: VoiceDebugLogEntry;
    }
  | {
      type: "clarify";
      reply: string;
      chips: string[];
      collaborator: CollaboratorState;
      editorSelection: EditorSelectionState;
      voiceLog?: VoiceDebugLogEntry;
    }
  | {
      type: "collaborate";
      reply: string;
      chips: string[];
      collaborator: CollaboratorState;
    }
  | {
      type: "build";
      presentation: Presentation;
      selectedSlideId: string | null;
      reply: string;
      coach: CoachReport;
      collaborator: CollaboratorState;
      autoTemplateName?: string;
    }
  | {
      type: "recommend";
      prompt: string;
      reply: string;
      collaborator: CollaboratorState;
    }
  | {
      type: "fallback";
      collaborator: CollaboratorState;
    };

/**
 * Creative collaborator brain: interview → smart template → research → coach,
 * plus live voice/text edits on the open deck.
 */
export async function runOrchestrator(
  ctx: OrchestratorContext
): Promise<OrchestratorResult> {
  const text = ctx.text.trim();
  let collaborator = ctx.collaborator.active
    ? ctx.collaborator
    : emptyCollaboratorState();

  // 1) Command-based voice/text editing (JSON actions → deterministic execute)
  if (ctx.presentation.slides.length > 0 && !ctx.collaborator.active) {
    const selection = ctx.editorSelection ?? emptyEditorSelection();
    const voice = await runVoiceAgent(
      text,
      ctx.presentation,
      ctx.selectedSlideId,
      selection
    );
    if (voice) {
      if (voice.kind === "clarify") {
        return {
          type: "clarify",
          reply: voice.reply,
          chips: [
            "Create a textbox on slide two.",
            "Move it to the top right.",
            "Make it bigger.",
          ],
          collaborator,
          editorSelection: voice.selection,
          voiceLog: voice.log,
        };
      }
      if (voice.kind === "executed") {
        const editContext = ctx.editContext ?? emptyEditContext();
        return {
          type: "edit",
          presentation: voice.presentation,
          selectedSlideId: voice.selectedSlideId,
          reply: voice.reply,
          themePersonality: voice.themePersonality,
          collaborator,
          editContext: {
            ...editContext,
            lastAction: voice.selection.lastAction,
            lastSlideId: voice.selection.slideId,
            lastChangedSlideIds: voice.changedSlideIds,
            lastReferent: voice.selection.objectId
              ? {
                  kind:
                    voice.selection.objectType === "chart"
                      ? "chart"
                      : voice.selection.objectType === "image"
                        ? "image"
                        : "text",
                  slideId: voice.selection.slideId,
                  label: voice.selection.objectId,
                }
              : editContext.lastReferent,
            turns: [
              ...editContext.turns,
              {
                role: "user" as const,
                text,
                at: new Date().toISOString(),
              },
              {
                role: "assistant" as const,
                text: voice.reply,
                at: new Date().toISOString(),
              },
            ].slice(-24),
          },
          editorSelection: voice.selection,
          changedSlideIds: voice.changedSlideIds,
          commandIds: voice.envelope.commands.map((c) => c.action),
          voiceLog: voice.log,
        };
      }
      // noop with log (parse error etc.)
      if (voice.log) {
        return {
          type: "clarify",
          reply: voice.reply,
          chips: ["Create a textbox on slide two."],
          collaborator,
          editorSelection: voice.selection,
          voiceLog: voice.log,
        };
      }
    }
  }

  // 2) Continue multi-turn interview
  if (ctx.collaborator.active) {
    const turn = continueCollaboration(ctx.collaborator, text);
    if (turn.kind === "question") {
      return {
        type: "collaborate",
        reply: turn.question,
        chips: turn.chips,
        collaborator: turn.state,
      };
    }
    // Ready → smart build
    return buildFromPrompt(turn.prompt, turn.state);
  }

  // 3) Start interview for vague creates
  if (isVagueCreateRequest(text)) {
    const turn = startCollaboration(text);
    if (turn.kind === "question") {
      return {
        type: "collaborate",
        reply: `Love it — let's shape this together.\n\n${turn.question}`,
        chips: turn.chips,
        collaborator: turn.state,
      };
    }
    return buildFromPrompt(turn.prompt, turn.state);
  }

  // 4) Specific create → smart template match + research + coach
  if (isTemplateDiscoveryIntent(text) && text.split(/\s+/).length >= 8) {
    return buildFromPrompt(text, collaborator);
  }

  // 5) Short create with some signal → recommend panel
  if (isTemplateDiscoveryIntent(text)) {
    return {
      type: "recommend",
      prompt: text,
      reply: "I'll find templates that fit — or we can keep chatting to refine.",
      collaborator,
    };
  }

  return { type: "fallback", collaborator };
}

async function buildFromPrompt(
  prompt: string,
  collaborator: CollaboratorState
): Promise<OrchestratorResult> {
  let intent = analyzePresentationIntent(prompt);
  intent = mergeBriefIntoIntent(intent, collaborator.brief);

  const { matches } = await recommendTemplates(prompt, 8);
  const top = matches[0]?.template;
  if (!top) {
    return {
      type: "recommend",
      prompt,
      reply: "I couldn't lock a template — browse the library or add more detail.",
      collaborator: { ...collaborator, active: false },
    };
  }

  let presentation = customizeTemplateWithAI(top, intent);
  const research = await gatherResearch(intent);
  presentation = applyResearchToPresentation(presentation, research);

  const coach = coachPresentation(presentation, {
    audienceHint: intent.audience.join(" ") || collaborator.brief.audience,
  });

  const reply = [
    `I matched “${top.name}” for “${intent.summary || prompt}”, customized the copy, and ran research + a coach pass.`,
    "",
    formatResearchReply(research),
    "",
    formatCoachReply(coach),
  ].join("\n");

  return {
    type: "build",
    presentation,
    selectedSlideId: presentation.slides[0]?.id ?? null,
    reply,
    coach,
    collaborator: { ...collaborator, active: false },
    autoTemplateName: top.name,
  };
}
