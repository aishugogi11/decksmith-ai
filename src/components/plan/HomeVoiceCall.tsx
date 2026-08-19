"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, Phone, PhoneOff } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { createPlan, replanRoute } from "@/lib/planClient";
import { mapsService } from "@/lib/services";
import { preferenceStore, routineEngine } from "@/memory";
import type { RoutePlan, Stop } from "@/models";
import type { GeoPoint } from "@/lib/types";
import {
  canSpeak,
  getLastSpoken,
  hasWakeWord,
  isHangUpIntent,
  isNavigateIntent,
  isNextLocationIntent,
  looksLikePlanRequest,
  parseNavigateToTarget,
  playGreetingNow,
  replayLastSpoken,
  speakAsync,
  speakFromUserGesture,
  stopSpeaking,
  stripWakeWord,
  unlockSpeech,
} from "@/lib/voice/speak";
import {
  advancePlanAfterNavigate,
  findStopByName,
  getActiveStop,
  getNextStop,
} from "@/lib/planProgress";

type Phase = "idle" | "listening" | "planning" | "speaking" | "awaiting";

interface HomeVoiceCallProps {
  origin?: GeoPoint | null;
  originLabel?: string | null;
  plan: RoutePlan | null;
  useMemory?: boolean;
  onPlanChange: (plan: RoutePlan | null) => void;
}

/**
 * Home-page Call Lumen — replaces the search bar.
 * Speak a plan → hear itinerary → “navigate to ___” opens Google Maps.
 */
export default function HomeVoiceCall({
  origin = null,
  originLabel = null,
  plan,
  useMemory = true,
  onPlanChange,
}: HomeVoiceCallProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [heard, setHeard] = useState("");
  const [agentLine, setAgentLine] = useState(
    "Tap Call Lumen. I’ll ask how I can help, then wait until you finish talking."
  );
  const [status, setStatus] = useState<string | null>(null);
  const [isTalking, setIsTalking] = useState(false);
  const [canReplay, setCanReplay] = useState(false);

  const inCallRef = useRef(false);
  const phaseRef = useRef<Phase>("idle");
  const planRef = useRef<RoutePlan | null>(plan);
  const busyRef = useRef(false);
  const startListeningRef = useRef<() => void>(() => {});
  const speechStopRef = useRef<() => void>(() => {});
  const originRef = useRef(origin);

  useEffect(() => {
    originRef.current = origin;
  }, [origin]);

  useEffect(() => {
    planRef.current = plan;
  }, [plan]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const setCallPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const commitPlan = useCallback(
    (next: RoutePlan) => {
      planRef.current = next;
      onPlanChange(next);
    },
    [onPlanChange]
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

  const resumeListening = useCallback(
    (delayMs = 450) => {
      if (!inCallRef.current) return;
      window.setTimeout(() => {
        if (!inCallRef.current || busyRef.current) return;
        setCallPhase("listening");
        setStatus("Listening — speak anytime");
        setAgentLine(
          planRef.current
            ? "Say a new plan, or “navigate to” a stop on your itinerary."
            : "I’m listening — tell me what you want to get done."
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
      // Give the mic a moment to fully release before TTS (Chrome audio conflict)
      await new Promise((r) => window.setTimeout(r, 200));
      try {
        await speakAsync(line);
        setCanReplay(Boolean(getLastSpoken()));
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
      setAgentLine("Pulling up your plan…");
      setStatus("Finding locations");
      stopSpeaking();
      speechStopRef.current();

      try {
        const consent = preferenceStore.getConsent() && useMemory;
        if (consent) preferenceStore.seedDemoRoutinesIfEmpty();
        const home = preferenceStore.getHome();

        // Fetch plan ASAP — show locations on screen as soon as ready
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

        // UI updates immediately with the location list
        commitPlan(next);
        setCallPhase("awaiting");
        const nextStop = next.stops[0];
        setStatus(
          nextStop
            ? `Next stop: ${nextStop.place.name} · say “navigate”`
            : 'Say “navigate” for Google Maps'
        );
        setAgentLine(
          nextStop
            ? `Next stop: ${nextStop.place.name}`
            : next.summary
        );

        busyRef.current = false;
        // Speaks next stop first, then the rest of the plan
        await talk(next.spokenSummary);
        if (inCallRef.current) resumeListening(400);
      } catch {
        busyRef.current = false;
        if (!inCallRef.current) return;
        await talk("I couldn’t build that plan. Try saying your errands again.");
        resumeListening(400);
      }
    },
    [commitPlan, originLabel, resumeListening, setCallPhase, talk, useMemory]
  );

  const navigateToStop = useCallback(
    async (stop: Stop, current: RoutePlan) => {
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
    },
    [commitPlan, openStopInMaps, rememberStop, resumeListening, talk]
  );

  const handleNavigateToNamed = useCallback(
    async (spokenName: string) => {
      const current = planRef.current;
      if (!current?.stops.length) {
        // No plan yet — find locations from this request instead of erroring
        await runPlan(
          spokenName.length > 3
            ? spokenName
            : `find ${spokenName}`
        );
        return;
      }
      const stop = findStopByName(current, spokenName);
      if (!stop) {
        // Unknown name on plan — search/plan for that place
        await runPlan(`go to ${spokenName}`);
        return;
      }
      await navigateToStop(stop, current);
    },
    [navigateToStop, runPlan]
  );

  const handleNavigate = useCallback(async () => {
    const current = planRef.current;
    const stop = getActiveStop(current);
    if (!current || !stop) {
      await talk(
        "I don’t have a plan yet. Tell me where you need to go — like groceries and pharmacy — and I’ll find the locations."
      );
      resumeListening(400);
      return;
    }
    // Maps first — don’t wait on speech
    openStopInMaps(stop);
    rememberStop(current, stop);
    const advanced = advancePlanAfterNavigate(current, stop.id);
    commitPlan(advanced);
    const following = getActiveStop(advanced);
    setAgentLine(`Navigating to ${stop.place.name}`);
    setStatus("Opened Google Maps");
    void talk(
      following
        ? explainNavigateStop(stop) +
            ` Say navigate again for ${following.place.name}.`
        : explainNavigateStop(stop) + " That was the last stop."
    ).then(() => {
      if (inCallRef.current) resumeListening(400);
    });
  }, [commitPlan, openStopInMaps, rememberStop, resumeListening, talk]);

  // local helper kept next to navigate speech
  function explainNavigateStop(stop: {
    place: { name: string };
    reasons: string[];
    distanceMiles: number;
    travelMinutesFromPrev: number;
    hoursLabel: string;
  }): string {
    const why = stop.reasons
      .slice(0, 2)
      .map((r) => r.replace(/^note:\s*/i, "").trim())
      .filter(Boolean);
    const miles =
      stop.distanceMiles > 0
        ? ` It's about ${stop.distanceMiles.toFixed(1)} miles and ${stop.travelMinutesFromPrev} minutes away.`
        : "";
    const hours = /open now/i.test(stop.hoursLabel)
      ? " It's open now."
      : "";
    const reasonText =
      why.length > 0 ? ` I chose it because ${why.join(", and ")}.` : "";
    return `Navigating to ${stop.place.name}.${miles}${hours}${reasonText}`;
  }

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

    await navigateToStop(stop, planNow);
  }, [commitPlan, navigateToStop, resumeListening, talk]);

  const handleFinalTranscript = useCallback(
    async (transcript: string) => {
      let raw = transcript.trim();
      if (!raw || !inCallRef.current || busyRef.current) return;

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
        setStatus(null);
        return;
      }

      const named = parseNavigateToTarget(raw);
      if (named && planRef.current?.stops.length) {
        busyRef.current = true;
        await handleNavigateToNamed(named);
        busyRef.current = false;
        return;
      }

      // Errand talk should always build a location plan — never block on navigate
      if (looksLikePlanRequest(raw) || (!planRef.current && named)) {
        await runPlan(raw);
        return;
      }

      if (named) {
        busyRef.current = true;
        await handleNavigateToNamed(named);
        busyRef.current = false;
        return;
      }

      if (isNextLocationIntent(raw)) {
        if (!planRef.current?.stops.length) {
          await runPlan(raw.replace(/\bnext\b/gi, "").trim() || raw);
          return;
        }
        busyRef.current = true;
        await handleNextLocation();
        busyRef.current = false;
        return;
      }

      if (isNavigateIntent(raw)) {
        if (!planRef.current?.stops.length) {
          await talk(
            "Tell me where you need to go first — like groceries and a prescription — and I’ll find the locations."
          );
          resumeListening(400);
          return;
        }
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
          await talk("I couldn’t skip that stop.");
        }
        busyRef.current = false;
        resumeListening(500);
        return;
      }

      await runPlan(raw);
    },
    [
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
    silenceMs: 1600,
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
      window.setTimeout(() => {
        if (!inCallRef.current || busyRef.current) return;
        if (phaseRef.current === "listening" || phaseRef.current === "awaiting") {
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
    onFinalRef.current = (t) => {
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
    setAgentLine("Call ended. Tap Call Lumen to plan again.");
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

    // Unlock HTML audio in this click, then play greeting WAV immediately
    unlockSpeech();
    inCallRef.current = true;
    busyRef.current = false;
    setHeard("");
    setCanReplay(false);
    setStatus("Connecting…");
    setCallPhase("speaking");

    const greeting = "How can I help you?";
    setAgentLine(greeting);
    setIsTalking(true);
    setCanReplay(true);

    // Start WAV in the same sync turn as the click (autoplay policy)
    const greetingPlay = playGreetingNow();

    void (async () => {
      try {
        await greetingPlay;
      } catch {
        try {
          await speakFromUserGesture(greeting);
        } catch {
          setStatus("Couldn’t play voice — tap Replay Lumen’s voice");
        }
      } finally {
        setIsTalking(false);
      }
      if (!inCallRef.current) return;
      await new Promise((r) => window.setTimeout(r, 350));
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
    if ((phase === "listening" || phase === "awaiting") && speech.interim) {
      setHeard(speech.interim);
    }
  }, [phase, speech.interim]);

  const inCall = phase !== "idle";

  return (
    <div className="rounded-3xl border border-white/60 bg-white/75 p-6 shadow-[0_20px_60px_rgba(11,18,32,0.12)] backdrop-blur-2xl sm:p-8">
      <div className="flex flex-col items-center text-center">
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={inCall ? endCall : startCall}
          className={`relative grid h-24 w-24 place-items-center rounded-full text-white shadow-xl sm:h-28 sm:w-28 ${
            inCall ? "bg-rose-600 shadow-rose-700/30" : "bg-teal-700 shadow-teal-800/35"
          }`}
          aria-label={inCall ? "End call" : "Call Lumen"}
        >
          {(phase === "listening" ||
            phase === "awaiting" ||
            phase === "speaking") && (
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full border-2 border-teal-300/60"
              animate={{ scale: [1, 1.22, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
          )}
          {inCall ? (
            <PhoneOff className="h-8 w-8 sm:h-9 sm:w-9" />
          ) : (
            <Phone className="h-8 w-8 sm:h-9 sm:w-9" />
          )}
        </motion.button>

        <p className="mt-4 text-sm font-semibold text-slate-900">
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
            className="mt-3 max-w-lg text-base leading-relaxed text-slate-700"
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

        {canReplay && !isTalking && (
          <button
            type="button"
            onClick={() => {
              unlockSpeech();
              speechStopRef.current();
              void (async () => {
                setIsTalking(true);
                try {
                  await replayLastSpoken();
                } finally {
                  setIsTalking(false);
                }
              })();
            }}
            className="mt-4 rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-teal-800"
          >
            Replay Lumen’s voice
          </button>
        )}
      </div>
    </div>
  );
}
