"use client";

import { motion } from "framer-motion";

interface RoutePathProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
}

/** Animated walking path from parking → destination */
export default function RoutePath({ from, to }: RoutePathProps) {
  const midX = (from.x + to.x) / 2 + 4;
  const midY = (from.y + to.y) / 2 - 6;
  const d = `M ${from.x} ${from.y} Q ${midX} ${midY}, ${to.x} ${to.y}`;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <motion.path
        d={d}
        fill="none"
        stroke="rgba(6, 182, 212, 0.35)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <motion.path
        d={d}
        fill="none"
        stroke="#06b6d4"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="3 2"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: "easeInOut" }}
      />
    </svg>
  );
}
