/**
 * Default public ElevenLabs voice IDs mapped to brand personalities.
 * Override globally with ELEVENLABS_VOICE_ID in .env.local (server only).
 */
export const PERSONALITY_VOICES: Record<string, string> = {
  professional: "21m00Tcm4TlvDq8ikWAM", // Rachel
  playful: "EXAVITQu4vr4xnSDxMaL", // Bella
  friendly: "XrExE9yKIg1WjnnlVkGX", // Matilda
  minimal: "pNInz6obpgDQGcFmaJgB", // Adam
  bold: "TxGEqnHWrfWFTfGW9XjX", // Josh
};

export function resolveVoiceId(personalityId?: string, voiceId?: string): string {
  if (voiceId?.trim()) return voiceId.trim();

  const envDefault =
    typeof process !== "undefined" ? process.env.ELEVENLABS_VOICE_ID : undefined;
  if (envDefault?.trim()) return envDefault.trim();

  if (personalityId && PERSONALITY_VOICES[personalityId]) {
    return PERSONALITY_VOICES[personalityId];
  }

  return PERSONALITY_VOICES.professional;
}
