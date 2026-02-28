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
    """Raw metrics for a single neighborhood area."""
    name: str
    latitude: float
    longitude: float
    population_density_index: float  # 0–100
    income_index: float              # 0–100
    competition_index: float         # 0–100
    foot_traffic_proxy: float        # 0–100
    commercial_rent_index: float     # 0–100


class ScoredArea(BaseModel):
    """Scored and ranked area returned to frontend."""
    name: str
    latitude: float
    longitude: float
    score: float                     # Final rounded score
    income_index: float
    foot_traffic_proxy: float
    population_density_index: float
    competition_index: float
    commercial_rent_index: float
    reasoning: List[str]             # 3 generated explanation bullets
    rank: int


class AnalyzeResponse(BaseModel):
    """Top-5 ranked areas returned from /analyze."""
    results: List[ScoredArea]
    business_type: str
    total_areas_analyzed: int
