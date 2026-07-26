"use client";

import { motion } from "framer-motion";
import Shimmer from "@/components/ui/Shimmer";

const STEPS = [
  "Reading your preferences…",
  "Scoring nearby places…",
  "Checking parking & travel time…",
  "Ranking the best matches…",
];

interface ThinkingOverlayProps {
  query: string;
}

/** AI thinking state with typing + shimmer cards */
export default function ThinkingOverlay({ query }: ThinkingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mx-auto w-full max-w-2xl px-4 pt-10"
    >
      <div className="mb-8 text-center">
        <p className="text-sm font-medium text-teal-700">Lumen is thinking</p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-2xl tracking-tight text-slate-900 sm:text-3xl">
          Finding places that fit
        </p>
        <p className="mt-2 text-sm text-slate-500">“{query}”</p>
      </div>

      <div className="space-y-3">
        {STEPS.map((step, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.28 }}
            className="flex items-center gap-3 rounded-2xl border border-white/50 bg-white/60 px-4 py-3 backdrop-blur"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-600" />
            </span>
            <span className="text-sm text-slate-700">{step}</span>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        <Shimmer className="h-28 w-full" />
        <Shimmer className="h-28 w-full" />
        <Shimmer className="h-28 w-[85%]" />
      </div>
    </motion.div>
  );
}
