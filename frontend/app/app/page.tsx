/**
 * app/app/page.tsx
 * ----------------
 * SiteScapr scoring tool — the core analysis experience.
 * Moved from root page to /app route as part of multi-page restructure.
 */

"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import InputPanel from "@/components/InputPanel";
import ResultsList from "@/components/ResultsList";
import ExplanationDrawer from "@/components/ExplanationDrawer";

// Dynamic import to prevent Leaflet SSR issues (Leaflet requires `window`)
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[480px] rounded-2xl bg-green-50 border border-gray-200 flex items-center justify-center">
      <span className="text-sm text-gray-400 font-medium animate-pulse">
        Loading map…
      </span>
    </div>
  ),
});

// ── Types ────────────────────────────────────────────────────────────────────

export interface ScoredArea {
  name: string;
  latitude: number;
  longitude: number;
  score: number;
  income_index: number;
  foot_traffic_proxy: number;
  population_density_index: number;
  competition_index: number;
  commercial_rent_index: number;
  reasoning: string[];
  rank: number;
}

export interface AnalyzeResponse {
  results: ScoredArea[];
  business_type: string;
  total_areas_analyzed: number;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AppPage() {
  const [results, setResults] = useState<ScoredArea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessType, setBusinessType] = useState<string>("");
  const [selectedArea, setSelectedArea] = useState<ScoredArea | null>(null);

  const handleAnalyze = useCallback(
    async (params: {
      business_type: string;
      target_demographic: string[];
      budget_range: number;
    }) => {
      setIsLoading(true);
      setError(null);
      setResults([]);
      setBusinessType(params.business_type);

      try {
        const res = await fetch("http://localhost:8000/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail ?? "Analysis failed.");
        }

        const data: AnalyzeResponse = await res.json();
        setResults(data.results);

        setTimeout(() => {
          document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
        }, 200);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Unexpected error. Is the backend running on port 8000?");
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return (
    <>
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 pt-10 pb-2">
        <div className="flex items-center gap-3 mb-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold text-green-700 tracking-wide uppercase">
            Kolkata Beta
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Location Analysis</h1>
        <p className="text-sm text-gray-400 mt-1">
          Configure your business parameters and let the AI scoring engine rank the best neighborhoods.
        </p>
      </section>

      {/* ── App Section ─────────────────────────────────────────────────── */}
      <section
        id="app"
        className="max-w-screen-xl mx-auto px-6 py-8 scroll-mt-24"
      >
        {/* Two-column grid: Input | Map */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
          {/* Left — Input Panel */}
          <InputPanel onAnalyze={handleAnalyze} isLoading={isLoading} />

          {/* Right — Map */}
          <div className="flex flex-col gap-4">
            <MapView results={results} />

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium animate-fade-in">
                ⚠ {error}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Results Section ─────────────────────────────────────────────── */}
      <section
        id="results"
        className="max-w-screen-xl mx-auto px-6 pb-24 scroll-mt-24"
      >
        {results.length > 0 && (
          <>
            <div className="mb-6 flex items-baseline gap-3">
              <h2 className="text-2xl font-bold tracking-tight">
                Top Recommendations
              </h2>
              <span className="text-sm text-green-600 font-semibold">
                for {businessType}
              </span>
            </div>
            <ResultsList results={results} onSelectArea={setSelectedArea} />
          </>
        )}

        {results.length === 0 && !isLoading && !error && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
                />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-700">No analysis yet</p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">
              Configure your parameters above and click <strong>Analyze</strong> to see
              neighborhood scores on the map.
            </p>
          </div>
        )}
      </section>

      {/* ── Explanation Drawer ───────────────────────────────────────────── */}
      <ExplanationDrawer area={selectedArea} onClose={() => setSelectedArea(null)} />
    </>
  );
}
