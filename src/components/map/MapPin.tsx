"use client";

import { motion } from "framer-motion";
import { MapPin as PinIcon, ParkingCircle } from "lucide-react";

interface MapPinProps {
  x: number; // 0–100 %
  y: number;
  label: string;
  variant: "destination" | "parking";
  active?: boolean;
  delay?: number;
  onClick?: () => void;
}

export default function MapPin({
  x,
  y,
  label,
  variant,
  active,
  delay = 0,
  onClick,
}: MapPinProps) {
  const isDest = variant === "destination";

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: -16, scale: 0.6 }}
      animate={{ opacity: 1, y: 0, scale: active ? 1.08 : 1 }}
      transition={{
        type: "spring",
        stiffness: 380,
        damping: 18,
        delay,
      }}
      whileHover={{ scale: 1.12 }}
      onClick={onClick}
      style={{ left: `${x}%`, top: `${y}%` }}
      className="absolute z-10 -translate-x-1/2 -translate-y-full"
      aria-label={label}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full text-white shadow-lg ${
          isDest
            ? active
              ? "bg-teal-600 shadow-teal-700/40"
              : "bg-slate-800/85"
            : "bg-amber-500 shadow-amber-600/35"
        }`}
      >
        {isDest ? (
          <PinIcon className="h-4 w-4" />
        ) : (
          <ParkingCircle className="h-4 w-4" />
        )}
      </span>
      {active && (
        <span className="mt-1 block max-w-[110px] truncate rounded-md bg-white/90 px-1.5 py-0.5 text-center text-[10px] font-semibold text-slate-800 shadow">
          {label}
        </span>
      )}
      <motion.span
        aria-hidden
        className={`absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 rounded-full ${
          isDest ? "bg-teal-600/40" : "bg-amber-500/40"
        }`}
        animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.6 }}
      />
    </motion.button>
  );
}
