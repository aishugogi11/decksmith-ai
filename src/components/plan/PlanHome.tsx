"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Route, Clock3, RefreshCw } from "lucide-react";
import Logo from "@/components/brand/Logo";
import StopCard from "@/components/plan/StopCard";
import StopDetail from "@/components/plan/StopDetail";
import MemoryConsent from "@/components/plan/MemoryConsent";
import HomeVoiceCall from "@/components/plan/HomeVoiceCall";
import { replanRoute } from "@/lib/planClient";
import { mapsService } from "@/lib/services";
import { preferenceStore, routineEngine } from "@/memory";
import type { RoutePlan, Stop, UserRoutine, SavedPlace } from "@/models";
import { formatClock } from "@/models/helpers";
import type { GeoPoint } from "@/lib/types";
import {
  advancePlanAfterNavigate,
  getActiveStop,
} from "@/lib/planProgress";

interface PlanHomeProps {
  origin?: GeoPoint | null;
  originLabel?: string | null;
  externalPlan?: RoutePlan | null;
  onPlanChange?: (plan: RoutePlan | null) => void;
}

export default function PlanHome({
  origin,
  originLabel,
  externalPlan,
  onPlanChange,
}: PlanHomeProps) {
  const [plan, setPlan] = useState<RoutePlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [useMemory, setUseMemory] = useState(false);
  const [routines, setRoutines] = useState<UserRoutine[]>([]);
  const [saved, setSaved] = useState<SavedPlace[]>([]);
  const [statusLine, setStatusLine] = useState<string | null>(null);

  useEffect(() => {
    setUseMemory(preferenceStore.getConsent());
    setRoutines(routineEngine.list());
    setSaved(preferenceStore.listSavedPlaces());
  }, []);

  useEffect(() => {
    if (externalPlan) {
      setPlan(externalPlan);
      setSelectedId(
        getActiveStop(externalPlan)?.id ?? externalPlan.stops[0]?.id ?? null
      );
    }
  }, [externalPlan]);

  const handlePlanChange = useCallback(
    (next: RoutePlan | null) => {
      setPlan(next);
      setSelectedId(
        next
          ? getActiveStop(next)?.id ?? next.stops[0]?.id ?? null
          : null
      );
      setError(null);
      setRoutines(routineEngine.list());
      onPlanChange?.(next);
    },
    [onPlanChange]
  );

  async function handleSkip(stop: Stop) {
    if (!plan) return;
    setBusy(true);
    try {
      const next = await replanRoute(plan, {
        type: "skip_stop",
        stopId: stop.id,
      });
      handlePlanChange(next);
      setStatusLine(next.replanEvents.at(-1)?.message ?? "Plan updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Replan failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleTrafficBump() {
    if (!plan) return;
    setBusy(true);
    try {
      const next = await replanRoute(plan, {
        type: "traffic_bump",
        extraMinutes: 15,
        stopId: plan.stops.find((s) => s.status === "active")?.id,
      });
      handlePlanChange(next);
      setStatusLine(
        next.replanEvents.at(-1)?.message ?? "Replanned for traffic"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Replan failed");
    } finally {
      setBusy(false);
    }
  }

  function handleNavigate(stop: Stop) {
    mapsService.navigateToStop({
      destination: stop.place.coordinates,
      destinationName: stop.place.name,
      origin: origin ?? undefined,
    });
    const task = plan?.tasks.find((t) => t.id === stop.taskId);
    if (task && useMemory) {
      routineEngine.rememberVisit({
        category: task.intent.category,
        placeName: stop.place.name,
        placeId: stop.place.id,
        coordinates: stop.place.coordinates,
      });
      setRoutines(routineEngine.list());
    }
    if (plan) {
      handlePlanChange(advancePlanAfterNavigate(plan, stop.id));
    }
  }

  function navigateFull() {
    if (!plan?.stops.length) return;
    mapsService.navigateFullRoute({
      origin: origin ?? undefined,
      stops: plan.stops.map((s) => ({
        coordinates: s.place.coordinates,
        name: s.place.name,
      })),
    });
  }

  const selected = plan?.stops.find((s) => s.id === selectedId) ?? null;
  const nextStop =
    plan?.stops.find((s) => s.status === "active") ?? plan?.stops[0];

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#e8f4f2_0%,_#eef2f7_45%,_#d5e3ef_100%)]" />
        <div className="absolute -left-24 top-16 h-[420px] w-[420px] rounded-full bg-teal-400/20 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-[380px] w-[380px] rounded-full bg-cyan-400/15 blur-3xl" />
      </div>

      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <span className="rounded-full bg-white/55 px-3 py-1 text-[11px] font-semibold tracking-wide text-slate-600 backdrop-blur">
          Voice planning
        </span>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-28 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Plan your day
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-slate-900 sm:text-5xl">
            What should I do next?
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-slate-600">
            Call Lumen, say your errands, hear the plan — then say “navigate to”
            a stop.
          </p>
        </motion.div>

        <div className="mx-auto mt-8 max-w-xl">
          <HomeVoiceCall
            origin={origin}
            originLabel={originLabel}
            plan={plan}
            useMemory={useMemory}
            onPlanChange={handlePlanChange}
          />
        </div>

        <div className="mt-4">
          <MemoryConsent
            onChange={(c) => {
              setUseMemory(c);
              setRoutines(routineEngine.list());
            }}
          />
        </div>

        {error && (
          <p className="mt-4 text-center text-sm text-amber-700">{error}</p>
        )}
        {statusLine && (
          <p className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-900">
            {statusLine}
          </p>
        )}

        {plan && (
          <>
            <section className="mt-10">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                    Today&apos;s Plan
                  </p>
                  <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-slate-900">
                    {plan.summary}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleTrafficBump()}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-900/10 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Simulate traffic +15m
                  </button>
                  <button
                    type="button"
                    onClick={navigateFull}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <Route className="h-3.5 w-3.5" />
                    Navigate full route
                  </button>
                </div>
              </div>
            </section>

            {nextStop && (
              <section className="mt-6 rounded-2xl border border-teal-500/25 bg-teal-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-800">
                  Current route
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  Next: {nextStop.place.name}
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                  <Clock3 className="h-4 w-4" />
                  ETA {formatClock(nextStop.etaIso)} · {nextStop.trafficLabel}
                </p>
                <p className="mt-2 text-xs text-teal-900">
                  Say “navigate to {nextStop.place.name}” to open Google Maps
                </p>
              </section>
            )}

            <section className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                Upcoming stops
              </p>
              <div className="mt-3 space-y-3">
                {plan.stops.map((stop, i) => (
                  <StopCard
                    key={stop.id}
                    stop={stop}
                    index={i}
                    selected={stop.id === selectedId}
                    onSelect={setSelectedId}
                    onNavigate={handleNavigate}
                    onSkip={(s) => void handleSkip(s)}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/60 bg-white/70 p-4 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Recent routines
            </p>
            {routines.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Enable routine learning to personalize preferred stops.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {routines.slice(0, 6).map((r) => (
                  <li key={r.id} className="text-sm text-slate-800">
                    <span className="font-semibold capitalize">{r.category}</span>
                    {" · "}
                    {r.placeName}
                    <span className="text-slate-500">
                      {" "}
                      · {r.cadence.replaceAll("_", " ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/70 p-4 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Saved places
            </p>
            <ul className="mt-3 space-y-2">
              {saved.map((p) => (
                <li key={p.id} className="text-sm text-slate-800">
                  <span className="font-semibold">{p.label}</span>
                  {" · "}
                  {p.placeName}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {selected && (
          <>
            <button
              type="button"
              aria-label="Dismiss"
              className="fixed inset-0 z-40 bg-slate-900/20"
              onClick={() => setSelectedId(null)}
            />
            <StopDetail
              stop={selected}
              origin={origin}
              onClose={() => setSelectedId(null)}
              onNavigate={handleNavigate}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
