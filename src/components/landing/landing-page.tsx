"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  GraduationCap,
  MessageSquareWarning,
  Mic,
  Search,
  Upload,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { SlideCanvas } from "@/components/slides/slide-canvas";
import { createQuantumDeck } from "@/lib/mock-ai";
import { THEMES } from "@/lib/themes";

export function LandingPage() {
  const demo = createQuantumDeck("minimal");
  const theme = THEMES.minimal;

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden text-zinc-950">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl brightness-95 saturate-[0.8]"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1800&q=60)",
          }}
        />
        <div className="absolute inset-0 bg-zinc-100/70" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/app">Studio</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/app?demo=1">
              Guided demo
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10">
        {/* First viewport — brand + one composition */}
        <section className="mx-auto grid min-h-[calc(100dvh-5rem)] max-w-6xl items-center gap-10 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pt-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <h1 className="font-[family-name:var(--font-display)] text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
              Decksmith
            </h1>
            <p className="mt-5 text-xl font-semibold tracking-tight text-zinc-800 sm:text-2xl">
              Import a deck. Redesign from feedback. Research what&apos;s
              missing.
            </p>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-zinc-600 sm:text-lg">
              An AI editor for presentations you already have — not another
              blank canvas that makes you start over.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/app?demo=1">Watch guided demo</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/app">Open studio</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="rounded-[28px] bg-white p-4 shadow-[0_30px_90px_rgba(0,0,0,0.16)] sm:p-5"
          >
            <SlideCanvas
              slide={demo.slides[0]}
              theme={theme}
              className="rounded-2xl border-0 shadow-none"
            />
          </motion.div>
        </section>

        {/* Below fold — one job per section */}
        <section className="border-t border-zinc-200/70 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-2">
            <FeatureBlock
              icon={Upload}
              title="Bring existing work"
              body="Upload PPTX or PDF. Editable objects on the canvas — so you improve the deck you already built."
            />
            <FeatureBlock
              icon={MessageSquareWarning}
              title="Redesign from feedback"
              body="Paste professor, client, or investor comments. Preview actions, then apply what you want."
            />
            <FeatureBlock
              icon={Search}
              title="Research + Coach"
              body="Pull current stats and citations, then check delivery readiness before you present."
            />
            <FeatureBlock
              icon={Mic}
              title="Voice refinement"
              body="Say “Make this look like an Apple Keynote” or “Reduce this to 15 slides” — edits apply live."
            />
          </div>
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-5 pb-16 sm:px-8">
            <GraduationCap className="h-4 w-4 text-zinc-500" />
            <p className="text-sm text-zinc-500">
              Templates stay available when you need a shell — they&apos;re just
              not the product.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function FeatureBlock({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Upload;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800">
        <Icon className="h-4 w-4" />
      </div>
      <h2 className="text-lg font-bold tracking-tight text-zinc-950">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-600">
        {body}
      </p>
    </div>
  );
}
