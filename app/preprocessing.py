from pathlib import Path
import json
import joblib
import numpy as np
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS_DIR = PROJECT_ROOT / "artifacts"

imputer = joblib.load(ARTIFACTS_DIR / "imputer.pkl")
scaler = joblib.load(ARTIFACTS_DIR / "scaler.pkl")

with open(ARTIFACTS_DIR / "feature_columns.json", "r", encoding="utf-8") as f:
    feature_cols = json.load(f)

with open(ARTIFACTS_DIR / "log_columns.json", "r", encoding="utf-8") as f:
    log_cols = json.load(f)

with open(ARTIFACTS_DIR / "planet_type_info.json", "r", encoding="utf-8") as f:
    planet_type_info = json.load(f)


base_numeric_cols = [
    "n_stars",
    "n_planets",
    "orbital_period_days",
    "planet_radius_earth",
    "planet_mass_earth",
    "equilibrium_temp_k",
    "orbital_eccentricity",
    "semi_major_axis_au",
    "star_temp_k",
    "star_radius_sun",
    "star_mass_sun",
    "star_age_gyr",
    "star_surface_gravity",
    "star_metallicity",
    "dist_from_earth_pc",
]

missing_flag_cols = [
    "equilibrium_temp_k",
    "star_age_gyr",
    "orbital_eccentricity",
    "star_metallicity",
    "orbital_period_days",
    "semi_major_axis_au",
    "star_radius_sun",
    "star_surface_gravity",
    "star_temp_k",
]


def preprocess_input(input_data: dict):
    row = {}

    for col in base_numeric_cols:
        value = input_data.get(col)
        row[col] = np.nan if value is None else value

    for col in missing_flag_cols:
        row[f"{col}_missing"] = int(pd.isna(row[col]))

    radius = row.get("planet_radius_earth")
    mass = row.get("planet_mass_earth")

    if pd.isna(radius) or pd.isna(mass) or radius == 0:
        row["density_proxy"] = np.nan
    else:
        row["density_proxy"] = mass / (radius ** 3)

    df = pd.DataFrame([row])

    for col in log_cols:
        if col in df.columns:
            df[col] = np.log1p(df[col])

    df = df[feature_cols]

    imputed = imputer.transform(df)
    scaled = scaler.transform(imputed)

    return scaled.astype(np.float32)


def get_planet_profile(predicted_class: str):
    for item in planet_type_info:
        if item["planet_type"] == predicted_class:
            return item
    return None