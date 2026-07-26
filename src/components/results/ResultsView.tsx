"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import type { SearchResult } from "@/lib/types";
import Logo from "@/components/brand/Logo";
import DestinationCard from "./DestinationCard";
import MapCanvas from "@/components/map/MapCanvas";
import ParkingPanel from "@/components/parking/ParkingPanel";

interface ResultsViewProps {
  result: SearchResult;
  onSelect: (id: string) => void;
  onBack: () => void;
  onDemoAgain: () => void;
}

export default function ResultsView({
  result,
  onSelect,
  onBack,
  onDemoAgain,
}: ResultsViewProps) {
  const selected =
    result.destinations.find((d) => d.id === result.selectedId) ??
    result.destinations[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-[100dvh] bg-[radial-gradient(ellipse_at_top,_#e8f4f2_0%,_#eef2f7_50%,_#e2eaf3_100%)]"
    >
      <header className="sticky top-0 z-20 border-b border-white/40 bg-white/60 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-900/10"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <Logo />
          </div>
          <button
            type="button"
            onClick={onDemoAgain}
            className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Replay Demo
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-5 lg:grid-cols-[1.05fr_0.95fr] lg:px-6 lg:py-8">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Ranked for you
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-tight text-slate-900 sm:text-3xl">
              Best matches nearby
            </h2>
            <p className="mt-1 text-sm text-slate-500">“{result.query}”</p>
          </motion.div>

          <div className="space-y-4">
            {result.destinations.map((place, index) => (
              <DestinationCard
                key={place.id}
                place={place}
                index={index}
                selected={place.id === selected?.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="h-[340px] sm:h-[400px]">
            <MapCanvas
              destinations={result.destinations}
              selectedId={selected?.id ?? null}
              onSelect={onSelect}
            />
          </div>
          {selected && <ParkingPanel place={selected} />}

          {selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-white/50 bg-white/60 p-4 text-sm text-slate-600 backdrop-blur"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Why this ranking
              </p>
              <ul className="mt-2 space-y-1.5">
                {selected.rankReasons.map((reason) => (
                  <li key={reason} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                    {reason}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
