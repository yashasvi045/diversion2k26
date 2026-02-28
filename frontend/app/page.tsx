/**
 * page.tsx
 * --------
 * Main SiteScapr page.
 *
 * Layout:
 *   1. Hero section — headline + CTA
 *   2. App section  — two-column grid (InputPanel | MapView)
 *   3. Results      — ResultsList below the map grid
 *
 * State management is intentionally co-located here (no Redux/Zustand)
 * since the app is a single-page workflow. Lift state when adding routing.
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

export default function HomePage() {
  const [results, setResults] = useState<ScoredArea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessType, setBusinessType] = useState<string>("");

  // Area selected for the explanation drawer
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

        // Smooth scroll to results
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
      {/* ── Hero Section ────────────────────────────────────────────────── */}
      <section className="relative min-h-[60vh] flex flex-col items-center justify-center px-6 py-24 overflow-hidden">
        {/* Decorative background gradient blob */}
        <div
          aria-hidden
          className="absolute -top-20 -right-20 w-[480px] h-[480px] rounded-full bg-green-100 opacity-50 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -bottom-20 -left-20 w-[320px] h-[320px] rounded-full bg-green-50 opacity-60 blur-3xl pointer-events-none"
        />

        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold text-green-700 tracking-wide uppercase">
            AI-Powered Site Intelligence
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-center font-extrabold text-5xl md:text-6xl lg:text-7xl leading-tight tracking-tight max-w-4xl">
          Find the Right Location
          <br />
          <span className="text-green-600">Before You Sign the Lease.</span>
        </h1>

        {/* Subtext */}
        <p className="mt-6 text-center text-gray-500 text-lg md:text-xl max-w-xl font-normal leading-relaxed">
          AI-powered site intelligence for smarter business decisions in{" "}
          <span className="font-semibold text-black">Kolkata</span>.
        </p>

        {/* CTA */}
        <div className="mt-10 flex items-center gap-4">
          <a
            href="#app"
            className="bg-black text-white font-semibold px-7 py-3.5 rounded-2xl hover:bg-gray-800 transition-all shadow-md hover:shadow-lg text-sm tracking-wide"
          >
            Start Analysis →
          </a>
          <span className="text-xs text-gray-400 font-medium">
            No sign-up required
          </span>
        </div>

        {/* Social proof strip */}
        <div className="mt-14 flex items-center gap-8 text-center">
          {[
            { value: "15", label: "Neighborhoods" },
            { value: "5", label: "Scored Metrics" },
            { value: "Top 5", label: "Ranked Results" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-bold text-black">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── App Section ─────────────────────────────────────────────────── */}
      <section
        id="app"
        className="max-w-screen-xl mx-auto px-6 py-12 scroll-mt-24"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Location Analysis</h2>
          <p className="text-sm text-gray-400 mt-1">
            Configure your business parameters and run the scoring engine.
          </p>
        </div>

        {/* Two-column grid: Input | Map */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
          {/* Left — Input Panel */}
          <InputPanel onAnalyze={handleAnalyze} isLoading={isLoading} />

          {/* Right — Map */}
          <div className="flex flex-col gap-4">
            <MapView results={results} />

            {/* Error banner */}
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
            <ResultsList
              results={results}
              onSelectArea={setSelectedArea}
            />
          </>
        )}

        {/* Empty state before first analysis */}
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
            <p className="text-base font-semibold text-gray-700">
              No analysis yet
            </p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">
              Configure your parameters above and click{" "}
              <strong>Analyze</strong> to see neighborhood scores on the map.
            </p>
          </div>
        )}
      </section>

      {/* ── Explanation Drawer ───────────────────────────────────────────── */}
      <ExplanationDrawer
        area={selectedArea}
        onClose={() => setSelectedArea(null)}
      />
    </>
  );
}
