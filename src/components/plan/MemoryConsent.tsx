"use client";

import { preferenceStore } from "@/memory";
import { useEffect, useState } from "react";

interface MemoryConsentProps {
  onChange?: (consent: boolean) => void;
}

/**
 * Explicit opt-in before Lumen learns routines on-device.
 */
export default function MemoryConsent({ onChange }: MemoryConsentProps) {
  const [consent, setConsent] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = preferenceStore.getConsent();
    setConsent(current);
    setReady(true);
    onChange?.(current);
  }, [onChange]);

  if (!ready) return null;

  return (
    <div className="rounded-2xl border border-white/60 bg-white/70 p-4 backdrop-blur">
      <p className="text-sm font-semibold text-slate-900">Routine learning</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">
        Allow Lumen to learn patterns on this device (preferred stores, usual
        dinner spots). Never used without your permission. Not a recents list —
        reusable routines only.
      </p>
      <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-800">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => {
            const next = preferenceStore.setConsent(e.target.checked);
            setConsent(next.consent);
            if (next.consent) preferenceStore.seedDemoRoutinesIfEmpty();
            onChange?.(next.consent);
          }}
          className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
        />
        Allow learning routines on this device
      </label>
    </div>
  );
}
