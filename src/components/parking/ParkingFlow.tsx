"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface ParkingFlowProps {
  parkingName: string;
  destinationName: string;
}

/** Compact visual: Parking → Destination */
export default function ParkingFlow({
  parkingName,
  destinationName,
}: ParkingFlowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="hidden items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-1.5 text-[10px] font-semibold text-white sm:inline-flex"
    >
      <span className="max-w-[72px] truncate text-amber-300">{parkingName}</span>
      <ArrowRight className="h-3 w-3 text-slate-400" />
      <span className="max-w-[72px] truncate text-cyan-300">
        {destinationName}
      </span>
    </motion.div>
  );
}
