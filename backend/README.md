# SiteScapr — Backend

FastAPI scoring engine for the SiteScapr business location recommender.

## Setup

```bash
python -m venv venv
venv\Scripts\activate      # Windows
source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

- API root: http://localhost:8000  
- Swagger UI: http://localhost:8000/docs  
- ReDoc: http://localhost:8000/redoc

## Endpoint

### `POST /analyze`

**Request body:**
```json
{
  "business_type": "Restaurant",
  "target_demographic": ["Working Professionals", "Students"],
  "budget_range": 150000
}
```

**Response:**
```json
{
  "results": [
    {
      "name": "New Town",
      "latitude": 22.5747,
      "longitude": 88.4647,
      "score": 57.4,
      "income_index": 72,
      "foot_traffic_proxy": 62,
      "population_density_index": 52,
      "competition_index": 40,
      "commercial_rent_index": 55,
      "reasoning": ["...", "...", "..."],
      "rank": 1
    }
  ],
  "business_type": "Restaurant",
  "total_areas_analyzed": 15
}
```

## Scoring Formula

```
Final Score = (0.30 × income_index)
            + (0.25 × foot_traffic_proxy)
            + (0.20 × population_density_index)
            − (0.15 × competition_index)
            − (0.10 × commercial_rent_index)
```

## Extending to ML

Replace `calculate_score()` in `scoring_engine.py` with a trained model inference call.  
The rest of the pipeline (schemas, ranking, reasoning) remains unchanged.
