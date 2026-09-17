<div align="center">


</div>

---

## 🚨 What is LANDGUARD-X?

**LANDGUARD-X** is an AI-powered landslide intelligence platform designed for vulnerable regions of India. It combines historical landslide observations, terrain and soil characteristics, machine-learning-based susceptibility estimation, dynamic environmental risk factors, geospatial visualization, citizen reporting, incident management, and authority-focused decision support in one connected system.

The core idea is simple:

> **Understand where terrain is naturally prone to landslides, combine that with changing environmental conditions, and convert the information into actionable risk intelligence.**

---

## 🎯 Problem Statement

Landslides are influenced by terrain, slope, soil properties, rainfall, saturation, land conditions, and human exposure. A useful disaster-management platform therefore needs to go beyond simply recording an incident after it happens.

LANDGUARD-X extends the conventional workflow:

```text
Incident → Response
```

into a connected intelligence workflow:

```text
Historical Data
      ↓
Susceptibility Assessment
      ↓
Dynamic Risk Intelligence
      ↓
Forecast & Warning
      ↓
Citizen Intelligence
      ↓
Authority Decision Support
      ↓
Emergency Response
```

---

# 💡 Solution

LANDGUARD-X separates landslide intelligence into three complementary layers.

### ⛰️ 1. Static Susceptibility

**Question:** *How naturally prone is this terrain to landslides?*

A trained Random Forest model uses terrain and soil characteristics to estimate the natural susceptibility of a location.

### 🌧️ 2. Dynamic Risk

**Question:** *How risky is the location under changing environmental conditions?*

The risk layer combines susceptibility with changing factors such as rainfall, soil moisture, terrain conditions, and exposure-related information.

### 🏛️ 3. Decision Support

**Question:** *What should citizens, responders, and authorities focus on?*

The platform turns risk information into maps, forecasts, explanations, alerts, citizen reports, incident workflows, and analytics.

---

# ✨ Key Features

| Module | Purpose |
|---|---|
| 🤖 AI Susceptibility | ML-based static landslide susceptibility |
| 🗺️ Risk Map | Geographic visualization of risk intelligence |
| 🔮 Forecast | Short-term risk trend visualization |
| 🧪 Scenario Simulator | What-if analysis under changed conditions |
| 👥 Citizen Reports | Ground-level hazard reporting |
| 🏛️ Authority Command | Monitoring and response decision support |
| 🚨 Incident Management | Incident lifecycle and response tracking |
| 📊 Analytics | Regional risk and incident insights |
| 🔍 Explainability | Understand the factors behind risk |

---

# 🧠 Machine Learning Pipeline

The ML component was developed from the **Geological Survey of India (GSI) Bhusanket landslide inventory**.

Approximately **36,071 historical landslide records** were processed.

```text
GSI Landslide Inventory
          ↓
Data Cleaning
          ↓
Coordinate Validation
          ↓
Historical Event Processing
          ↓
Positive + Background Samples
          ↓
Terrain Feature Extraction
          ↓
Soil Feature Extraction
          ↓
Spatial Train/Test Split
          ↓
Model Training
          ↓
Model Evaluation
          ↓
Random Forest Model
          ↓
FastAPI Inference Layer
          ↓
LANDGUARD-X Dashboard
```

---

# 🔬 ML Features

The current susceptibility model uses **8 terrain and soil features**:

| Feature | Description |
|---|---|
| `Elevation_m` | Elevation of the location |
| `Slope_deg` | Terrain slope in degrees |
| `Soil_Clay_pct` | Soil clay percentage |
| `Soil_Sand_pct` | Soil sand percentage |
| `Soil_Silt_pct` | Soil silt percentage |
| `Soil_pH` | Soil pH |
| `Soil_SOC` | Soil organic carbon |
| `Soil_BulkDensity` | Soil bulk density |

### Target

```text
1 → Known / positive landslide location
0 → Background location
```

Background samples were generated to provide non-event examples for supervised classification.

---

# 🤖 Model

### Random Forest Classifier

```text
Algorithm              : Random Forest
Number of Trees        : 400
Minimum Samples/Leaf   : 2
Parallel Training      : Enabled
```

A Logistic Regression model was also trained as a baseline. The Random Forest model is the primary susceptibility model integrated into the backend.

---

# 📊 Model Evaluation

A spatial validation strategy was used instead of relying only on a random split.

### 🗺️ Spatial Block Validation

The study region was divided into approximately **0.5° × 0.5° geographic blocks**. Entire blocks were assigned to training or testing data, reducing the chance of geographically nearby samples appearing in both datasets.

| Dataset | Samples |
|---|---:|
| Training | 32,874 |
| Testing | 10,569 |

**No geographic block was shared between training and testing sets.**

### Logistic Regression

| Metric | Score |
|---|---:|
| Precision | 0.905 |
| Recall | 0.975 |
| F1 Score | 0.939 |
| ROC-AUC | 0.832 |
| PR-AUC | 0.939 |

### Random Forest

| Metric | Score |
|---|---:|
| Precision | 0.927 |
| Recall | 0.972 |
| F1 Score | 0.949 |
| ROC-AUC | 0.894 |
| PR-AUC | 0.969 |

> **Evaluation note:** These metrics are based on the constructed landslide-presence/background dataset with spatial holdout validation. They should not be interpreted as calibrated real-world landslide probabilities or operational warning accuracy.

---

# 🛰️ Data Sources

### Geological Survey of India — Bhusanket

Historical landslide observations used by the ML pipeline are based on the GSI Bhusanket inventory.

The processed inventory contains approximately **36,071 records** with information such as state, district, latitude, longitude, landslide details, material, movement type, historical information, and road/highway location.

### 🌱 SoilGrids / ISRIC

Soil characteristics are obtained from SoilGrids / ISRIC. The model uses:

- Clay
- Sand
- Silt
- pH
- Soil Organic Carbon
- Bulk Density

### ⛰️ Terrain Data

Terrain processing provides:

- Elevation
- Slope

These variables form a major component of static landslide susceptibility.

---

# 🌧️ Why Rainfall Is Separate From the ML Model

The Random Forest is intentionally a **static susceptibility model**. Rainfall is not one of its eight ML features.

```text
             TERRAIN + SOIL
                  │
                  ▼
        ┌────────────────────┐
        │ Random Forest Model│
        └─────────┬──────────┘
                  │
                  ▼
        Static Susceptibility
                  │
       ┌──────────┴──────────┐
       ▼                     ▼
   Rainfall             Soil Moisture
       │                     │
       └──────────┬──────────┘
                  ▼
             Risk Engine
                  │
                  ▼
             Overall Risk
```

The ML model answers:

> **How prone is this terrain?**

The dynamic risk layer addresses:

> **How do changing environmental conditions affect the current risk?**

This separation allows long-term susceptibility and short-term triggers to work together without confusing susceptibility with a time-specific landslide prediction.

---

# 🏗️ System Architecture

```text
                         LANDGUARD-X
                              │
              ┌───────────────┴───────────────┐
              │                               │
       Historical Data                 Environmental Data
              │                               │
              ▼                    ┌──────────┴──────────┐
       GSI Landslide                │                     │
        Inventory               Rainfall             Soil Moisture
              │                    │                     │
              ▼                    └──────────┬──────────┘
       ML Susceptibility                       │
              │                                │
              └──────────────┬─────────────────┘
                             │
                             ▼
                    Risk Intelligence
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
          Risk Map       Forecast      Explainability
              │              │              │
              └──────────────┼──────────────┘
                             │
                             ▼
                     Decision Support
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
          Citizens       Authorities     Analytics
              │              │
              └──────────────┼──────────────┘
                             ▼
                     Incident Response
```

---

# 🖥️ Platform Modules

### 🏠 Overview

High-level view of location risk intelligence, major factors, environmental conditions, and exposure information.

### 🗺️ Risk Map

Interactive geospatial interface for exploring locations, elevated-risk areas, and spatial patterns.

### 🔮 Forecast

Short-term risk trend visualization showing how risk conditions may evolve. The current implementation is a prototype decision-support forecast, not an operational disaster prediction system.

### 🧪 Scenario Simulator

Allows users to modify environmental conditions and observe how calculated risk changes.

Example:

```text
Increase Rainfall
      ↓
Higher Trigger Risk
      ↓
Overall Risk Changes
```

### 👥 Citizen Reports

Citizens can submit suspected hazards, upload photographs, and provide location information. Reports can enter the authority workflow for review.

### 🏛️ Authority Command Center

Provides a consolidated view of active incidents, risk zones, priority locations, citizen reports, response status, and emergency resources.

### 🚨 Incident Management

```text
Report
  ↓
Incident Creation
  ↓
Authority Review
  ↓
Priority Assessment
  ↓
Response Dispatch
  ↓
Status Tracking
```

### 📊 Analytics

Provides aggregated insights into risk distribution, incidents, severity, exposure, and regional patterns.

---

# 🔌 Backend API

The backend is built with **FastAPI** and exposes REST APIs for the platform.

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Backend health and service status |
| `GET /api/locations` | List available locations |
| `GET /api/risk/{id}` | Current risk intelligence |
| `POST /api/risk/calculate` | Scenario-based risk calculation |
| `GET /api/forecast/{id}` | Risk forecast |
| `GET /api/weather/{id}` | Environmental information |
| `GET /api/incidents` | Incident management |
| `GET /api/alerts` | Active alerts |
| `GET /api/reports` | Citizen reports |
| `GET /api/analytics` | Aggregated analytics |
| `GET /api/model/info` | ML model information |
| `GET /api/model/susceptibility/{location_id}` | ML susceptibility prediction |

FastAPI provides an interactive Swagger/OpenAPI interface when the backend is running.

---

# 🤖 ML API Integration

The trained Random Forest model is integrated directly into the FastAPI backend.

### Model Information

```text
GET /api/model/info
```

Provides model availability, model type, feature configuration, model status, and locations with ML features.

### Susceptibility Prediction

```text
GET /api/model/susceptibility/{location_id}
```

Returns:

- ML probability
- 0–100 susceptibility score
- Susceptibility category
- Features used
- Model information

### Integrated Risk

```text
GET /api/risk/{location_id}
```

The risk endpoint combines the ML susceptibility component with the dynamic risk engine.

---

# 💻 Technology Stack

| Layer | Technologies |
|---|---|
| 🎨 Frontend | React, TypeScript, Vite |
| 🎨 UI | Tailwind CSS |
| 🗺️ Mapping | Leaflet / React-Leaflet |
| 📈 Visualization | Recharts |
| 🐍 Backend | Python, FastAPI |
| 📦 Validation | Pydantic |
| 🗄️ Database | SQLite |
| 🤖 Machine Learning | Scikit-learn |
| 🌲 ML Model | Random Forest |
| 💾 Model Serialization | Joblib |
| 📊 Data Processing | Pandas, NumPy |
| 🌱 Soil Data | SoilGrids / ISRIC |
| 🛰️ Geospatial Data | GSI / terrain datasets |

---

# 📁 Project Structure

```text
LANDGUARD-X/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── data/
│   │   ├── database/
│   │   ├── ml/
│   │   │   ├── location_features.json
│   │   │   └── predictor.py
│   │   ├── models/
│   │   ├── risk_engine/
│   │   ├── schemas/
│   │   └── main.py
│   │
│   ├── scripts/
│   │   └── precompute_location_features.py
│   │
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── data/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── data/
│   ├── demo_locations.json
│   ├── incidents.json
│   └── risk_zones.json
│
├── .env.example
├── .gitignore
└── README.md
```

---

# ⚙️ Installation

## Requirements

- Python 3.10+
- Node.js 18+
- npm
- Git

## 1. Clone

```bash
git clone <repository-url>
cd LANDGUARD-X
```

## 2. Backend

```bash
cd backend
python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### Linux / macOS

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the API:

```bash
uvicorn app.main:app --reload --port 8000
```

## 3. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite will display the local development address in the terminal.

---

# 🧠 Trained Model Setup

The trained Random Forest model is intentionally **not stored in this Git repository** because the serialized model artifact is very large.

Expected location:

```text
backend/
└── models/
    └── landslide_model.joblib
```

The backend ML predictor automatically looks for the model in this location.

The repository contains the inference code, feature configuration, API integration, and training methodology. The large model artifact must be provided separately for the complete ML-enabled deployment.

---

# 🔐 Environment Variables

Environment-specific configuration should remain outside the repository.

A template is provided in:

```text
.env.example
```

Do not commit:

```text
.env
```

or any API keys/secrets.

---

# 🔍 Explainability

LANDGUARD-X is designed around interpretable risk intelligence.

Instead of exposing only a prediction, the platform can provide:

- Overall risk score
- Static susceptibility
- Environmental factors
- Factor contributions
- Primary risk drivers
- Exposure information

Potential future explainability extensions include SHAP, permutation importance, partial dependence, and feature-response analysis.

---

# 🧩 Hybrid Risk Architecture

```text
                    Historical Events
                           │
                           ▼
                  Random Forest Model
                           │
                           ▼
                  STATIC SUSCEPTIBILITY
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
         Rainfall      Soil Moisture   Exposure
             │             │             │
             └─────────────┼─────────────┘
                           ▼
                      RISK ENGINE
                           │
                           ▼
                     OVERALL RISK
                           │
        ┌──────────┬───────┴───────┬──────────┐
        ▼          ▼               ▼          ▼
      Map      Forecast          Alerts    Analytics
        │          │               │
        └──────────┼───────────────┘
                   ▼
            DECISION SUPPORT
                   │
                   ▼
                ACTION
```

This architecture keeps long-term susceptibility separate from short-term triggers while allowing both to contribute to overall risk intelligence.

---

# 🚀 Future Roadmap

## Phase 1 — Current Prototype

```text
Historical Landslide Data
          +
Terrain & Soil
          ↓
ML Susceptibility
          ↓
Risk Intelligence
          ↓
Web Dashboard
```

## Phase 2 — Real-Time Environmental Intelligence

Future integration can include:

- Live rainfall feeds
- Soil-moisture observations
- Updated weather conditions
- Automated environmental ingestion

```text
Live Environmental Data
          ↓
Dynamic Trigger Assessment
          ↓
Updated Risk Intelligence
```

## Phase 3 — Satellite & Remote Sensing

Future remote-sensing capabilities can investigate:

- Landslide scar detection
- Surface disturbance
- Vegetation change
- Exposed soil
- Slope changes
- SAR-based change detection

Potential techniques:

- CNN-based image analysis
- Satellite image classification
- SAR change detection
- NDVI analysis

## Phase 4 — Advanced Spatial AI

Potential future models and features:

- XGBoost / Gradient Boosting
- Deep learning
- Spatiotemporal models
- Temporal rainfall-trigger models
- Lithology and geology
- Land cover
- Drainage density
- Distance to roads
- Fault proximity
- Seismic activity
- Higher-resolution terrain variables

## Phase 5 — Operational Decision Support

```text
Detection
   ↓
Risk Assessment
   ↓
Forecast
   ↓
Early Warning
   ↓
Citizen Intelligence
   ↓
Authority Action
   ↓
Response
   ↓
Post-Event Analysis
```

---

# 🌐 Prototype → Production Vision

### Prototype

```text
Historical Data
      ↓
ML Model
      ↓
Risk Engine
      ↓
Dashboard
```

### Production Vision

```text
┌───────────────────────────────────────────┐
│          MULTI-SOURCE DATA LAYER          │
│                                           │
│ GSI │ Weather │ Soil │ DEM │ Satellite    │
└────────────────────┬──────────────────────┘
                     ↓
          ┌─────────────────────┐
          │ AI / ML PIPELINE    │
          │                     │
          │ Susceptibility      │
          │ Trigger Detection   │
          │ Remote Sensing      │
          └──────────┬──────────┘
                     ↓
              Risk Intelligence
                     ↓
        ┌────────────┼────────────┐
        ↓            ↓            ↓
      Citizen      Authority    Responder
       Layer         Layer        Layer
        └────────────┼────────────┘
                     ↓
             Coordinated Action
```

---

# ⚠️ Current Limitations

LANDGUARD-X is currently a **research and hackathon prototype**, not an operational government warning system.

Important limitations include:

- Historical inventories represent observed landslide locations and are not necessarily a complete census of all landslides.
- Background sampling affects the classification problem and resulting probability distribution.
- The current ML feature set focuses on terrain and soil variables.
- The susceptibility model does not directly predict the exact timing of rainfall-triggered landslides.
- Current demonstration environmental values should not be interpreted as verified live government observations.
- Broader geographic coverage and additional geological/environmental features are required for operational deployment.
- Safety-critical deployment requires extensive validation against authoritative observations.

---

# 🎓 Why LANDGUARD-X?

LANDGUARD-X is designed as more than a prediction dashboard.

```text
📊 DATA
   ↓
🤖 AI
   ↓
🔍 EXPLAINABILITY
   ↓
🗺️ INTELLIGENCE
   ↓
🚨 WARNING
   ↓
👥 CITIZEN INTELLIGENCE
   ↓
🏛️ DECISION SUPPORT
   ↓
🚑 ACTION
```

The platform connects technical intelligence with the people and workflows that need to act on it.

---

# 🏆 Smart India Hackathon 2026

<div align="center">

## LANDGUARD-X

### AI-Powered Landslide Susceptibility, Risk Intelligence & Decision Support

**Predict · Understand · Respond · Protect**

🌍 **Data → AI → Intelligence → Action**

</div>

---

# ⚠️ Disclaimer

LANDGUARD-X is a research and hackathon prototype intended for demonstration and decision-support research.

Its outputs should **not** be used as the sole basis for evacuation, emergency response, infrastructure closure, or other safety-critical decisions without validation against authoritative observations and official disaster-management systems.
