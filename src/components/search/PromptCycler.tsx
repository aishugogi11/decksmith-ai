"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { EXAMPLE_PROMPTS } from "@/lib/prompts";

interface PromptCyclerProps {
  active: boolean;
  onPromptChange?: (prompt: string) => void;
}

/** Cycles example prompts through the search placeholder */
export default function PromptCycler({
  active,
  onPromptChange,
}: PromptCyclerProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % EXAMPLE_PROMPTS.length);
    }, 2800);
    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    onPromptChange?.(EXAMPLE_PROMPTS[index]);
  }, [index, onPromptChange]);

  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-y-0 left-14 right-28 flex items-center overflow-hidden sm:left-16 sm:right-36">
      <AnimatePresence mode="wait">
        <motion.span
          key={EXAMPLE_PROMPTS[index]}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.55, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35 }}
          className="truncate text-[15px] text-slate-500 sm:text-base"
        >
          {EXAMPLE_PROMPTS[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
