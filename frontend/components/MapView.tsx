/**
 * MapView.tsx
 * -----------
 * Interactive Leaflet map centered on Kolkata.
 *
 * Architecture notes:
 *  - Dynamic import (ssr: false in page.tsx) prevents window-not-defined errors.
 *  - Uses VANILLA Leaflet (not react-leaflet's <MapContainer>) to gain full
 *    control over the map lifecycle. This is the only reliable way to support
 *    React 18 Strict Mode, which mounts → unmounts → remounts every component
 *    in development. react-leaflet's MapContainer does not call map.remove()
 *    on unmount, leaving `_leaflet_id` on the DOM element and crashing the
 *    second mount. With vanilla Leaflet we call map.remove() in the useEffect
 *    cleanup, which clears _leaflet_id so each remount is fresh.
 *  - A second useEffect watches `results` and redraws overlay circles
 *    whenever the backend returns new scores.
 */

"use client";

import { useEffect, useRef } from "react";
import type L from "leaflet";
import "leaflet/dist/leaflet.css";

import { KOLKATA_AREAS } from "@/lib/kolkataMockData";
import type { ScoredArea } from "@/app/page";

// ── Constants ─────────────────────────────────────────────────────────────────

const KOLKATA_CENTER: [number, number] = [22.5726, 88.3639];
const DEFAULT_ZOOM = 12;

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreToColor(score: number, max: number): string {
  const pct = Math.min(score / max, 1);
  if (pct > 0.8) return "#15803d";
  if (pct > 0.6) return "#16a34a";
  if (pct > 0.4) return "#22c55e";
  if (pct > 0.2) return "#86efac";
  return "#bbf7d0";
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface MapViewProps {
  results: ScoredArea[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MapView({ results }: MapViewProps) {
  // Ref to the <div> Leaflet will attach to
  const containerRef = useRef<HTMLDivElement>(null);

  // Ref to the live L.Map instance — survives re-renders without triggering them
  const mapRef = useRef<L.Map | null>(null);

  // Refs to current circle markers so we can redraw on results change
  const circlesRef = useRef<L.CircleMarker[]>([]);

  // ── Effect 1: initialise map once per mount, destroy on unmount ────────────
  // KEY FIX: map.remove() in the cleanup calls Leaflet's internal teardown,
  // which deletes _leaflet_id from the container DOM element. This means
  // React 18 Strict Mode's remount always gets a pristine element to work
  // with — no "Map container already initialized" crash.
  useEffect(() => {
    if (!containerRef.current) return;

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;

      // Fix default icon URLs broken by webpack/Next.js module bundling
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current, {
        center: KOLKATA_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = map;

      // Draw default (unscored) circles for all areas on first load
      KOLKATA_AREAS.forEach((area) => {
        const circle = L.circleMarker([area.latitude, area.longitude], {
          radius: 14,
          color: "#94a3b8",
          fillColor: "#cbd5e1",
          fillOpacity: 0.22,
          weight: 1,
        });
        circle.bindTooltip(area.name, { direction: "top", offset: [0, -8] });
        circle.bindPopup(
          `<div style="font-family:Poppins,sans-serif;min-width:160px">
            <p style="font-weight:700;font-size:13px;margin-bottom:4px">${area.name}</p>
            <p style="font-size:11px;color:#9ca3af">Run analysis to see score.</p>
          </div>`
        );
        circle.addTo(map);
        circlesRef.current.push(circle);
      });
    });

    return () => {
      // map.remove() is the critical call — it wipes _leaflet_id from the DOM
      // element, allowing Strict Mode's remount to succeed cleanly.
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        circlesRef.current = [];
      }
    };
  }, []); // intentionally runs once per mount


  // ── Effect 2: redraw circles whenever results change ──────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    import("leaflet").then((L) => {
      // Remove all existing circles before redrawing
      circlesRef.current.forEach((c) => c.remove());
      circlesRef.current = [];

      const resultMap = new Map(results.map((r) => [r.name, r]));
      const maxScore = results.length > 0 ? results[0].score : 100;

      KOLKATA_AREAS.forEach((area) => {
        const result = resultMap.get(area.name);
        const isResult = !!result;
        const score = result?.score ?? 0;

        const circle = L.circleMarker([area.latitude, area.longitude], {
          radius: isResult ? 20 + (score / maxScore) * 14 : 14,
          color: isResult ? scoreToColor(score, maxScore) : "#94a3b8",
          fillColor: isResult ? scoreToColor(score, maxScore) : "#cbd5e1",
          fillOpacity: isResult ? 0.55 : 0.18,
          weight: isResult ? 2.5 : 1,
        });

        // Tooltip
        circle.bindTooltip(
          isResult
            ? `<div style="font-family:Poppins,sans-serif;font-size:12px">
                <div style="font-weight:700;color:#000">
                  <span style="background:#000;color:#fff;border-radius:4px;padding:1px 5px;margin-right:5px;font-size:10px">#${result.rank}</span>
                  ${area.name}
                </div>
                <div style="color:#16a34a;font-weight:600;margin-top:2px">Score: ${score}</div>
              </div>`
            : `<span style="font-family:Poppins,sans-serif">${area.name}</span>`,
          {
            direction: "top",
            offset: [0, -8],
            permanent: isResult && result.rank === 1,
          }
        );

        // Popup
        circle.bindPopup(
          isResult
            ? `<div style="font-family:Poppins,sans-serif;min-width:200px">
                <p style="font-weight:700;font-size:14px;margin-bottom:8px;color:#000">${area.name}</p>
                <div style="background:#f0fdf4;border-radius:8px;padding:8px 10px;margin-bottom:8px;text-align:center">
                  <span style="font-size:22px;font-weight:800;color:#16a34a">${score}</span>
                  <span style="font-size:11px;color:#6b7280;display:block">SiteScapr Score</span>
                </div>
                ${[
                  ["Income", result.income_index],
                  ["Foot Traffic", result.foot_traffic_proxy],
                  ["Population", result.population_density_index],
                  ["Competition", result.competition_index],
                  ["Rent", result.commercial_rent_index],
                ]
                  .map(
                    ([lbl, val]) =>
                      `<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px">
                        <span style="color:#6b7280">${lbl}</span>
                        <span style="font-weight:600">${val}/100</span>
                      </div>`
                  )
                  .join("")}
              </div>`
            : `<div style="font-family:Poppins,sans-serif;min-width:160px">
                <p style="font-weight:700;font-size:13px;margin-bottom:4px">${area.name}</p>
                <p style="font-size:11px;color:#9ca3af">Run analysis to see score.</p>
              </div>`
        );

        circle.addTo(map);
        circlesRef.current.push(circle);
      });
    });
  }, [results]);


  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-card">
      {/* Leaflet attaches to this div. Never recreated by React (no key change). */}
      <div ref={containerRef} style={{ height: "480px", width: "100%" }} />

      {/* Map legend */}
      <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center gap-6 text-xs text-gray-500">
        <span className="font-semibold text-gray-700">Legend</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#15803d] opacity-70 inline-block" />
          High Score
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#86efac] opacity-70 inline-block" />
          Mid Score
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-slate-300 opacity-70 inline-block" />
          Not Ranked
        </div>
        <span className="ml-auto text-gray-300">© OpenStreetMap</span>
      </div>
    </div>
  );
}
