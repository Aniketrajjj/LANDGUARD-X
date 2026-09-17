# LANDGUARD-X

### AI-Powered Landslide Risk Intelligence, Early Warning & Decision Support System

**"Predict Risk. Protect Lives."**

Built for Smart India Hackathon — a decision-support prototype that turns environmental signals into
explainable landslide risk intelligence, early warning, and coordinated emergency response.

---

## 1. Project Overview

LANDGUARD-X answers one question for any Himalayan location:

> *Is this location at risk of a landslide, why is it at risk, how might the risk change over the
> coming hours, and what should citizens and authorities do?*

It serves three users from one coherent platform:
- **Citizens** — check local risk, understand why, upload hazard photos, report hazards
- **Authorities** — monitor regional zones, manage alerts and incidents, dispatch response teams
- **Emergency responders** — see prioritized incidents, nearby hospitals/shelters, response status

## 2. Problem Statement

Landslides in Himalayan regions cause recurring loss of life, property, and infrastructure. Existing
systems are largely reactive (incident → response) and rarely give citizens or authorities an
interpretable, forward-looking view of *why* an area is risky or *how* that risk is changing.

## 3. Solution

LANDGUARD-X follows the workflow **DETECT → ASSESS → PREDICT → WARN → RESPOND → RESCUE**:

```
Environmental Signals → Risk Intelligence → Forecast → Early Warning
   → Citizen Intelligence → Authority Decision Support → Emergency Response
```

It combines an interpretable, deterministic risk-scoring engine with a 48-hour forecast, a live
GIS risk map, a "what-if" scenario simulator, citizen hazard reporting with AI-assisted visual
assessment, and an Authority Command Center with a full dispatch workflow.

## 4. Architecture

```
LANDGUARD-X/
├── frontend/          React + Vite + TypeScript + Tailwind + Leaflet + Recharts
│   └── src/
│       ├── components/    Header, Sidebar, MapView, charts, simulator, cards
│       ├── pages/          Overview, RiskMap, Forecast, Citizen, Authority, Incidents, Analytics
│       ├── services/api.ts Backend client with automatic offline fallback
│       ├── utils/riskEngine.ts   Client-side mirror of the scoring engine (offline mode)
│       └── data/locations.ts     Mirrored demo dataset (offline mode)
│
├── backend/            Python + FastAPI + Pydantic + SQLite
│   └── app/
│       ├── main.py             All API routes
│       ├── risk_engine/        Deterministic, interpretable scoring engine
│       ├── data/demo_data.py   Demo location dataset
│       ├── database/db.py      SQLite with in-memory fallback
│       └── schemas/            Pydantic models
│
├── data/                Static snapshots: demo_locations.json, risk_zones.json, incidents.json
├── .env.example
└── README.md
```

**Offline-first design:** the frontend calls the FastAPI backend for everything, but every API
function in `services/api.ts` catches failures and transparently falls back to an identical,
deterministic TypeScript port of the risk engine running on local demo data. If the backend is down
or unreachable, the demo still works end-to-end — a small "Demo data" badge appears in the header
so this is never presented as live data.

## 5. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, React Router, Leaflet/React-Leaflet, Recharts, Lucide icons |
| Backend | Python 3, FastAPI, Pydantic, Uvicorn |
| Database | SQLite (zero-config; falls back to in-memory store automatically) |
| Risk Engine | Deterministic weighted scoring model (see below) — architected to be replaced by a trained ML model without changing the API contract |

## 6. Risk Engine

Risk is **not** predicted deterministically as a yes/no event. LANDGUARD-X estimates an interpretable
0–100 susceptibility/trigger-risk score:

```
Risk Score = 30% Rainfall Risk
           + 25% Slope Risk
           + 15% Soil Saturation
           + 10% Historical Susceptibility
           + 10% Elevation / Terrain
           +  5% Land Cover
           +  5% Infrastructure Exposure
```

Classification: 0–30 LOW · 31–50 MODERATE · 51–70 HIGH · 71–85 VERY HIGH · 86–100 CRITICAL

The engine (`backend/app/risk_engine/engine.py`) returns the total score, every sub-score, every
factor's point contribution, the classification, and a ranked list of primary drivers with
human-readable explanations — this powers the **Explainable Risk Intelligence** panel so the system
never just shows a bare number.

The same location data is used to generate a **deterministic 48-hour forecast curve** (not
randomized on refresh) and drives the **Early Warning** thresholds:

- Score ≥ 85 → 🚨 CRITICAL LANDSLIDE WARNING
- Score 70–84 → ⚠️ HIGH LANDSLIDE ALERT
- Score 50–69 → 🟡 LANDSLIDE WATCH
- Score < 50 → 🟢 NORMAL

**Scientific framing:** the system explicitly distinguishes *Susceptibility* (long-term terrain
proneness), *Trigger* (short-term rainfall/saturation factors), and *Exposure* (population/
infrastructure), conceptually combining them as `Risk ≈ Hazard × Exposure × Vulnerability`. The UI
never claims deterministic prediction — it uses "risk estimation," "probability," "early warning,"
and "decision support."

## 7. API Documentation

All endpoints are prefixed `/api`. CORS is open for local development.

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Service status |
| GET | `/locations` | List all demo locations |
| GET | `/locations/{id}` | Full raw parameters for one location |
| GET | `/risk/{id}` | Current risk score + explainability |
| POST | `/risk/calculate` | Scenario simulator (`{location_id, rainfall_mm, soil_moisture_pct}`) |
| GET | `/forecast/{id}` | 48-hour deterministic forecast |
| GET | `/weather/{id}` | Weather intelligence card data |
| GET | `/incidents` | All incidents |
| POST | `/incidents` | Create an incident |
| PATCH | `/incidents/{id}` | Update incident status |
| POST | `/incidents/{id}/dispatch` | Dispatch a response team |
| GET | `/alerts` | Active alerts across all zones |
| POST | `/reports` | Submit a citizen hazard report (auto-forwarded to incidents) |
| GET | `/reports` | List citizen reports |
| GET | `/analytics` | Aggregated stats for the Analytics page |
| POST | `/image-assessment` | AI-Assisted Visual Hazard Assessment (prototype) |

Interactive OpenAPI docs are available at `http://localhost:8000/docs` once the backend is running.

## 8. Installation

**Prerequisites:** Node.js 18+, Python 3.10+

```bash
# 1. Clone / unzip the project, then:

# Backend
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

Copy `.env.example` to `.env` at the project root if you want to wire in a real weather/geocoding
API key later — the app runs completely without it.

## 9. Running Locally

```bash
# Terminal 1 — backend (http://localhost:8000)
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api/*` to the backend automatically
(see `frontend/vite.config.ts`). If the backend isn't running, the app still works using its
built-in offline demo-data engine — you'll see a "Demo data" badge in the header.

## 10. Demo Flow (3-minute SIH walkthrough)

1. **Open dashboard** → Dharamshala loads by default at ~82/100, VERY HIGH risk.
2. **Point at the map** → "Red/orange zones indicate elevated landslide risk across the Himalayan belt."
3. **Explainable AI panel** → walk through the primary drivers: rainfall, slope, soil moisture, historical susceptibility.
4. **Forecast page** → show the 48-hour curve and the "risk expected to increase" message.
5. **Scenario Simulator** → drag rainfall up → show score jump and level change live.
6. **Switch to Citizen Mode** → "Check Your Landslide Risk," upload a slope photo → AI-Assisted Visual Hazard Assessment result.
7. **Submit a hazard report** → generates an `LGX-XXXX` ID, confirms forwarding to the authority dashboard.
8. **Switch to Authority Command Center** → the new incident appears in Active Incidents.
9. **Open the incident → Dispatch Response Team** → ETA, nearest hospital/shelter, recommended actions appear.
10. **Close on Analytics** → zone risk chart, severity breakdown, population exposure.

Closing line: *"LANDGUARD-X converts environmental intelligence into actionable early warning and
coordinated disaster response — from prediction to action."*

## 11. Answers for Judges

**"Why is this AI?"**
The system performs structured, multi-factor risk inference over environmental, terrain, and
historical variables and produces an explainable classification and forecast — the same problem
class as an ML risk model, currently implemented as a transparent, auditable weighted-scoring
engine rather than a black-box model. This is a deliberate hackathon choice: it is fully
interpretable, requires no training data or GPU, and is architected so a trained model
(Random Forest / XGBoost / CNN) can be swapped in behind the exact same `compute_risk()` /
`/api/risk/*` contract without touching the frontend. The image-based hazard assessment is a
clearly-labelled prototype computer-vision workflow, ready to be backed by a real CNN.

**"Where does the data come from?"**
This prototype uses internally-consistent, deterministic demo data for 10 real Himalayan
locations (rainfall, slope, soil moisture, elevation, land cover, historical susceptibility,
population exposure), clearly labelled "Prototype Demonstration Data" in the UI. The architecture
is designed to ingest real inputs later: IMD/weather APIs, DEM/slope rasters, soil-moisture
satellite products (e.g. ISRO Bhuvan, SMAP), NDVI/land-cover layers, and historical landslide
inventories (e.g. GSI/NRSC).

**"How is this different from existing systems?"**
Most disaster-tech prototypes stop at "incident → response." LANDGUARD-X is the full pipeline:
environmental signals → interpretable risk score → forecast → early warning → citizen
intelligence → authority decision support → coordinated response — in one connected product, not
five disconnected dashboards. The what-if scenario simulator is a decision-support feature, not
just monitoring.

## 12. Known Limitations

- Risk scoring is a transparent weighted model, not a trained ML model — by design, for
  interpretability and hackathon feasibility.
- Demo data covers 10 fixed Himalayan locations; arbitrary coordinate support requires a
  geocoding API key (architecture supports this — see `.env.example`).
- The image-based hazard assessment is a labelled prototype mechanism, not a validated
  computer-vision model.
- SQLite persistence is local-file based and resets if the database file is deleted; this is
  intentional for zero-configuration hackathon demos.

## 13. ML Upgrade Path

The prototype is deliberately architected so `compute_risk()` in
`backend/app/risk_engine/engine.py` can be replaced by a trained model without changing any API
contract or frontend code:

- **Models:** Random Forest / XGBoost / LightGBM for tabular susceptibility scoring; CNNs for the
  image hazard assessment; spatiotemporal models (ConvLSTM etc.) for short-term hazard probability.
- **Inputs:** DEM/slope/aspect, cumulative + intensity rainfall, soil moisture, geology, NDVI/land
  cover, drainage density, historical landslide inventories, road-construction proximity, seismic
  activity, satellite imagery (optical/SAR).
- **Outputs:** susceptibility maps, short-term hazard probability, calibrated risk scores, and
  spatial risk maps — feeding the same `/api/risk/*` and `/api/forecast/*` contracts.

---

*LANDGUARD-X is a decision-support prototype. Risk estimates are probabilistic and should be
validated against authoritative observations before operational deployment.*

---

## ML Model Integration

The Random Forest trained in `LANDGUARD_X_integrated_ML.ipynb` on the GSI Bhusanket inventory
(36,071 records) is wired into the API.

### How the two scoring systems fit together

The model's eight features are **terrain and soil only**:

```
Elevation_m, Slope_deg,
Soil_Clay_pct, Soil_Sand_pct, Soil_Silt_pct, Soil_pH, Soil_SOC, Soil_BulkDensity
```

There is no rainfall feature. That makes it a **static susceptibility** model — it answers *"is this
terrain landslide-prone?"*, not *"is a landslide likely today?"*. So it does **not** replace the risk
engine. It replaces the three static terms inside it:

| Factor | Heuristic weight | Hybrid weight |
|---|---|---|
| Rainfall (24h) | 0.30 | 0.30 |
| Slope | 0.25 | — |
| Elevation band | 0.10 | — |
| Historical susceptibility | 0.10 | — |
| **ML susceptibility** | — | **0.45** |
| Soil moisture | 0.15 | 0.15 |
| Land cover | 0.05 | 0.05 |
| Infrastructure exposure | 0.05 | 0.05 |
| **Total** | **1.00** | **1.00** |

Weights sum to 1.00 in both modes, so scores stay comparable. The dynamic trigger terms (rainfall,
soil moisture) are untouched, which is what still makes the score move hour to hour and keeps the
scenario simulator meaningful.

### Setup

```bash
cd backend
pip install -r requirements.txt

# 1. Put the trained model where the API expects it (gitignored — 119 MB)
mkdir -p models
cp /path/to/landslide_model.joblib models/

# 2. Precompute the eight features for the demo locations (needs internet, once)
#    Optional: point at your DEM tiles for real elevation/slope
export LANDGUARD_DEM_DIR=/path/to/DEM_tiles
python scripts/precompute_location_features.py

# 3. Run
uvicorn app.main:app --reload
```

Check it took:

```bash
curl localhost:8000/api/health          # -> "ml_model_active": true
curl localhost:8000/api/model/info      # provenance + load status
curl localhost:8000/api/risk/dharamshala | jq '.risk.mode'   # -> "hybrid_ml"
```

### Graceful degradation

If the model file or `location_features.json` is missing, `is_available()` returns false and every
endpoint keeps serving the original heuristic engine. `risk.mode` reports `"heuristic"`, the UI badge
switches to "Rules only", and `/api/model/info` explains exactly what is missing. Nothing 500s.

### New endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/model/info` | Model provenance, load status, which locations have features |
| `GET /api/model/susceptibility/{id}` | Raw model probability + the features used (503 if unavailable) |

`GET /api/risk/{id}` now also returns an `ml` block and `risk.mode`.

---

## Known limitations of the trained model

State these before a judge finds them.

**The training set ended up badly imbalanced, in the wrong direction.** 36,041 background points were
generated, but only 7,456 survived feature extraction, against 35,987 positives — an 83% positive
dataset. The 28,669 dropped rows were almost entirely background points that fell outside the
available DEM tiles. Two consequences:

- The surviving background is **spatially biased** toward the tiles that happened to download, so
  part of what the model learned is "is this inside a downloaded DEM tile".
- The model is strongly biased toward predicting "prone". Every demo location scores above 0.9. Treat
  the output as a **relative ranking**, not a calibrated probability.

Fixing this means completing the DEM coverage (the notebook's Copernicus GLO-30 step) and regenerating
background samples, then retraining. The reported test metrics (RF: PR-AUC 0.969, ROC-AUC 0.894) are
inflated by the imbalance and should be quoted with that caveat.

**Other gaps:**

- No lithology, land cover, or distance-to-road/fault features. Lithology in particular is standard in
  susceptibility work and is the most likely first question.
- The GSI inventory is road-corridor heavy (NH/SH surveys), so landslide locations partly encode
  "where GSI surveyed". Uniformly sampled background does not share that bias.
- Copernicus GLO-30 is a surface model (DSM), so slope in forested terrain includes canopy.
- Demo-location features come from SoilGrids at 250 m and from `demo_data.py` terrain values unless
  you point the precompute script at real DEM tiles.
