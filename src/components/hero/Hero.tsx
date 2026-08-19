"use client";

import { motion } from "framer-motion";
import Logo from "@/components/brand/Logo";
import SearchBox from "@/components/search/SearchBox";
import type { LocationAwarenessStatus } from "@/hooks/useLocationAwareness";

interface HeroProps {
  onSearch: (query: string) => void;
  onDemo: () => void;
  onSfGuide?: () => void;
  disabled?: boolean;
  statusMessage?: string | null;
  locationStatus?: LocationAwarenessStatus;
  searchingNearYou?: boolean;
  locationLabel?: string | null;
  showFallbackForm?: boolean;
  onSaveFallback?: (cityOrZip: string) => Promise<void>;
  onRetryGps?: () => void;
  fallbackBusy?: boolean;
}

/**
 * First viewport: brand-forward hero + location-aware AI search.
 */
export default function Hero({
  onSearch,
  onDemo,
  onSfGuide,
  disabled,
  statusMessage,
  locationStatus,
  searchingNearYou,
  locationLabel,
  showFallbackForm,
  onSaveFallback,
  onRetryGps,
  fallbackBusy,
}: HeroProps) {
  return (
    <section className="relative flex min-h-[100dvh] flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#e8f4f2_0%,_#eef2f7_42%,_#d9e4ef_100%)]" />
        <div className="absolute -left-20 top-10 h-[420px] w-[420px] rounded-full bg-teal-400/20 blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-[380px] w-[380px] rounded-full bg-cyan-400/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.28]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(15,23,42,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at center, black 20%, transparent 75%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-900/10 to-transparent" />
      </div>

      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <button
          type="button"
          onClick={onSfGuide}
          className="rounded-full bg-teal-700/90 px-3 py-1 text-[11px] font-semibold tracking-wide text-white backdrop-blur transition hover:bg-teal-800"
        >
          Call Lumen
        </button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-5 pb-16 pt-6 text-center sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mb-8"
        >
          <Logo size="lg" />
          <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl tracking-tight text-slate-900 sm:text-5xl">
            Know where to go.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-slate-600 sm:text-lg">
            Search from where you are — Lumen ranks nearby places by vibe,
            distance, and what you actually asked for.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.55 }}
          className="flex w-full justify-center"
        >
          <SearchBox
            onSearch={onSearch}
            onDemo={onDemo}
            disabled={disabled}
            statusMessage={statusMessage}
            locationStatus={locationStatus}
            searchingNearYou={searchingNearYou}
            locationLabel={locationLabel}
            showFallbackForm={showFallbackForm}
            onSaveFallback={onSaveFallback}
            onRetryGps={onRetryGps}
            fallbackBusy={fallbackBusy}
          />
        </motion.div>
      </div>
    </section>
  );
}
