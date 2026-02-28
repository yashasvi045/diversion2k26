"""
scoring_engine.py
-----------------
Core scoring logic for SiteScapr.

Scoring Formula:
  Final Score = (0.30 × income_index)
              + (0.25 × foot_traffic_proxy)
              + (0.20 × population_density_index)
              − (0.15 × competition_index)
              − (0.10 × commercial_rent_index)

Architecture note:
  This module is intentionally stateless and pure-function based,
  making it straightforward to swap in a trained ML model later.
"""

from typing import List, Dict, Any
from .schemas import AreaMetrics, ScoredArea

# ── Kolkata neighborhood dataset ──────────────────────────────────────────────
# Each area has realistic, research-informed index values (0–100).
# Sources: OpenCity, census approximations, commercial real-estate data.

KOLKATA_AREAS: List[Dict[str, Any]] = [
    {
        "name": "Park Street",
        "latitude": 22.5517,
        "longitude": 88.3509,
        "income_index": 85,
        "foot_traffic_proxy": 88,
        "population_density_index": 65,
        "competition_index": 90,
        "commercial_rent_index": 82,
    },
    {
        "name": "New Town",
        "latitude": 22.5747,
        "longitude": 88.4647,
        "income_index": 72,
        "foot_traffic_proxy": 62,
        "population_density_index": 52,
        "competition_index": 40,
        "commercial_rent_index": 55,
    },
    {
        "name": "Salt Lake Sector V",
        "latitude": 22.5697,
        "longitude": 88.4290,
        "income_index": 78,
        "foot_traffic_proxy": 85,
        "population_density_index": 60,
        "competition_index": 60,
        "commercial_rent_index": 72,
    },
    {
        "name": "Behala",
        "latitude": 22.5016,
        "longitude": 88.3107,
        "income_index": 52,
        "foot_traffic_proxy": 62,
        "population_density_index": 88,
        "competition_index": 36,
        "commercial_rent_index": 28,
    },
    {
        "name": "Ballygunge",
        "latitude": 22.5311,
        "longitude": 88.3590,
        "income_index": 82,
        "foot_traffic_proxy": 70,
        "population_density_index": 55,
        "competition_index": 62,
        "commercial_rent_index": 78,
    },
    {
        "name": "Shyambazar",
        "latitude": 22.6041,
        "longitude": 88.3765,
        "income_index": 60,
        "foot_traffic_proxy": 80,
        "population_density_index": 80,
        "competition_index": 68,
        "commercial_rent_index": 45,
    },
    {
        "name": "Esplanade",
        "latitude": 22.5647,
        "longitude": 88.3511,
        "income_index": 68,
        "foot_traffic_proxy": 92,
        "population_density_index": 75,
        "competition_index": 88,
        "commercial_rent_index": 72,
    },
    {
        "name": "Gariahat",
        "latitude": 22.5218,
        "longitude": 88.3633,
        "income_index": 70,
        "foot_traffic_proxy": 82,
        "population_density_index": 68,
        "competition_index": 78,
        "commercial_rent_index": 62,
    },
    {
        "name": "Rajarhat",
        "latitude": 22.6078,
        "longitude": 88.4785,
        "income_index": 65,
        "foot_traffic_proxy": 50,
        "population_density_index": 40,
        "competition_index": 33,
        "commercial_rent_index": 38,
    },
    {
        "name": "Jadavpur",
        "latitude": 22.4999,
        "longitude": 88.3697,
        "income_index": 62,
        "foot_traffic_proxy": 68,
        "population_density_index": 72,
        "competition_index": 55,
        "commercial_rent_index": 50,
    },
    {
        "name": "Alipore",
        "latitude": 22.5266,
        "longitude": 88.3363,
        "income_index": 92,
        "foot_traffic_proxy": 42,
        "population_density_index": 35,
        "competition_index": 28,
        "commercial_rent_index": 88,
    },
    {
        "name": "Tollygunge",
        "latitude": 22.4981,
        "longitude": 88.3424,
        "income_index": 60,
        "foot_traffic_proxy": 65,
        "population_density_index": 78,
        "competition_index": 52,
        "commercial_rent_index": 46,
    },
    {
        "name": "Dum Dum",
        "latitude": 22.6452,
        "longitude": 88.3978,
        "income_index": 52,
        "foot_traffic_proxy": 72,
        "population_density_index": 85,
        "competition_index": 38,
        "commercial_rent_index": 30,
    },
    {
        "name": "Kasba",
        "latitude": 22.5135,
        "longitude": 88.3837,
        "income_index": 65,
        "foot_traffic_proxy": 70,
        "population_density_index": 70,
        "competition_index": 48,
        "commercial_rent_index": 55,
    },
    {
        "name": "Howrah",
        "latitude": 22.5958,
        "longitude": 88.2636,
        "income_index": 48,
        "foot_traffic_proxy": 76,
        "population_density_index": 90,
        "competition_index": 55,
        "commercial_rent_index": 26,
    },
]


def calculate_score(area: Dict[str, Any]) -> float:
    """
    Apply weighted scoring formula to an area dict.
    Returns score rounded to 1 decimal place.
    """
    raw = (
        0.30 * area["income_index"]
        + 0.25 * area["foot_traffic_proxy"]
        + 0.20 * area["population_density_index"]
        - 0.15 * area["competition_index"]
        - 0.10 * area["commercial_rent_index"]
    )
    return round(raw, 1)


def _threshold_label(value: float, low: float, high: float) -> str:
    """Helper: categorize a 0–100 index into Low / Moderate / High."""
    if value >= high:
        return "High"
    elif value >= low:
        return "Moderate"
    return "Low"


def generate_reasoning(area: Dict[str, Any], business_type: str) -> List[str]:
    """
    Rule-based reasoning bullet generator.
    Produces 3 human-readable insight sentences per area.
    Architecture note: designed to be replaced by an LLM call later.
    """
    bullets: List[str] = []

    income_lbl = _threshold_label(area["income_index"], 55, 75)
    traffic_lbl = _threshold_label(area["foot_traffic_proxy"], 55, 75)
    density_lbl = _threshold_label(area["population_density_index"], 55, 75)
    comp_lbl = _threshold_label(area["competition_index"], 45, 70)
    rent_lbl = _threshold_label(area["commercial_rent_index"], 40, 65)

    # Bullet 1: demand signal
    bullets.append(
        f"{income_lbl} consumer income ({area['income_index']}/100) combined with "
        f"{traffic_lbl.lower()} pedestrian traffic ({area['foot_traffic_proxy']}/100) "
        f"suggests {'strong' if area['income_index'] > 70 and area['foot_traffic_proxy'] > 70 else 'moderate'} "
        f"demand potential for a {business_type}."
    )

    # Bullet 2: competitive landscape
    if area["competition_index"] >= 70:
        bullets.append(
            f"High market saturation ({area['competition_index']}/100) — differentiation "
            f"strategy or niche positioning is essential to gain traction in this zone."
        )
    elif area["competition_index"] >= 45:
        bullets.append(
            f"Moderate competition ({area['competition_index']}/100) leaves room for a "
            f"well-marketed {business_type} to establish a loyal customer base."
        )
    else:
        bullets.append(
            f"Low competition ({area['competition_index']}/100) presents a first-mover "
            f"advantage — this area is largely underserved for {business_type} businesses."
        )

    # Bullet 3: cost vs density trade-off
    bullets.append(
        f"{density_lbl} residential density ({area['population_density_index']}/100) with "
        f"{rent_lbl.lower()} commercial rent ({area['commercial_rent_index']}/100) "
        f"offers a {'favorable ROI runway' if area['commercial_rent_index'] < 55 else 'higher upfront cost'} "
        f"— {'ideal for volume-driven models' if area['population_density_index'] > 70 else 'better suited for premium or niche formats'}."
    )

    return bullets


def rank_areas(
    business_type: str,
    target_demographic: List[str],
    budget_range: int,
) -> List[ScoredArea]:
    """
    Score all Kolkata areas, filter by budget affordability,
    and return the top 5 ranked results.
    """
    scored: List[Dict[str, Any]] = []

    for area in KOLKATA_AREAS:
        # Soft budget filter: exclude areas where rent index is proportionally
        # too high relative to the user's budget (rough heuristic mapping)
        # Rent index 100 ≈ ₹5,00,000/month; scale linearly.
        estimated_rent = (area["commercial_rent_index"] / 100) * 500_000
        if estimated_rent > budget_range * 1.2:  # 20% tolerance
            continue

        score = calculate_score(area)
        reasoning = generate_reasoning(area, business_type)

        scored.append({
            **area,
            "score": score,
            "reasoning": reasoning,
        })

    # Sort descending by score, take top 5
    scored.sort(key=lambda x: x["score"], reverse=True)
    top5 = scored[:5]

    return [
        ScoredArea(
            name=a["name"],
            latitude=a["latitude"],
            longitude=a["longitude"],
            score=a["score"],
            income_index=a["income_index"],
            foot_traffic_proxy=a["foot_traffic_proxy"],
            population_density_index=a["population_density_index"],
            competition_index=a["competition_index"],
            commercial_rent_index=a["commercial_rent_index"],
            reasoning=a["reasoning"],
            rank=idx + 1,
        )
        for idx, a in enumerate(top5)
    ]
