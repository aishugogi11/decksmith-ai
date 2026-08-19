"use client";

import type { Stop } from "@/models";
import { formatClock } from "@/models/helpers";
import { whyThisStop } from "@/planner";
import { mapsService } from "@/lib/services";
import type { GeoPoint } from "@/lib/types";
import { X, Navigation } from "lucide-react";
import { motion } from "framer-motion";

interface StopDetailProps {
  stop: Stop;
  origin?: GeoPoint | null;
  onClose: () => void;
  onNavigate: (stop: Stop) => void;
  onChooseAlternative?: (stop: Stop, altId: string) => void;
}

export default function StopDetail({
  stop,
  origin,
  onClose,
  onNavigate,
  onChooseAlternative,
}: StopDetailProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-3xl border border-white/60 bg-white/95 p-5 shadow-[0_-20px_60px_rgba(11,18,32,0.18)] backdrop-blur-xl sm:bottom-6 sm:rounded-3xl"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Why this stop?
          </p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-slate-900">
            {stop.place.name}
          </h3>
          {stop.place.address && (
            <p className="mt-1 text-sm text-slate-500">{stop.place.address}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-slate-900/5 p-2 text-slate-600"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <Meta label="ETA" value={formatClock(stop.etaIso)} />
        <Meta label="Depart by" value={formatClock(stop.departByIso)} />
        <Meta
          label="Distance"
          value={`${stop.distanceMiles.toFixed(1)} mi · ${stop.travelMinutesFromPrev} min`}
        />
        <Meta
          label="Detour"
          value={
            stop.detourMinutes != null
              ? `~${stop.detourMinutes} min from area`
              : "On route"
          }
        />
        <Meta label="Hours" value={stop.hoursLabel} />
        <Meta label="Traffic" value={stop.trafficLabel} />
      </div>

      <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
        {whyThisStop(stop)}
      </pre>

      {stop.alternatives.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Alternatives
          </p>
          <ul className="mt-2 space-y-2">
            {stop.alternatives.map((alt) => (
              <li
                key={alt.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-900/5 bg-white px-3 py-2 text-sm"
              >
                <span className="font-medium text-slate-800">{alt.name}</span>
                {onChooseAlternative && (
                  <button
                    type="button"
                    onClick={() => onChooseAlternative(stop, alt.id)}
                    className="text-xs font-semibold text-teal-800"
                  >
                    Use this
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          onNavigate(stop);
          mapsService.navigateToStop({
            destination: stop.place.coordinates,
            destinationName: stop.place.name,
            origin: origin ?? undefined,
          });
        }}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white"
      >
        <Navigation className="h-4 w-4" />
        Navigate in Google Maps
      </button>
      <p className="mt-2 text-center text-[11px] text-slate-500">
        Lumen plans. Google Maps navigates.
      </p>
    </motion.div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 font-medium text-slate-800">{value}</p>
    </div>
  );
}
