/**
 * ScoreCard.tsx
 * -------------
 * Individual neighborhood score card shown in the ResultsList.
 *
 * Displays:
 *  - Rank badge
 *  - Area name + score ring
 *  - Mini metric bar chart (5 indices)
 *  - "View Insights" button → triggers ExplanationDrawer
 *
 * Architecture: Pure presentational component. No internal state.
 */

"use client";

import type { ScoredArea } from "@/app/page";

// ── Metric bar sub-component ──────────────────────────────────────────────────

function MetricBar({
  label,
  value,
  positive = true,
}: {
  label: string;
  value: number;
  positive?: boolean;
}) {
  // Positive metrics (income, traffic, density) → green bar
  // Negative metrics (competition, rent) → red bar when high
  const barColor = positive
    ? value > 75
      ? "bg-green-500"
      : value > 50
      ? "bg-green-400"
      : "bg-green-200"
    : value > 75
    ? "bg-red-400"
    : value > 50
    ? "bg-orange-300"
    : "bg-green-300";

  return (
    <div className="flex items-center gap-2">
      <span className="w-24 text-xs text-gray-400 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-600 w-8 text-right">{value}</span>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ScoreCardProps {
  area: ScoredArea;
  onViewInsights: (area: ScoredArea) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ScoreCard({ area, onViewInsights }: ScoreCardProps) {
  // Map score (roughly 0–80 range) to a 0–100 ring percentage
  const ringPct = Math.min(Math.round((area.score / 80) * 100), 100);

  const rankColors: Record<number, string> = {
    1: "bg-black text-white",
    2: "bg-gray-800 text-white",
    3: "bg-gray-600 text-white",
    4: "bg-gray-200 text-gray-700",
    5: "bg-gray-100 text-gray-600",
  };

  return (
    <article className="rounded-2xl border border-gray-200 bg-gradient-to-br from-green-50 to-white shadow-card hover:shadow-glass transition-all duration-300 p-5 flex flex-col gap-4 animate-slide-up">
      {/* Header row */}
      <div className="flex items-start gap-3">
        {/* Rank badge */}
        <span
          className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
            rankColors[area.rank] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          #{area.rank}
        </span>

        {/* Name + score */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-black leading-tight truncate">
            {area.name}
          </h4>
          <p className="text-xs text-gray-400 mt-0.5">Kolkata, West Bengal</p>
        </div>

        {/* Score ring */}
        <div className="relative flex-shrink-0 w-14 h-14">
          {/* CSS conic-gradient ring */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(#16a34a ${ringPct}%, #e5e7eb ${ringPct}%)`,
              padding: "3px",
            }}
          >
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <span className="text-sm font-extrabold text-green-700 leading-none">
                {area.score}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric bars */}
      <div className="flex flex-col gap-1.5">
        <MetricBar label="Income" value={area.income_index} positive />
        <MetricBar label="Foot Traffic" value={area.foot_traffic_proxy} positive />
        <MetricBar label="Population" value={area.population_density_index} positive />
        <MetricBar label="Competition" value={area.competition_index} positive={false} />
        <MetricBar label="Rent" value={area.commercial_rent_index} positive={false} />
      </div>

      {/* View Insights button */}
      <button
        onClick={() => onViewInsights(area)}
        className="mt-1 w-full text-xs font-semibold text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 py-2 rounded-xl transition-colors"
      >
        View AI Insights →
      </button>
    </article>
  );
}
