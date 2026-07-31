import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-sm border border-stone-200/90 bg-white shadow-[0_24px_60px_rgba(28,25,23,0.08)]",
        className
      )}
    >
      {children}
    </div>
  );
}
