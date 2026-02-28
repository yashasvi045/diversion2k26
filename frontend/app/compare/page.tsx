/**
 * app/compare/page.tsx
 * --------------------
 * Multi-location comparison calculator.
 * Fully client-side — no backend call needed.
 *
 * Formula (v2):
 *   LS = (Demand × w_d) − (Friction × w_f) + (Growth × w_g)
 *   Demand   = (w_i × income) + (w_t × foot_traffic) + (w_p × pop_density)
 *   Friction = (w_c × adj_comp) + (w_r × rent) + (w_a × accessibility)
 *              adj_comp = competition × (1 − clustering_benefit_factor)
 *   Growth   = (w_g1 × growth_trend) + (w_g2 × vacancy) + (w_g3 × infra)
 *
 * All inputs: 0–1 (raw values are auto-normalised from any entered scale).
 */

"use client";

import { useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocationInput {
  id: number;
  name: string;
  // Demand
  income_index: number;
  foot_traffic: number;
  population_density: number;
  // Friction
  competition_index: number;
  commercial_rent: number;
  accessibility_penalty: number;
  clustering_benefit_factor: number;
  // Growth
  area_growth_trend: number;
  vacancy_rate_improvement: number;
  infrastructure_investment: number;
}

interface TopLevelWeights {
  demand: number;
  friction: number;
  growth: number;
}

interface SubWeights {
  demand_income: number;
  demand_foot_traffic: number;
  demand_population: number;
  friction_competition: number;
  friction_rent: number;
  friction_accessibility: number;
  growth_trend: number;
  growth_vacancy: number;
  growth_infra: number;
}

interface ComputedScore {
  id: number;
  name: string;
  location_score: number;
  demand_score: number;
  friction_score: number;
  growth_score: number;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_LOCATION = (id: number): LocationInput => ({
  id,
  name: `Location ${id}`,
  income_index: 0.65,
  foot_traffic: 0.60,
  population_density: 0.55,
  competition_index: 0.50,
  commercial_rent: 0.45,
  accessibility_penalty: 0.25,
  clustering_benefit_factor: 0.15,
  area_growth_trend: 0.50,
  vacancy_rate_improvement: 0.45,
  infrastructure_investment: 0.50,
});

const DEFAULT_TOP: TopLevelWeights = { demand: 0.40, friction: 0.35, growth: 0.25 };

const DEFAULT_SUB: SubWeights = {
  demand_income: 0.30,
  demand_foot_traffic: 0.35,
  demand_population: 0.35,
  friction_competition: 0.40,
  friction_rent: 0.35,
  friction_accessibility: 0.25,
  growth_trend: 0.50,
  growth_vacancy: 0.30,
  growth_infra: 0.20,
};

const CLUSTERING_PRESETS = [
  { label: "Low — Professional Services (0.0)", value: 0.0 },
  { label: "Medium — Retail (0.3)", value: 0.3 },
  { label: "High — Food & Beverage (0.5)", value: 0.5 },
];

// ── Formula ───────────────────────────────────────────────────────────────────

function computeScore(loc: LocationInput, top: TopLevelWeights, sub: SubWeights): ComputedScore {
  const demand =
    sub.demand_income * loc.income_index +
    sub.demand_foot_traffic * loc.foot_traffic +
    sub.demand_population * loc.population_density;

  const adj_comp = loc.competition_index * (1 - loc.clustering_benefit_factor);
  const friction =
    sub.friction_competition * adj_comp +
    sub.friction_rent * loc.commercial_rent +
    sub.friction_accessibility * loc.accessibility_penalty;

  const growth =
    sub.growth_trend * loc.area_growth_trend +
    sub.growth_vacancy * loc.vacancy_rate_improvement +
    sub.growth_infra * loc.infrastructure_investment;

  const ls = top.demand * demand - top.friction * friction + top.growth * growth;

  return {
    id: loc.id,
    name: loc.name || `Location ${loc.id}`,
    location_score: Math.round(ls * 100 * 10) / 10,
    demand_score: Math.round(demand * 100 * 10) / 10,
    friction_score: Math.round(friction * 100 * 10) / 10,
    growth_score: Math.round(growth * 100 * 10) / 10,
  };
}

function weightsSum(a: number, b: number, c: number) {
  return Math.round((a + b + c) * 100) / 100;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SliderInput({
  label,
  tooltip,
  value,
  onChange,
}: {
  label: string;
  tooltip: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex flex-col gap-1" title={tooltip}>
      <div className="flex justify-between items-center">
        <label className="text-xs text-gray-500 font-medium truncate max-w-[160px]">{label}</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={value}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) onChange(Math.max(0, Math.min(1, v)));
            }}
            className="w-14 text-xs text-right font-mono border border-gray-200 rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-green-400"
          />
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-gray-200 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-600 cursor-pointer"
        style={{
          background: `linear-gradient(to right, #16a34a ${pct}%, #e5e7eb ${pct}%)`,
        }}
      />
    </div>
  );
}

function WeightInput({
  label,
  value,
  onChange,
  invalid,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  invalid: boolean;
}) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${invalid ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
      <span className="text-xs font-medium text-gray-700">{label}</span>
      <input
        type="number"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(Math.max(0, Math.min(1, v)));
        }}
        className={`w-16 text-xs text-right font-mono border rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-1 ${invalid ? "border-red-300 focus:ring-red-400 bg-white" : "border-gray-200 focus:ring-green-400 bg-white"}`}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ComparePage() {
  const [locations, setLocations] = useState<LocationInput[]>([DEFAULT_LOCATION(1)]);
  const [topWeights, setTopWeights] = useState<TopLevelWeights>(DEFAULT_TOP);
  const [subWeights, setSubWeights] = useState<SubWeights>(DEFAULT_SUB);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [openLocationId, setOpenLocationId] = useState<number | null>(1);
  let nextId = Math.max(...locations.map((l) => l.id)) + 1;

  const addLocation = () => {
    if (locations.length >= 5) return;
    const id = nextId++;
    setLocations((prev) => [...prev, DEFAULT_LOCATION(id)]);
    setOpenLocationId(id);
  };

  const removeLocation = (id: number) => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLocation = useCallback((id: number, field: keyof LocationInput, value: number | string) => {
    setLocations((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  }, []);

  const setTopWeight = (key: keyof TopLevelWeights, v: number) =>
    setTopWeights((prev) => ({ ...prev, [key]: v }));
  const setSubWeight = (key: keyof SubWeights, v: number) =>
    setSubWeights((prev) => ({ ...prev, [key]: v }));

  // Compute scores
  const scores: ComputedScore[] = locations
    .map((loc) => computeScore(loc, topWeights, subWeights))
    .sort((a, b) => b.location_score - a.location_score)
    .map((s, i) => ({ ...s, rank: i + 1 }));

  // Weight validation
  const topSum = weightsSum(topWeights.demand, topWeights.friction, topWeights.growth);
  const demandSum = weightsSum(subWeights.demand_income, subWeights.demand_foot_traffic, subWeights.demand_population);
  const frictionSum = weightsSum(subWeights.friction_competition, subWeights.friction_rent, subWeights.friction_accessibility);
  const growthSum = weightsSum(subWeights.growth_trend, subWeights.growth_vacancy, subWeights.growth_infra);

  const topInvalid = topSum !== 1.0;
  const demandInvalid = demandSum !== 1.0;
  const frictionInvalid = frictionSum !== 1.0;
  const growthInvalid = growthSum !== 1.0;
  const anyInvalid = topInvalid || demandInvalid || frictionInvalid || growthInvalid;

  // CSV export
  const exportCSV = () => {
    const header = [
      "Rank", "Location", "Location Score", "Demand Score", "Friction Score", "Growth Score",
      "Income Index", "Foot Traffic", "Population Density", "Competition Index",
      "Commercial Rent", "Accessibility Penalty", "Clustering Benefit Factor",
      "Growth Trend", "Vacancy Improvement", "Infrastructure",
    ].join(",");

    const rows = scores.map((s, i) => {
      const loc = locations.find((l) => l.id === s.id)!;
      return [
        i + 1, `"${s.name}"`, s.location_score, s.demand_score, s.friction_score, s.growth_score,
        loc.income_index, loc.foot_traffic, loc.population_density, loc.competition_index,
        loc.commercial_rent, loc.accessibility_penalty, loc.clustering_benefit_factor,
        loc.area_growth_trend, loc.vacancy_rate_improvement, loc.infrastructure_investment,
      ].join(",");
    });

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sitescapr-comparison.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-10">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Custom Calculator</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Location Comparison</h1>
        <p className="mt-1.5 text-sm text-gray-400 max-w-2xl">
          Manually enter sub-index values for up to 5 locations and compare them side-by-side using the SiteScapr v2 formula.
          All inputs are on a 0–1 scale. Values are normalised automatically if you enter 0–100.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8 items-start">
        {/* Left — location inputs */}
        <div className="flex flex-col gap-4">

          {/* Location cards */}
          {locations.map((loc) => {
            const isOpen = openLocationId === loc.id;
            const score = scores.find((s) => s.id === loc.id);
            return (
              <div key={loc.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {/* Card header */}
                <button
                  onClick={() => setOpenLocationId(isOpen ? null : loc.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-black text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {scores.findIndex((s) => s.id === loc.id) + 1}
                    </span>
                    <span className="font-semibold text-sm text-gray-800">{loc.name || `Location ${loc.id}`}</span>
                    {score && (
                      <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                        LS: {score.location_score}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {locations.length > 1 && (
                      <span
                        onClick={(e) => { e.stopPropagation(); removeLocation(loc.id); }}
                        className="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        Remove
                      </span>
                    )}
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 border-t border-gray-100">
                    {/* Location name */}
                    <div className="mt-4 mb-5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Location Name</label>
                      <input
                        type="text"
                        value={loc.name}
                        onChange={(e) => updateLocation(loc.id, "name", e.target.value)}
                        placeholder="e.g. Park Street"
                        className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {/* Demand inputs */}
                      <div className="flex flex-col gap-4">
                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide border-b border-emerald-100 pb-1.5">
                          Demand Inputs
                        </p>
                        <SliderInput
                          label="Income Index"
                          tooltip="Average household income and purchasing power of the area. Higher = more affluent."
                          value={loc.income_index}
                          onChange={(v) => updateLocation(loc.id, "income_index", v)}
                        />
                        <SliderInput
                          label="Foot Traffic"
                          tooltip="Estimated daily pedestrian flow near the location. Influenced by transit, landmarks, and density."
                          value={loc.foot_traffic}
                          onChange={(v) => updateLocation(loc.id, "foot_traffic", v)}
                        />
                        <SliderInput
                          label="Population Density"
                          tooltip="Residential and commercial density indicating addressable market size."
                          value={loc.population_density}
                          onChange={(v) => updateLocation(loc.id, "population_density", v)}
                        />
                      </div>

                      {/* Friction inputs */}
                      <div className="flex flex-col gap-4">
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wide border-b border-red-100 pb-1.5">
                          Friction Inputs
                        </p>
                        <SliderInput
                          label="Competition Index"
                          tooltip="Density of similar businesses in the catchment area. Higher = more saturated."
                          value={loc.competition_index}
                          onChange={(v) => updateLocation(loc.id, "competition_index", v)}
                        />
                        <SliderInput
                          label="Commercial Rent"
                          tooltip="Indexed cost of commercial space. Higher = more expensive relative to budget."
                          value={loc.commercial_rent}
                          onChange={(v) => updateLocation(loc.id, "commercial_rent", v)}
                        />
                        <SliderInput
                          label="Accessibility Penalty"
                          tooltip="Difficulty of reaching the location (parking, transit, road access). Higher = harder to reach."
                          value={loc.accessibility_penalty}
                          onChange={(v) => updateLocation(loc.id, "accessibility_penalty", v)}
                        />
                        {/* Clustering benefit */}
                        <div>
                          <label className="text-xs text-gray-500 font-medium" title="Clustering reduces effective competition. Food/beverage clusters benefit most; professional services benefit least.">
                            Clustering Benefit
                          </label>
                          <select
                            value={loc.clustering_benefit_factor}
                            onChange={(e) => updateLocation(loc.id, "clustering_benefit_factor", parseFloat(e.target.value))}
                            className="mt-1.5 w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                          >
                            {CLUSTERING_PRESETS.map((p) => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                            <option value={loc.clustering_benefit_factor}>
                              Custom: {loc.clustering_benefit_factor.toFixed(2)}
                            </option>
                          </select>
                          <input
                            type="range" min={0} max={0.5} step={0.05}
                            value={loc.clustering_benefit_factor}
                            onChange={(e) => updateLocation(loc.id, "clustering_benefit_factor", parseFloat(e.target.value))}
                            className="mt-1.5 w-full h-1.5 rounded-full appearance-none bg-gray-200 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, #f97316 ${loc.clustering_benefit_factor * 200}%, #e5e7eb ${loc.clustering_benefit_factor * 200}%)`,
                            }}
                          />
                          <p className="text-[10px] text-gray-400 mt-0.5">Value: {loc.clustering_benefit_factor.toFixed(2)} → adj. competition = {(loc.competition_index * (1 - loc.clustering_benefit_factor)).toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Growth inputs */}
                      <div className="flex flex-col gap-4">
                        <p className="text-xs font-bold text-blue-700 uppercase tracking-wide border-b border-blue-100 pb-1.5">
                          Growth Inputs
                        </p>
                        <SliderInput
                          label="Area Growth Trend"
                          tooltip="Rate of commercial and residential development activity in the area. Higher = faster growth."
                          value={loc.area_growth_trend}
                          onChange={(v) => updateLocation(loc.id, "area_growth_trend", v)}
                        />
                        <SliderInput
                          label="Vacancy Improvement"
                          tooltip="Improvement in commercial vacancy rate over time. Higher = more space becoming occupied."
                          value={loc.vacancy_rate_improvement}
                          onChange={(v) => updateLocation(loc.id, "vacancy_rate_improvement", v)}
                        />
                        <SliderInput
                          label="Infrastructure Investment"
                          tooltip="Level of public infrastructure investment (roads, metro, utilities). Higher = better-serviced area."
                          value={loc.infrastructure_investment}
                          onChange={(v) => updateLocation(loc.id, "infrastructure_investment", v)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add location */}
          {locations.length < 5 && (
            <button
              onClick={addLocation}
              className="rounded-2xl border-2 border-dashed border-gray-200 hover:border-green-400 hover:bg-green-50 transition-colors py-4 text-sm font-semibold text-gray-400 hover:text-green-700 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Location ({locations.length}/5)
            </button>
          )}

          {/* Advanced settings */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-semibold text-gray-700">Advanced Settings</span>
                {anyInvalid && (
                  <span className="text-xs font-semibold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                    Weight error
                  </span>
                )}
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${showAdvanced ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAdvanced && (
              <div className="px-5 pb-5 border-t border-gray-100">
                <p className="text-xs text-gray-400 mt-4 mb-4">
                  Edit formula weights below. Each group must sum to exactly 1.00 — a warning will appear if they don&apos;t.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Top-level weights */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Location Score Weights</p>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${topInvalid ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                        Σ = {topSum.toFixed(2)}
                      </span>
                    </div>
                    {topInvalid && <p className="text-xs text-red-500 mb-2">⚠ Weights must sum to 1.00</p>}
                    <div className="flex flex-col gap-2">
                      <WeightInput label="Demand weight" value={topWeights.demand} onChange={(v) => setTopWeight("demand", v)} invalid={topInvalid} />
                      <WeightInput label="Friction weight" value={topWeights.friction} onChange={(v) => setTopWeight("friction", v)} invalid={topInvalid} />
                      <WeightInput label="Growth weight" value={topWeights.growth} onChange={(v) => setTopWeight("growth", v)} invalid={topInvalid} />
                    </div>
                  </div>

                  {/* Demand sub-weights */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Demand Sub-weights</p>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${demandInvalid ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                        Σ = {demandSum.toFixed(2)}
                      </span>
                    </div>
                    {demandInvalid && <p className="text-xs text-red-500 mb-2">⚠ Must sum to 1.00</p>}
                    <div className="flex flex-col gap-2">
                      <WeightInput label="Income" value={subWeights.demand_income} onChange={(v) => setSubWeight("demand_income", v)} invalid={demandInvalid} />
                      <WeightInput label="Foot Traffic" value={subWeights.demand_foot_traffic} onChange={(v) => setSubWeight("demand_foot_traffic", v)} invalid={demandInvalid} />
                      <WeightInput label="Population Density" value={subWeights.demand_population} onChange={(v) => setSubWeight("demand_population", v)} invalid={demandInvalid} />
                    </div>
                  </div>

                  {/* Friction sub-weights */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-red-600 uppercase tracking-wide">Friction Sub-weights</p>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${frictionInvalid ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                        Σ = {frictionSum.toFixed(2)}
                      </span>
                    </div>
                    {frictionInvalid && <p className="text-xs text-red-500 mb-2">⚠ Must sum to 1.00</p>}
                    <div className="flex flex-col gap-2">
                      <WeightInput label="Competition" value={subWeights.friction_competition} onChange={(v) => setSubWeight("friction_competition", v)} invalid={frictionInvalid} />
                      <WeightInput label="Commercial Rent" value={subWeights.friction_rent} onChange={(v) => setSubWeight("friction_rent", v)} invalid={frictionInvalid} />
                      <WeightInput label="Accessibility" value={subWeights.friction_accessibility} onChange={(v) => setSubWeight("friction_accessibility", v)} invalid={frictionInvalid} />
                    </div>
                  </div>

                  {/* Growth sub-weights */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Growth Sub-weights</p>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${growthInvalid ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                        Σ = {growthSum.toFixed(2)}
                      </span>
                    </div>
                    {growthInvalid && <p className="text-xs text-red-500 mb-2">⚠ Must sum to 1.00</p>}
                    <div className="flex flex-col gap-2">
                      <WeightInput label="Growth Trend" value={subWeights.growth_trend} onChange={(v) => setSubWeight("growth_trend", v)} invalid={growthInvalid} />
                      <WeightInput label="Vacancy Improvement" value={subWeights.growth_vacancy} onChange={(v) => setSubWeight("growth_vacancy", v)} invalid={growthInvalid} />
                      <WeightInput label="Infrastructure" value={subWeights.growth_infra} onChange={(v) => setSubWeight("growth_infra", v)} invalid={growthInvalid} />
                    </div>
                  </div>
                </div>

                {/* Reset button */}
                <button
                  onClick={() => { setTopWeights(DEFAULT_TOP); setSubWeights(DEFAULT_SUB); }}
                  className="mt-4 text-xs font-semibold text-gray-500 hover:text-black border border-gray-200 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Reset to defaults
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right — results table */}
        <div className="sticky top-24">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-gray-800">Ranked Results</h2>
                <p className="text-xs text-gray-400 mt-0.5">Sorted by Location Score</p>
              </div>
              <button
                onClick={exportCSV}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-black border border-gray-200 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Export CSV
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">#</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Location</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">LS</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-emerald-600 uppercase tracking-wide">D</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-red-500 uppercase tracking-wide">F</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-blue-600 uppercase tracking-wide">G</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {scores.map((s, i) => (
                    <tr key={s.id} className={`${i === 0 ? "bg-green-50/50" : "hover:bg-gray-50"} transition-colors`}>
                      <td className="px-4 py-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-black text-white" : "bg-gray-100 text-gray-600"}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800 text-xs max-w-[100px] truncate">{s.name}</td>
                      <td className="px-4 py-3 text-right font-extrabold text-green-700">{s.location_score}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600 text-xs">{s.demand_score}</td>
                      <td className="px-4 py-3 text-right font-semibold text-red-500 text-xs">{s.friction_score}</td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-600 text-xs">{s.growth_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-3 text-[10px] text-gray-500">
              <span><strong className="text-gray-700">LS</strong> Location Score (×100)</span>
              <span><strong className="text-emerald-600">D</strong> Demand Score (×100)</span>
              <span><strong className="text-red-500">F</strong> Friction Score (×100)</span>
              <span><strong className="text-blue-600">G</strong> Growth Score (×100)</span>
            </div>
          </div>

          {/* Formula reminder */}
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white px-5 py-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Active Formula</p>
            <p className="text-xs text-gray-600 font-mono leading-relaxed">
              LS = ({topWeights.demand} × D) − ({topWeights.friction} × F) + ({topWeights.growth} × G)
            </p>
            {anyInvalid && (
              <p className="text-xs text-red-500 mt-2 font-semibold">⚠ Scores may be inaccurate — fix weight errors above.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
