"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives?: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<
    ArrayLike<{ transcript: string }> & { isFinal?: boolean }
  >;
};

function getSpeechRecognitionCtor():
  | (new () => SpeechRecognitionLike)
  | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface UseSpeechRecognitionOptions {
  onFinal?: (transcript: string) => void;
  onEnd?: () => void;
  lang?: string;
  /**
   * How long to wait after the user stops speaking before treating
   * the utterance as finished (ms). Longer = lets them finish listing errands.
   */
  silenceMs?: number;
}

/**
 * Web Speech API mic → text.
 * Waits for a pause after speech so the user can finish talking.
 */
export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const { onFinal, onEnd, lang = "en-US", silenceMs = 1800 } = options;
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinal);
  const onEndRef = useRef(onEnd);
  const ignoreEndRef = useRef(false);
  const silenceTimerRef = useRef<number | null>(null);
  const bufferRef = useRef("");
  const deliveredRef = useRef(false);
  const silenceMsRef = useRef(silenceMs);

  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [waitingForPause, setWaitingForPause] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    silenceMsRef.current = silenceMs;
  }, [silenceMs]);

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognitionCtor()));
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current != null) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const deliverBuffer = useCallback(() => {
    clearSilenceTimer();
    const text = bufferRef.current.trim();
    if (!text || deliveredRef.current) {
      setWaitingForPause(false);
      return;
    }
    deliveredRef.current = true;
    bufferRef.current = "";
    setInterim("");
    setWaitingForPause(false);
    onFinalRef.current?.(text);
  }, [clearSilenceTimer]);

  const scheduleDeliver = useCallback(() => {
    clearSilenceTimer();
    setWaitingForPause(true);
    silenceTimerRef.current = window.setTimeout(() => {
      // Stop recognition so it doesn't keep capturing after we commit
      ignoreEndRef.current = true;
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      deliverBuffer();
      setListening(false);
    }, silenceMsRef.current);
  }, [clearSilenceTimer, deliverBuffer]);

  const stop = useCallback(() => {
    ignoreEndRef.current = true;
    clearSilenceTimer();
    deliveredRef.current = true;
    bufferRef.current = "";
    setWaitingForPause(false);
    setInterim("");
    recognitionRef.current?.abort();
    setListening(false);
  }, [clearSilenceTimer]);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError("Voice search is not supported in this browser. Try Chrome.");
      return;
    }

    setError(null);
    setInterim("");
    setWaitingForPause(false);
    clearSilenceTimer();
    bufferRef.current = "";
    deliveredRef.current = false;

    ignoreEndRef.current = true;
    recognitionRef.current?.abort();
    ignoreEndRef.current = false;

    const recognition = new Ctor();
    recognition.lang = lang;
    // Continuous so short pauses mid-sentence don't cut the user off
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      if (deliveredRef.current) return;

      let interimText = "";
      let newlyFinal = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const piece = result[0]?.transcript ?? "";
        if (result.isFinal) newlyFinal += piece;
        else interimText += piece;
      }

      if (newlyFinal) {
        bufferRef.current = `${bufferRef.current} ${newlyFinal}`.replace(
          /\s+/g,
          " "
        ).trim();
      }

      const live =
        `${bufferRef.current}${interimText ? ` ${interimText}` : ""}`.trim();
      setInterim(live);

      // Any speech activity resets the “finished talking” timer
      if (live) scheduleDeliver();
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") {
        setListening(false);
        return;
      }
      if (event.error === "no-speech") {
        setListening(false);
        // If we already captured words, deliver them; else restart via onEnd
        if (bufferRef.current.trim() && !deliveredRef.current) {
          deliverBuffer();
          return;
        }
        if (!ignoreEndRef.current) onEndRef.current?.();
        return;
      }
      clearSilenceTimer();
      setWaitingForPause(false);
      setError(
        event.error === "not-allowed"
          ? "Microphone permission denied. Allow mic access and try again."
          : `Voice error: ${event.error}`
      );
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      if (ignoreEndRef.current) return;

      // Engine ended early — if we have speech, wait out remaining silence,
      // otherwise ask caller to restart listening.
      if (bufferRef.current.trim() && !deliveredRef.current) {
        scheduleDeliver();
        return;
      }
      if (!deliveredRef.current) {
        setWaitingForPause(false);
        onEndRef.current?.();
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      window.setTimeout(() => {
        try {
          recognition.start();
          setListening(true);
        } catch {
          setError("Could not start the microphone. Tap Call Lumen again.");
          setListening(false);
        }
      }, 200);
    }
  }, [clearSilenceTimer, deliverBuffer, lang, scheduleDeliver]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(() => {
    return () => {
      ignoreEndRef.current = true;
      clearSilenceTimer();
      recognitionRef.current?.abort();
    };
  }, [clearSilenceTimer]);

  return {
    supported,
    listening,
    interim,
    /** True while we heard speech and are waiting for the user to finish */
    waitingForPause,
    error,
    start,
    stop,
    toggle,
  };
}
