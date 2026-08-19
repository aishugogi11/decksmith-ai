import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextResponse } from "next/server";

const execFileAsync = promisify(execFile);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CHARS = 500;

/**
 * Local TTS via macOS `say` → WAV.
 * Reliable audio playback through <audio> (speechSynthesis is often silent
 * in embedded browsers).
 */
export async function POST(req: Request) {
  let text = "";
  try {
    const body = (await req.json()) as { text?: string };
    text = String(body.text ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_CHARS);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  // Strip characters that confuse `say` / shell
  const safe = text.replace(/[^\w\s.,!?'\-:$%/]/g, " ").replace(/\s+/g, " ").trim();
  if (!safe) {
    return NextResponse.json({ error: "Nothing to speak" }, { status: 400 });
  }

  const dir = await mkdtemp(path.join(tmpdir(), "lumen-tts-"));
  const outPath = path.join(dir, "out.wav");
  const scriptPath = path.join(dir, "script.txt");

  try {
    await writeFile(scriptPath, safe, "utf8");

    // Prefer Samantha; fall back to system default
    try {
      await execFileAsync(
        "say",
        ["-v", "Samantha", "-f", scriptPath, "-o", outPath, "--data-format=LEI16@22050"],
        { timeout: 20_000 }
      );
    } catch {
      await execFileAsync(
        "say",
        ["-f", scriptPath, "-o", outPath, "--data-format=LEI16@22050"],
        { timeout: 20_000 }
      );
    }

    const wav = await readFile(outPath);
    return new NextResponse(wav, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "TTS failed";
    return NextResponse.json(
      {
        error: "TTS unavailable",
        detail: message,
        hint: "This endpoint uses macOS say. On other OS, browser speechSynthesis is used.",
      },
      { status: 503 }
    );
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}
