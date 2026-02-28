/**
 * ResultsList.tsx
 * ---------------
 * Renders the top 5 scored neighborhoods as a responsive card grid.
 *
 * Features:
 *  - 5-column grid on large screens, adapts down to 1 column
 *  - Summary stats bar (best score, avg score, cheapest area)
 *  - Delegates per-card rendering to ScoreCard
 *  - Passes selected area up to parent for ExplanationDrawer
 */

"use client";

import ScoreCard from "@/components/ScoreCard";
import type { ScoredArea } from "@/app/page";

// ── Props ─────────────────────────────────────────────────────────────────────

interface ResultsListProps {
  results: ScoredArea[];
  onSelectArea: (area: ScoredArea) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ResultsList({ results, onSelectArea }: ResultsListProps) {
  if (results.length === 0) return null;

  const best = results[0];
  const avgScore = (
    results.reduce((s, r) => s + r.score, 0) / results.length
  ).toFixed(1);
  const cheapest = [...results].sort(
    (a, b) => a.commercial_rent_index - b.commercial_rent_index
  )[0];

  return (
    <section className="animate-fade-in">
      {/* ── Summary stats bar ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Top Score",
            value: best.score,
            sub: best.name,
            color: "text-green-700",
          },
          {
            label: "Avg Score",
            value: avgScore,
            sub: "Top 5 areas",
            color: "text-black",
          },
          {
            label: "Lowest Rent",
            value: cheapest.name,
            sub: `Rent index ${cheapest.commercial_rent_index}/100`,
            color: "text-green-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-gray-200 bg-white shadow-card px-5 py-4"
          >
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
              {stat.label}
            </p>
            <p className={`text-xl font-extrabold leading-tight ${stat.color}`}>
              {stat.value}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Score cards grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {results.map((area) => (
          <ScoreCard key={area.name} area={area} onViewInsights={onSelectArea} />
        ))}
      </div>

      {/* Methodology footnote */}
      <p className="mt-6 text-center text-xs text-gray-300">
        Score = 0.30×Income + 0.25×FootTraffic + 0.20×Density − 0.15×Competition −
        0.10×Rent &nbsp;|&nbsp; All indices 0–100
      </p>
    </section>
  );
}
