"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { RankedDestination } from "@/lib/types";
import MapPin from "./MapPin";
import RoutePath from "./RoutePath";

interface MapCanvasProps {
  destinations: RankedDestination[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Stylized interactive map (no API key).
 * Pins + animated parking→destination walking route for demos.
 */
export default function MapCanvas({
  destinations,
  selectedId,
  onSelect,
}: MapCanvasProps) {
  const selected =
    destinations.find((d) => d.id === selectedId) ?? destinations[0];

  const bestParking = selected?.parking
    .slice()
    .sort((a, b) => b.score - a.score)[0];

  /** Project lat/lng into a local SVG viewBox for the demo cluster */
  const project = useMemo(() => {
    const lats = destinations.map((d) => d.coordinates.lat);
    const lngs = destinations.map((d) => d.coordinates.lng);
    const parkingPts = destinations.flatMap((d) =>
      d.parking.map((p) => p.coordinates)
    );
    const allLats = [...lats, ...parkingPts.map((p) => p.lat)];
    const allLngs = [...lngs, ...parkingPts.map((p) => p.lng)];

    const minLat = Math.min(...allLats) - 0.002;
    const maxLat = Math.max(...allLats) + 0.002;
    const minLng = Math.min(...allLngs) - 0.003;
    const maxLng = Math.max(...allLngs) + 0.003;

    return (lat: number, lng: number) => {
      const x = ((lng - minLng) / (maxLng - minLng)) * 100;
      const y = (1 - (lat - minLat) / (maxLat - minLat)) * 100;
      return { x, y };
    };
  }, [destinations]);

  const destPt = selected
    ? project(selected.coordinates.lat, selected.coordinates.lng)
    : null;
  const parkPt = bestParking
    ? project(bestParking.coordinates.lat, bestParking.coordinates.lng)
    : null;

  return (
    <div className="relative h-full min-h-[320px] w-full overflow-hidden rounded-2xl border border-white/50 bg-[#dfe8f0] shadow-inner">
      {/* Soft map atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,#ffffff_0%,transparent_50%),radial-gradient(ellipse_at_80%_80%,#c5ddd8_0%,transparent_45%)]" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Decorative "streets" */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <path
          d="M0 65 Q 30 55, 50 70 T 100 60"
          fill="none"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="6"
        />
        <path
          d="M10 20 Q 40 40, 55 30 T 100 45"
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="4"
        />
        <path
          d="M25 0 Q 35 40, 40 100"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="5"
        />
      </svg>

      {/* Route parking → destination */}
      {destPt && parkPt && (
        <RoutePath
          key={`${selected?.id}-${bestParking?.id}`}
          from={parkPt}
          to={destPt}
        />
      )}

      {/* Destination pins */}
      {destinations.map((d, i) => {
        const pt = project(d.coordinates.lat, d.coordinates.lng);
        return (
          <MapPin
            key={d.id}
            x={pt.x}
            y={pt.y}
            label={d.name}
            variant="destination"
            active={d.id === selected?.id}
            delay={0.1 + i * 0.06}
            onClick={() => onSelect(d.id)}
          />
        );
      })}

      {/* Best parking pin for selected place */}
      {bestParking && parkPt && (
        <MapPin
          key={bestParking.id}
          x={parkPt.x}
          y={parkPt.y}
          label={bestParking.name}
          variant="parking"
          active
          delay={0.35}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2"
      >
        <LegendDot color="bg-teal-600" label="Destination" />
        <LegendDot color="bg-amber-500" label="Parking" />
        <LegendDot color="bg-cyan-500" label="Walk route" />
      </motion.div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-medium text-slate-700 backdrop-blur">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
