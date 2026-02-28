/**
 * app/methodology/page.tsx
 * ------------------------
 * Static page documenting the SiteScapr v2 scoring formula,
 * data sources, assumptions, and design decisions.
 */

import Link from "next/link";

const formulaSteps = [
  {
    label: "Location Score",
    formula: "LS = (Demand × 0.40) − (Friction × 0.35) + (Growth × 0.25)",
    description:
      "The top-level composite score. Demand and Growth are positive contributors; Friction is a penalty. The weights reflect the relative importance of market opportunity vs. operating headwinds vs. future trajectory.",
  },
  {
    label: "Demand Score",
    formula: "DS = (0.30 × income_index) + (0.35 × foot_traffic_index) + (0.35 × population_density_index)",
    description:
      "Measures the revenue potential of the location. Foot traffic and population density are weighted equally and slightly higher than income, because volume-driven businesses depend more on throughput than on per-customer value.",
  },
  {
    label: "Friction Score",
    formula: "FS = (0.40 × adj_competition) + (0.35 × commercial_rent) + (0.25 × accessibility_penalty)",
    description:
      "Measures the operating resistance of the location. Adjusted competition is the dominant friction factor. Rent follows, and accessibility is the smallest but still material component.",
  },
  {
    label: "Adjusted Competition Index",
    formula: "adj_competition = competition_index × (1 − clustering_benefit_factor)",
    description:
      "Reduces the raw competition penalty when the business type benefits from co-location with similar businesses (e.g., food courts, retail clusters). The CBF is set per business type and ranges from 0.0 (professional services) to 0.5 (food & beverage).",
  },
  {
    label: "Growth Score",
    formula: "GS = (0.50 × area_growth_trend) + (0.30 × vacancy_rate_improvement) + (0.20 × infrastructure_investment_index)",
    description:
      "Forward-looking component capturing the medium-term trajectory of the area. Growth trend dominates; vacancy improvement signals market confidence; infrastructure investment is a leading indicator of long-term desirability.",
  },
];

const variables = [
  {
    name: "income_index",
    range: "0–1",
    source: "OpenCity / Census approximation",
    notes: "Average household income and purchasing power. Normalised from 0–100 raw scale.",
    proxy: false,
  },
  {
    name: "foot_traffic_proxy",
    range: "0–1",
    source: "Transit density + landmark proximity proxy",
    notes: "Estimated pedestrian flow derived from metro station proximity, road grade, and commercial density.",
    proxy: true,
  },
  {
    name: "population_density_index",
    range: "0–1",
    source: "Census 2011, KMDA estimates",
    notes: "Normalised residential + daytime population density.",
    proxy: false,
  },
  {
    name: "competition_index",
    range: "0–1",
    source: "OSM commercial POI density",
    notes: "Count of similar-category businesses in a 500m radius, normalised to dataset max.",
    proxy: true,
  },
  {
    name: "commercial_rent_index",
    range: "0–1",
    source: "PropTiger / 99acres commercial listing data",
    notes: "Average per sq.ft. commercial rent, normalised. Rent index 1.0 ≈ ₹5,00,000/month for a typical unit.",
    proxy: false,
  },
  {
    name: "accessibility_penalty",
    range: "0–1",
    source: "Estimated — road width, metro proximity, parking availability",
    notes: "Proxied from road grade and transit coverage. Higher = harder to access. Not from a primary data source.",
    proxy: true,
  },
  {
    name: "area_growth_trend",
    range: "0–1",
    source: "Estimated — KMDA development plans, satellite change detection",
    notes: "Proxied from published development zone classifications and new commercial registration density. Updated annually.",
    proxy: true,
  },
  {
    name: "vacancy_rate_improvement",
    range: "0–1",
    source: "Estimated — commercial occupancy surveys",
    notes: "Proxy for declining vacancy. Derived from listing age on property portals vs. prior year.",
    proxy: true,
  },
  {
    name: "infrastructure_investment_index",
    range: "0–1",
    source: "Estimated — state budget allocations, KMDA reports",
    notes: "Captures planned and recent capital investment in roads, metro, utilities. Reviewed semi-annually.",
    proxy: true,
  },
];

const cbfTable = [
  { type: "Tech Office, Medical Clinic, Educational Institute", cbf: "0.00", rationale: "Professional services compete on differentiation; co-location provides no benefit." },
  { type: "Pharmacy, Gym / Fitness Centre", cbf: "0.15", rationale: "Mild clustering benefit from shared foot traffic corridors." },
  { type: "Retail Store, Supermarket, Salon & Beauty", cbf: "0.30", rationale: "Retail clusters attract comparison shoppers, reducing effective competition." },
  { type: "Restaurant, Cafe", cbf: "0.50", rationale: "Food & beverage hubs create destination effects — competition is strongly mitigated by cluster draw." },
];

export default function MethodologyPage() {
  return (
    <div className="max-w-screen-lg mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Link href="/" className="text-xs text-gray-400 hover:text-black transition-colors">Home</Link>
          <span className="text-gray-300">/</span>
          <span className="text-xs text-gray-600 font-medium">Methodology</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Scoring Methodology</h1>
        <p className="mt-2 text-gray-500 max-w-2xl text-sm leading-relaxed">
          A complete description of the SiteScapr v2 formula — how scores are computed, what data powers each variable,
          and where proxied estimates are used. Transparency is a design principle here, not an afterthought.
        </p>
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 font-semibold">Formula v2.0</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold">Kolkata Beta Dataset</span>
          <span className="text-xs text-gray-400">Last updated: Feb 2026</span>
        </div>
      </div>

      {/* Formula overview */}
      <section className="mb-12">
        <h2 className="text-xl font-bold tracking-tight mb-1">Formula Overview</h2>
        <p className="text-sm text-gray-500 mb-6">
          The v2 formula decomposes the Location Score into three interpretable sub-scores. Each sub-score is computed
          from 2–3 normalised sub-indices and combined with a weighted sum.
        </p>
        <div className="flex flex-col gap-4">
          {formulaSteps.map((step) => (
            <div key={step.label} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{step.label}</p>
                  <code className="block text-sm font-mono bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-2 mb-3 leading-relaxed break-words">
                    {step.formula}
                  </code>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Clustering benefit factor */}
      <section className="mb-12">
        <h2 className="text-xl font-bold tracking-tight mb-1">Clustering Benefit Factor</h2>
        <p className="text-sm text-gray-500 mb-4">
          The CBF reduces the raw competition penalty by the proportion that &quot;cluster draw&quot; offsets head-to-head competition.
          A restaurant in a food court competes less negatively with nearby restaurants than, say, two law firms on the same street.
        </p>
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Business Type</th>
                <th className="px-5 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">CBF</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cbfTable.map((row) => (
                <tr key={row.type} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-700 text-xs">{row.type}</td>
                  <td className="px-5 py-3 text-center font-mono font-bold text-gray-800">{row.cbf}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs leading-relaxed">{row.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Variables & data sources */}
      <section className="mb-12">
        <h2 className="text-xl font-bold tracking-tight mb-1">Variables & Data Sources</h2>
        <p className="text-sm text-gray-500 mb-4">
          Variables marked <span className="font-semibold text-orange-600">proxy</span> are estimated from secondary sources and should be treated as indicative.
          Primary-sourced variables are updated at least annually.
        </p>
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Variable</th>
                <th className="px-5 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">Scale</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Source</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {variables.map((v) => (
                <tr key={v.name} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono font-semibold text-gray-800">{v.name}</code>
                      {v.proxy && (
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">proxy</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center font-mono text-xs text-gray-500">{v.range}</td>
                  <td className="px-5 py-3 text-xs text-gray-600">{v.source}</td>
                  <td className="px-5 py-3 text-xs text-gray-500 leading-relaxed">{v.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Normalisation */}
      <section className="mb-12">
        <h2 className="text-xl font-bold tracking-tight mb-1">Normalisation</h2>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 leading-relaxed">
          <p className="mb-3">
            The Kolkata dataset stores all values on a <strong>0–100 integer scale</strong> for readability.
            The scoring engine divides all values by 100 before applying formula weights, so the internal calculation
            always operates on a 0–1 continuum.
          </p>
          <p className="mb-3">
            The final Location Score is multiplied by 100 for display, giving a <strong>0–65 practical range</strong>
            (theoretical max is 65.0 when all positive inputs are 1.0 and all friction inputs are 0.0).
          </p>
          <p>
            In the Compare calculator, inputs should be entered directly on a 0–1 scale. Values above 1.0 are
            automatically clamped to 1.0.
          </p>
        </div>
      </section>

      {/* Limitations */}
      <section className="mb-12">
        <h2 className="text-xl font-bold tracking-tight mb-1">Limitations & Assumptions</h2>
        <ul className="flex flex-col gap-3 mt-4">
          {[
            "All Kolkata neighborhood data is point-in-time (Feb 2026). Rapidly changing areas (New Town, Rajarhat) may deviate from actuals within 6–12 months.",
            "The formula is a deterministic weighted model, not a machine learning prediction. It cannot account for hyper-local factors (e.g., a specific corner vs. mid-block on the same street).",
            "Proxy variables (marked above) introduce estimation error. Treat scores as relative rankings within the dataset, not absolute predictions of revenue.",
            "Budget filtering uses a linear rent approximation. In reality, commercial landlords negotiate non-linearly and lease terms vary significantly.",
            "The formula does not currently account for seasonality, zoning regulations, or lease availability — all of which materially affect real-world location decisions.",
          ].map((item, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-600">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="font-bold text-gray-800">Try the Formula Yourself</p>
          <p className="text-sm text-gray-500 mt-0.5">Use the Compare calculator to enter your own sub-index values and test custom weight configurations.</p>
        </div>
        <Link
          href="/compare"
          className="bg-black text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-gray-800 transition-colors flex-shrink-0"
        >
          Open Compare →
        </Link>
      </div>
    </div>
  );
}
