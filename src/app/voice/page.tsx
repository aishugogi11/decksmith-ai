import VoiceGuide from "@/components/voice/VoiceGuide";

export const metadata = {
  title: "Lumen — Call Lumen",
  description:
    "Tell Lumen your errands. It builds a reasoned daily plan and hands off to Google Maps only when you navigate.",
};

export default function VoicePage() {
  return <VoiceGuide />;
}
