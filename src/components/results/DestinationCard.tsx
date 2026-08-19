"use client";

import type { MouseEvent } from "react";
import { motion } from "framer-motion";
import { Clock, MapPin, Navigation, Star } from "lucide-react";
import type { GeoPoint, RankedDestination } from "@/lib/types";
import { navigationService } from "@/lib/services";
import GlassCard from "@/components/ui/GlassCard";
import OpenBadge from "@/components/ui/OpenBadge";
import MatchBadge from "./MatchBadge";
import TagChip from "./TagChip";

interface DestinationCardProps {
  place: RankedDestination;
  index: number;
  selected: boolean;
  onSelect: (id: string) => void;
  /** User origin for Google Maps directions */
  origin?: GeoPoint | null;
}

export default function DestinationCard({
  place,
  index,
  selected,
  onSelect,
  origin,
}: DestinationCardProps) {
  function handleNavigate(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    navigationService.navigateToPlace({
      coordinates: place.coordinates,
      name: place.name,
      placeId: place.id,
      origin: origin ?? undefined,
    });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index, duration: 0.45, ease: "easeOut" }}
      className="w-full"
    >
      <GlassCard
        className={`overflow-hidden transition ${
          selected
            ? "ring-2 ring-teal-500/70 shadow-[0_12px_48px_rgba(13,115,119,0.18)]"
            : "hover:border-teal-500/30"
        }`}
      >
        <button
          type="button"
          onClick={() => onSelect(place.id)}
          className="w-full text-left"
          aria-pressed={selected}
        >
          <div className="relative aspect-[16/9] overflow-hidden sm:aspect-[2/1]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={place.imageUrl}
              alt=""
              className="h-full w-full object-cover transition duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
            <div className="absolute left-3 top-3">
              <MatchBadge score={place.matchScore} />
            </div>
            <div className="absolute bottom-3 left-3">
              <OpenBadge isOpen={place.isOpen} closesAt={place.closesAt} />
            </div>
          </div>

          <div className="space-y-3 p-4 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-teal-700">
                  {place.category}
                </p>
                <h3 className="font-[family-name:var(--font-display)] text-xl tracking-tight text-slate-900">
                  {place.name}
                </h3>
                {place.address && (
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                    {place.address}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {place.rating.toFixed(1)}
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
              {origin ? (
                <>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {place.distanceMiles.toFixed(1)} mi away
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    ~{place.travelMinutes} min
                  </span>
                </>
              ) : place.address ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span className="line-clamp-1">{place.address}</span>
                </span>
              ) : null}
              <span className="font-semibold text-slate-700">
                {place.isOpen ? "Open now" : "Closed"}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {place.tags.slice(0, 5).map((tag) => (
                <TagChip key={tag} label={tag} />
              ))}
            </div>

            <p className="text-sm leading-relaxed text-slate-600">
              <span className="font-semibold text-teal-800">Why it matches — </span>
              {place.aiExplanation}
            </p>
          </div>
        </button>

        <div className="px-4 pb-4">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={handleNavigate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Navigation className="h-4 w-4" />
            Navigate
          </motion.button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
