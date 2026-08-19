"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Sparkles } from "lucide-react";
import PromptCycler from "./PromptCycler";
import LocationFallbackForm from "@/components/location/LocationFallbackForm";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import type { LocationAwarenessStatus } from "@/hooks/useLocationAwareness";

interface SearchBoxProps {
  onSearch: (query: string) => void;
  onDemo: () => void;
  disabled?: boolean;
  initialQuery?: string;
  statusMessage?: string | null;
  locationStatus?: LocationAwarenessStatus;
  searchingNearYou?: boolean;
  locationLabel?: string | null;
  showFallbackForm?: boolean;
  onSaveFallback?: (cityOrZip: string) => Promise<void>;
  onRetryGps?: () => void;
  fallbackBusy?: boolean;
}

export default function SearchBox({
  onSearch,
  onDemo,
  disabled,
  initialQuery = "",
  statusMessage,
  locationStatus,
  searchingNearYou,
  locationLabel,
  showFallbackForm,
  onSaveFallback,
  onRetryGps,
  fallbackBusy,
}: SearchBoxProps) {
  const [query, setQuery] = useState(initialQuery);
  const showCycler = query.length === 0;

  const speech = useSpeechRecognition({
    onFinal: (transcript) => {
      setQuery(transcript);
      if (!disabled && transcript.trim()) {
        onSearch(transcript.trim());
      }
    },
  });

  useEffect(() => {
    if (speech.interim) {
      setQuery(speech.interim);
    }
  }, [speech.interim]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || disabled) return;
    speech.stop();
    onSearch(trimmed);
  }

  const locationLine = searchingNearYou
    ? "Searching near you."
    : locationLabel
      ? `Searching near ${locationLabel}.`
      : locationStatus === "prompting" || locationStatus === "bootstrapping"
        ? "Getting your location…"
        : null;

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`group relative flex items-center rounded-2xl border bg-white/75 p-2 shadow-[0_20px_60px_rgba(11,18,32,0.12)] backdrop-blur-2xl transition focus-within:border-teal-500/40 focus-within:shadow-[0_20px_60px_rgba(13,115,119,0.18)] ${
            speech.listening
              ? "border-teal-500/50 shadow-[0_20px_60px_rgba(13,115,119,0.22)]"
              : "border-white/60"
          }`}
        >
          <span className="ml-3 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-teal-600 to-cyan-700 text-white shadow-md shadow-teal-700/30">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>

          <div className="relative min-w-0 flex-1">
            <label htmlFor="lumen-search" className="sr-only">
              What are you looking for nearby?
            </label>
            <input
              id="lumen-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={disabled}
              autoComplete="off"
              placeholder={
                speech.listening
                  ? "Listening…"
                  : showCycler
                    ? ""
                    : "Find a quiet coffee shop"
              }
              className="w-full bg-transparent px-3 py-3 text-[15px] text-slate-900 outline-none placeholder:text-slate-400 sm:text-base"
            />
            <PromptCycler active={showCycler && !disabled && !speech.listening} />
          </div>

          <motion.button
            type="button"
            disabled={disabled || !speech.supported}
            whileTap={{ scale: 0.94 }}
            onClick={speech.toggle}
            aria-pressed={speech.listening}
            aria-label={speech.listening ? "Stop listening" : "Search by voice"}
            className={`mr-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-40 ${
              speech.listening
                ? "bg-teal-600 text-white shadow-md shadow-teal-700/30"
                : "bg-slate-900/5 text-slate-700 hover:bg-slate-900/10"
            }`}
          >
            {speech.listening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </motion.button>

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

      <div className="mt-3 min-h-[1.25rem] text-center text-xs sm:text-sm">
        {speech.listening ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-medium text-teal-700"
          >
            Listening — say what you’re looking for nearby
          </motion.p>
        ) : speech.error ? (
          <p className="text-amber-700">{speech.error}</p>
        ) : locationLine ? (
          <p className="font-medium text-teal-800">{locationLine}</p>
        ) : statusMessage ? (
          <p className="text-slate-500">{statusMessage}</p>
        ) : null}
      </div>

      {showFallbackForm && onSaveFallback && (
        <LocationFallbackForm
          onSave={onSaveFallback}
          onRetryGps={onRetryGps}
          busy={fallbackBusy}
          savedLabel={locationLabel}
        />
      )}

      <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onDemo}
          disabled={disabled}
          className="rounded-full border border-slate-900/10 bg-white/50 px-4 py-2 text-sm font-semibold text-slate-800 backdrop-blur transition hover:bg-white/80 disabled:opacity-50"
        >
          Try Demo
        </button>
        <p className="text-xs text-slate-500 sm:text-sm">
          Location optional · real Google places either way
        </p>
      </div>
    </div>
  );
}
