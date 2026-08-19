"use client";

import { formatClock } from "@/models/helpers";
import type { Stop } from "@/models";
import { Clock, MapPin, Navigation } from "lucide-react";
import { motion } from "framer-motion";

interface StopCardProps {
  stop: Stop;
  index: number;
  selected?: boolean;
  onSelect: (id: string) => void;
  onNavigate: (stop: Stop) => void;
  onSkip?: (stop: Stop) => void;
}

export default function StopCard({
  stop,
  index,
  selected,
  onSelect,
  onNavigate,
  onSkip,
}: StopCardProps) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onSelect(stop.id)}
      className={`w-full rounded-2xl border p-4 text-left backdrop-blur transition ${
        selected
          ? "border-teal-500/40 bg-teal-50/90 shadow-[0_12px_40px_rgba(13,115,119,0.12)]"
          : "border-white/70 bg-white/75 hover:border-teal-500/25"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-900 text-sm font-semibold text-white">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-slate-900">
              {stop.place.name}
            </p>
            {stop.status === "active" && (
              <span className="rounded-full bg-teal-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                Next
              </span>
            )}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ETA {formatClock(stop.etaIso)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {stop.distanceMiles.toFixed(1)} mi · {stop.travelMinutesFromPrev} min
            </span>
          </p>
          <p className="mt-1 line-clamp-1 text-xs text-slate-500">
            {stop.reasons[0] ? `Why: ${stop.reasons[0]}` : stop.hoursLabel}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(stop);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.stopPropagation();
              onNavigate(stop);
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
        >
          <Navigation className="h-3.5 w-3.5" />
          Navigate
        </span>
        {onSkip && stop.status !== "skipped" && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onSkip(stop);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.stopPropagation();
                onSkip(stop);
              }
            }}
            className="inline-flex items-center rounded-xl border border-slate-900/10 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700"
          >
            Skip
          </span>
        )}
      </div>
    </motion.button>
  );
}
