"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, ParkingCircle, Star } from "lucide-react";
import type { RankedDestination } from "@/lib/types";
import GlassCard from "@/components/ui/GlassCard";
import OpenBadge from "@/components/ui/OpenBadge";
import MatchBadge from "./MatchBadge";
import TagChip from "./TagChip";

interface DestinationCardProps {
  place: RankedDestination;
  index: number;
  selected: boolean;
  onSelect: (id: string) => void;
}

const PRICE = ["", "£", "££", "£££", "££££"] as const;

export default function DestinationCard({
  place,
  index,
  selected,
  onSelect,
}: DestinationCardProps) {
  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index, duration: 0.45, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      onClick={() => onSelect(place.id)}
      className="w-full text-left"
      aria-pressed={selected}
    >
      <GlassCard
        className={`overflow-hidden transition ${
          selected
            ? "ring-2 ring-teal-500/70 shadow-[0_12px_48px_rgba(13,115,119,0.18)]"
            : "hover:border-teal-500/30"
        }`}
      >
        <div className="relative aspect-[16/9] overflow-hidden sm:aspect-[2/1]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={place.imageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
          <div className="absolute left-3 top-3">
            <MatchBadge score={place.matchScore} />
          </div>
          <div className="absolute bottom-3 left-3">
            <OpenBadge isOpen={place.isOpen} closesAt={place.closesAt} />
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-teal-700">
                {place.category}
              </p>
              <h3 className="font-[family-name:var(--font-display)] text-xl tracking-tight text-slate-900">
                {place.name}
              </h3>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {place.rating.toFixed(1)}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {place.distanceMiles.toFixed(1)} mi
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {place.travelMinutes} min
            </span>
            <span className="inline-flex items-center gap-1">
              <ParkingCircle className="h-3.5 w-3.5 text-slate-400" />
              Parking {place.parkingScore}
            </span>
            <span className="font-semibold text-slate-700">
              {PRICE[place.priceLevel]}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {place.tags.slice(0, 5).map((tag) => (
              <TagChip key={tag} label={tag} />
            ))}
          </div>

          <p className="text-sm leading-relaxed text-slate-600">
            <span className="font-semibold text-teal-800">Why Lumen picked it — </span>
            {place.aiExplanation}
          </p>
        </div>
      </GlassCard>
    </motion.button>
  );
}
