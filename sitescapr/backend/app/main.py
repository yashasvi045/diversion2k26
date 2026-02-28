"""
main.py
-------
FastAPI application entry point for SiteScapr backend.

Run with:
    uvicorn app.main:app --reload --port 8000

CORS is open for local development (localhost:3000).
Tighten origins before any public deployment.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .schemas import AnalyzeRequest, AnalyzeResponse
from .scoring_engine import rank_areas, KOLKATA_AREAS

app = FastAPI(
    title="SiteScapr API",
    description="AI-powered business location scoring engine for Kolkata.",
    version="0.1.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
    """Basic health check endpoint."""
    return {"status": "ok", "service": "SiteScapr API v0.1.0"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest):
    """
    Core analysis endpoint.

    Accepts business parameters, scores all Kolkata neighborhoods
    against the weighted formula, applies budget filter, and returns
    the top 5 ranked recommendations with reasoning.
    """
    try:
        results = rank_areas(
            business_type=request.business_type,
            target_demographic=request.target_demographic,
            budget_range=request.budget_range,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not results:
        raise HTTPException(
            status_code=404,
            detail="No suitable areas found within the given budget range. Try increasing your budget.",
        )

    return AnalyzeResponse(
        results=results,
        business_type=request.business_type,
        total_areas_analyzed=len(KOLKATA_AREAS),
    )
