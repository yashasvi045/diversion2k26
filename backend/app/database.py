"""
database.py
-----------
SQLAlchemy ORM layer for persisting area index data.

SQLite is used by default (DATABASE_URL=sqlite:///./sitescapr.db).
No external database required — the .db file is created automatically
in the backend/ directory the first time the app starts.

To switch to PostgreSQL, set DATABASE_URL in your .env:
  DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5432/sitescapr
"""

import os
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from sqlalchemy import create_engine, Column, String, Float, DateTime
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sitescapr.db")

# SQLite requires check_same_thread=False for use with FastAPI's sync routes.
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class AreaIndex(Base):
    """One row per Kolkata neighbourhood — all 9 indices stored as floats (0–100)."""

    __tablename__ = "area_indices"

    name                            = Column(String, primary_key=True, index=True)
    latitude                        = Column(Float, nullable=False)
    longitude                       = Column(Float, nullable=False)
    # Demand indices
    income_index                    = Column(Float, nullable=False)
    foot_traffic_proxy              = Column(Float, nullable=False)
    population_density_index        = Column(Float, nullable=False)
    # Friction indices
    competition_index               = Column(Float, nullable=False)
    commercial_rent_index           = Column(Float, nullable=False)
    accessibility_penalty           = Column(Float, nullable=False)
    # Growth indices
    area_growth_trend               = Column(Float, nullable=False)
    vacancy_rate_improvement        = Column(Float, nullable=False)
    infrastructure_investment_index = Column(Float, nullable=False)
    # Pipeline metadata
    last_updated                    = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_news_summary               = Column(String, default="")


# Ordered list of index field names — used when applying deltas.
_INDEX_FIELDS: List[str] = [
    "income_index",
    "foot_traffic_proxy",
    "population_density_index",
    "competition_index",
    "commercial_rent_index",
    "accessibility_penalty",
    "area_growth_trend",
    "vacancy_rate_improvement",
    "infrastructure_investment_index",
]


def init_db() -> None:
    """Create all tables if they do not already exist."""
    Base.metadata.create_all(bind=engine)


def get_areas() -> List[Dict[str, Any]]:
    """
    Return all areas from the DB as a list of dicts with the same shape
    as KOLKATA_AREAS in scoring_engine.py. Returns [] if the table is empty.
    """
    db = SessionLocal()
    try:
        rows = db.query(AreaIndex).all()
        return [
            {
                "name":                           r.name,
                "latitude":                       r.latitude,
                "longitude":                      r.longitude,
                "income_index":                   r.income_index,
                "foot_traffic_proxy":             r.foot_traffic_proxy,
                "population_density_index":       r.population_density_index,
                "competition_index":              r.competition_index,
                "commercial_rent_index":          r.commercial_rent_index,
                "accessibility_penalty":          r.accessibility_penalty,
                "area_growth_trend":              r.area_growth_trend,
                "vacancy_rate_improvement":       r.vacancy_rate_improvement,
                "infrastructure_investment_index": r.infrastructure_investment_index,
            }
            for r in rows
        ]
    finally:
        db.close()


def apply_delta(area_name: str, deltas: Dict[str, float], source_summary: str = "") -> bool:
    """
    Apply news-derived index deltas to a single area row.

    Each delta key is expected in the form "<field>_delta" (e.g. "income_index_delta").
    Values are clamped strictly to [0, 100] after being applied.

    Returns True if the row was found and updated, False if the area does not exist.
    """
    db = SessionLocal()
    try:
        row = db.query(AreaIndex).filter(AreaIndex.name == area_name).first()
        if not row:
            return False

        for field in _INDEX_FIELDS:
            delta = deltas.get(f"{field}_delta", 0.0)
            if delta == 0.0:
                continue
            current: float = getattr(row, field)
            new_val = max(0.0, min(100.0, current + delta))
            setattr(row, field, round(new_val, 2))

        row.last_updated = datetime.now(timezone.utc)
        row.last_news_summary = source_summary
        db.commit()
        return True
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def get_last_pipeline_run() -> Optional[Dict[str, Any]]:
    """Return metadata about the most recently updated neighbourhood."""
    db = SessionLocal()
    try:
        row = (
            db.query(AreaIndex)
            .filter(AreaIndex.last_news_summary != "")
            .order_by(AreaIndex.last_updated.desc())
            .first()
        )
        if not row or not row.last_updated:
            return None
        return {
            "last_updated": row.last_updated.isoformat(),
            "area": row.name,
            "summary": row.last_news_summary,
        }
    finally:
        db.close()
