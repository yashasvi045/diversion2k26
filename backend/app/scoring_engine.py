"""
scoring_engine.py
-----------------
Core scoring logic for SiteScapr.

Scoring Formula (v2):
  Location Score (LS) = (Demand Score x 0.40) - (Friction Score x 0.35) + (Growth Score x 0.25)

  Demand Score   = (0.30 x income_index) + (0.35 x foot_traffic_index) + (0.35 x population_density_index)
  Friction Score = (0.40 x adjusted_competition_index) + (0.35 x commercial_rent_index) + (0.25 x accessibility_penalty)
     Adjusted Competition Index = competition_index x (1 - clustering_benefit_factor)
  Growth Score   = (0.50 x area_growth_trend) + (0.30 x vacancy_rate_improvement) + (0.20 x infrastructure_investment_index)

  All sub-index inputs are normalised to 0-1 before applying weights.
  clustering_benefit_factor is derived from business type:
    Food & Beverage (Restaurant, Cafe):                 0.50  (High)
    Retail (Retail Store, Supermarket, Salon & Beauty): 0.30  (Medium)
    Professional Services (Tech Office, Clinic, etc.):  0.00  (Low)
    Others:                                             0.15  (Low-Medium)
"""

from typing import List, Dict, Any, Tuple, Optional
from .schemas import AreaMetrics, ScoredArea

# -- Clustering benefit factor by business type --------------------------------

CLUSTERING_BENEFIT: Dict[str, float] = {
    "restaurant":            0.50,
    "cafe":                  0.50,
    "retail store":          0.30,
    "supermarket":           0.30,
    "salon & beauty":        0.30,
    "hotel / hospitality":   0.20,   # hotels cluster in tourist corridors
    "souvenir / gift shop":  0.35,   # very high clustering in tourist zones
    "gym / fitness centre":  0.15,
    "pharmacy":              0.15,
    "tech office":           0.00,
    "medical clinic":        0.00,
    "educational institute": 0.00,
}

DEFAULT_CLUSTERING_BENEFIT = 0.15


def _clustering_benefit(business_type: str) -> float:
    return CLUSTERING_BENEFIT.get(business_type.lower().strip(), DEFAULT_CLUSTERING_BENEFIT)


# -- Business-type-aware weight profiles ---------------------------------------
# Sub-weights define what "Demand", "Friction", and "Growth" actually mean for
# each category. A tech office cares about income + infrastructure far more
# than foot traffic or population density. A restaurant is the opposite.
#
# Each profile: (demand_weights, friction_weights, growth_weights)
#   demand_weights   : (income, foot_traffic, pop_density)     must sum to 1
#   friction_weights : (competition, rent, accessibility)       must sum to 1
#   growth_weights   : (area_trend, vacancy, infra)             must sum to 1

WeightTriple = Tuple[float, float, float]

_PROFILES: Dict[str, Tuple[WeightTriple, WeightTriple, WeightTriple]] = {
    # Professional / office — income + infra matter most; density/rent less so
    "tech office":           ((0.55, 0.15, 0.30), (0.20, 0.20, 0.60), (0.30, 0.20, 0.50)),
    "medical clinic":        ((0.40, 0.25, 0.35), (0.25, 0.30, 0.45), (0.35, 0.25, 0.40)),
    "educational institute": ((0.45, 0.20, 0.35), (0.20, 0.25, 0.55), (0.35, 0.20, 0.45)),
    # Food & beverage — foot traffic + competition are everything for restaurants.
    # Cafes differ: ambient student/youth population density matters more than
    # raw transit burst (a rail terminus doesn't generate cafe customers).
    "restaurant":            ((0.20, 0.50, 0.30), (0.50, 0.30, 0.20), (0.50, 0.30, 0.20)),
    "cafe":                  ((0.20, 0.35, 0.45), (0.50, 0.30, 0.20), (0.50, 0.30, 0.20)),
    # Retail — foot traffic dominant, competition & rent both matter
    "retail store":          ((0.25, 0.45, 0.30), (0.45, 0.35, 0.20), (0.50, 0.30, 0.20)),
    "supermarket":           ((0.20, 0.40, 0.40), (0.40, 0.35, 0.25), (0.50, 0.30, 0.20)),
    "salon & beauty":        ((0.25, 0.45, 0.30), (0.45, 0.35, 0.20), (0.50, 0.30, 0.20)),
    # Tourism & hospitality — income_index is the key discriminator between
    # tourist zones (Esplanade/Park St, income 75-85) and transit hubs
    # (Howrah, income 48). Tourists spend based on the prestige of the destination,
    # not the resident income level. Weighting income at 65% in demand pulls
    # Esplanade/Park Street above transit areas for new hotel/hospitality entrants.
    # Accessibility carries 60% of friction: tourist hotels live and die by ease
    # of reaching the attraction corridor, not just public transit proximity.
    "hotel / hospitality":   ((0.65, 0.25, 0.10), (0.15, 0.25, 0.60), (0.35, 0.25, 0.40)),
    # Souvenir / gift — tourist zone (income) + foot traffic equally important;
    # clustering near tourist landmarks is strong (CBF 0.35)
    "souvenir / gift shop":  ((0.50, 0.40, 0.10), (0.30, 0.30, 0.40), (0.45, 0.30, 0.25)),
    # Health & wellness — population density + accessibility drive footfall
    "pharmacy":              ((0.25, 0.30, 0.45), (0.35, 0.35, 0.30), (0.45, 0.30, 0.25)),
    # Gyms for working professionals correlate with income (membership affordability)
    # more than with raw transit traffic. Upscale gyms cluster near IT belts and
    # affluent residential zones, not at rail termini.
    "gym / fitness centre":  ((0.45, 0.20, 0.35), (0.35, 0.35, 0.30), (0.45, 0.30, 0.25)),
}

_DEFAULT_PROFILE: Tuple[WeightTriple, WeightTriple, WeightTriple] = (
    (0.30, 0.35, 0.35),  # demand
    (0.40, 0.35, 0.25),  # friction
    (0.50, 0.30, 0.20),  # growth
)


def _get_profile(business_type: str) -> Tuple[WeightTriple, WeightTriple, WeightTriple]:
    return _PROFILES.get(business_type.lower().strip(), _DEFAULT_PROFILE)


# -- Kolkata neighborhood dataset ----------------------------------------------
# All indices are on a 0-100 scale; normalised to 0-1 inside scoring.
# New v2 fields (accessibility_penalty, area_growth_trend,
# vacancy_rate_improvement, infrastructure_investment_index) are proxied
# from secondary sources -- see /methodology for assumptions.

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
        "accessibility_penalty": 15,
        "area_growth_trend": 45,
        "vacancy_rate_improvement": 35,
        "infrastructure_investment_index": 65,
    },
    {
        "name": "New Town",
        "latitude": 22.5747,
        "longitude": 88.4647,
        "income_index": 72,
        # Wikipedia confirms 500K floating population + large IT workforce (20K jobs
        # added in 6 months Jan 2023) + hotel cluster guests — raised from 62 to 70.
        "foot_traffic_proxy": 70,
        "population_density_index": 55,
        "competition_index": 40,
        "commercial_rent_index": 55,
        # Orange Line Metro (New Garia–Airport via New Town) under construction,
        # expected 2026. Existing 12-lane VIP Road + AC bus rapid transit already
        # operational. Penalty lowered from 25 to 17 to reflect near-future
        # accessibility plus existing road quality.
        "accessibility_penalty": 17,
        "area_growth_trend": 78,
        "vacancy_rate_improvement": 62,
        # Bengal Silicon Valley Tech Hub, active metro construction, multiple
        # universities (Amity, Presidency, IIT KGP Research Park) — raised from 80.
        "infrastructure_investment_index": 87,
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
        "accessibility_penalty": 20,
        "area_growth_trend": 65,
        "vacancy_rate_improvement": 50,
        "infrastructure_investment_index": 82,
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
        "accessibility_penalty": 55,
        "area_growth_trend": 40,
        "vacancy_rate_improvement": 45,
        "infrastructure_investment_index": 35,
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
        "accessibility_penalty": 20,
        "area_growth_trend": 50,
        "vacancy_rate_improvement": 40,
        "infrastructure_investment_index": 60,
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
        "accessibility_penalty": 30,
        "area_growth_trend": 55,
        "vacancy_rate_improvement": 50,
        "infrastructure_investment_index": 55,
    },
    {
        "name": "Esplanade",
        "latitude": 22.5647,
        "longitude": 88.3511,
        # Tourist/visitor spending + CBD white-collar workforce pushes effective
        # income above the resident average — adjusted from 68 to 75.
        "income_index": 75,
        "foot_traffic_proxy": 92,
        "population_density_index": 75,
        "competition_index": 88,
        "commercial_rent_index": 72,
        "accessibility_penalty": 10,
        # Victoria Memorial, Eden Gardens, Metro, main bus terminals — active
        # tourism investment ongoing; trend raised from 40 to 55.
        "area_growth_trend": 55,
        "vacancy_rate_improvement": 35,
        "infrastructure_investment_index": 72,
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
        "accessibility_penalty": 22,
        "area_growth_trend": 50,
        "vacancy_rate_improvement": 40,
        "infrastructure_investment_index": 58,
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
        "accessibility_penalty": 35,
        "area_growth_trend": 85,
        "vacancy_rate_improvement": 70,
        "infrastructure_investment_index": 88,
    },
    {
        "name": "Jadavpur",
        "latitude": 22.4999,
        "longitude": 88.3697,
        "income_index": 62,
        # Jadavpur University (8,000+ students), Gariahat shopping district nearby,
        # and the busy Dhakuria–Jadavpur corridor push commercial foot traffic higher.
        # Raised from 68 to 76.
        "foot_traffic_proxy": 76,
        "population_density_index": 75,
        "competition_index": 55,
        "commercial_rent_index": 50,
        "accessibility_penalty": 28,
        "area_growth_trend": 58,
        "vacancy_rate_improvement": 52,
        "infrastructure_investment_index": 55,
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
        "accessibility_penalty": 25,
        "area_growth_trend": 35,
        "vacancy_rate_improvement": 30,
        "infrastructure_investment_index": 55,
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
        "accessibility_penalty": 28,
        "area_growth_trend": 50,
        "vacancy_rate_improvement": 48,
        "infrastructure_investment_index": 52,
    },
    {
        "name": "Dum Dum",
        "latitude": 22.6452,
        "longitude": 88.3978,
        "income_index": 52,
        # Airport is in Dum Dum but airport workers ≠ general consumer foot traffic.
        # Residential/transit suburb — foot traffic is moderate, not tourist-grade.
        "foot_traffic_proxy": 62,
        "population_density_index": 85,
        "competition_index": 38,
        "commercial_rent_index": 30,
        # Airport proximity gives decent accessibility but it's not a metro/rail hub
        # for the general city — adjusted from 25 to 20.
        "accessibility_penalty": 20,
        "area_growth_trend": 60,
        "vacancy_rate_improvement": 55,
        "infrastructure_investment_index": 68,
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
        "accessibility_penalty": 28,
        "area_growth_trend": 52,
        "vacancy_rate_improvement": 45,
        "infrastructure_investment_index": 50,
    },
    {
        "name": "Howrah",
        "latitude": 22.5958,
        "longitude": 88.2636,
        "income_index": 48,
        # Howrah Station raw throughput: ~1M+ daily passengers. However, transit
        # throughput ≠ commercial dwell traffic. Commuters rushing to catch trains
        # have a ~30-40% commercial conversion rate vs residential urban zones.
        # Effective consumer foot traffic adjusted from 90 to 74 — still the highest
        # in the dataset, but now represents commercially-usable dwell traffic rather
        # than raw in-transit volume.
        "foot_traffic_proxy": 74,
        "population_density_index": 90,
        # The transit hotel/shop market around Howrah Station is genuinely saturated
        # — dozens of budget lodges, travel agents, and eateries compete for the
        # same rail-commuter catchment. Raised from 55 to 78.
        "competition_index": 78,
        "commercial_rent_index": 26,
        # India's busiest rail terminus + metro = one of the most accessible points
        # in the entire metro area. Penalty should be near-minimum.
        "accessibility_penalty": 10,
        "area_growth_trend": 60,
        "vacancy_rate_improvement": 50,
        "infrastructure_investment_index": 68,
    },
]


# -- Scoring formula -----------------------------------------------------------

def calculate_score(
    area: Dict[str, Any],
    clustering_benefit_factor: float = DEFAULT_CLUSTERING_BENEFIT,
    profile: Tuple[WeightTriple, WeightTriple, WeightTriple] = _DEFAULT_PROFILE,
) -> Tuple[float, float, float, float]:
    """
    Apply the v2 weighted scoring formula using a business-type weight profile.

    Returns:
        (display_score, demand_score, friction_score, growth_score)
        display_score = location_score * 100
        demand/friction/growth are raw 0-1 values
    """
    (w_inc, w_traf, w_dens), (w_comp, w_rent, w_acc), (w_grow, w_vac, w_infra) = profile

    inc   = area["income_index"] / 100
    traf  = area["foot_traffic_proxy"] / 100
    dens  = area["population_density_index"] / 100
    comp  = area["competition_index"] / 100
    rent  = area["commercial_rent_index"] / 100
    acc   = area["accessibility_penalty"] / 100
    grow  = area["area_growth_trend"] / 100
    vac   = area["vacancy_rate_improvement"] / 100
    infra = area["infrastructure_investment_index"] / 100

    demand_score   = (w_inc * inc) + (w_traf * traf) + (w_dens * dens)
    adj_comp       = comp * (1.0 - clustering_benefit_factor)
    friction_score = (w_comp * adj_comp) + (w_rent * rent) + (w_acc * acc)
    growth_score   = (w_grow * grow) + (w_vac * vac) + (w_infra * infra)

    ls = (0.40 * demand_score) - (0.35 * friction_score) + (0.25 * growth_score)
    display_score = round(ls * 100, 1)

    return display_score, round(demand_score, 4), round(friction_score, 4), round(growth_score, 4)


# -- Reasoning generator -------------------------------------------------------

def _threshold_label(value: float, low: float, high: float) -> str:
    if value >= high:
        return "High"
    elif value >= low:
        return "Moderate"
    return "Low"


def generate_reasoning(
    area: Dict[str, Any],
    business_type: str,
    demand_score: float,
    friction_score: float,
    growth_score: float,
) -> List[str]:
    bullets: List[str] = []

    income_lbl  = _threshold_label(area["income_index"], 55, 75)
    traffic_lbl = _threshold_label(area["foot_traffic_proxy"], 55, 75)
    comp_lbl    = _threshold_label(area["competition_index"], 45, 70)
    rent_lbl    = _threshold_label(area["commercial_rent_index"], 40, 65)
    acc_lbl     = _threshold_label(area["accessibility_penalty"], 30, 55)
    growth_lbl  = _threshold_label(area["area_growth_trend"], 45, 65)

    bullets.append(
        f"{income_lbl} consumer income ({area['income_index']}/100) with "
        f"{traffic_lbl.lower()} foot traffic ({area['foot_traffic_proxy']}/100) -- "
        f"Demand Score {round(demand_score * 100, 1)}/100 signals "
        f"{'strong' if demand_score > 0.65 else 'moderate' if demand_score > 0.45 else 'limited'} "
        f"demand potential for a {business_type}."
    )

    if area["competition_index"] >= 70:
        bullets.append(
            f"High market saturation ({area['competition_index']}/100) drives Friction Score "
            f"{round(friction_score * 100, 1)}/100 -- differentiation strategy essential. "
            f"Accessibility is {acc_lbl.lower()} and rent is {rent_lbl.lower()}."
        )
    elif area["competition_index"] >= 45:
        bullets.append(
            f"Moderate competition ({area['competition_index']}/100) with {rent_lbl.lower()} rent -- "
            f"Friction Score {round(friction_score * 100, 1)}/100 leaves room for a well-marketed "
            f"{business_type} to establish a loyal base."
        )
    else:
        bullets.append(
            f"Low competition ({area['competition_index']}/100) and {rent_lbl.lower()} rent yield "
            f"Friction Score {round(friction_score * 100, 1)}/100 -- first-mover advantage available."
        )

    bullets.append(
        f"{growth_lbl} growth trend ({area['area_growth_trend']}/100) with infrastructure index "
        f"{area['infrastructure_investment_index']}/100 -- Growth Score {round(growth_score * 100, 1)}/100 "
        f"indicates this area is "
        f"{'rapidly evolving' if growth_score > 0.60 else 'steadily developing' if growth_score > 0.40 else 'relatively mature'}."
    )

    return bullets


# -- Ranking pipeline ----------------------------------------------------------

def rank_areas(
    business_type: str,
    target_demographic: List[str],
    budget_range: int,
    areas: Optional[List[Dict[str, Any]]] = None,
) -> List[ScoredArea]:
    """Score and rank areas. Uses `areas` if provided, otherwise falls back to KOLKATA_AREAS."""
    cbf          = _clustering_benefit(business_type)
    profile      = _get_profile(business_type)
    scored: List[Dict[str, Any]] = []
    active_areas = areas if areas is not None else KOLKATA_AREAS

    for area in active_areas:
        # Rent index 100 ≈ ₹3,00,000/month (realistic Kolkata upper bound).
        # 1.5× tolerance gives the user a comfortable margin for negotiation.
        estimated_rent = (area["commercial_rent_index"] / 100) * 300_000
        if estimated_rent > budget_range * 1.5:
            continue

        display_score, demand_score, friction_score, growth_score = calculate_score(area, cbf, profile)
        reasoning = generate_reasoning(area, business_type, demand_score, friction_score, growth_score)

        scored.append({
            **area,
            "score": display_score,
            "demand_score": demand_score,
            "friction_score": friction_score,
            "growth_score": growth_score,
            "clustering_benefit_factor": cbf,
            "reasoning": reasoning,
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    top5 = scored[:5]

    return [
        ScoredArea(
            name=a["name"],
            latitude=a["latitude"],
            longitude=a["longitude"],
            score=a["score"],
            demand_score=a["demand_score"],
            friction_score=a["friction_score"],
            growth_score=a["growth_score"],
            clustering_benefit_factor=a["clustering_benefit_factor"],
            income_index=a["income_index"],
            foot_traffic_proxy=a["foot_traffic_proxy"],
            population_density_index=a["population_density_index"],
            competition_index=a["competition_index"],
            commercial_rent_index=a["commercial_rent_index"],
            accessibility_penalty=a["accessibility_penalty"],
            area_growth_trend=a["area_growth_trend"],
            vacancy_rate_improvement=a["vacancy_rate_improvement"],
            infrastructure_investment_index=a["infrastructure_investment_index"],
            reasoning=a["reasoning"],
            rank=idx + 1,
        )
        for idx, a in enumerate(top5)
    ]
