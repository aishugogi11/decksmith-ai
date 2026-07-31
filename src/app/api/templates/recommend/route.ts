import { NextRequest, NextResponse } from "next/server";
import { recommendTemplates } from "@/lib/ai/recommend";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { prompt?: string; limit?: number };
  try {
    body = (await req.json()) as { prompt?: string; limit?: number };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const result = await recommendTemplates(prompt, body.limit ?? 8);
  return NextResponse.json({
    intent: result.intent,
    matches: result.matches.map((m) => ({
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
    })),
  });
}
