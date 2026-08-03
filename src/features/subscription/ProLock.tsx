"use client";

import { Crown, Lock } from "lucide-react";
import { useSubscriptionStore } from "@/features/subscription/store";
import type { FeatureFlag } from "@/features/subscription/types";
import { cn } from "@/lib/utils";

export function ProBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800",
        className
      )}
    >
      <Crown className="h-3 w-3" />
      Pro
    </span>
  );
}

export function ProLockIcon({ className }: { className?: string }) {
  return <Lock className={cn("h-3.5 w-3.5 text-zinc-400", className)} />;
}

/** Wrap a control that requires Pro — shows lock + opens upgrade on click if gated. */
export function ProGate({
  feature,
  children,
  reason,
  className,
}: {
  feature: FeatureFlag;
  children: React.ReactNode;
  reason?: string;
  className?: string;
}) {
  const hasFeature = useSubscriptionStore((s) => s.hasFeature);
  const openUpgrade = useSubscriptionStore((s) => s.openUpgrade);
  const allowed = hasFeature(feature);

  if (allowed) return <>{children}</>;

  return (
    <div className={cn("relative", className)}>
      <div className="pointer-events-none opacity-50">{children}</div>
      <button
        type="button"
        onClick={() =>
          openUpgrade(
            reason ?? "This feature is available on EchoFlow Pro."
          )
        }
        className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/50"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950 px-3 py-1.5 text-[11px] font-semibold text-white shadow-md">
          <Lock className="h-3.5 w-3.5" />
          Upgrade to Pro
        </span>
      </button>
    </div>
  );
}
