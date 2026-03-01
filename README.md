# 🗺️ SiteScapr — AI-Powered Business Location Recommender for Kolkata

> SiteScapr helps business owners find the **best locations** in Kolkata to set up their business using AI-driven analysis, weighted scoring, and interactive map visualization.

---

## 🚀 Features

- 📍 **Smart Location Recommendations** — ranked results based on business type, foot traffic, competition, and more
- 🤖 **AI Reasoning Engine** — natural language justifications for each recommended location
- 🗺️ **Interactive Map** — built with React Leaflet, visualizing top-ranked spots with markers and charts
- ⚡ **Fast API Backend** — lightweight Python-based API with a scoring engine using weighted formulas
- 📦 **SQLite Database** — persistent storage for neighbourhood indices, auto-seeded on startup
- 🔄 **n8n Automation Pipeline** — runs every 12 hours, fetches NewsAPI headlines for all 15 Kolkata areas, uses Groq LLaMA 3.1 to produce scoring deltas, and auto-updates the live indices

---

## 🏗️ System Architecture

```
👤 Business Owner
        │
        ▼
┌─────────────────────────────────────┐
│           Frontend                  │
│  Next.js 14 · TypeScript · Tailwind │
│  React Leaflet Map                  │
└────────────────┬────────────────────┘
                 │  POST /analyze
                 ▼
┌─────────────────────────────────────┐
│            Backend                  │
│       FastAPI · Python 3.11         │
└──────────┬──────────────────────────┘
           │
           ▼
   📊 Scoring Engine   🗄️ SQLite DB
   (Weighted Formula)  (live indices)
           │                 ▲
           ▼                 │ POST /internal/update-indices
   🥇 Ranked Results + Map   │
                     ┌───────┴──────────────────────────┐
                     │      n8n Automation Pipeline      │
                     │  ⏰ Every 12 h                    │
                     │  🗞️  NewsAPI (15 neighbourhoods)  │
                     │  🤖 Groq LLaMA 3.1 (deltas)      │
                     └──────────────────────────────────┘
```

## ⚙️ Getting Started

**Prerequisites:** Node.js 18+ · Python 3.11+

```bash
# Clone
git clone https://github.com/yashasvi045/diversion2k26


# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload        # → http://localhost:8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev                      # → http://localhost:3000
```
---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Map | React Leaflet |
| Backend | FastAPI, Python 3.11 |
| Database | SQLite (via SQLAlchemy) |
| AI Engine | Groq LLaMA 3.1-8b (scoring deltas) |
| Scoring | Custom Weighted Formula Engine |
| Automation | n8n workflow (News Index Pipeline) |
| News Data | NewsAPI.org |

---

## 📁 Project Structure

```
sitescapr/
├── frontend/
│   ├── app/                  # Next.js App Router pages
│   ├── components/
│   │   └── MapView.tsx       # React Leaflet map component
│   └── tailwind.config.ts
├── backend/
│   ├── main.py               # FastAPI entry point
│   ├── scoring_engine.py     # Weighted formula logic
│   ├── ai_engine.py          # AI reasoning integration
│   └── data/
│       └── locations.json    # Mock dataset for Kolkata
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- pip

### 1. Clone the repository

```bash
git clone https://github.com/your-username/sitescapr.git
cd sitescapr
```

### 2. Start the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

---

## 🔌 API Reference

### `POST /analyze`

Analyzes and returns ranked location recommendations.

**Request Body:**
```json
{
  "business_type": "cafe",
  "budget": "medium",
  "target_audience": "students"
}
```

**Response:**
```json
{
  "results": [
    {
      "rank": 1,
      "location": "Salt Lake Sector V",
      "score": 87.4,
      "reason": "High footfall from IT professionals and students...",
      "coordinates": [22.5726, 88.4272]
    }
  ]
}
```

---

## 🗃️ Dataset

The scoring indices are stored in SQLite and seeded from `backend/app/seed.py` on first run. They cover all 15 major Kolkata localities and track:

- Foot traffic proxy
- Competition index
- Commercial rent index
- Income index
- Population density index
- Area growth trend
- Infrastructure investment index
- Vacancy rate
- Accessibility penalty

---

## 🔄 n8n Automation Pipeline

The file `n8n_workflow.json` is an importable n8n workflow called **SiteScapr News Index Pipeline**.

### What it does

| Step | Node | Action |
|------|------|---------|
| 1 | Schedule Trigger | Fires every 12 hours |
| 2 | Generate Area List | Emits one item per neighbourhood (15 total) |
| 3 | Fetch NewsAPI | Queries the last 7 days of news for each area |
| 4 | Format News | Builds a concise text digest (up to 10 headlines) |
| 5 | Build Groq Request | Constructs the LLM prompt asking for scoring deltas |
| 6 | Call Groq | Sends to `llama-3.1-8b-instant` via Groq API |
| 7 | Parse Deltas | Validates and clamps 9 delta values to `[-10, +10]` |
| 8 | Update FastAPI | POSTs deltas to `/internal/update-indices` on the backend |

### How to import

1. Start n8n (`npx n8n` or via Docker: `docker-compose up n8n`)
2. In the n8n UI, go to **Workflows → Import from file**
3. Select `n8n_workflow.json`
4. Set the `PIPELINE_SECRET` credential to `sitescapr_pipeline_2026`
5. Activate the workflow

> The workflow targets `http://host.docker.internal:8000` — change to `http://localhost:8000` if running n8n outside Docker.

---

## 🛣️ Roadmap

- [x] MVP with mock JSON dataset
- [x] FastAPI backend with scoring engine
- [x] SQLite database with live scoring indices
- [x] React Leaflet map visualization
- [x] n8n automation pipeline (news-driven index updates via Groq AI)
- [ ] PostgreSQL migration for production
- [ ] User authentication & saved searches
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

```bash
git checkout -b feature/your-feature-name
git commit -m "Add your feature"
git push origin feature/your-feature-name
```

Then open a Pull Request.

---
## 🔮 Future Scope

- Real-time municipal API integration
- Machine learning model for demand prediction
- Multi-city expansion
- User accounts + saved reports
- SaaS subscription model

## 🏅 Why SiteScapr?

✔ Data-driven  
✔ Customizable scoring  
✔ AI-powered reasoning  
✔ Interactive map visualization  
✔ Built for emerging markets

![Python](https://img.shields.io/badge/Python-3.11-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green)
![n8n](https://img.shields.io/badge/n8n-Automation-orange)
![Groq](https://img.shields.io/badge/Groq-LLaMA_3.1-purple)

