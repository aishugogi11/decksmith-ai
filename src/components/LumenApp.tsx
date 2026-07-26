"use client";

import { useCallback, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Hero from "@/components/hero/Hero";
import ThinkingOverlay from "@/components/search/ThinkingOverlay";
import ResultsView from "@/components/results/ResultsView";
import { DEMO_QUERY } from "@/lib/prompts";
import { runSearch } from "@/lib/search";
import type { AppPhase, SearchResult } from "@/lib/types";

/**
 * Top-level experience orchestrator:
 * landing → thinking → results (with Demo Mode shortcut).
 */
export default function LumenApp() {
  const [phase, setPhase] = useState<AppPhase>("landing");
  const [activeQuery, setActiveQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);

  const executeSearch = useCallback(async (query: string) => {
    setActiveQuery(query);
    setPhase("thinking");
    setResult(null);

    try {
      const next = await runSearch(query);
      setResult(next);
      setPhase("results");
    } catch {
      // Demo inventory is local — keep UX resilient
      setPhase("landing");
    }
  }, []);

  const handleDemo = useCallback(() => {
    void executeSearch(DEMO_QUERY);
  }, [executeSearch]);

  const handleSelect = useCallback((id: string) => {
    setResult((prev) => (prev ? { ...prev, selectedId: id } : prev));
  }, []);

  const handleBack = useCallback(() => {
    setPhase("landing");
    setResult(null);
    setActiveQuery("");
  }, []);

  return (
    <div className="min-h-[100dvh]">
      <AnimatePresence mode="wait">
        {phase === "landing" && (
          <Hero
            key="landing"
            onSearch={executeSearch}
            onDemo={handleDemo}
          />
        )}

        {phase === "thinking" && (
          <div key="thinking" className="min-h-[100dvh] bg-[radial-gradient(ellipse_at_top,_#e8f4f2_0%,_#eef2f7_50%,_#e2eaf3_100%)]">
            <ThinkingOverlay query={activeQuery} />
          </div>
        )}

        {phase === "results" && result && (
          <ResultsView
            key="results"
            result={result}
            onSelect={handleSelect}
            onBack={handleBack}
            onDemoAgain={handleDemo}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
