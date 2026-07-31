import { ensureEditorActionsRegistered } from "@/lib/voice-agent/actions";
import { parseEnvelopeJson } from "@/lib/voice-agent/execute";
import { parseVoiceLocally } from "@/lib/voice-agent/local-parser";
import {
  buildVoiceAgentSystemPrompt,
  buildVoiceAgentUserPrompt,
} from "@/lib/voice-agent/system-prompt";
import type {
  VoiceAgentContext,
  VoiceCommandEnvelope,
} from "@/lib/voice-agent/types";

export type InterpretResult = {
  envelope: VoiceCommandEnvelope;
  source: "llm" | "local";
  rawModelText?: string;
};

/**
 * Convert transcript → structured JSON commands.
 * Prefers LLM when OPENAI_API_KEY is available (via /api/voice-command);
 * otherwise uses the deterministic local parser (same schema).
 */
export async function interpretVoiceCommand(
  transcript: string,
  ctx: VoiceAgentContext,
  opts?: { preferLocal?: boolean }
): Promise<InterpretResult> {
  ensureEditorActionsRegistered();

  if (!opts?.preferLocal) {
    try {
      const llm = await interpretViaApi(transcript, ctx);
      if (llm) return llm;
    } catch {
      /* fall through to local */
    }
  }

  return {
    envelope: parseVoiceLocally(transcript, ctx),
    source: "local",
  };
}

async function interpretViaApi(
  transcript: string,
  ctx: VoiceAgentContext
): Promise<InterpretResult | null> {
  if (typeof window === "undefined") {
    // Server-side: call OpenAI directly if key present
    return interpretViaOpenAI(transcript, ctx);
  }

  const res = await fetch("/api/voice-command", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript,
      presentation: summarizeForApi(ctx),
      selection: ctx.selection,
      selectedSlideId: ctx.selectedSlideId,
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    envelope?: VoiceCommandEnvelope;
    source?: "llm" | "local";
    raw?: string;
  };
  if (!data.envelope) return null;
  return {
    envelope: data.envelope,
    source: data.source === "llm" ? "llm" : "local",
    rawModelText: data.raw,
  };
}

export async function interpretViaOpenAI(
  transcript: string,
  ctx: VoiceAgentContext
): Promise<InterpretResult | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const system = buildVoiceAgentSystemPrompt(
    ctx.presentation,
    ctx.selection,
    ctx.selectedSlideId
  );
  const user = buildVoiceAgentUserPrompt(transcript);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VOICE_MODEL || "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) return null;

  return {
    envelope: parseEnvelopeJson(raw),
    source: "llm",
    rawModelText: raw,
  };
}

function summarizeForApi(ctx: VoiceAgentContext) {
  return {
    id: ctx.presentation.id,
    title: ctx.presentation.title,
    themeId: ctx.presentation.themeId,
    slides: ctx.presentation.slides.map((s) => ({
      id: s.id,
      layout: s.layout,
      title: s.title,
      objects: s.objects ?? [],
    })),
  };
}
