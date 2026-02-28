# SiteScapr

> AI-powered business location recommender for smarter site selection decisions in Kolkata.

---

## Overview

SiteScapr scores and ranks neighborhoods based on business-specific weighted metrics — income index, foot traffic, population density, competition, and commercial rent — returning actionable, ranked recommendations with AI-generated reasoning bullets.

---

## Architecture

```
Frontend (Next.js 14 + TypeScript + Tailwind + React Leaflet)
       ↕ REST API (POST /analyze)
Backend (FastAPI + Python 3.11 + Rule-based Scoring Engine)
```

---

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend runs at: http://localhost:8000  
Swagger docs at: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:3000

---

## Scoring Formula

```
Final Score = (0.30 × income_index)
            + (0.25 × foot_traffic_proxy)
            + (0.20 × population_density_index)
            − (0.15 × competition_index)
            − (0.10 × commercial_rent_index)
```

All indices are on a 0–100 scale.

---

## Tech Stack

| Layer     | Technology               |
|-----------|--------------------------|
| Frontend  | Next.js 14, TypeScript, Tailwind CSS, React Leaflet |
| Backend   | FastAPI, Python 3.11, Uvicorn |
| Maps      | OpenStreetMap (Leaflet)  |
| Data      | Mock dataset (Kolkata neighborhoods) |
