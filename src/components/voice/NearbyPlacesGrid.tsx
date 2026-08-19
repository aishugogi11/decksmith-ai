"use client";

import { motion } from "framer-motion";
import { MapPin, Sparkles } from "lucide-react";
import type { NearbyPlaceOption } from "@/lib/voice/nearbyOptions";
import type { RankedDestination } from "@/lib/types";

type GridPlace =
  | {
      kind: "curated";
      place: NearbyPlaceOption;
    }
  | {
      kind: "live";
      place: RankedDestination;
    };

interface NearbyPlacesGridProps {
  places: GridPlace[];
  loading?: boolean;
  sourceLabel?: string;
}

export default function NearbyPlacesGrid({
  places,
  loading,
  sourceLabel,
}: NearbyPlacesGridProps) {
  if (loading) {
    return (
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-2xl bg-white/50"
          />
        ))}
      </div>
    );
  }

  if (!places.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8"
    >
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Nearby options
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-tight text-slate-900">
            Cool places around there
          </h2>
        </div>
        {sourceLabel && (
          <p className="text-xs font-medium text-slate-500">{sourceLabel}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {places.map((item, index) =>
          item.kind === "curated" ? (
            <CuratedCard key={item.place.id} place={item.place} index={index} />
          ) : (
            <LiveCard key={item.place.id} place={item.place} index={index} />
          )
        )}
      </div>
    </motion.section>
  );
}

function CuratedCard({
  place,
  index,
}: {
  place: NearbyPlaceOption;
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 * index }}
      className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-[0_16px_40px_rgba(11,18,32,0.08)] backdrop-blur"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={place.imageUrl}
        alt=""
        className="h-40 w-full object-cover"
      />
      <div className="space-y-2 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-teal-800">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {place.neighborhood}
          </span>
          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-teal-800">
            {place.vibe}
          </span>
        </div>
        <h3 className="font-[family-name:var(--font-display)] text-lg text-slate-900">
          {place.name}
        </h3>
        <p className="text-sm leading-relaxed text-slate-600">{place.why}</p>
        <p className="text-xs text-slate-500">
          <span className="font-semibold text-teal-800">Why it works — </span>
          {place.tip}
        </p>
      </div>
    </motion.article>
  );
}

function LiveCard({
  place,
  index,
}: {
  place: RankedDestination;
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 * index }}
      className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-[0_16px_40px_rgba(11,18,32,0.08)] backdrop-blur"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={place.imageUrl}
        alt=""
        className="h-40 w-full object-cover"
      />
      <div className="space-y-2 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-teal-800">
          <span className="inline-flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            {place.category}
          </span>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">
            {place.rating.toFixed(1)}★
          </span>
          <span className="text-slate-500">
            {place.distanceMiles.toFixed(1)} mi
          </span>
        </div>
        <h3 className="font-[family-name:var(--font-display)] text-lg text-slate-900">
          {place.name}
        </h3>
        {place.address && (
          <p className="line-clamp-1 text-xs text-slate-500">{place.address}</p>
        )}
        <p className="text-sm leading-relaxed text-slate-600">
          {place.aiExplanation}
        </p>
        {place.googleMapsUri && (
          <a
            href={place.googleMapsUri}
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-xs font-semibold text-teal-800 underline-offset-2 hover:underline"
          >
            Open in Google Maps
          </a>
        )}
      </div>
    </motion.article>
  );
}
