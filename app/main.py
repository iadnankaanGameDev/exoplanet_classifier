from pathlib import Path
import json

import torch
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.model import ExoplanetClassifier
from app.schemas import ExoplanetInput
from app.preprocessing import preprocess_input, get_planet_profile


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS_DIR = PROJECT_ROOT / "artifacts"
STATIC_DIR = PROJECT_ROOT / "app" / "static"

device = "cuda" if torch.cuda.is_available() else "cpu"


with open(ARTIFACTS_DIR / "model_config.json", "r", encoding="utf-8") as f:
    model_config = json.load(f)

with open(ARTIFACTS_DIR / "class_names.json", "r", encoding="utf-8") as f:
    class_names = json.load(f)

with open(ARTIFACTS_DIR / "ui_feature_config.json", "r", encoding="utf-8") as f:
    ui_feature_config = json.load(f)


model = ExoplanetClassifier(
    input_dim=model_config["input_dim"],
    hidden_dim=model_config["hidden_dim"],
    output_dim=model_config["output_dim"]
).to(device)

model.load_state_dict(
    torch.load(
        ARTIFACTS_DIR / "exoplanet_model.pth",
        map_location=device
    )
)

model.eval()


app = FastAPI(
    title="Exoplanet Type Classifier",
    description="PyTorch multiclass classifier for predicting exoplanet types.",
    version="1.0"
)

app.mount(
    "/static",
    StaticFiles(directory=STATIC_DIR),
    name="static"
)


@app.get("/")
def frontend():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/health")
def health():
    return {
        "message": "Exoplanet Type Classifier API is running.",
        "device": device,
        "classes": class_names
    }

@app.get("/api/ui-config")
def get_ui_config():
    with open(ARTIFACTS_DIR / "ui_feature_config.json", "r", encoding="utf-8") as f:
        return json.load(f)


@app.post("/predict")
def predict(input_data: ExoplanetInput):
    processed_input = preprocess_input(input_data.model_dump())

    input_tensor = torch.tensor(
        processed_input,
        dtype=torch.float32
    ).to(device)

    with torch.inference_mode():
        logits = model(input_tensor)
        probabilities = torch.softmax(logits, dim=1).cpu().numpy()[0]

    predicted_index = int(probabilities.argmax())
    predicted_class = class_names[predicted_index]
    confidence = float(probabilities[predicted_index])

    probability_dict = {
        class_names[i]: float(probabilities[i])
        for i in range(len(class_names))
    }

    top_3_predictions = sorted(
        probability_dict.items(),
        key=lambda item: item[1],
        reverse=True
    )[:3]

    top_3_predictions = [
        {
            "planet_type": planet_type,
            "probability": probability,
            "probability_percent": round(probability * 100, 2)
        }
        for planet_type, probability in top_3_predictions
    ]

    profile = get_planet_profile(predicted_class)

    return {
        "predicted_planet_type": predicted_class,
        "confidence": confidence,
        "confidence_percent": round(confidence * 100, 2),
        "probabilities": probability_dict,
        "top_3_predictions": top_3_predictions,
        "typical_profile": profile
    }