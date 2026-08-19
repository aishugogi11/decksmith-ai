"use client";

import { useState } from "react";
import PlanHome from "@/components/plan/PlanHome";
import { useLocationAwareness } from "@/hooks/useLocationAwareness";
import type { RoutePlan } from "@/models";

/**
 * Lumen Daily Planning Assistant — voice-first home, Maps only on Navigate.
 */
export default function LumenApp() {
  const [plan, setPlan] = useState<RoutePlan | null>(null);
  const { location } = useLocationAwareness();

  return (
    <PlanHome
      origin={location?.coordinates ?? null}
      originLabel={location?.label ?? null}
      externalPlan={plan}
      onPlanChange={setPlan}
    />
  );
}
