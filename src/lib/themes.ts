import type { ThemeId } from "@/lib/types";

export interface ThemeTokens {
  id: ThemeId;
  label: string;
  description: string;
  slideBg: string;
  slideFg: string;
  muted: string;
  accent: string;
  accentSoft: string;
  card: string;
  border: string;
  fontDisplay: string;
}

export const THEMES: Record<ThemeId, ThemeTokens> = {
  apple: {
    id: "apple",
    label: "Apple",
    description: "Clean, bold, lots of space",
    slideBg: "linear-gradient(180deg, #f5f5f7 0%, #e8e8ed 100%)",
    slideFg: "#1d1d1f",
    muted: "#6e6e73",
    accent: "#0071e3",
    accentSoft: "rgba(0,113,227,0.12)",
    card: "rgba(255,255,255,0.72)",
    border: "rgba(0,0,0,0.08)",
    fontDisplay: "var(--font-display)",
  },
  microsoft: {
    id: "microsoft",
    label: "Microsoft",
    description: "Fluent, confident, corporate-ready",
    slideBg: "linear-gradient(135deg, #f3f6fb 0%, #e7eef8 100%)",
    slideFg: "#1b1b1b",
    muted: "#605e5c",
    accent: "#0078d4",
    accentSoft: "rgba(0,120,212,0.12)",
    card: "#ffffff",
    border: "rgba(0,0,0,0.08)",
    fontDisplay: "var(--font-display)",
  },
  google: {
    id: "google",
    label: "Google",
    description: "Colorful, friendly, product-forward",
    slideBg: "linear-gradient(160deg, #ffffff 0%, #f8fafc 100%)",
    slideFg: "#202124",
    muted: "#5f6368",
    accent: "#1a73e8",
    accentSoft: "rgba(26,115,232,0.12)",
    card: "#ffffff",
    border: "rgba(60,64,67,0.12)",
    fontDisplay: "var(--font-display)",
  },
  minimal: {
    id: "minimal",
    label: "Minimal",
    description: "Quiet type, strong hierarchy",
    slideBg: "#fafafa",
    slideFg: "#111111",
    muted: "#737373",
    accent: "#111111",
    accentSoft: "rgba(17,17,17,0.06)",
    card: "#ffffff",
    border: "rgba(0,0,0,0.08)",
    fontDisplay: "var(--font-display)",
  },
  startup: {
    id: "startup",
    label: "Startup",
    description: "Energetic gradients, punchy stats",
    slideBg: "linear-gradient(145deg, #0b1220 0%, #132033 55%, #0f766e 160%)",
    slideFg: "#f8fafc",
    muted: "#94a3b8",
    accent: "#2dd4bf",
    accentSoft: "rgba(45,212,191,0.16)",
    card: "rgba(15,23,42,0.55)",
    border: "rgba(255,255,255,0.1)",
    fontDisplay: "var(--font-display)",
  },
  corporate: {
    id: "corporate",
    label: "Corporate",
    description: "Navy, trustworthy, boardroom-ready",
    slideBg: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
    slideFg: "#f8fafc",
    muted: "#94a3b8",
    accent: "#38bdf8",
    accentSoft: "rgba(56,189,248,0.14)",
    card: "rgba(30,41,59,0.8)",
    border: "rgba(148,163,184,0.2)",
    fontDisplay: "var(--font-display)",
  },
  education: {
    id: "education",
    label: "Education",
    description: "Warm, clear, classroom-friendly",
    slideBg: "linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%)",
    slideFg: "#1c1917",
    muted: "#78716c",
    accent: "#ea580c",
    accentSoft: "rgba(234,88,12,0.12)",
    card: "rgba(255,255,255,0.8)",
    border: "rgba(120,113,108,0.15)",
    fontDisplay: "var(--font-display)",
  },
  luxury: {
    id: "luxury",
    label: "Luxury",
    description: "Deep charcoal with gold accents",
    slideBg: "linear-gradient(160deg, #0c0a09 0%, #1c1917 100%)",
    slideFg: "#fafaf9",
    muted: "#a8a29e",
    accent: "#d6b25e",
    accentSoft: "rgba(214,178,94,0.14)",
    card: "rgba(28,25,23,0.75)",
    border: "rgba(214,178,94,0.18)",
    fontDisplay: "var(--font-display)",
  },
  dark: {
    id: "dark",
    label: "Dark",
    description: "High contrast night mode",
    slideBg: "#09090b",
    slideFg: "#fafafa",
    muted: "#a1a1aa",
    accent: "#a3e635",
    accentSoft: "rgba(163,230,53,0.12)",
    card: "#18181b",
    border: "rgba(255,255,255,0.08)",
    fontDisplay: "var(--font-display)",
  },
  gradient: {
    id: "gradient",
    label: "Gradient",
    description: "Bold mesh backgrounds",
    slideBg:
      "radial-gradient(circle at 20% 20%, #164e63 0%, transparent 40%), radial-gradient(circle at 80% 0%, #4c1d95 0%, transparent 35%), linear-gradient(160deg, #020617 0%, #0f172a 100%)",
    slideFg: "#f8fafc",
    muted: "#94a3b8",
    accent: "#22d3ee",
    accentSoft: "rgba(34,211,238,0.14)",
    card: "rgba(15,23,42,0.55)",
    border: "rgba(255,255,255,0.12)",
    fontDisplay: "var(--font-display)",
  },
  instagram: {
    id: "instagram",
    label: "Instagram",
    description: "Square carousel — bold type, short captions",
    slideBg:
      "linear-gradient(145deg, #1a0a12 0%, #3b1028 42%, #c13584 120%)",
    slideFg: "#fff7fb",
    muted: "#f5c6de",
    accent: "#f77737",
    accentSoft: "rgba(247,119,55,0.2)",
    card: "rgba(26,10,18,0.55)",
    border: "rgba(255,255,255,0.14)",
    fontDisplay: "var(--font-display)",
  },
};

export const THEME_LIST = Object.values(THEMES);
