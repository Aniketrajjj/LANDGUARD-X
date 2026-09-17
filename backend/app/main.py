from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import random
import string
import hashlib

from app.data.demo_data import LOCATIONS, SEED_INCIDENTS
from app.risk_engine import engine
from app.ml import predictor
from app.database import db
from app.schemas.schemas import ReportCreate, ScenarioRequest, IncidentStatusUpdate

app = FastAPI(
    title="LANDGUARD-X API",
    description="AI-Powered Landslide Risk Intelligence, Early Warning & Decision Support System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LOCATIONS_BY_ID = {loc["id"]: loc for loc in LOCATIONS}

# Seed incidents on startup (idempotent)
for inc in SEED_INCIDENTS:
    db.insert_incident(inc)


def _location_or_404(location_id: str) -> dict:
    loc = LOCATIONS_BY_ID.get(location_id)
    if not loc:
        raise HTTPException(status_code=404, detail=f"Unknown location '{location_id}'")
    return loc


def _susceptibility_value(location_id: str):
    """Model probability in 0-1, or None when the model can't serve this location."""
    ml = predictor.susceptibility(location_id)
    if ml and ml.get("probability") is not None:
        return ml["probability"], ml
    return None, ml


def _risk_payload(loc: dict) -> dict:
    prob, ml = _susceptibility_value(loc["id"])
    risk = engine.compute_risk(loc, susceptibility=prob)
    return {
        "location": {
            "id": loc["id"],
            "name": loc["name"],
            "state": loc["state"],
            "lat": loc["lat"],
            "lon": loc["lon"],
        },
        "risk": risk,
        "alert": engine.alert_level(risk["score"]),
        "ml": ml,
    }


# ---------------------------------------------------------------- HEALTH ---
@app.get("/api/health")
def health():
    return {
        "status": "operational",
        "service": "LANDGUARD-X",
        "version": "1.1.0",
        "ml_model_active": predictor.is_available(),
    }


# ------------------------------------------------------------------- MODEL --
@app.get("/api/model/info")
def model_info():
    """Provenance and load status of the trained susceptibility model."""
    return predictor.status()


@app.get("/api/model/susceptibility/{location_id}")
def model_susceptibility(location_id: str):
    _location_or_404(location_id)
    ml = predictor.susceptibility(location_id)
    if ml is None:
        raise HTTPException(
            status_code=503,
            detail="Trained model unavailable. See /api/model/info for the reason.",
        )
    return {"location_id": location_id, **ml}


# ------------------------------------------------------------- LOCATIONS ---
@app.get("/api/locations")
def get_locations():
    return [
        {
            "id": l["id"], "name": l["name"], "state": l["state"],
            "lat": l["lat"], "lon": l["lon"],
        }
        for l in LOCATIONS
    ]


@app.get("/api/locations/{location_id}")
def get_location(location_id: str):
    loc = _location_or_404(location_id)
    return loc


# ------------------------------------------------------------------ RISK ---
@app.get("/api/risk/{location_id}")
def get_risk(location_id: str):
    loc = _location_or_404(location_id)
    return _risk_payload(loc)


@app.post("/api/risk/calculate")
def calculate_risk(payload: ScenarioRequest):
    """Scenario simulator: recompute risk with overridden rainfall/soil moisture."""
    base = _location_or_404(payload.location_id)
    scenario_loc = dict(base)
    scenario_loc["rainfall_mm"] = payload.rainfall_mm
    scenario_loc["soil_moisture_pct"] = payload.soil_moisture_pct

    # Terrain susceptibility is static, so the same model value is used for both
    # legs — only the rainfall/soil-moisture trigger terms move in a scenario.
    prob, _ = _susceptibility_value(base["id"])
    baseline_risk = engine.compute_risk(base, susceptibility=prob)
    scenario_risk = engine.compute_risk(scenario_loc, susceptibility=prob)

    return {
        "location_id": base["id"],
        "current": baseline_risk,
        "scenario": scenario_risk,
        "change": round(scenario_risk["score"] - baseline_risk["score"], 1),
    }


# -------------------------------------------------------------- FORECAST ---
@app.get("/api/forecast/{location_id}")
def get_forecast(location_id: str):
    loc = _location_or_404(location_id)
    prob, _ = _susceptibility_value(location_id)
    risk = engine.compute_risk(loc, susceptibility=prob)
    curve = engine.forecast_curve(risk["score"], loc["trend"])
    peak = max(curve, key=lambda p: p["score"])
    return {
        "location_id": loc["id"],
        "current_score": risk["score"],
        "current_level": risk["level"],
        "trend": loc["trend"],
        "forecast": curve,
        "peak": peak,
        "message": _forecast_message(loc["trend"], peak),
    }


def _forecast_message(trend: str, peak: dict) -> str:
    if trend == "increasing":
        return (
            f"Risk is expected to increase, peaking around +{peak['hour']}h at "
            f"{peak['score']}/100 ({peak['level'].replace('_',' ').title()}), "
            "driven by forecast rainfall and elevated soil saturation."
        )
    if trend == "decreasing":
        return "Risk is expected to gradually decline as forecast rainfall eases."
    return "Risk is expected to remain broadly stable over the next 48 hours."


# --------------------------------------------------------------- WEATHER ---
@app.get("/api/weather/{location_id}")
def get_weather(location_id: str):
    loc = _location_or_404(location_id)
    return {
        "location_id": loc["id"],
        "temperature_c": loc["temperature_c"],
        "rainfall_mm_24h": loc["rainfall_mm"],
        "rainfall_forecast_mm": loc["rainfall_forecast_mm"],
        "humidity_pct": loc["humidity_pct"],
        "wind_kmh": loc["wind_kmh"],
        "soil_moisture_pct": loc["soil_moisture_pct"],
        "forecast_note": "Heavy rainfall expected" if loc["rainfall_forecast_mm"] > loc["rainfall_mm"] else "Rainfall expected to ease",
        "source": "Prototype Demonstration Data",
    }


# -------------------------------------------------------------- INCIDENTS --
@app.get("/api/incidents")
def get_incidents():
    incidents = db.list_incidents()
    return sorted(incidents, key=lambda i: i.get("reported_minutes_ago", 0))


@app.post("/api/incidents")
def create_incident(payload: dict):
    incident_id = _generate_id()
    incident = {
        "id": incident_id,
        "location_id": payload.get("location_id", ""),
        "location_name": payload.get("location_name", "Unknown"),
        "type": payload.get("type", "Reported hazard"),
        "description": payload.get("description", ""),
        "severity": payload.get("severity", "MODERATE"),
        "status": "RECEIVED",
        "people_affected": payload.get("people_affected", 0),
        "reported_minutes_ago": 0,
        "source": payload.get("source", "citizen"),
    }
    db.insert_incident(incident)
    return incident


@app.patch("/api/incidents/{incident_id}")
def patch_incident(incident_id: str, payload: IncidentStatusUpdate):
    ok = db.update_incident_status(incident_id, payload.status)
    if not ok:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"id": incident_id, "status": payload.status}


@app.post("/api/incidents/{incident_id}/dispatch")
def dispatch_incident(incident_id: str):
    ok = db.update_incident_status(incident_id, "RESPONSE DISPATCHED")
    if not ok:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {
        "id": incident_id,
        "status": "RESPONSE DISPATCHED",
        "response_team_eta_minutes": 18,
        "nearest_hospital_km": 4.7,
        "nearest_shelter_km": 2.1,
        "road_access": "Partially blocked",
        "recommended_actions": [
            "Inspect slope",
            "Restrict traffic",
            "Prepare evacuation",
            "Notify local authorities",
        ],
    }


# ----------------------------------------------------------------- ALERTS --
@app.get("/api/alerts")
def get_alerts():
    alerts = []
    for loc in LOCATIONS:
        prob, _ = _susceptibility_value(loc["id"])
        risk = engine.compute_risk(loc, susceptibility=prob)
        alert = engine.alert_level(risk["score"])
        if alert["code"] != "NORMAL":
            alerts.append({
                "location_id": loc["id"],
                "location_name": loc["name"],
                "score": risk["score"],
                "level": risk["level"],
                "alert_code": alert["code"],
                "alert_label": alert["label"],
            })
    return sorted(alerts, key=lambda a: a["score"], reverse=True)


# ---------------------------------------------------------------- REPORTS --
@app.post("/api/reports")
def create_report(payload: ReportCreate):
    report_id = _generate_id()
    report = {
        "id": report_id,
        "location_id": payload.location_id or "",
        "location_name": payload.location_name,
        "hazard_type": payload.hazard_type,
        "description": payload.description,
        "severity": payload.severity,
        "contact": payload.contact or "",
        "photo_provided": payload.photo_provided,
        "status": "RECEIVED",
    }
    db.insert_report(report)

    # Forward into the authority incident stream automatically
    incident = {
        "id": report_id,
        "location_id": payload.location_id or "",
        "location_name": payload.location_name,
        "type": payload.hazard_type,
        "description": payload.description,
        "severity": payload.severity,
        "status": "RECEIVED",
        "people_affected": 0,
        "reported_minutes_ago": 0,
        "source": "citizen",
    }
    db.insert_incident(incident)

    return {
        "id": report_id,
        "status": "RECEIVED",
        "message": "Your report has been forwarded to the disaster management dashboard.",
    }


@app.get("/api/reports")
def get_reports():
    return db.list_reports()


# ------------------------------------------------------------- ANALYTICS ---
@app.get("/api/analytics")
def get_analytics():
    incidents = db.list_incidents()
    severity_counts = {"CRITICAL": 0, "HIGH": 0, "MODERATE": 0, "LOW": 0}
    for inc in incidents:
        sev = inc.get("severity", "MODERATE")
        severity_counts[sev] = severity_counts.get(sev, 0) + 1

    zone_scores = []
    total_exposed = 0
    critical_zones = 0
    high_zones = 0
    for loc in LOCATIONS:
        prob, _ = _susceptibility_value(loc["id"])
        risk = engine.compute_risk(loc, susceptibility=prob)
        zone_scores.append({"name": loc["name"], "score": risk["score"], "level": risk["level"]})
        total_exposed += loc["population_exposed"]
        if risk["level"] == "CRITICAL":
            critical_zones += 1
        elif risk["level"] == "VERY_HIGH":
            high_zones += 1

    active_alerts = len([z for z in zone_scores if z["score"] >= 50])
    open_incidents = len([i for i in incidents if i["status"] not in ("RESOLVED",)])

    return {
        "summary": {
            "active_alerts": active_alerts,
            "critical_zones": critical_zones,
            "high_risk_zones": high_zones,
            "open_incidents": open_incidents,
            "population_exposed": total_exposed,
        },
        "zone_scores": sorted(zone_scores, key=lambda z: z["score"], reverse=True),
        "severity_breakdown": severity_counts,
        "reports_total": len(db.list_reports()),
    }


# --------------------------------------------------------- IMAGE ASSESSMENT
IMAGE_INDICATOR_SETS = [
    ["exposed soil", "surface cracking", "loose debris", "vegetation disturbance"],
    ["surface cracking", "water seepage", "loose debris"],
    ["exposed soil", "vegetation disturbance"],
    ["surface cracking", "loose debris", "tilted vegetation", "exposed soil"],
]


@app.post("/api/image-assessment")
def image_assessment(payload: Optional[dict] = None):
    """
    AI-Assisted Visual Hazard Assessment (prototype).

    This is a clearly-labelled DEMO mechanism, not a real trained
    computer-vision model. It deterministically derives a plausible
    result from the uploaded filename/size so demos are repeatable,
    and is architected so a real CNN/vision model can be dropped in
    behind this same endpoint later.
    """
    seed_source = "demo"
    if payload:
        seed_source = str(payload.get("filename", "demo")) + str(payload.get("size", 0))
    seed = int(hashlib.md5(seed_source.encode()).hexdigest(), 16)

    indicators = IMAGE_INDICATOR_SETS[seed % len(IMAGE_INDICATOR_SETS)]
    confidence = 65 + (seed % 30)  # 65-94%

    return {
        "indicators": indicators,
        "potential_hazard": "Slope instability indicators",
        "confidence": confidence,
        "recommendation": "Report this location for professional assessment.",
        "is_demo": True,
        "disclaimer": (
            "This is a prototype AI-Assisted Visual Hazard Assessment. It does "
            "not scientifically confirm an active landslide and should not "
            "replace field inspection."
        ),
    }


def _generate_id() -> str:
    return "LGX-" + "".join(random.choices(string.digits, k=4))
