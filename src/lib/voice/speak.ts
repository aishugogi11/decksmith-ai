/** Client-side ElevenLabs playback via /api/tts */

let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;

export type SpeakOptions = {
  personalityId?: string;
  voiceId?: string;
  signal?: AbortSignal;
};

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }
}

export function isSpeaking(): boolean {
  return Boolean(currentAudio && !currentAudio.paused);
}

export async function speakText(
  text: string,
  options: SpeakOptions = {}
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  stopSpeaking();

  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: trimmed,
      personalityId: options.personalityId,
      voiceId: options.voiceId,
    }),
    signal: options.signal,
  });

  if (!res.ok) {
    let message = "Voice playback failed";
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  currentUrl = url;

  const audio = new Audio(url);
  currentAudio = audio;

  await new Promise<void>((resolve, reject) => {
    audio.onended = () => {
      stopSpeaking();
      resolve();
    };
    audio.onerror = () => {
      stopSpeaking();
      reject(new Error("Audio playback failed"));
    };
    void audio.play().catch((err) => {
      stopSpeaking();
      reject(err instanceof Error ? err : new Error("Audio playback failed"));
    });
  });
}
