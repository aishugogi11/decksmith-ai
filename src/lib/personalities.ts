import type { ThemeId } from "@/lib/types";

/** Blueprint-style brand personality → theme mapping */
export const BRAND_PERSONALITIES: {
  id: string;
  label: string;
  description: string;
  themeId: ThemeId;
}[] = [
  {
    id: "professional",
    label: "Professional",
    description: "Authoritative. Credible. Polished.",
    themeId: "corporate",
  },
  {
    id: "playful",
    label: "Playful",
    description: "Fun. Light-hearted. Engaging.",
    themeId: "startup",
  },
  {
    id: "friendly",
    label: "Friendly",
    description: "Warm. Approachable. Helpful.",
    themeId: "education",
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Quiet. Clean. Editorial.",
    themeId: "minimal",
  },
  {
    id: "bold",
    label: "Bold",
    description: "Confident. High contrast. Modern.",
    themeId: "dark",
  },
];
