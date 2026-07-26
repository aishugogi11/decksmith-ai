"use client";

import { motion } from "framer-motion";
import {
  Accessibility,
  ArrowRight,
  Footprints,
  ParkingCircle,
  Zap,
} from "lucide-react";
import type { RankedDestination } from "@/lib/types";
import GlassCard from "@/components/ui/GlassCard";
import ParkingFlow from "./ParkingFlow";

interface ParkingPanelProps {
  place: RankedDestination;
}

export default function ParkingPanel({ place }: ParkingPanelProps) {
  const options = place.parking.slice().sort((a, b) => b.score - a.score);
  const best = options[0];

  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Smart Parking
          </p>
          <h3 className="font-[family-name:var(--font-display)] text-lg text-slate-900">
            Best way in
          </h3>
        </div>
        <ParkingFlow
          parkingName={best?.name ?? "Parking"}
          destinationName={place.name}
        />
      </div>

      <div className="space-y-3">
        {options.map((opt, i) => (
          <motion.div
            key={opt.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className={`rounded-xl border px-3 py-3 ${
              i === 0
                ? "border-teal-500/30 bg-teal-50/70"
                : "border-slate-200/80 bg-white/50"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <ParkingCircle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-semibold text-slate-900">
                    {opt.name}
                  </p>
                </div>
                <p className="mt-1 text-xs capitalize text-slate-500">
                  {opt.type} · score {opt.score}
                </p>
              </div>
              {i === 0 && (
                <span className="rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  Best
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1">
                <Footprints className="h-3.5 w-3.5" />
                {opt.walkingMinutes} min · {opt.walkingMeters}m
              </span>
              <span>{opt.estimatedCost}</span>
              {opt.hasEvCharging && (
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <Zap className="h-3.5 w-3.5" />
                  EV
                </span>
              )}
              {opt.accessible && (
                <span className="inline-flex items-center gap-1">
                  <Accessibility className="h-3.5 w-3.5" />
                  Accessible
                </span>
              )}
            </div>

            {i === 0 && (
              <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-teal-800">
                Park here
                <ArrowRight className="h-3.5 w-3.5" />
                Walk to {place.name}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}
