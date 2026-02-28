/**
 * InputPanel.tsx
 * --------------
 * Left-panel form for SiteScapr analysis configuration.
 *
 * Renders:
 *  - City selector (Kolkata only in beta)
 *  - Business type dropdown
 *  - Target demographic multi-select (checkbox list)
 *  - Monthly budget range slider
 *  - Analyze button
 *
 * Architecture: Fully controlled component; parent holds no form state.
 * Internal state is reset if more cities are added later.
 */

"use client";

import { useState } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

const BUSINESS_TYPES = [
  "Restaurant",
  "Retail Store",
  "Pharmacy",
  "Cafe",
  "Gym / Fitness Centre",
  "Tech Office",
  "Salon & Beauty",
  "Supermarket",
  "Educational Institute",
  "Medical Clinic",
  "Hotel / Hospitality",
  "Souvenir / Gift Shop",
];

const DEMOGRAPHICS = [
  "Students",
  "Working Professionals",
  "Families",
  "Senior Citizens",
  "Tourists",
  "High Income Households",
  "Young Adults",
];

const BUDGET_MIN = 50_000;
const BUDGET_MAX = 500_000;
const BUDGET_STEP = 10_000;

// ── Props ─────────────────────────────────────────────────────────────────────

interface InputPanelProps {
  onAnalyze: (params: {
    business_type: string;
    target_demographic: string[];
    budget_range: number;
  }) => void;
  isLoading: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function InputPanel({ onAnalyze, isLoading }: InputPanelProps) {
  const [businessType, setBusinessType] = useState<string>("");
  const [demographics, setDemographics] = useState<string[]>([]);
  const [budget, setBudget] = useState<number>(150_000);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  const toggleDemographic = (demo: string) => {
    setDemographics((prev) =>
      prev.includes(demo) ? prev.filter((d) => d !== demo) : [...prev, demo]
    );
  };

  const handleSubmit = () => {
    if (!businessType) {
      setValidationMsg("Please select a business type.");
      return;
    }
    if (demographics.length === 0) {
      setValidationMsg("Select at least one target demographic.");
      return;
    }
    setValidationMsg(null);
    onAnalyze({ business_type: businessType, target_demographic: demographics, budget_range: budget });
  };

  return (
    <aside className="rounded-2xl border border-gray-200 bg-white shadow-card p-6 flex flex-col gap-6 sticky top-24">
      {/* Panel header */}
      <div>
        <h3 className="font-bold text-base tracking-tight">Analysis Parameters</h3>
        <p className="text-xs text-gray-400 mt-0.5">Configure your business profile</p>
      </div>

      {/* ── City ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          City
        </label>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-green-50">
          <span className="text-green-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </span>
          <span className="text-sm font-semibold text-green-800">Kolkata</span>
          <span className="ml-auto text-xs text-green-600 font-medium">Beta</span>
        </div>
      </div>

      {/* ── Business Type ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Business Type
        </label>
        <select
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all appearance-none cursor-pointer"
        >
          <option value="" disabled>
            Select business type…
          </option>
          {BUSINESS_TYPES.map((bt) => (
            <option key={bt} value={bt}>
              {bt}
            </option>
          ))}
        </select>
      </div>

      {/* ── Target Demographics ── */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Target Demographic
        </label>
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
          {DEMOGRAPHICS.map((demo) => (
            <label
              key={demo}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={demographics.includes(demo)}
                onChange={() => toggleDemographic(demo)}
                className="w-4 h-4 accent-black rounded cursor-pointer"
              />
              <span className="text-sm text-gray-700">{demo}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Budget Slider ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Monthly Budget
          </label>
          <span className="text-sm font-bold text-black">
            ₹{(budget / 1000).toFixed(0)}k
          </span>
        </div>
        <input
          type="range"
          min={BUDGET_MIN}
          max={BUDGET_MAX}
          step={BUDGET_STEP}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full h-2 rounded-full bg-gray-200 appearance-none cursor-pointer accent-black"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>₹50k</span>
          <span>₹5L</span>
        </div>
      </div>

      {/* Validation message */}
      {validationMsg && (
        <p className="text-xs text-red-500 font-medium -mt-2">{validationMsg}</p>
      )}

      {/* ── Analyze Button ── */}
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full bg-black text-white font-semibold py-3 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm tracking-wide shadow-md hover:shadow-lg"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Analyzing…
          </span>
        ) : (
          "Analyze →"
        )}
      </button>

      {/* Footnote */}
      <p className="text-[11px] text-gray-300 text-center leading-relaxed -mt-2">
        Scores computed via weighted index model.
        <br />
        No real-time data required.
      </p>
    </aside>
  );
}
