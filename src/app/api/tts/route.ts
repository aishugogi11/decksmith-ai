import { NextRequest, NextResponse } from "next/server";
import { resolveVoiceId } from "@/lib/voice/voices";

export const runtime = "nodejs";

const MAX_CHARS = 2500;

type Body = {
  text?: string;
  voiceId?: string;
  personalityId?: string;
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Missing ELEVENLABS_API_KEY. Add it to .env.local (see .env.example).",
      },
      { status: 503 }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = body.text?.trim() ?? "";
  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  const clipped = text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}…` : text;
  const voiceId = resolveVoiceId(body.personalityId, body.voiceId);
  const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";

  const elevenRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: clipped,
        model_id: modelId,
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.75,
          style: 0.2,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!elevenRes.ok) {
    const detail = await elevenRes.text().catch(() => "");
    let message = `ElevenLabs error (${elevenRes.status})`;
    try {
      const parsed = JSON.parse(detail) as {
        detail?: { message?: string } | string;
      };
      if (typeof parsed.detail === "string") message = parsed.detail;
      else if (parsed.detail?.message) message = parsed.detail.message;
    } catch {
      if (detail) message = detail.slice(0, 200);
    }
    return NextResponse.json({ error: message }, { status: elevenRes.status });
  }

  const audio = await elevenRes.arrayBuffer();
  return new NextResponse(audio, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
