"use client";

import { motion } from "framer-motion";
import { Clock, MapPin } from "lucide-react";
import type { SfStop } from "@/lib/voice/sfDayTrip";

interface ItineraryRevealProps {
  headline: string;
  summary: string;
  stops: SfStop[];
}

export default function ItineraryReveal({
  headline,
  summary,
  stops,
}: ItineraryRevealProps) {
  if (!stops.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
        Your day, spoken + mapped
      </p>
      <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-tight text-slate-900 sm:text-3xl">
        {headline}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
        {summary}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {stops.map((stop, index) => (
          <motion.article
            key={stop.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * index, duration: 0.4 }}
            className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-[0_16px_40px_rgba(11,18,32,0.08)] backdrop-blur"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={stop.imageUrl}
              alt=""
              className="h-36 w-full object-cover sm:h-40"
            />
            <div className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-teal-800">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {stop.time}
                </span>
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {stop.neighborhood}
                </span>
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-lg text-slate-900">
                {stop.name}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">{stop.why}</p>
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-teal-800">Tip — </span>
                {stop.tip}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}
