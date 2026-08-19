"use client";

import { FormEvent, useState } from "react";
import { MapPinned } from "lucide-react";

interface LocationFallbackFormProps {
  onSave: (cityOrZip: string) => Promise<void>;
  onRetryGps?: () => void;
  busy?: boolean;
  savedLabel?: string | null;
}

/**
 * City / ZIP fallback when GPS permission is denied.
 */
export default function LocationFallbackForm({
  onSave,
  onRetryGps,
  busy,
  savedLabel,
}: LocationFallbackFormProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await onSave(value);
      setValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save location.");
    }
  }

  return (
    <div className="mx-auto mt-4 w-full max-w-2xl rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 text-left backdrop-blur">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-900">
          <MapPinned className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-950">
            Location access is off
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
            You can still search without location — Google will match by
            relevance. Optional: add a city or ZIP to bias results nearby.
            {savedLabel ? ` Currently using “${savedLabel}”.` : ""}
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-3 flex flex-col gap-2 sm:flex-row"
          >
            <label htmlFor="fallback-location" className="sr-only">
              City or ZIP
            </label>
            <input
              id="fallback-location"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="City or ZIP / postcode"
              disabled={busy}
              className="w-full rounded-xl border border-amber-200 bg-white/90 px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-500/50"
            />
            <button
              type="submit"
              disabled={busy || !value.trim()}
              className="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40"
            >
              {busy ? "Saving…" : "Use location"}
            </button>
          </form>

          {error && <p className="mt-2 text-xs text-amber-800">{error}</p>}

          {onRetryGps && (
            <button
              type="button"
              onClick={onRetryGps}
              className="mt-2 text-xs font-semibold text-teal-800 underline-offset-2 hover:underline"
            >
              Try GPS again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
