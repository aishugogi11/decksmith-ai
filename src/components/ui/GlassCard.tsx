import { type ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section";
}

/** Frosted glass surface used across results & map panels */
export default function GlassCard({
  children,
  className = "",
  as: Tag = "div",
}: GlassCardProps) {
  return (
    <Tag
      className={`rounded-2xl border border-white/50 bg-white/70 shadow-[0_8px_40px_rgba(11,18,32,0.08)] backdrop-blur-xl ${className}`}
    >
      {children}
    </Tag>
  );
}
