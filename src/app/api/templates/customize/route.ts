import { NextRequest, NextResponse } from "next/server";
import { analyzePresentationIntent } from "@/lib/ai/intent";
import { customizeTemplateWithAI } from "@/lib/ai/customize-template";
import { getTemplateRecordById } from "@/lib/template-engine";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { templateId?: string; prompt?: string };
  try {
    body = (await req.json()) as { templateId?: string; prompt?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const templateId = body.templateId?.trim();
  const prompt = body.prompt?.trim();
  if (!templateId || !prompt) {
    return NextResponse.json(
      { error: "templateId and prompt are required" },
      { status: 400 }
    );
  }

  const template = await getTemplateRecordById(templateId);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const intent = analyzePresentationIntent(prompt);
  const presentation = customizeTemplateWithAI(template, intent);

  return NextResponse.json({ intent, presentation });
}
