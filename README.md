# Exoplanet Type Classifier

An interactive multiclass classification web application that predicts the type of an exoplanet using planetary, orbital, and host-star features.

This project was built as a PyTorch multiclass classification assignment and extended with a FastAPI backend and an interactive frontend interface.

---

## Project Overview

The goal of this project is to classify exoplanets into one of six planet types:

- Sub-Earth
- Super-Earth
- Mini-Neptune
- Neptune-like
- Gas Giant
- Super-Jupiter

The model uses numerical astronomical features such as planet radius, planet mass, orbital period, equilibrium temperature, orbital eccentricity, semi-major axis, and host-star properties.

The final application allows users to adjust feature values with interactive sliders, apply predefined class presets, and observe how the model prediction changes.

---

## Demo Features

The web application includes:

- PyTorch neural network for multiclass classification
- FastAPI backend
- Interactive frontend with HTML, CSS, and JavaScript
- Slider-based feature input system
- Log-scaled sliders for wide-range astronomical features
- Class guide carousel with planet type presets
- Dynamic visual representations for planet classes
- Prediction confidence score
- Class probability distribution
- Typical planet profile comparison
- Basic habitability temperature note

---

## Dataset

The dataset used in this project is based on an exoplanet archive-style tabular dataset containing confirmed exoplanets and their physical/orbital properties.

Main target column:

```text
planet_type
```

Selected input features include:

```text
n_stars
n_planets
orbital_period_days
planet_radius_earth
planet_mass_earth
equilibrium_temp_k
orbital_eccentricity
semi_major_axis_au
star_temp_k
star_radius_sun
star_mass_sun
star_age_gyr
star_surface_gravity
star_metallicity
dist_from_earth_pc
```

Some additional engineered or metadata fields were used during preprocessing and UI configuration.

---

## Model

The classification model is a feed-forward neural network built with PyTorch.

General architecture:

```text
Input features
↓
Fully connected hidden layers
↓
ReLU activations
↓
Output layer with 6 classes
```

The model was trained using:

- Train / validation / test split
- Standard scaling
- Missing value imputation
- Label encoding
- Cross entropy loss
- Adam optimizer

Final test performance:

```text
Test Accuracy: ~94%
```

Per-class performance showed strong results overall, while smaller classes such as Sub-Earth and Super-Jupiter were more challenging due to class imbalance and class boundary overlap.

---

## Project Structure

```text
exoplanet_classifier/
│
├── app/
│   ├── main.py
│   ├── model.py
│   ├── preprocessing.py
│   ├── schemas.py
│   └── static/
│       ├── index.html
│       ├── styles.css
│       └── script.js
│
├── artifacts/
│   ├── exoplanet_model.pth
│   ├── model_config.json
│   ├── class_names.json
│   ├── feature_columns.json
│   ├── log_columns.json
│   ├── ui_feature_config.json
│   ├── planet_type_info.json
│   ├── imputer.pkl
│   ├── scaler.pkl
│   └── label_encoder.pkl
│
├── data/
│   └── raw/
│       └── nasa_exoplanet_intelligence.csv
│
├── notebooks/
│   ├── 01_eda_preprocessing.ipynb
│   ├── 02_pytorch_training.ipynb
│   └── 03_improving.ipynb
│
├── processed/
│   └── exoplanet_splits_scaled.npz
│
├── requirements.txt
├── .gitignore
└── README.md
```

---

## Notebooks

### 01_eda_preprocessing.ipynb

Includes:

- Dataset loading
- Exploratory data analysis
- Missing value analysis
- Feature selection
- Log transformation decisions
- Train / validation / test split
- Imputer and scaler fitting
- Artifact saving
- UI feature configuration generation

### 02_pytorch_training.ipynb

Includes:

- Loading processed train/validation/test data
- Tensor conversion
- PyTorch neural network definition
- Model training loop
- Validation monitoring
- Test evaluation
- Classification report
- Model saving

### 03_improving.ipynb

Includes:

- UI feature configuration improvements
- Slider range adjustments
- Log-scale configuration
- Class marker configuration for frontend exploration

---

## FastAPI Endpoints

### Home / Frontend

```text
GET /
```

Serves the interactive web interface.

### Health Check

```text
GET /api/health
```

Returns API status and available class names.

### UI Config

```text
GET /api/ui-config
```

Returns frontend slider configuration, feature metadata, scale type, and class markers.

### Prediction

```text
POST /predict
```

Takes exoplanet feature values and returns:

- predicted planet type
- confidence score
- class probabilities
- top predictions
- typical planet profile

Example request:

```json
{
  "n_stars": 1,
  "n_planets": 1,
  "orbital_period_days": 13.7,
  "planet_radius_earth": 2.46,
  "planet_mass_earth": 6.85,
  "equilibrium_temp_k": 678,
  "orbital_eccentricity": 0.02,
  "semi_major_axis_au": 0.11,
  "star_temp_k": 5500,
  "star_radius_sun": 0.95,
  "star_mass_sun": 0.9,
  "star_age_gyr": 4.3,
  "star_surface_gravity": 4.4,
  "star_metallicity": 0.0,
  "dist_from_earth_pc": 300
}
```

Example response:

```json
{
  "predicted_planet_type": "Mini-Neptune",
  "confidence": 0.9988,
  "confidence_percent": 99.88,
  "probabilities": {
    "Gas Giant": 0.0,
    "Mini-Neptune": 0.9988,
    "Neptune-like": 0.0005,
    "Sub-Earth": 0.0,
    "Super-Earth": 0.0006,
    "Super-Jupiter": 0.0
  },
  "typical_profile": {
    "planet_type": "Mini-Neptune",
    "planet_radius_earth": 2.46,
    "planet_mass_earth": 6.85,
    "equilibrium_temp_k": 678,
    "orbital_period_days": 13.77,
    "semi_major_axis_au": 0.11
  }
}
```

---

## How to Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/iadnankaanGameDev/exoplanet_classifier.git
cd exoplanet_classifier
```

### 2. Create a virtual environment

```bash
python -m venv .venv
```

### 3. Activate the virtual environment

Windows PowerShell:

```bash
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, run:

```bash
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
```

Then activate again:

```bash
.\.venv\Scripts\Activate.ps1
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Run the FastAPI app

```bash
uvicorn app.main:app --reload
```

### 6. Open the application

Frontend:

```text
http://127.0.0.1:8000/
```

Swagger API docs:

```text
http://127.0.0.1:8000/docs
```

---

## Frontend Interaction

The frontend is designed as an interactive exploration tool.

Users can:

- Adjust feature values with sliders
- Use numeric input boxes for precise values
- Apply planet type presets
- Observe probability changes
- Compare input values with typical planet class profiles
- See visual representations of planet classes

Some sliders use logarithmic scaling because astronomical values such as planet mass, orbital period, and distance can span very wide ranges.

---

## Why Log-Scaled Sliders?

Some features have very large value ranges.

For example:

```text
planet_mass_earth
orbital_period_days
semi_major_axis_au
dist_from_earth_pc
```

A normal linear slider makes small values difficult to control. Log-scaled sliders make both small and large values easier to explore.

This improves the user experience and makes class transitions easier to observe.

---

## Important Notes

This project is a machine learning classification demo. The habitability note is only a simplified estimate based mainly on equilibrium temperature and should not be interpreted as a scientific habitability conclusion.

The model predicts planet type based on patterns in the dataset, not on full astrophysical simulation.

---

## Possible Future Improvements

Future versions could include:

- Model interpretability with permutation importance or SHAP
- Counterfactual suggestions such as “increase radius to move toward Mini-Neptune”
- A separate habitable zone classifier
- Multi-task neural network outputs
- More detailed comparison with real exoplanet examples
- Deployment to a public hosting service
- More polished responsive UI design
- Hidden layer representation visualization

---

## Technologies Used

- Python
- PyTorch
- FastAPI
- Uvicorn
- Pandas
- NumPy
- Scikit-learn
- Joblib
- HTML
- CSS
- JavaScript

---

## Author

Developed by Adnan Kaan İrfan as a PyTorch multiclass classification web application project.
