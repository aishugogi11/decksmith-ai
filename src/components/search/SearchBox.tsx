"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import PromptCycler from "./PromptCycler";

interface SearchBoxProps {
  onSearch: (query: string) => void;
  onDemo: () => void;
  disabled?: boolean;
  initialQuery?: string;
}

export default function SearchBox({
  onSearch,
  onDemo,
  disabled,
  initialQuery = "",
}: SearchBoxProps) {
  const [query, setQuery] = useState(initialQuery);
  const showCycler = query.length === 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || disabled) return;
    onSearch(trimmed);
  }

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="relative">
        <div className="group relative flex items-center rounded-2xl border border-white/60 bg-white/75 p-2 shadow-[0_20px_60px_rgba(11,18,32,0.12)] backdrop-blur-2xl transition focus-within:border-teal-500/40 focus-within:shadow-[0_20px_60px_rgba(13,115,119,0.18)]">
          <span className="ml-3 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-teal-600 to-cyan-700 text-white shadow-md shadow-teal-700/30">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>

          <div className="relative min-w-0 flex-1">
            <label htmlFor="lumen-search" className="sr-only">
              Where do you want to go?
            </label>
            <input
              id="lumen-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={disabled}
              autoComplete="off"
              placeholder={showCycler ? "" : "Where do you want to go?"}
              className="w-full bg-transparent px-3 py-3 text-[15px] text-slate-900 outline-none placeholder:text-slate-400 sm:text-base"
            />
            <PromptCycler active={showCycler && !disabled} />
          </div>

          <motion.button
            type="submit"
            disabled={disabled || !query.trim()}
            whileTap={{ scale: 0.97 }}
            className="mr-1 shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
          >
            Search
          </motion.button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onDemo}
          disabled={disabled}
          className="rounded-full border border-slate-900/10 bg-white/50 px-4 py-2 text-sm font-semibold text-slate-800 backdrop-blur transition hover:bg-white/80 disabled:opacity-50"
        >
          Try Demo
        </button>
        <p className="text-xs text-slate-500 sm:text-sm">
          No API keys needed · instant sample results
        </p>
      </div>
    </div>
  );
}
