import type { GeoPoint } from "@/lib/types";

/**
 * Traffic estimates — stub for Phase 1; swap for live traffic later.
 */
export interface TrafficEstimate {
  from: GeoPoint;
  to: GeoPoint;
  minutes: number;
  label: string;
  factor: number;
}

export interface TrafficProvider {
  estimate(from: GeoPoint, to: GeoPoint): Promise<TrafficEstimate>;
}

export class StubTrafficProvider implements TrafficProvider {
  private bumpFactor = 1;

  setBumpFactor(factor: number) {
    this.bumpFactor = factor;
  }

  getBumpFactor() {
    return this.bumpFactor;
  }

  reset() {
    this.bumpFactor = 1;
  }

  async estimate(from: GeoPoint, to: GeoPoint): Promise<TrafficEstimate> {
    const { distanceMiles } = await import("@/lib/geo");
    const miles = distanceMiles(from, to);
    const base = Math.max(3, Math.round(miles * 12));
    const minutes = Math.round(base * this.bumpFactor);
    const label =
      this.bumpFactor > 1.2
        ? `Heavier traffic · ~${minutes} min`
        : this.bumpFactor > 1
          ? `Moderate traffic · ~${minutes} min`
          : `Light traffic · ~${minutes} min`;
    return { from, to, minutes, label, factor: this.bumpFactor };
  }
}

export class TrafficService {
  constructor(private readonly provider: TrafficProvider) {}

  estimate(from: GeoPoint, to: GeoPoint) {
    return this.provider.estimate(from, to);
  }
}

export const stubTrafficProvider = new StubTrafficProvider();
export const trafficService = new TrafficService(stubTrafficProvider);
