import { NextResponse } from "next/server";
import { ensureEditorActionsRegistered } from "@/lib/voice-agent/actions";
import { parseEnvelopeJson } from "@/lib/voice-agent/execute";
import { interpretViaOpenAI } from "@/lib/voice-agent/interpret";
import { parseVoiceLocally } from "@/lib/voice-agent/local-parser";
import type { EditorSelectionState } from "@/lib/voice-agent/types";
import type { Presentation } from "@/lib/types";

export const runtime = "nodejs";

type Body = {
  transcript?: string;
  presentation?: {
    id: string;
    title: string;
    themeId: Presentation["themeId"];
    slides: Presentation["slides"];
  };
  selection?: EditorSelectionState;
  selectedSlideId?: string | null;
};

/**
 * Speech → structured JSON commands.
 * Uses OpenAI when OPENAI_API_KEY is set; otherwise deterministic local parser.
 */
export async function POST(req: Request) {
  try {
    ensureEditorActionsRegistered();
    const body = (await req.json()) as Body;
    const transcript = body.transcript?.trim();
    if (!transcript) {
      return NextResponse.json({ error: "Missing transcript" }, { status: 400 });
    }

    const presentation = toPresentation(body.presentation);
    const selection = body.selection ?? {
      slideId: null,
      objectId: null,
      objectType: null,
      lastAction: null,
    };
    const ctx = {
      presentation,
      selectedSlideId: body.selectedSlideId ?? null,
      selection,
    };

    const llm = await interpretViaOpenAI(transcript, ctx);
    if (llm) {
      return NextResponse.json({
        envelope: llm.envelope,
        source: "llm",
        raw: llm.rawModelText,
      });
    }

    const envelope = parseVoiceLocally(transcript, ctx);
    return NextResponse.json({
      envelope,
      source: "local",
      raw: JSON.stringify(envelope),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Voice command failed";
    // Attempt to surface parse errors clearly
    try {
      if (typeof err === "object" && err && "raw" in err) {
        parseEnvelopeJson(String((err as { raw: string }).raw));
      }
    } catch {
      /* ignore */
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function toPresentation(
  raw: Body["presentation"]
): Presentation {
  const now = new Date().toISOString();
  if (!raw?.slides?.length) {
    return {
      id: "tmp",
      title: "Untitled",
      themeId: "minimal",
      slides: [{ id: "s1", layout: "section", title: "Slide 1", objects: [] }],
      createdAt: now,
      updatedAt: now,
    };
  }
  return {
    id: raw.id,
    title: raw.title,
    themeId: raw.themeId,
    slides: raw.slides,
    createdAt: now,
    updatedAt: now,
  };
}
