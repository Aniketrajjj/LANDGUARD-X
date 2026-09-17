"""
Precompute the eight model features for every demo location.

Run this ONCE, from the backend/ directory, on a machine with internet:

    python scripts/precompute_location_features.py

It writes app/ml/location_features.json, which the API then loads offline.

Elevation and slope come from your DEM tiles if you point DEM_DIR at them;
otherwise it falls back to the values already in demo_data.py. Soil comes from
the SoilGrids WCS service — the same source and the same unit conversions used
when the model was trained, which matters: feeding the model raw SoilGrids
integers instead of converted units silently produces garbage probabilities.
"""

import json
import os
import sys
import time

import numpy as np
import requests

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.data.demo_data import LOCATIONS  # noqa: E402

OUT_PATH = os.path.join(os.path.dirname(__file__), "..", "app", "ml", "location_features.json")
DEM_DIR = os.environ.get("LANDGUARD_DEM_DIR", "")
SOIL_CACHE = os.path.join(os.path.dirname(__file__), "soil_cache")

SOILGRIDS_WCS = "https://maps.isric.org/mapserv"
SOIL_DEPTH = "0-5cm"
SOIL_TILE_DEG = 2

# property -> (output column, divisor to reach the trained unit)
SOIL_LAYERS = {
    "clay":  ("Soil_Clay_pct",      10.0),
    "sand":  ("Soil_Sand_pct",      10.0),
    "silt":  ("Soil_Silt_pct",      10.0),
    "phh2o": ("Soil_pH",            10.0),
    "soc":   ("Soil_SOC",           10.0),
    "bdod":  ("Soil_BulkDensity",  100.0),
}


def soil_tile_corner(lat, lon, size=SOIL_TILE_DEG):
    return int(np.floor(lat / size) * size), int(np.floor(lon / size) * size)


def download_soil_tile(prop, south, west, retries=2):
    os.makedirs(SOIL_CACHE, exist_ok=True)
    path = os.path.join(SOIL_CACHE, f"{prop}_{south}_{west}.tif")
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return path

    params = {
        "map": f"/map/{prop}.map",
        "SERVICE": "WCS", "VERSION": "2.0.1", "REQUEST": "GetCoverage",
        "COVERAGEID": f"{prop}_{SOIL_DEPTH}_mean",
        "FORMAT": "image/tiff",
        "SUBSET": [f"long({west},{west + SOIL_TILE_DEG})", f"lat({south},{south + SOIL_TILE_DEG})"],
        "SUBSETTINGCRS": "http://www.opengis.net/def/crs/EPSG/0/4326",
        "OUTPUTCRS": "http://www.opengis.net/def/crs/EPSG/0/4326",
    }

    for attempt in range(retries + 1):
        try:
            r = requests.get(SOILGRIDS_WCS, params=params, timeout=180)
            r.raise_for_status()
            if r.content[:4] not in (b"II*\x00", b"MM\x00*"):
                print(f"    {prop}: server returned non-TIFF")
                return None
            with open(path, "wb") as fh:
                fh.write(r.content)
            return path
        except requests.exceptions.RequestException as exc:
            if attempt == retries:
                print(f"    {prop} failed: {exc}")
                return None
            time.sleep(3 * (attempt + 1))
    return None


def sample_soil(lat, lon):
    import rasterio
    from rasterio.transform import rowcol

    south, west = soil_tile_corner(lat, lon)
    out = {}
    for prop, (col, factor) in SOIL_LAYERS.items():
        path = download_soil_tile(prop, south, west)
        if path is None:
            out[col] = None
            continue
        with rasterio.open(path) as src:
            band = src.read(1).astype("float64")
            if src.nodata is not None:
                band[band == src.nodata] = np.nan
            band[band < -1e4] = np.nan
            row, col_idx = rowcol(src.transform, lon, lat)
            if 0 <= row < band.shape[0] and 0 <= col_idx < band.shape[1]:
                val = band[row, col_idx]
                out[col] = None if np.isnan(val) else round(float(val) / factor, 3)
            else:
                out[col] = None
    return out


def sample_dem(lat, lon):
    """Elevation + slope from a local DEM tile, or (None, None) if unavailable."""
    if not DEM_DIR:
        return None, None
    import rasterio
    from rasterio.transform import rowcol

    path = os.path.join(DEM_DIR, f"dem_{int(np.floor(lat))}_{int(np.floor(lon))}.tif")
    if not os.path.exists(path):
        return None, None

    with rasterio.open(path) as src:
        elev = src.read(1).astype("float64")
        if src.nodata is not None:
            elev[elev == src.nodata] = np.nan
        tr = src.transform
        m_lat = 111_320
        m_lon = 111_320 * np.cos(np.radians(lat))
        dy, dx = np.gradient(elev, -tr.e * m_lat, tr.a * m_lon)
        slope = np.degrees(np.arctan(np.sqrt(dx ** 2 + dy ** 2)))
        row, col = rowcol(tr, lon, lat)
        if not (0 <= row < elev.shape[0] and 0 <= col < elev.shape[1]):
            return None, None
        e, s = elev[row, col], slope[row, col]
        return (None if np.isnan(e) else round(float(e), 2),
                None if np.isnan(s) else round(float(s), 2))


def main():
    result = {}
    for loc in LOCATIONS:
        print(f"{loc['name']} ({loc['lat']:.4f}, {loc['lon']:.4f})")

        elev, slope = sample_dem(loc["lat"], loc["lon"])
        source = "DEM tile"
        if elev is None:
            elev, slope, source = float(loc["elevation_m"]), float(loc["slope_deg"]), "demo_data.py"
        print(f"  elevation/slope from {source}: {elev} m, {slope} deg")

        soil = sample_soil(loc["lat"], loc["lon"])
        print(f"  soil: {soil}")

        entry = {"Elevation_m": elev, "Slope_deg": slope, **soil}
        entry["_source"] = {"terrain": source, "soil": "SoilGrids WCS 0-5cm"}
        result[loc["id"]] = entry

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as fh:
        json.dump(result, fh, indent=2)

    complete = sum(
        1 for v in result.values()
        if all(v.get(k) is not None for k in
               ["Elevation_m", "Slope_deg"] + [c for c, _ in SOIL_LAYERS.values()])
    )
    print(f"\nWrote {OUT_PATH}")
    print(f"{complete}/{len(result)} locations have a complete feature set.")
    if complete < len(result):
        print("Incomplete locations fall back to the heuristic engine at runtime.")


if __name__ == "__main__":
    main()
