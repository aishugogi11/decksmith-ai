import { NextResponse } from "next/server";
import { runVisualAssist } from "@/features/visual-assistant/assist";
import type { VisualDeckContext } from "@/features/visual-assistant/types";

/**
 * Conversational Visual Assistant turn (clarify → search → recommend).
 * Client also runs this locally; the route exists for future model-backed assists.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      message?: string;
      context?: VisualDeckContext;
      forceSearch?: boolean;
    };
    const message = body.message?.trim();
    if (!message) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }
    const context: VisualDeckContext = body.context ?? {
      title: "Untitled deck",
      themeId: "apple",
      designStyle: "modern presentation",
      slide: null,
    };
    const turn = runVisualAssist(message, context, {
      forceSearch: body.forceSearch,
    });
    return NextResponse.json({ turn });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Assist failed" },
      { status: 500 }
    );
  }
}
