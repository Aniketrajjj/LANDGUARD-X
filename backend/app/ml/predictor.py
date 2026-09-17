"""
LANDGUARD-X — Trained ML susceptibility model wrapper
-----------------------------------------------------
Loads the RandomForestClassifier trained in LANDGUARD_X_integrated_ML.ipynb on the
GSI Bhusanket inventory and exposes a single `susceptibility()` call.

WHAT THIS MODEL IS
    A *static susceptibility* model. Its eight features are terrain and soil only:
        Elevation_m, Slope_deg,
        Soil_Clay_pct, Soil_Sand_pct, Soil_Silt_pct, Soil_pH, Soil_SOC, Soil_BulkDensity
    There is no rainfall feature. It answers "is this terrain landslide-prone?",
    not "is a landslide likely today?".

WHAT IT IS NOT
    A trigger model. Rainfall and soil moisture stay in the deterministic risk
    engine, which is what makes the score move day to day.

Everything degrades gracefully: if the model file or the precomputed features are
missing, `is_available()` returns False and the API keeps serving the heuristic
engine rather than erroring.
"""

from __future__ import annotations

import json
import os
import threading
from typing import Optional

FEATURE_ORDER = [
    "Elevation_m",
    "Slope_deg",
    "Soil_Clay_pct",
    "Soil_Sand_pct",
    "Soil_Silt_pct",
    "Soil_pH",
    "Soil_SOC",
    "Soil_BulkDensity",
]

_HERE = os.path.dirname(os.path.abspath(__file__))
_BACKEND_ROOT = os.path.abspath(os.path.join(_HERE, "..", ".."))

MODEL_PATH = os.environ.get(
    "LANDGUARD_MODEL_PATH", os.path.join(_BACKEND_ROOT, "models", "landslide_model.joblib")
)
FEATURES_PATH = os.environ.get(
    "LANDGUARD_FEATURES_PATH", os.path.join(_HERE, "location_features.json")
)

_lock = threading.Lock()
_model = None
_features: dict = {}
_load_error: Optional[str] = None
_loaded = False


def _load() -> None:
    """Lazy, thread-safe, one-shot load. Never raises."""
    global _model, _features, _load_error, _loaded
    if _loaded:
        return
    with _lock:
        if _loaded:
            return
        _loaded = True

        if os.path.exists(FEATURES_PATH):
            try:
                with open(FEATURES_PATH, "r", encoding="utf-8") as fh:
                    raw = json.load(fh)
                # Keep only locations whose eight features are all present
                _features = {
                    loc_id: vals
                    for loc_id, vals in raw.items()
                    if isinstance(vals, dict)
                    and all(vals.get(f) is not None for f in FEATURE_ORDER)
                }
            except Exception as exc:
                _load_error = f"Could not read {FEATURES_PATH}: {exc}"
                return
        else:
            _load_error = (
                "location_features.json not found — run "
                "`python scripts/precompute_location_features.py` to generate it."
            )
            return

        if not os.path.exists(MODEL_PATH):
            _load_error = (
                f"Model file not found at {MODEL_PATH}. Place landslide_model.joblib "
                "there (it is gitignored because of its size)."
            )
            return

        try:
            import warnings
            import joblib  # imported lazily so the API still boots without sklearn
            with warnings.catch_warnings():
                # The pickle carries the sklearn version it was trained under. A
                # mismatch is loud but usually harmless; requirements.txt pins the
                # training version so this normally stays quiet.
                warnings.filterwarnings("ignore", category=UserWarning)
                _model = joblib.load(MODEL_PATH)
        except Exception as exc:
            _model = None
            _load_error = f"Could not load model: {exc}"


def is_available() -> bool:
    _load()
    return _model is not None and bool(_features)


def status() -> dict:
    _load()
    return {
        "model_available": _model is not None,
        "model_type": type(_model).__name__ if _model is not None else None,
        "features": FEATURE_ORDER,
        "locations_with_features": sorted(_features.keys()),
        "model_path": MODEL_PATH,
        "error": _load_error,
        "trained_on": "GSI Bhusanket landslide inventory (36,071 records) + background samples",
        "note": (
            "Static susceptibility only (terrain + soil). Rainfall and soil moisture "
            "are handled by the deterministic risk engine, not by this model."
        ),
    }


def features_for(location_id: str) -> Optional[dict]:
    _load()
    return _features.get(location_id)


def susceptibility(location_id: str) -> Optional[dict]:
    """
    Return the model's P(landslide-prone terrain) for a known location.

    Returns None when the model or that location's features are unavailable,
    which callers must treat as "fall back to the heuristic engine".
    """
    _load()
    if _model is None:
        return None

    feats = _features.get(location_id)
    if feats is None:
        return None

    try:
        # Pass a named DataFrame: the forest was fitted with feature names, and a
        # bare list triggers a sklearn warning and relies on positional order.
        import pandas as pd
        row = pd.DataFrame([[float(feats[f]) for f in FEATURE_ORDER]], columns=FEATURE_ORDER)
        prob = float(_model.predict_proba(row)[0][1])
    except Exception as exc:
        return {"error": str(exc), "probability": None}

    return {
        "probability": round(prob, 4),
        "score_0_100": round(prob * 100, 1),
        "band": _band(prob),
        "features_used": {f: feats[f] for f in FEATURE_ORDER},
        "model": "RandomForestClassifier (400 trees)",
        "kind": "static_susceptibility",
    }


def _band(prob: float) -> str:
    if prob >= 0.85:
        return "VERY_HIGH"
    if prob >= 0.65:
        return "HIGH"
    if prob >= 0.40:
        return "MODERATE"
    return "LOW"
