"use client";

import { create } from "zustand";
import {
  FREE_FEATURES,
  FREE_LIMITS,
  PRO_FEATURES,
  type FeatureFlag,
  type PlanId,
  type SubscriptionState,
  type UsageCounters,
} from "@/features/subscription/types";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadUsage(): UsageCounters {
  if (typeof window === "undefined") {
    return { day: todayKey(), aiRequestsToday: 0, presentationCount: 0 };
  }
  try {
    const raw = localStorage.getItem("decksmith-usage");
    if (!raw) return { day: todayKey(), aiRequestsToday: 0, presentationCount: 0 };
    const parsed = JSON.parse(raw) as UsageCounters;
    if (parsed.day !== todayKey()) {
      return {
        day: todayKey(),
        aiRequestsToday: 0,
        presentationCount: parsed.presentationCount ?? 0,
      };
    }
    return parsed;
  } catch {
    return { day: todayKey(), aiRequestsToday: 0, presentationCount: 0 };
  }
}

function persistUsage(usage: UsageCounters) {
  try {
    localStorage.setItem("decksmith-usage", JSON.stringify(usage));
  } catch {
    /* ignore */
  }
}

function loadPlan(): PlanId {
  if (typeof window === "undefined") return "free";
  try {
    const p = localStorage.getItem("decksmith-plan");
    return p === "pro" ? "pro" : "free";
  } catch {
    return "free";
  }
}

type SubStore = SubscriptionState & {
  hasFeature: (flag: FeatureFlag) => boolean;
  canUseAi: () => { ok: boolean; reason?: string };
  recordAiRequest: () => boolean;
  recordPresentation: () => boolean;
  openUpgrade: (reason?: string) => void;
  closeUpgrade: () => void;
  /** Dev / future Stripe webhook hook — not real billing */
  setPlan: (plan: PlanId) => void;
};

export const useSubscriptionStore = create<SubStore>((set, get) => ({
  plan: "free",
  usage: { day: todayKey(), aiRequestsToday: 0, presentationCount: 0 },
  upgradeOpen: false,
  upgradeReason: null,

  hasFeature: (flag) => {
    const plan = get().plan;
    const list = plan === "pro" ? PRO_FEATURES : FREE_FEATURES;
    return list.includes(flag);
  },

  canUseAi: () => {
    const { plan, usage } = get();
    if (plan === "pro") return { ok: true };
    const u = usage.day === todayKey() ? usage : { ...usage, day: todayKey(), aiRequestsToday: 0 };
    if (u.aiRequestsToday >= FREE_LIMITS.aiRequestsPerDay) {
      return {
        ok: false,
        reason: `Free plan allows ${FREE_LIMITS.aiRequestsPerDay} AI requests/day. Upgrade to Pro for unlimited AI.`,
      };
    }
    return { ok: true };
  },

  recordAiRequest: () => {
    const gate = get().canUseAi();
    if (!gate.ok) {
      get().openUpgrade(gate.reason);
      return false;
    }
    if (get().plan === "pro") return true;
    const day = todayKey();
    const prev = get().usage;
    const usage: UsageCounters = {
      day,
      aiRequestsToday:
        prev.day === day ? prev.aiRequestsToday + 1 : 1,
      presentationCount: prev.presentationCount,
    };
    persistUsage(usage);
    set({ usage });
    return true;
  },

  recordPresentation: () => {
    if (get().plan === "pro") return true;
    const usage = get().usage;
    if (usage.presentationCount >= FREE_LIMITS.maxPresentations) {
      get().openUpgrade(
        `Free plan allows ${FREE_LIMITS.maxPresentations} presentations. Upgrade to Pro for unlimited decks.`
      );
      return false;
    }
    const next = { ...usage, presentationCount: usage.presentationCount + 1 };
    persistUsage(next);
    set({ usage: next });
    return true;
  },

  openUpgrade: (reason) =>
    set({ upgradeOpen: true, upgradeReason: reason ?? null }),
  closeUpgrade: () => set({ upgradeOpen: false, upgradeReason: null }),

  setPlan: (plan) => {
    try {
      localStorage.setItem("decksmith-plan", plan);
    } catch {
      /* ignore */
    }
    set({ plan, upgradeOpen: false });
  },
}));

/** Hydrate from localStorage on client */
export function hydrateSubscription() {
  useSubscriptionStore.setState({
    plan: loadPlan(),
    usage: loadUsage(),
  });
}
