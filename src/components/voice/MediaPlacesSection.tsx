"use client";

import { motion } from "framer-motion";
import { ExternalLink, MapPin } from "lucide-react";
import {
  platformLabel,
  type MediaPlace,
  type MediaPlatform,
} from "@/lib/voice/mediaPlaces";

interface MediaPlacesSectionProps {
  places: MediaPlace[];
  loading?: boolean;
}

const PLATFORM_STYLES: Record<MediaPlatform, string> = {
  instagram: "bg-rose-50 text-rose-800",
  tiktok: "bg-slate-900 text-white",
  youtube: "bg-red-50 text-red-800",
  blog: "bg-sky-50 text-sky-800",
  newsletter: "bg-amber-50 text-amber-900",
};

export default function MediaPlacesSection({
  places,
  loading,
}: MediaPlacesSectionProps) {
  if (loading) {
    return (
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl bg-white/50" />
        ))}
      </div>
    );
  }

  if (!places.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-10"
    >
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">
          From Instagram & media
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-tight text-slate-900">
          Spots creators keep posting
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Curated from places that repeatedly show up on Instagram, TikTok,
          YouTube, and travel media near your search — not a live Instagram
          scrape.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {places.map((place, index) => (
          <motion.article
            key={place.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * index }}
            className="overflow-hidden rounded-2xl border border-white/60 bg-white/75 shadow-[0_16px_40px_rgba(11,18,32,0.08)] backdrop-blur"
          >
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={place.imageUrl}
                alt=""
                className="h-44 w-full object-cover"
              />
              <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                {place.platforms.slice(0, 3).map((platform) => (
                  <span
                    key={platform}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PLATFORM_STYLES[platform]}`}
                  >
                    {platformLabel(platform)}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-teal-800">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {place.neighborhood}
                </span>
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-lg text-slate-900">
                {place.name}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                {place.why}
              </p>
              <p className="text-xs leading-relaxed text-slate-500">
                <span className="font-semibold text-rose-800">On media — </span>
                {place.mediaNote}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {place.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <a
                href={place.exploreUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 pt-1 text-xs font-semibold text-rose-800 underline-offset-2 hover:underline"
              >
                Explore on Instagram
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}
