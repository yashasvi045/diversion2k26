# 🗺️ SiteScapr — AI-Powered Business Location Recommender for Kolkata

> SiteScapr helps business owners find the **best locations** in Kolkata to set up their business using AI-driven analysis, weighted scoring, and interactive map visualization.

---

## 🚀 Features

- 📍 **Smart Location Recommendations** — ranked results based on business type, foot traffic, competition, and more
- 🤖 **AI Reasoning Engine** — natural language justifications for each recommended location
- 🗺️ **Interactive Map** — built with React Leaflet, visualizing top-ranked spots with markers and charts
- ⚡ **Fast API Backend** — lightweight Python-based API with a scoring engine using weighted formulas
- 📦 **Mock Dataset (JSON)** — ready-to-use data for Kolkata localities (PostgreSQL-ready for production)

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
└──────────┬──────────────┬───────────┘
           │              │
           ▼              ▼
   📊 Scoring Engine   🤖 AI Reasoning
   (Weighted Formula)  (Claude API)
           │
           ▼
   📦 Mock Dataset (JSON)
   → Future: PostgreSQL
           │
           ▼
   🥇 Ranked Results + Map
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
| AI Engine | Claude API (AI Reasoning) |
| Scoring | Custom Weighted Formula Engine |
| Data | JSON Mock Dataset (PostgreSQL planned) |

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

The current mock dataset (`locations.json`) covers major Kolkata localities and includes:

- Foot traffic estimates
- Competitor density
- Rent index
- Demographics
- Connectivity scores

> 📌 PostgreSQL integration is planned for the production version.

---

## 🛣️ Roadmap

- [x] MVP with mock JSON dataset
- [x] FastAPI backend with scoring engine
- [x] React Leaflet map visualization
- [ ] PostgreSQL database integration
- [ ] User authentication & saved searches
- [ ] Real-time data feeds (foot traffic, rent)
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
  
