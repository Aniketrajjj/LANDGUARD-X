"""
LANDGUARD-X Risk Engine
------------------------
A deterministic, interpretable risk scoring engine.

HYBRID MODE (integrated with the trained model)
    The RandomForest trained on the GSI Bhusanket inventory uses terrain + soil
    only, so it is a *static susceptibility* model with no rainfall feature. It
    therefore does not replace this engine — it replaces the three static terms
    inside it (slope, elevation, historical_susceptibility, combined weight 0.45)
    with one model-derived `ml_susceptibility` term of the same total weight.

    The dynamic trigger terms (rainfall 0.30, soil moisture 0.15) and the context
    terms (land cover 0.05, exposure 0.05) are untouched, which is what still makes
    the score move hour to hour. Weights sum to 1.00 in both modes, so scores stay
    comparable and the API contract is unchanged.

    When the model or a location's features are unavailable, `susceptibility` is
    None and the engine runs exactly as before.

Risk (conceptually) = Hazard x Exposure x Vulnerability
Here we compute an interpretable Hazard/Susceptibility-driven score and
report Exposure (population/infrastructure) separately, per SIH scientific
credibility guidance.
"""

from app.data.demo_data import LAND_COVER_RISK


def clamp(value: float, lo: float = 0, hi: float = 100) -> float:
    return max(lo, min(hi, value))


def rainfall_risk(rainfall_mm: float) -> float:
    """Normalize 24h rainfall (mm) against a regional trigger threshold."""
    threshold = 150.0  # mm/24h considered a strong landslide trigger locally
    return clamp((rainfall_mm / threshold) * 100)


def slope_risk(slope_deg: float) -> float:
    """Steeper slope => higher susceptibility. 45deg treated as extreme."""
    return clamp((slope_deg / 45.0) * 100)


def soil_saturation_risk(soil_moisture_pct: float) -> float:
    """Soil moisture already expressed 0-100%."""
    return clamp(soil_moisture_pct)


def historical_risk(historical_susceptibility: float) -> float:
    """Historical susceptibility index, already 0-100."""
    return clamp(historical_susceptibility)


def elevation_terrain_risk(elevation_m: float) -> float:
    """
    Mid-elevation Himalayan slopes (roughly 800m - 2200m) with weathered
    overburden are statistically most landslide-prone; very low or very
    high elevations are treated as comparatively lower risk in this
    simplified prototype model.
    """
    if 800 <= elevation_m <= 2200:
        return 85
    if 2200 < elevation_m <= 3000 or 400 <= elevation_m < 800:
        return 55
    return 30


def land_cover_risk(land_cover: str) -> float:
    return clamp(LAND_COVER_RISK.get(land_cover, 50))


def infrastructure_exposure_risk(population_exposed: int) -> float:
    """Larger exposed population/infrastructure raises the exposure term."""
    cap = 15000
    return clamp((population_exposed / cap) * 100)


# Heuristic mode: all seven factors derived from rules.
WEIGHTS = {
    "rainfall": 0.30,
    "slope": 0.25,
    "soil": 0.15,
    "historical": 0.10,
    "elevation": 0.10,
    "land_cover": 0.05,
    "infrastructure": 0.05,
}

# Hybrid mode: slope + elevation + historical (0.25 + 0.10 + 0.10 = 0.45) are
# replaced by the trained model's susceptibility output at the same total weight.
ML_WEIGHTS = {
    "rainfall": 0.30,
    "ml_susceptibility": 0.45,
    "soil": 0.15,
    "land_cover": 0.05,
    "infrastructure": 0.05,
}


def classify(score: float) -> str:
    if score <= 30:
        return "LOW"
    if score <= 50:
        return "MODERATE"
    if score <= 70:
        return "HIGH"
    if score <= 85:
        return "VERY_HIGH"
    return "CRITICAL"


def compute_risk(location: dict, susceptibility: float = None) -> dict:
    """
    Compute an interpretable risk score for a location dict containing:
    rainfall_mm, slope_deg, soil_moisture_pct, elevation_m, land_cover,
    historical_susceptibility, population_exposed.

    `susceptibility` is the trained model's P(landslide-prone terrain) in 0-1.
    Pass it to run in hybrid mode; leave it None to run the original heuristic.

    Returns total score, per-factor sub-scores, per-factor point
    contribution (sub-score * weight, already scaled to the 0-100 total),
    classification, and primary driver list.
    """
    use_ml = susceptibility is not None

    if use_ml:
        weights = ML_WEIGHTS
        sub = {
            "rainfall": rainfall_risk(location["rainfall_mm"]),
            "ml_susceptibility": clamp(float(susceptibility) * 100),
            "soil": soil_saturation_risk(location["soil_moisture_pct"]),
            "land_cover": land_cover_risk(location["land_cover"]),
            "infrastructure": infrastructure_exposure_risk(location["population_exposed"]),
        }
    else:
        weights = WEIGHTS
        sub = {
            "rainfall": rainfall_risk(location["rainfall_mm"]),
            "slope": slope_risk(location["slope_deg"]),
            "soil": soil_saturation_risk(location["soil_moisture_pct"]),
            "historical": historical_risk(location["historical_susceptibility"]),
            "elevation": elevation_terrain_risk(location["elevation_m"]),
            "land_cover": land_cover_risk(location["land_cover"]),
            "infrastructure": infrastructure_exposure_risk(location["population_exposed"]),
        }

    contributions = {k: round(sub[k] * weights[k], 1) for k in sub}
    total = round(sum(contributions.values()), 1)
    total = clamp(total)
    level = classify(total)

    driver_labels = {
        "rainfall": {
            "icon": "🌧",
            "title": "Heavy rainfall",
            "desc": "Rainfall is significantly above the local trigger threshold.",
        },
        "slope": {
            "icon": "⛰",
            "title": "Steep terrain",
            "desc": "Slope angle increases susceptibility to slope failure.",
        },
        "soil": {
            "icon": "💧",
            "title": "High soil moisture",
            "desc": "Increased saturation reduces slope stability.",
        },
        "historical": {
            "icon": "📚",
            "title": "Historical susceptibility",
            "desc": "The region has previously experienced landslide events.",
        },
        "elevation": {
            "icon": "🗻",
            "title": "Terrain elevation band",
            "desc": "Elevation and overburden characteristics elevate susceptibility.",
        },
        "land_cover": {
            "icon": "🌱",
            "title": "Land cover",
            "desc": "Sparse vegetation/exposed soil reduces slope-holding root structure.",
        },
        "ml_susceptibility": {
            "icon": "🧠",
            "title": "Modelled terrain susceptibility",
            "desc": "A model trained on 36,071 GSI landslide records rates this terrain and soil profile as landslide-prone.",
        },
        "infrastructure": {
            "icon": "🏘",
            "title": "Infrastructure exposure",
            "desc": "A large exposed population/infrastructure footprint raises overall risk.",
        },
    }

    # Primary drivers = top contributing factors (excluding negligible ones)
    ranked = sorted(contributions.items(), key=lambda kv: kv[1], reverse=True)
    primary_drivers = [
        {**driver_labels[k], "factor": k, "contribution": v}
        for k, v in ranked
        if v >= 5
    ][:4]

    return {
        "score": total,
        "level": level,
        "sub_scores": {k: round(v, 1) for k, v in sub.items()},
        "contributions": contributions,
        "weights": weights,
        "primary_drivers": primary_drivers,
        "mode": "hybrid_ml" if use_ml else "heuristic",
        "ml_susceptibility": round(float(susceptibility), 4) if use_ml else None,
    }


def forecast_curve(base_score: float, trend: str):
    """
    Deterministic 48-hour forecast curve. NOT randomized - same inputs
    always produce the same forecast, as required for a stable demo.
    """
    hours = [0, 3, 6, 12, 24, 48]
    if trend == "increasing":
        deltas = [0, 4, 9, 14, 12, -5]
    elif trend == "decreasing":
        deltas = [0, -3, -6, -10, -14, -18]
    else:
        deltas = [0, 1, -1, 2, -2, 1]

    points = []
    for h, d in zip(hours, deltas):
        score = clamp(round(base_score + d, 1))
        points.append({"hour": h, "score": score, "level": classify(score)})
    return points


def alert_level(score: float) -> dict:
    if score >= 85:
        return {"code": "CRITICAL_WARNING", "label": "🚨 CRITICAL LANDSLIDE WARNING"}
    if score >= 70:
        return {"code": "HIGH_ALERT", "label": "⚠️ HIGH LANDSLIDE ALERT"}
    if score >= 50:
        return {"code": "WATCH", "label": "🟡 LANDSLIDE WATCH"}
    return {"code": "NORMAL", "label": "🟢 NORMAL"}
