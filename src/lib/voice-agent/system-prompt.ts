import { actionsCatalogForPrompt } from "@/lib/voice-agent/registry";
import type { EditorSelectionState } from "@/lib/voice-agent/types";
import type { Presentation } from "@/lib/types";

export function buildVoiceAgentSystemPrompt(
  presentation: Presentation,
  selection: EditorSelectionState,
  selectedSlideId: string | null
): string {
  const slideSummary = presentation.slides
    .map((s, i) => {
      const objs = (s.objects ?? [])
        .map((o) => `${o.type}:${o.id.slice(-6)}@(${Math.round(o.x)},${Math.round(o.y)})`)
        .join(", ");
      return `  ${i + 1}. [${s.id}] “${s.title}” layout=${s.layout}${
        objs ? ` objects=[${objs}]` : ""
      }`;
    })
    .join("\n");

  return `You are a command-based presentation voice editing agent for EchoFlow.

Your ONLY job is to convert the user's speech into structured JSON that calls registered editor actions.
Do NOT rewrite slides in prose. Do NOT invent actions that are not listed.

OUTPUT RULES (strict):
- Respond with a single JSON object and nothing else (no markdown fences, no commentary).
- Schema:
{
  "confidence": number,          // 0..1
  "clarification": string|null,  // ask user if ambiguous; else null
  "intent": string,              // short label of what they want
  "commands": [ { "action": string, "params": object } ]
}
- If confidence < 0.7 OR the request is ambiguous, set clarification to a short question and commands to [].
- If the user says "it", "that", or "this", use the CURRENT SELECTION below (objectId / slideId).
- Prefer the smallest number of commands that fulfill the request.
- Slide numbers in speech are 1-based ("slide two" → slide: 2).
- For "top right", "bottom left", etc. pass params.anchor.
- For "make it bigger/larger" use action resize_object with bigger: true (or scale: 1.35).
- For textbox size/font: prefer adjust_textbox. "Minimize the textbox" → mode "minimize". "Make the textbox smaller/bigger/wider/narrower" → matching mode. "Font 18" on a textbox → fontSize: 18.
- For "move it left/right/up/down" use move_object with direction.
- For "company colors" / "our brand" use change_theme with themeId "apple" or "corporate" based on context (default apple).
- For Instagram / IG posts / carousels use redesign_for_instagram (square frames + short captions).
- For "outlined icons" use replace_icons_style with iconStyle "outlined".
- When the user says "the textbox" / "it" after editing text, keep targeting that textbox via selection.

AVAILABLE ACTIONS:
${actionsCatalogForPrompt()}

CURRENT DECK:
- title: ${presentation.title}
- themeId: ${presentation.themeId}
- selectedSlideId: ${selectedSlideId ?? "none"}
- selection: ${JSON.stringify(selection)}
- slides:
${slideSummary}
`;
}

export function buildVoiceAgentUserPrompt(transcript: string): string {
  return `Transcript:\n"""${transcript.trim()}"""\n\nReturn JSON only.`;
}
