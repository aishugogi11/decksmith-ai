"use client";

import { motion } from "framer-motion";

export default function MatchBadge({ score }: { score: number }) {
  const tone =
    score >= 90
      ? "from-teal-500 to-cyan-500"
      : score >= 75
        ? "from-cyan-600 to-sky-500"
        : "from-slate-500 to-slate-600";

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center rounded-full bg-gradient-to-r ${tone} px-3 py-1 text-xs font-bold text-white shadow-md shadow-teal-700/20`}
    >
      {score}% Match
    </motion.div>
  );
}
