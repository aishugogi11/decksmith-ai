import type { PlanConstraints } from "@/models";
import type { GeoPoint } from "@/lib/types";
import { FALLBACK_ORIGIN } from "@/models/helpers";

/**
 * Pulls time/location constraints from utterance + context.
 */
export class ConstraintParser {
  parse(params: {
    utterance: string;
    origin?: GeoPoint | null;
    originLabel?: string;
    arriveByIso?: string;
    useMemory?: boolean;
  }): PlanConstraints {
    const nowIso = new Date().toISOString();
    let arriveByIso = params.arriveByIso;

    // "before 8:30", "by 8pm"
    const m = params.utterance.match(
      /\b(?:before|by)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i
    );
    if (m && !arriveByIso) {
      const hourRaw = Number(m[1]);
      const minute = m[2] ? Number(m[2]) : 0;
      let hour = hourRaw;
      const meridiem = m[3]?.toLowerCase();
      if (meridiem === "pm" && hour < 12) hour += 12;
      if (meridiem === "am" && hour === 12) hour = 0;
      if (!meridiem && hour < 7) hour += 12; // assume evening for errands
      const d = new Date();
      d.setHours(hour, minute, 0, 0);
      if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
      arriveByIso = d.toISOString();
    }

    return {
      origin: params.origin ?? FALLBACK_ORIGIN,
      originLabel: params.originLabel ?? (params.origin ? "Current location" : "Demo area"),
      nowIso,
      arriveByIso,
      useMemory: Boolean(params.useMemory),
    };
  }
}

export const constraintParser = new ConstraintParser();
