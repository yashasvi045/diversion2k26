"""
main.py
-------
FastAPI application entry point for SiteScapr backend.

Run with:
    uvicorn app.main:app --reload --port 8000

CORS is open for local development (localhost:3000).
Tighten origins before any public deployment.
"""

import os
import uuid
import razorpay
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .schemas import AnalyzeRequest, AnalyzeResponse
from .scoring_engine import rank_areas, KOLKATA_AREAS

load_dotenv()

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
rzp_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

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
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
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
    except Exception:
        raise HTTPException(status_code=500, detail="Analysis failed. Please try again.")

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


# ── Razorpay ──────────────────────────────────────────────────────────────────

class CreateOrderRequest(BaseModel):
    plan: str = "pro"  # "pro" is the only paid plan for now


PLAN_AMOUNTS = {
    "pro": 59900,  # ₹599 in paise
}


@app.post("/create-order")
def create_order(body: CreateOrderRequest):
    """
    Creates a Razorpay order for the requested plan.
    Returns order_id, amount (paise), currency, and the public key_id.
    """
    amount = PLAN_AMOUNTS.get(body.plan)
    if amount is None:
        raise HTTPException(status_code=400, detail=f"Unknown plan: {body.plan}")

    try:
        order = rzp_client.order.create({
            "amount": amount,
            "currency": "INR",
            "receipt": f"sitescapr_{body.plan}_{uuid.uuid4().hex[:8]}",
            "notes": {"plan": body.plan},
        })
    except Exception:
        raise HTTPException(status_code=500, detail="Order creation failed. Please try again.")

    return {
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "key_id": RAZORPAY_KEY_ID,
    }


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@app.post("/verify-payment")
def verify_payment(body: VerifyPaymentRequest):
    """
    Verifies the Razorpay HMAC-SHA256 payment signature.
    Must be called after a successful checkout to confirm the payment is genuine.
    """
    try:
        rzp_client.utility.verify_payment_signature({
            "razorpay_order_id": body.razorpay_order_id,
            "razorpay_payment_id": body.razorpay_payment_id,
            "razorpay_signature": body.razorpay_signature,
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Payment verification failed: invalid signature.")

    return {"verified": True, "payment_id": body.razorpay_payment_id}
