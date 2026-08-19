"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Mic, Phone, PhoneOff } from "lucide-react";
import Logo from "@/components/brand/Logo";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { createPlan, replanRoute } from "@/lib/planClient";
import { mapsService } from "@/lib/services";
import { preferenceStore, routineEngine } from "@/memory";
import type { RoutePlan, Stop } from "@/models";
import type { GeoPoint } from "@/lib/types";
import {
  canSpeak,
  hasWakeWord,
  isHangUpIntent,
  isNavigateIntent,
  isNextLocationIntent,
  parseNavigateToTarget,
  speakAsync,
  speakFromUserGesture,
  stopSpeaking,
  stripWakeWord,
  unlockSpeech,
  playGreetingNow,
} from "@/lib/voice/speak";
import {
  advancePlanAfterNavigate,
  findStopByName,
  getActiveStop,
  getNextStop,
} from "@/lib/planProgress";

type AgentPhase =
  | "idle"
  | "listening"
  | "planning"
  | "speaking"
  | "awaiting";

interface VoiceGuideProps {
  onBack?: () => void;
  onPlanReady?: (plan: RoutePlan) => void;
  initialPlan?: RoutePlan | null;
  origin?: GeoPoint | null;
  originLabel?: string | null;
  useMemory?: boolean;
}

/**
 * Call Lumen — open listening: talk and it replies.
 * Navigate / next location opens Google Maps.
 */
export default function VoiceGuide({
  onBack,
  onPlanReady,
  initialPlan = null,
  origin = null,
  originLabel = null,
  useMemory = true,
}: VoiceGuideProps) {
  const [phase, setPhase] = useState<AgentPhase>("idle");
  const [heard, setHeard] = useState("");
  const [plan, setPlan] = useState<RoutePlan | null>(initialPlan);
  const [status, setStatus] = useState<string | null>(null);
  const [agentLine, setAgentLine] = useState(
    initialPlan
      ? "Call Lumen, then say navigate or next location — or describe a new plan."
      : "Tap Call Lumen, then just talk. I’ll reply with your plan."
  );
  const [isTalking, setIsTalking] = useState(false);

  const inCallRef = useRef(false);
  const phaseRef = useRef<AgentPhase>("idle");
  const planRef = useRef<RoutePlan | null>(initialPlan);
  const busyRef = useRef(false);
  const startListeningRef = useRef<() => void>(() => {});
  const originRef = useRef(origin);

  useEffect(() => {
    originRef.current = origin;
  }, [origin]);

  useEffect(() => {
    if (initialPlan) {
      planRef.current = initialPlan;
      setPlan(initialPlan);
    }
  }, [initialPlan]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const setCallPhase = useCallback((next: AgentPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const commitPlan = useCallback(
    (next: RoutePlan) => {
      planRef.current = next;
      setPlan(next);
      onPlanReady?.(next);
    },
    [onPlanReady]
  );

  const openStopInMaps = useCallback((stop: Stop) => {
    mapsService.navigateToStop({
      destination: stop.place.coordinates,
      destinationName: stop.place.name,
      origin: originRef.current ?? undefined,
    });
  }, []);

  const rememberStop = useCallback((current: RoutePlan, stop: Stop) => {
    const task = current.tasks.find((t) => t.id === stop.taskId);
    if (task && preferenceStore.getConsent()) {
      routineEngine.rememberVisit({
        category: task.intent.category,
        placeName: stop.place.name,
        placeId: stop.place.id,
        coordinates: stop.place.coordinates,
      });
    }
  }, []);

  const speechStopRef = useRef<() => void>(() => {});

  const resumeListening = useCallback(
    (delayMs = 400) => {
      if (!inCallRef.current) return;
      window.setTimeout(() => {
        if (!inCallRef.current || busyRef.current) return;
        setCallPhase("listening");
        setStatus("Listening — speak anytime");
        setAgentLine(
          planRef.current
            ? "I’m listening. Say your plan, navigate, or next location."
            : "I’m listening. Tell me what you need to get done."
        );
        startListeningRef.current();
      }, delayMs);
    },
    [setCallPhase]
  );

  const talk = useCallback(
    async (line: string) => {
      setAgentLine(line);
      setIsTalking(true);
      setCallPhase("speaking");
      speechStopRef.current();
      try {
        await speakAsync(line);
      } finally {
        setIsTalking(false);
      }
    },
    [setCallPhase]
  );

  const runPlan = useCallback(
    async (utterance: string) => {
      busyRef.current = true;
      setCallPhase("planning");
      setAgentLine(`Got it — planning “${utterance}”…`);
      setStatus("Building your plan");
      stopSpeaking();

      // Quick spoken ack so the user hears a reply immediately
      await speakAsync("Got it. Building your plan.");

      try {
        const consent = preferenceStore.getConsent() && useMemory;
        if (consent) preferenceStore.seedDemoRoutinesIfEmpty();
        const home = preferenceStore.getHome();

        const next = await createPlan({
          utterance,
          origin: originRef.current,
          originLabel: originLabel ?? undefined,
          useMemory: consent,
          routines: consent
            ? preferenceStore.listRoutines().map((r) => ({
                category: r.category,
                placeName: r.placeName,
                placeId: r.placeId,
                coordinates: r.coordinates,
              }))
            : [],
          home: home
            ? {
                id: home.id,
                name: home.placeName,
                category: "Home",
                coordinates: home.coordinates,
                isOpen: true,
              }
            : undefined,
        });

        if (!inCallRef.current) return;

        commitPlan(next);
        await talk(next.spokenSummary);
        busyRef.current = false;
        if (inCallRef.current) {
          setCallPhase("awaiting");
          setStatus("Say navigate or next location for Google Maps");
          resumeListening(500);
        }
      } catch {
        busyRef.current = false;
        if (!inCallRef.current) return;
        await talk(
          "I couldn’t build that plan. Try saying your errands again."
        );
        resumeListening(500);
      }
    },
    [commitPlan, originLabel, resumeListening, setCallPhase, talk, useMemory]
  );

  const handleNavigate = useCallback(async () => {
    const current = planRef.current;
    const stop = getActiveStop(current);
    if (!current || !stop) {
      await talk(
        "I don’t have a stop yet. Tell me your errands first, or build a plan on the home screen."
      );
      resumeListening(500);
      return;
    }

    openStopInMaps(stop);
    rememberStop(current, stop);
    const advanced = advancePlanAfterNavigate(current, stop.id);
    commitPlan(advanced);

    const following = getActiveStop(advanced);
    await talk(
      following
        ? `Opening Google Maps for ${stop.place.name}. Say navigate to ${following.place.name} when you’re ready.`
        : `Opening Google Maps for ${stop.place.name}. That was the last stop.`
    );
    if (inCallRef.current) resumeListening(500);
  }, [commitPlan, openStopInMaps, rememberStop, resumeListening, talk]);

  const handleNavigateToNamed = useCallback(
    async (spokenName: string) => {
      const current = planRef.current;
      if (!current?.stops.length) {
        await runPlan(
          spokenName.length > 3 ? spokenName : `find ${spokenName}`
        );
        return;
      }
      const stop = findStopByName(current, spokenName);
      if (!stop) {
        await runPlan(`go to ${spokenName}`);
        return;
      }
      openStopInMaps(stop);
      rememberStop(current, stop);
      const advanced = advancePlanAfterNavigate(current, stop.id);
      commitPlan(advanced);
      await talk(`Navigating to ${stop.place.name}.`);
      if (inCallRef.current) resumeListening(400);
    },
    [commitPlan, openStopInMaps, rememberStop, resumeListening, runPlan, talk]
  );

  const handleNextLocation = useCallback(async () => {
    const current = planRef.current;
    if (!current?.stops.length) {
      await talk("There’s no plan yet. Tell me what you need to get done.");
      resumeListening(500);
      return;
    }

    let stop = getNextStop(current);
    let planNow = current;

    if (!stop) {
      const active = getActiveStop(current);
      if (active) {
        planNow = advancePlanAfterNavigate(current, active.id);
        commitPlan(planNow);
        stop = getActiveStop(planNow);
      }
    } else {
      const active = getActiveStop(current);
      if (active && active.id !== stop.id) {
        planNow = advancePlanAfterNavigate(current, active.id);
        planNow = {
          ...planNow,
          stops: planNow.stops.map((s) =>
            s.id === stop!.id
              ? { ...s, status: "active" as const }
              : s.status === "active"
                ? { ...s, status: "pending" as const }
                : s
          ),
        };
        commitPlan(planNow);
        stop = getActiveStop(planNow) ?? stop;
      }
    }

    if (!stop) {
      await talk("You’ve finished every stop on this plan.");
      resumeListening(500);
      return;
    }

    openStopInMaps(stop);
    rememberStop(planNow, stop);
    const after = advancePlanAfterNavigate(planNow, stop.id);
    commitPlan(after);

    const following = getActiveStop(after);
    await talk(
      following
        ? `Opening Google Maps for ${stop.place.name}. Say next location for ${following.place.name}.`
        : `Opening Google Maps for ${stop.place.name}. That was the last stop.`
    );
    if (inCallRef.current) resumeListening(500);
  }, [commitPlan, openStopInMaps, rememberStop, resumeListening, talk]);

  /**
   * Any speech while on a call is handled — no wake word required.
   */
  const handleFinalTranscript = useCallback(
    async (transcript: string) => {
      let raw = transcript.trim();
      if (!raw || !inCallRef.current || busyRef.current) return;

      // Optional wake word — strip if present, but don't require it
      if (hasWakeWord(raw)) {
        const rest = stripWakeWord(raw);
        raw = rest || raw;
      }

      setHeard(raw);
      speechStopRef.current();

      if (isHangUpIntent(raw)) {
        busyRef.current = true;
        inCallRef.current = false;
        stopSpeaking();
        await talk("Goodbye.");
        busyRef.current = false;
        setCallPhase("idle");
        setAgentLine("Call ended. Tap Call Lumen when you’re ready again.");
        return;
      }

      const named = parseNavigateToTarget(raw);
      if (named) {
        busyRef.current = true;
        await handleNavigateToNamed(named);
        busyRef.current = false;
        return;
      }

      if (isNextLocationIntent(raw)) {
        busyRef.current = true;
        await handleNextLocation();
        busyRef.current = false;
        return;
      }

      if (isNavigateIntent(raw)) {
        busyRef.current = true;
        await handleNavigate();
        busyRef.current = false;
        return;
      }

      if (/\bskip\b/i.test(raw) && planRef.current) {
        busyRef.current = true;
        try {
          const next = await replanRoute(planRef.current, {
            type: "skip_stop",
            stopId:
              getActiveStop(planRef.current)?.id ??
              planRef.current.stops[0].id,
          });
          commitPlan(next);
          await talk(next.spokenSummary);
        } catch {
          await talk("I couldn’t skip that stop. Try again.");
        }
        busyRef.current = false;
        resumeListening(500);
        return;
      }

      // Anything else → treat as a plan request and reply
      await runPlan(raw);
    },
    [
      commitPlan,
      handleNavigate,
      handleNavigateToNamed,
      handleNextLocation,
      resumeListening,
      runPlan,
      setCallPhase,
      talk,
    ]
  );

  const onFinalRef = useRef<(t: string) => void>(() => {});

  const speech = useSpeechRecognition({
    onFinal: (t) => onFinalRef.current(t),
    silenceMs: 2500,
    onEnd: () => {
      if (
        !inCallRef.current ||
        busyRef.current ||
        phaseRef.current === "idle" ||
        phaseRef.current === "planning" ||
        phaseRef.current === "speaking"
      ) {
        return;
      }
      // Keep mic alive until we hear something
      window.setTimeout(() => {
        if (!inCallRef.current || busyRef.current) return;
        if (
          phaseRef.current === "listening" ||
          phaseRef.current === "awaiting"
        ) {
          startListeningRef.current();
        }
      }, 250);
    },
  });

  useEffect(() => {
    startListeningRef.current = speech.start;
    speechStopRef.current = speech.stop;
  }, [speech.start, speech.stop]);

  useEffect(() => {
    onFinalRef.current = (t: string) => {
      void handleFinalTranscript(t);
    };
  }, [handleFinalTranscript]);

  const endCall = useCallback(() => {
    inCallRef.current = false;
    busyRef.current = false;
    speech.stop();
    stopSpeaking();
    setCallPhase("idle");
    setIsTalking(false);
    setAgentLine("Call ended. Tap Call Lumen when you’re ready again.");
    setStatus(null);
  }, [setCallPhase, speech.stop]);

  const startCall = useCallback(() => {
    if (!speech.supported) {
      setStatus("Voice needs Chrome (or another Chromium browser).");
      return;
    }
    if (!canSpeak()) {
      setStatus("Speech output isn’t available in this browser.");
      return;
    }

    unlockSpeech();
    inCallRef.current = true;
    busyRef.current = false;
    setHeard("");
    setStatus("Connecting…");
    setCallPhase("speaking");

    const greeting = "How can I help you?";
    setAgentLine(greeting);
    setIsTalking(true);
    const greetingPlay = playGreetingNow();

    void (async () => {
      try {
        await greetingPlay;
      } catch {
        try {
          await speakFromUserGesture(greeting);
        } catch {
          // ignore
        }
      } finally {
        setIsTalking(false);
      }
      if (!inCallRef.current) return;
      await new Promise((r) => window.setTimeout(r, 400));
      if (!inCallRef.current) return;
      setCallPhase("listening");
      setStatus("Listening — take your time, I’ll wait until you finish");
      setAgentLine("I’m listening. Take your time — I’ll wait until you finish.");
      speech.start();
    })();
  }, [setCallPhase, speech.supported, speech.start]);

  useEffect(() => {
    return () => {
      inCallRef.current = false;
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    if (
      (phase === "listening" || phase === "awaiting") &&
      speech.interim
    ) {
      setHeard(speech.interim);
    }
  }, [phase, speech.interim]);

  const inCall = phase !== "idle";

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#e8f4f2_0%,_#eef2f7_45%,_#d5e3ef_100%)]" />
        <div className="absolute -left-24 top-16 h-[420px] w-[420px] rounded-full bg-teal-400/20 blur-3xl" />
      </div>

      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to plan
            </button>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          )}
          <Logo />
        </div>
        <span className="rounded-full bg-white/55 px-3 py-1 text-[11px] font-semibold text-slate-600">
          Talk anytime
        </span>
      </header>

      <main className="mx-auto max-w-2xl px-5 pb-20 sm:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Call Lumen
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-slate-900 sm:text-5xl">
            Talk, then hear back.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-slate-600">
            Tap Call Lumen and speak your plan — I’ll reply out loud, then open
            Google Maps when you say navigate.
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center">
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={inCall ? endCall : startCall}
            className={`relative grid h-28 w-28 place-items-center rounded-full text-white shadow-xl ${
              inCall ? "bg-rose-600" : "bg-teal-700"
            }`}
            aria-label={inCall ? "End call" : "Call Lumen"}
          >
            {(phase === "listening" ||
              phase === "awaiting" ||
              phase === "speaking") && (
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full border-2 border-teal-300/60"
                animate={{ scale: [1, 1.25, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
            )}
            {inCall ? (
              <PhoneOff className="h-9 w-9" />
            ) : (
              <Phone className="h-9 w-9" />
            )}
          </motion.button>

          <p className="mt-4 text-sm font-semibold text-slate-800">
            {isTalking
              ? "Lumen is talking…"
              : speech.waitingForPause
                ? "Got it — finish talking…"
                : phase === "listening" || phase === "awaiting"
                  ? "Listening — talk now"
                  : phase === "planning"
                    ? "Planning…"
                    : inCall
                      ? "End call"
                      : "Call Lumen"}
          </p>

          <AnimatePresence mode="wait">
            <motion.p
              key={agentLine}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 max-w-md text-center text-base text-slate-700"
            >
              {agentLine}
            </motion.p>
          </AnimatePresence>

          {(phase === "listening" || phase === "awaiting" || heard) && (
            <p className="mt-3 flex items-center gap-2 text-sm text-teal-800">
              <Mic className="h-4 w-4 animate-pulse" />
              <span className="font-medium">
                {heard ||
                  (speech.waitingForPause
                    ? "Waiting for you to finish…"
                    : "Listening…")}
              </span>
            </p>
          )}

          {speech.error && (
            <p className="mt-2 text-sm text-amber-700">{speech.error}</p>
          )}
          {status && <p className="mt-2 text-xs text-slate-500">{status}</p>}

          {plan && (
            <div className="mt-8 w-full rounded-2xl border border-white/70 bg-white/80 p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                Today&apos;s plan
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {plan.summary}
              </p>
              <ol className="mt-3 space-y-1 text-sm text-slate-700">
                {plan.stops.map((s, i) => (
                  <li key={s.id}>
                    {i + 1}. {s.place.name}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
