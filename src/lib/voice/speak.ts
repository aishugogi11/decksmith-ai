/**
 * Lumen voice output.
 * Prefers real WAV audio (/api/tts via macOS say) so sound works in Chrome
 * and Cursor’s browser. Falls back to speechSynthesis when TTS API is unavailable.
 */

let lastSpoken = "";
let unlocked = false;
let currentAudio: HTMLAudioElement | null = null;
let audioUnlocked = false;
let voicesReady: Promise<void> | null = null;

function delay(ms: number): Promise<void> {
  return new Promise((r) => window.setTimeout(r, ms));
}

function stopAudio(): void {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.src = "";
    } catch {
      // ignore
    }
    currentAudio = null;
  }
}

/** Play a WAV/URL through HTMLAudioElement (audible in embedded browsers). */
function playAudioUrl(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    stopAudio();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const audio = new Audio(url);
    audio.volume = 1;
    currentAudio = audio;

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (currentAudio === audio) currentAudio = null;
      resolve();
    };

    audio.onended = finish;
    audio.onerror = () => {
      if (settled) return;
      settled = true;
      if (currentAudio === audio) currentAudio = null;
      reject(new Error("audio playback failed"));
    };

    void audio.play().catch((err) => {
      if (settled) return;
      settled = true;
      if (currentAudio === audio) currentAudio = null;
      reject(err);
    });
  });
}

async function speakViaApi(text: string): Promise<boolean> {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return false;
    const blob = await res.blob();
    if (!blob.size) return false;
    const url = URL.createObjectURL(blob);
    try {
      await playAudioUrl(url);
      return true;
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return false;
  }
}

function ensureVoices(): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve();
  }

  if (!voicesReady) {
    voicesReady = new Promise((resolve) => {
      const existing = window.speechSynthesis.getVoices();
      if (existing.length) {
        resolve();
        return;
      }
      const onVoices = () => {
        window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
        resolve();
      };
      window.speechSynthesis.addEventListener("voiceschanged", onVoices);
      void window.speechSynthesis.getVoices();
      window.setTimeout(resolve, 400);
    });
  }

  return voicesReady;
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  return (
    voices.find(
      (v) =>
        /en-US/i.test(v.lang) &&
        /Google|Samantha|Karen|Moira|Jenny|Aria|Female/i.test(v.name)
    ) ||
    voices.find((v) => /en-US/i.test(v.lang) && !/compact/i.test(v.name)) ||
    voices.find((v) => /^en/i.test(v.lang)) ||
    voices[0] ||
    null
  );
}

function chunkText(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  for (const sentence of sentences) {
    if (sentence.length <= 180) {
      chunks.push(sentence);
      continue;
    }
    let buf = "";
    for (const part of sentence.split(/(?<=,)\s+/)) {
      if ((buf + " " + part).trim().length > 160 && buf) {
        chunks.push(buf.trim());
        buf = part;
      } else {
        buf = `${buf} ${part}`.trim();
      }
    }
    if (buf) chunks.push(buf.trim());
  }
  return chunks.length ? chunks : [cleaned];
}

function speakChunkSynth(text: string): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1.02;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voice = pickVoice();
    if (voice) utterance.voice = voice;

    let settled = false;
    let started = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearInterval(keepAlive);
      window.clearTimeout(safety);
      resolve();
    };

    const keepAlive = window.setInterval(() => {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        return;
      }
      if (started && !window.speechSynthesis.speaking) {
        finish();
      }
    }, 200);

    const safety = window.setTimeout(
      finish,
      Math.min(25_000, 2500 + text.length * 60)
    );

    utterance.onstart = () => {
      started = true;
    };
    utterance.onend = finish;
    utterance.onerror = () => finish();

    try {
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
      window.setTimeout(() => {
        if (window.speechSynthesis.speaking) started = true;
        if (!started && !window.speechSynthesis.speaking) {
          window.speechSynthesis.resume();
        }
      }, 120);
    } catch {
      finish();
    }
  });
}

async function speakViaSynth(text: string): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  await ensureVoices();
  window.speechSynthesis.cancel();
  await delay(40);
  window.speechSynthesis.resume();

  for (const chunk of chunkText(text)) {
    await speakChunkSynth(chunk);
    await delay(60);
  }
}

export function speak(text: string): void {
  void speakAsync(text);
}

export async function speakAsync(text: string): Promise<void> {
  const cleaned = text.trim();
  if (!cleaned) return;
  lastSpoken = cleaned;

  // Prefer real audio (works when speechSynthesis is silent)
  const ok = await speakViaApi(cleaned);
  if (ok) return;

  await speakViaSynth(cleaned);
}

/** Kick off greeting WAV inside a click handler (autoplay-safe). */
export function playGreetingNow(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  lastSpoken = "How can I help you?";
  unlocked = true;
  return playAudioUrl("/voice/greeting.wav");
}

/**
 * Speak from a click/tap. Plays the canned greeting WAV immediately when
 * possible, then falls through to /api/tts or speechSynthesis.
 */
export async function speakFromUserGesture(text: string): Promise<void> {
  const cleaned = text.trim();
  if (!cleaned) return;
  lastSpoken = cleaned;
  unlocked = true;

  // Instant canned greeting — no network wait
  if (/^how can i help you\??$/i.test(cleaned)) {
    try {
      await playAudioUrl("/voice/greeting.wav");
      return;
    } catch {
      // fall through
    }
  }

  const ok = await speakViaApi(cleaned);
  if (ok) return;

  // Last resort: speechSynthesis in the gesture turn
  if (typeof window !== "undefined" && window.speechSynthesis) {
    void window.speechSynthesis.getVoices();
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    await speakViaSynth(cleaned);
  }
}

export function stopSpeaking(): void {
  stopAudio();
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

export function canSpeak(): boolean {
  return typeof window !== "undefined";
}

export function getLastSpoken(): string {
  return lastSpoken;
}

export function replayLastSpoken(): Promise<void> {
  if (!lastSpoken) return Promise.resolve();
  return speakFromUserGesture(lastSpoken);
}

/**
 * Unlock HTML audio from a user gesture (required before autoplay).
 */
export function unlockSpeech(): void {
  if (typeof window === "undefined") return;
  unlocked = true;

  try {
    if (window.speechSynthesis) {
      window.speechSynthesis.resume();
      void window.speechSynthesis.getVoices();
    }
  } catch {
    // ignore
  }

  if (audioUnlocked) return;
  try {
    const silent = new Audio(
      "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA="
    );
    silent.volume = 0.01;
    void silent.play().then(() => {
      silent.pause();
      audioUnlocked = true;
    });
  } catch {
    // ignore
  }
}

export function isSpeechUnlocked(): boolean {
  return unlocked;
}

export function formatDistanceMiles(miles: number): string {
  if (!Number.isFinite(miles) || miles < 0) return "nearby";
  if (miles < 0.05) return "just around the corner";
  if (miles < 1) return `${miles.toFixed(1)} miles`;
  if (miles < 10) return `${miles.toFixed(1)} miles`;
  return `${Math.round(miles)} miles`;
}

export function isNavigateIntent(transcript: string): boolean {
  const t = transcript.toLowerCase().trim();
  return (
    /\bnavigate\b/.test(t) ||
    /\bdirections?\b/.test(t) ||
    /\bgoogle maps\b/.test(t) ||
    /\bopen maps?\b/.test(t) ||
    /\btake me there\b/.test(t) ||
    /\bgo there\b/.test(t) ||
    /\bstart navigation\b/.test(t) ||
    /\bdrive there\b/.test(t) ||
    /\bbring me there\b/.test(t) ||
    /\bpull\s+(?:it|this|that)\s+up\b/.test(t) ||
    /\bopen\s+(?:it|this|that)\b/.test(t)
  );
}

export function parseNavigateToTarget(transcript: string): string | null {
  const cleaned = stripWakeWord(transcript.trim());

  const isNavCommand =
    /\bnavigate\s+to\b/i.test(cleaned) ||
    /\btake\s+me\s+to\b/i.test(cleaned) ||
    /\bdrive\s+(?:me\s+)?to\b/i.test(cleaned) ||
    /\bpull\s+up\b/i.test(cleaned) ||
    /\bopen\b.+\bin\s+(?:google\s+)?maps\b/i.test(cleaned);

  if (!isNavCommand) return null;

  if (/\b(?:and|then)\b/i.test(cleaned) && !/\bnavigate\s+to\b/i.test(cleaned)) {
    return null;
  }

  const m =
    cleaned.match(/\bnavigate\s+to\s+(.+)$/i) ||
    cleaned.match(/\btake\s+me\s+to\s+(.+)$/i) ||
    cleaned.match(/\bdrive\s+(?:me\s+)?to\s+(.+)$/i) ||
    cleaned.match(/\bpull\s+up\s+(.+)$/i) ||
    cleaned.match(/\bopen\s+(.+?)\s+in\s+(?:google\s+)?maps\b/i);

  if (!m?.[1]) return null;
  const name = m[1]
    .trim()
    .replace(/[.!?]+$/g, "")
    .replace(/\s+please$/i, "")
    .trim();
  if (!name) return null;
  if (/^(?:the\s+)?next(?:\s+(?:location|stop|place|destination|one))?$/i.test(name)) {
    return null;
  }
  if (/^(?:it|this|that|maps?|google maps)$/i.test(name)) return null;

  if (
    /\b(grocer|prescription|pharmacy|dinner|coffee|and then|head home|back home)\b/i.test(
      name
    )
  ) {
    return null;
  }

  return name;
}

export function looksLikePlanRequest(transcript: string): boolean {
  const t = stripWakeWord(transcript.trim()).toLowerCase();
  if (!t) return false;
  if (/\bnavigate\b/.test(t) && !/\band\b|\bthen\b/.test(t)) return false;
  return (
    /\b(grocer|prescription|pharmacy|dinner|lunch|coffee|errand|pick up|head home|back home|need to|want to|go to the)\b/i.test(
      t
    ) || /\b(?:and|then)\b/.test(t)
  );
}

export function isNextLocationIntent(transcript: string): boolean {
  const t = transcript.toLowerCase().trim();
  return (
    /\bnext\s+(?:location|stop|place|destination|one)\b/.test(t) ||
    /\bpull\s+up\s+(?:the\s+)?next\b/.test(t) ||
    /\bopen\s+(?:the\s+)?next\b/.test(t) ||
    /\bnavigate\s+to\s+(?:the\s+)?next\b/.test(t) ||
    /\btake\s+me\s+to\s+(?:the\s+)?next\b/.test(t) ||
    /\bgo\s+to\s+(?:the\s+)?next\b/.test(t)
  );
}

export function isHangUpIntent(transcript: string): boolean {
  const t = transcript.toLowerCase().trim();
  return (
    /\b(hang up|end call|goodbye|good bye|stop listening|cancel)\b/.test(t)
  );
}

export function hasWakeWord(transcript: string): boolean {
  return /\b(?:hey|hi|ok|okay)?\s*lumen\b/i.test(transcript.trim());
}

export function stripWakeWord(transcript: string): string {
  return transcript
    .trim()
    .replace(/^(?:hey|hi|ok|okay)?\s*lumen[,.!?]?\s*/i, "")
    .trim();
}
