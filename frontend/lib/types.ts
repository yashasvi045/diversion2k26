/**
 * types.ts
 * --------
 * Shared TypeScript types used across the SiteScapr app.
 */

export interface ScoredArea {
  name: string;
  latitude: number;
  longitude: number;
  score: number;
  demand_score: number;
  friction_score: number;
  growth_score: number;
  clustering_benefit_factor: number;
  income_index: number;
  foot_traffic_proxy: number;
  population_density_index: number;
  competition_index: number;
  commercial_rent_index: number;
  accessibility_penalty: number;
  area_growth_trend: number;
  vacancy_rate_improvement: number;
  infrastructure_investment_index: number;
  reasoning: string[];
  rank: number;
}

export interface AnalyzeResponse {
  results: ScoredArea[];
  business_type: string;
  total_areas_analyzed: number;
}
