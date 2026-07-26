interface LogoProps {
  size?: "sm" | "lg";
}

export default function Logo({ size = "sm" }: LogoProps) {
  const text = size === "lg" ? "text-5xl sm:text-6xl" : "text-lg";
  const mark = size === "lg" ? "h-10 w-10 sm:h-12 sm:w-12" : "h-7 w-7";

  return (
    <div className="inline-flex items-center gap-2.5">
      <span
        className={`${mark} relative grid place-items-center rounded-xl bg-gradient-to-br from-teal-600 to-cyan-700 shadow-lg shadow-teal-700/25`}
        aria-hidden
      >
        <span className="absolute inset-[3px] rounded-[10px] border border-white/25" />
        <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.9)]" />
      </span>
      <span
        className={`font-[family-name:var(--font-display)] font-semibold tracking-tight text-slate-900 ${text}`}
      >
        Lumen
      </span>
    </div>
  );
}
