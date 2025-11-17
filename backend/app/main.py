import os
import io
import shutil
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from .storyboard import init_genai, prepare_pipeline_and_models, generate_full_storyboard
from .utils import pil_to_base64, make_zip

# Read env
HUGGINGFACE_TOKEN = os.environ.get("HUGGINGFACE_TOKEN")
GENAI_API_KEY = os.environ.get("GENAI_API_KEY")

app = FastAPI(title="Storyboard Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    script: str
    character_description: str
    base_seed: Optional[int] = 42
    cols: Optional[int] = 3

@app.on_event("startup")
def startup_event():
    if GENAI_API_KEY:
        init_genai(GENAI_API_KEY)
    try:
        prepare_pipeline_and_models(HUGGINGFACE_TOKEN)
    except Exception as e:
        print("Warning: pipeline/model preparation error:", e)

@app.post("/api/generate")
def api_generate(req: GenerateRequest):
    try:
        storyboard, generated_images, shots, reference = generate_full_storyboard(
            req.script, req.character_description, base_seed=req.base_seed, cols=req.cols, hf_token=HUGGINGFACE_TOKEN
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {e}")

    # Convert to base64
    storyboard_b64 = pil_to_base64(storyboard)
    reference_b64 = pil_to_base64(reference)
    shots_b64 = [pil_to_base64(img) for img in generated_images]

    return {
        "storyboard": storyboard_b64,
        "reference": reference_b64,
        "shots": shots_b64,
        "shots_meta": shots
    }

@app.post("/api/download-zip")
def api_download_zip(req: GenerateRequest):
    try:
        storyboard, generated_images, shots, reference = generate_full_storyboard(
            req.script, req.character_description, base_seed=req.base_seed, cols=req.cols, hf_token=HUGGINGFACE_TOKEN
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {e}")

    out_dir = os.path.abspath("output_tmp")

    if os.path.exists(out_dir):
        shutil.rmtree(out_dir)

    os.makedirs(out_dir, exist_ok=True)
    zip_path = make_zip(out_dir, shots, storyboard, generated_images)

    return {"zip_path": zip_path}
