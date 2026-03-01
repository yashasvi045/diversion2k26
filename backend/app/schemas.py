"""
schemas.py
----------
Pydantic models for request/response validation.
Keeps all data contracts in one place for easy future extension.
"""

from pydantic import BaseModel, Field
from typing import List


class AnalyzeRequest(BaseModel):
    """Input payload from the frontend analysis form."""
    business_type: str = Field(..., example="Restaurant")
    target_demographic: List[str] = Field(..., example=["Working Professionals", "Students"])
    budget_range: int = Field(..., ge=50000, le=500000, description="Monthly budget in INR")


class AreaMetrics(BaseModel):
    """Raw metrics for a single neighborhood area (all indices 0–100)."""
    name: str
    latitude: float
    longitude: float
    # Demand inputs
    income_index: float                      # 0–100
    foot_traffic_proxy: float                # 0–100
    population_density_index: float          # 0–100
    # Friction inputs
    competition_index: float                 # 0–100
    commercial_rent_index: float             # 0–100
    accessibility_penalty: float             # 0–100 (higher = harder to reach)
    # Growth inputs
    area_growth_trend: float                 # 0–100 (higher = faster development)
    vacancy_rate_improvement: float          # 0–100 (higher = more vacancy improving)
    infrastructure_investment_index: float   # 0–100


class ScoredArea(BaseModel):
    """Scored and ranked area returned to frontend."""
    name: str
    latitude: float
    longitude: float
    # Final & component scores
    score: float                             # Location Score × 100 (display scale)
    demand_score: float                      # 0–1
    friction_score: float                    # 0–1
    growth_score: float                      # 0–1
    clustering_benefit_factor: float         # 0–0.5 applied
    # Raw indices (0–100, as stored in dataset)
    income_index: float
    foot_traffic_proxy: float
    population_density_index: float
    competition_index: float
    commercial_rent_index: float
    accessibility_penalty: float
    area_growth_trend: float
    vacancy_rate_improvement: float
    infrastructure_investment_index: float
    reasoning: List[str]                     # 3 generated explanation bullets
    rank: int


class AnalyzeResponse(BaseModel):
    """Top-5 ranked areas returned from /analyze."""
    results: List[ScoredArea]
    business_type: str
    total_areas_analyzed: int


class IndexDeltaUpdate(BaseModel):
    """
    Payload sent by the n8n pipeline to update a neighbourhood's indices.
    All delta fields default to 0.0 — only non-zero fields are applied.
    Values are clamped to keep each index within [0, 100].
    """
    area_name: str
    income_index_delta: float = 0.0
    foot_traffic_proxy_delta: float = 0.0
    population_density_index_delta: float = 0.0
    competition_index_delta: float = 0.0
    commercial_rent_index_delta: float = 0.0
    accessibility_penalty_delta: float = 0.0
    area_growth_trend_delta: float = 0.0
    vacancy_rate_improvement_delta: float = 0.0
    infrastructure_investment_index_delta: float = 0.0
    source_summary: str = ""  # short description of the news used
