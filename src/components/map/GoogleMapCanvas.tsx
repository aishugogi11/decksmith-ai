"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoPoint, RankedDestination } from "@/lib/types";

interface GoogleMapCanvasProps {
  destinations: RankedDestination[];
  selectedId: string | null;
  origin?: GeoPoint | null;
  onSelect: (id: string) => void;
}

declare global {
  interface Window {
    __lumenMapsReady?: Promise<void>;
  }
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.google?.maps) return Promise.resolve();
  if (window.__lumenMapsReady) return window.__lumenMapsReady;

  window.__lumenMapsReady = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&v=weekly`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return window.__lumenMapsReady;
}

/**
 * Real Google Map with destination + parking markers.
 */
export default function GoogleMapCanvas({
  destinations,
  selectedId,
  origin,
  onSelect,
}: GoogleMapCanvasProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const lineRef = useRef<google.maps.Polyline | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const selected =
    destinations.find((d) => d.id === selectedId) ?? destinations[0];

  useEffect(() => {
    if (!apiKey || !mapRef.current) return;
    let cancelled = false;

    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !mapRef.current || !window.google) return;

        const center = selected?.coordinates ??
          origin ?? {
            lat: 51.5074,
            lng: -0.1278,
          };

        if (!mapInstance.current) {
          mapInstance.current = new google.maps.Map(mapRef.current, {
            center,
            zoom: 13,
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: [
              { featureType: "poi", stylers: [{ visibility: "off" }] },
              {
                featureType: "transit",
                elementType: "labels",
                stylers: [{ visibility: "off" }],
              },
            ],
          });
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load Google Maps");
      });

    return () => {
      cancelled = true;
    };
    // Initialize once per key; markers update in the next effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!ready || !map || !window.google) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    lineRef.current?.setMap(null);
    lineRef.current = null;

    const bounds = new google.maps.LatLngBounds();

    if (origin) {
      const you = new google.maps.Marker({
        map,
        position: origin,
        title: "You",
        label: {
          text: "●",
          color: "#0f766e",
          fontSize: "14px",
        },
      });
      markersRef.current.push(you);
      bounds.extend(origin);
    }

    destinations.forEach((d) => {
      const marker = new google.maps.Marker({
        map,
        position: d.coordinates,
        title: d.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: d.id === selected?.id ? 11 : 8,
          fillColor: d.id === selected?.id ? "#0d7377" : "#334155",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      marker.addListener("click", () => onSelect(d.id));
      markersRef.current.push(marker);
      bounds.extend(d.coordinates);
    });

    const bestParking = selected?.parking
      .slice()
      .sort((a, b) => b.score - a.score)[0];

    if (bestParking && selected) {
      const park = new google.maps.Marker({
        map,
        position: bestParking.coordinates,
        title: bestParking.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: "#f59e0b",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      markersRef.current.push(park);
      bounds.extend(bestParking.coordinates);

      lineRef.current = new google.maps.Polyline({
        map,
        path: [bestParking.coordinates, selected.coordinates],
        strokeColor: "#06b6d4",
        strokeOpacity: 0.85,
        strokeWeight: 3,
      });
    }

    if (selected) {
      map.panTo(selected.coordinates);
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, 64);
    }
  }, [destinations, selected, origin, onSelect, ready]);

  if (!apiKey) {
    return (
      <div className="grid h-full place-items-center rounded-2xl border border-white/50 bg-[#dfe8f0] p-6 text-center text-sm text-slate-600">
        Add <code className="mx-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to show
        the live Google Map.
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid h-full place-items-center rounded-2xl border border-white/50 bg-[#dfe8f0] p-6 text-center text-sm text-amber-800">
        {error}
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[320px] w-full overflow-hidden rounded-2xl border border-white/50 shadow-inner">
      <div ref={mapRef} className="h-full w-full" />
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
        <LegendDot color="bg-teal-600" label="Destination" />
        <LegendDot color="bg-amber-500" label="Parking" />
        <LegendDot color="bg-cyan-500" label="You" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-medium text-slate-700 backdrop-blur">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
