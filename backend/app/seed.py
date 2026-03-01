"""
seed.py
-------
One-time script to populate the area_indices table from the
static KOLKATA_AREAS dataset defined in scoring_engine.py.

This runs automatically on app startup if the table is empty.
You can also run it manually:

    python -m app.seed
"""

from .database import init_db, SessionLocal, AreaIndex
from .scoring_engine import KOLKATA_AREAS


def seed() -> None:
    init_db()
    db = SessionLocal()
    try:
        seeded = 0
        skipped = 0
        for area in KOLKATA_AREAS:
            existing = db.query(AreaIndex).filter(AreaIndex.name == area["name"]).first()
            if existing:
                skipped += 1
                continue
            row = AreaIndex(
                name=area["name"],
                latitude=area["latitude"],
                longitude=area["longitude"],
                income_index=area["income_index"],
                foot_traffic_proxy=area["foot_traffic_proxy"],
                population_density_index=area["population_density_index"],
                competition_index=area["competition_index"],
                commercial_rent_index=area["commercial_rent_index"],
                accessibility_penalty=area["accessibility_penalty"],
                area_growth_trend=area["area_growth_trend"],
                vacancy_rate_improvement=area["vacancy_rate_improvement"],
                infrastructure_investment_index=area["infrastructure_investment_index"],
            )
            db.add(row)
            seeded += 1
        db.commit()
        print(f"[seed] Done — {seeded} areas inserted, {skipped} already existed.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
