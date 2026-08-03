"use client";

import { Check, Crown, X } from "lucide-react";
import { useSubscriptionStore } from "@/features/subscription/store";
import { FREE_LIMITS } from "@/features/subscription/types";

const PRO_PERKS = [
  "Feedback → Redesign on imported decks",
  "Research Mode — stats, sources & citations",
  "Unlimited generations & voice editing",
  "Presentation Coach with Apply actions",
  "Premium templates & advanced themes",
  "Brand Kit (coming soon)",
  "Priority support & unlimited exports",
];

/**
 * Upgrade modal — Stripe-ready shell (no billing yet).
 * “Upgrade to Pro” toggles local plan for demos; swap for Checkout later.
 */
export function UpgradeModal() {
  const open = useSubscriptionStore((s) => s.upgradeOpen);
  const reason = useSubscriptionStore((s) => s.upgradeReason);
  const closeUpgrade = useSubscriptionStore((s) => s.closeUpgrade);
  const setPlan = useSubscriptionStore((s) => s.setPlan);
  const plan = useSubscriptionStore((s) => s.plan);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]"
        aria-label="Close upgrade modal"
        onClick={closeUpgrade}
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="upgrade-title"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.2)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-6 py-5">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
              <Crown className="h-3.5 w-3.5" />
              EchoFlow Pro
            </p>
            <h2
              id="upgrade-title"
              className="mt-1 text-xl font-bold tracking-tight text-zinc-950"
            >
              Unlock the full workspace
            </h2>
            {reason && (
              <p className="mt-2 text-sm text-zinc-600">{reason}</p>
            )}
          </div>
          <button
            type="button"
            onClick={closeUpgrade}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p className="text-sm text-zinc-500">
            Free includes create, voice edit, basic templates, and{" "}
            {FREE_LIMITS.aiRequestsPerDay} edits/day. Pro removes limits
            and unlocks Research, Coach, and Feedback redesign.
          </p>
          <ul className="space-y-2">
            {PRO_PERKS.map((p) => (
              <li
                key={p}
                className="flex items-start gap-2 text-sm text-zinc-800"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {p}
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-zinc-400">
            Billing is not connected yet — this toggles Pro locally so you can
            demo gated features. Wire Stripe Checkout here later.
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-zinc-100 px-6 py-4 sm:flex-row sm:justify-end">
          {plan === "pro" ? (
            <button
              type="button"
              onClick={() => setPlan("free")}
              className="rounded-2xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-700"
            >
              Switch to Free (demo)
            </button>
          ) : null}
          <button
            type="button"
            onClick={closeUpgrade}
            className="rounded-2xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-700"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={() => setPlan("pro")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Crown className="h-4 w-4" />
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
  );
}
