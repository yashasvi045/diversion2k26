/**
 * ExplanationDrawer.tsx
 * ---------------------
 * Slide-in side drawer showing AI-generated reasoning for a selected area.
 *
 * Shows:
 *  - Area name, rank, and score
 *  - 3 reasoning bullets from the backend
 *  - Full metric breakdown with visual bars
 *  - Score decomposition (contribution per factor)
 *
 * Architecture:
 *  - Controlled by parent via `area` prop (null = closed)
 *  - Uses CSS translate for smooth open/close animation
 *  - Backdrop click dismisses the drawer
 */

"use client";

import { useEffect } from "react";
import type { ScoredArea } from "@/app/page";

// ── Score contribution display ────────────────────────────────────────────────

interface ContributionRowProps {
  label: string;
  rawValue: number;
  weight: number;
  positive: boolean;
}

function ContributionRow({ label, rawValue, weight, positive }: ContributionRowProps) {
  const contribution = positive
    ? +(rawValue * weight).toFixed(1)
    : -(rawValue * weight).toFixed(1);
  const isPositive = contribution >= 0;

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400">
          {rawValue}/100 × {(weight * 100).toFixed(0)}% weight
        </p>
      </div>
      <span
        className={`text-sm font-bold tabular-nums ${
          isPositive ? "text-green-600" : "text-red-500"
        }`}
      >
        {isPositive ? "+" : ""}
        {contribution}
      </span>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ExplanationDrawerProps {
  area: ScoredArea | null;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExplanationDrawer({ area, onClose }: ExplanationDrawerProps) {
  const isOpen = area !== null;

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer panel */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white shadow-2xl border-l border-gray-200 transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal
        aria-label="Area insights"
      >
        {area && (
          <>
            {/* ── Drawer header ── */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold bg-black text-white px-2 py-0.5 rounded-lg">
                    Rank #{area.rank}
                  </span>
                  <span className="text-xs text-green-600 font-semibold">
                    Score: {area.score}
                  </span>
                </div>
                <h2 className="font-extrabold text-xl text-black leading-tight">
                  {area.name}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Kolkata, West Bengal</p>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="flex-shrink-0 w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                aria-label="Close drawer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ── Scrollable content ── */}
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

              {/* AI reasoning bullets */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  AI Analysis
                </h3>
                <ul className="flex flex-col gap-3">
                  {area.reasoning.map((bullet, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-700 leading-relaxed">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold mt-0.5">
                        {i + 1}
                      </span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Score decomposition — 3-tier */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Score Breakdown
                </h3>
                <p className="text-xs text-gray-400 mb-3">
                  LS = (Demand × 0.40) − (Friction × 0.35) + (Growth × 0.25)
                </p>

                {/* Component scores */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: "Demand", value: area.demand_score, color: "emerald", pct: area.demand_score },
                    { label: "Friction", value: area.friction_score, color: "red", pct: area.friction_score },
                    { label: "Growth", value: area.growth_score, color: "blue", pct: area.growth_score },
                  ].map(({ label, value, color, pct }) => (
                    <div key={label} className={`rounded-xl border px-3 py-2.5 text-center bg-${color}-50 border-${color}-200`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wide text-${color}-600`}>{label}</p>
                      <p className={`text-xl font-extrabold text-${color}-700 mt-0.5`}>{Math.round(value * 100)}</p>
                      <div className="mt-1.5 h-1 rounded-full bg-gray-200 overflow-hidden">
                        <div className={`h-full rounded-full bg-${color}-500`} style={{ width: `${Math.round(pct * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sub-index breakdown per component */}
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 divide-y divide-gray-100">
                  {/* Demand sub-indices */}
                  <div className="py-2">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1.5">Demand inputs</p>
                    <ContributionRow label="Income Index" rawValue={area.income_index} weight={0.30} positive />
                    <ContributionRow label="Foot Traffic" rawValue={area.foot_traffic_proxy} weight={0.35} positive />
                    <ContributionRow label="Population Density" rawValue={area.population_density_index} weight={0.35} positive />
                  </div>
                  {/* Friction sub-indices */}
                  <div className="py-2">
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1.5">Friction inputs</p>
                    <ContributionRow label="Competition (adj.)" rawValue={Math.round(area.competition_index * (1 - area.clustering_benefit_factor))} weight={0.40} positive={false} />
                    <ContributionRow label="Commercial Rent" rawValue={area.commercial_rent_index} weight={0.35} positive={false} />
                    <ContributionRow label="Accessibility Penalty" rawValue={area.accessibility_penalty} weight={0.25} positive={false} />
                  </div>
                  {/* Growth sub-indices */}
                  <div className="py-2">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-1.5">Growth inputs</p>
                    <ContributionRow label="Area Growth Trend" rawValue={area.area_growth_trend} weight={0.50} positive />
                    <ContributionRow label="Vacancy Improvement" rawValue={area.vacancy_rate_improvement} weight={0.30} positive />
                    <ContributionRow label="Infrastructure" rawValue={area.infrastructure_investment_index} weight={0.20} positive />
                  </div>
                </div>

                {/* Clustering note */}
                <p className="text-[10px] text-gray-400 mt-2 px-1">
                  Clustering benefit factor applied: <span className="font-semibold text-gray-600">{area.clustering_benefit_factor.toFixed(2)}</span> (reduces effective competition)
                </p>

                {/* Total */}
                <div className="mt-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-700">Location Score</span>
                  <span className="text-lg font-extrabold text-green-700">{area.score}</span>
                </div>
              </div>

              {/* Coordinates */}
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Coordinates
                </h3>
                <div className="flex gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Latitude</p>
                    <p className="font-mono font-semibold">{area.latitude.toFixed(4)}° N</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Longitude</p>
                    <p className="font-mono font-semibold">{area.longitude.toFixed(4)}° E</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={onClose}
                className="w-full bg-black text-white text-sm font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors"
              >
                Close Insights
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
