import os
import json
import torch
from diffusers import StableDiffusionPipeline, DDIMScheduler
from PIL import Image
import numpy as np
from huggingface_hub import hf_hub_download
import google.generativeai as genai

from .utils import pil_to_base64, make_zip

device = "cuda" if torch.cuda.is_available() else "cpu"

# Initialize genai (we will configure per environment variable in main)
model_gemini = None  # will be set from main

# We'll lazy-load pipeline to reduce startup time.
_pipeline = None
_ip_adapter_loaded = False

def init_genai(api_key: str):
    global model_gemini
    genai.configure(api_key=api_key)
    model_gemini = genai.GenerativeModel("gemma-3-27b-it")

def load_pipeline(model_name="runwayml/stable-diffusion-v1-5", safety_checker=None, dtype=torch.float16):
    global _pipeline, _ip_adapter_loaded
    if _pipeline is not None:
        return _pipeline
    

    torch_dtype = dtype if device.startswith("cuda") else torch.float32
    _pipeline = StableDiffusionPipeline.from_pretrained(
        model_name,
        torch_dtype=torch_dtype,
        safety_checker=safety_checker
    ).to(device)

    _pipeline.scheduler = DDIMScheduler.from_config(_pipeline.scheduler.config)

    _ip_adapter_loaded = False
    return _pipeline

def load_ip_adapter_if_present(adapter_repo_dir="backend/app/models", weight_name="ip-adapter-full-face_sd15.bin"):
    global _pipeline, _ip_adapter_loaded
    if _pipeline is None:
        _pipeline = load_pipeline()

    path = os.path.join(adapter_repo_dir, weight_name)

    if os.path.exists(path):
        try:
            _pipeline.load_ip_adapter("h94/IP-Adapter", subfolder="models", weight_name=weight_name)
            _ip_adapter_loaded = True

        except Exception as e:
            print("Could not load IP-Adapter:", e)
            _ip_adapter_loaded = False
    return _ip_adapter_loaded


SYSTEM_PROMPT = """
You are a shot breakdown engine for a film storyboard system.
Your tasks:
- Parse the script or ad brief
- Identify scenes
- Break each scene into 3–10 shots
- Extract precise metadata for each shot

For each shot, extract:
{
    "shot_number": 1,
    "scene_id": "scene_1",
    "description": "Man wakes up in bed, stretches",
    "camera": {
        "shot_size": "medium shot",
        "angle": "eye level",
        "movement": "static"
    },
    "pose": "sitting in bed, arms stretched",
    "action": "waking up, stretching",
    "emotion": "tired but refreshed",
    "lighting": "soft morning light from window",
    "background": "bedroom with window, bed",
    "objects": ["bed", "pillow", "window"],
    "outfit": "white t-shirt",
    "image_prompt": "A professional man in his 30s with short dark hair, wearing a white t-shirt, sitting in bed stretching his arms, tired but refreshed expression, soft morning sunlight coming through bedroom window, medium shot, eye level angle"
}

Output ONLY valid JSON array with all shots.
"""

def generate_shot_breakdown(script_text: str):
    global model_gemini
    if model_gemini is None:
        raise RuntimeError("model_gemini not initialized. Call init_genai(api_key) first.")
    
    prompt = f"Script:\n{script_text}\n\nGenerate shot breakdown in strict JSON format as an array of shots. Include detailed camera angles, shot sizes, and composition notes."
    response = model_gemini.generate_content([SYSTEM_PROMPT, prompt])

    text = response.text.strip()

    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return json.loads(text.strip())

def prepare_pipeline_and_models(hf_token: str = None):
    if hf_token:
        os.environ["HUGGINGFACE_TOKEN"] = hf_token

    pipeline = load_pipeline()
    load_ip_adapter_if_present()

    return pipeline

def generate_reference_character(pipeline, character_description: str, seed: int = 42):
    try:
        pipeline.unload_ip_adapter()
    except Exception:
        pass

    prompt = f"{character_description}, professional photography, high quality, detailed face, clear features, studio lighting"
    negative_prompt = "blurry, low quality, distorted face, multiple people, cartoon, drawing, bad anatomy"

    generator = torch.Generator(device=device).manual_seed(seed) if device.startswith("cuda") else None

    img = pipeline(
        prompt=prompt,
        negative_prompt=negative_prompt,
        num_inference_steps=30,
        guidance_scale=7.5,
        generator=generator,
        height=512,
        width=512
    ).images[0]

    try:
        pipeline.load_ip_adapter("h94/IP-Adapter", subfolder="models", weight_name="ip-adapter-full-face_sd15.bin")
        pipeline.set_ip_adapter_scale(0.7)
    except Exception:
        pass
    return img

def generate_shot_image(pipeline, reference_image, shot_data: dict, seed: int = None):
    prompt = shot_data.get('image_prompt', shot_data.get('description', ''))

    if 'outfit' in shot_data:
        prompt += f", wearing {shot_data['outfit']}"
    if 'lighting' in shot_data:
        prompt += f", {shot_data['lighting']}"
    if 'background' in shot_data:
        prompt += f", {shot_data['background']}"

    prompt += ", professional photography, high quality, detailed"
    negative_prompt = "blurry, low quality, distorted face, deformed, multiple people, different person, cartoon, drawing, bad anatomy, ugly"

    generator = torch.Generator(device=device).manual_seed(seed) if (seed is not None and device.startswith("cuda")) else None
    image = pipeline(
        prompt=prompt,
        ip_adapter_image=reference_image,
        negative_prompt=negative_prompt,
        num_inference_steps=30,
        guidance_scale=7.5,
        generator=generator,
        height=512,
        width=512
    ).images[0]

    return image

def create_storyboard(images, shots_data, cols=3):
    from PIL import ImageDraw, ImageFont
    n_images = len(images)

    rows = (n_images + cols - 1) // cols
    img_width, img_height = 512, 512
    text_height = 120

    margin = 20
    board_width = cols * (img_width + margin) + margin
    board_height = rows * (img_height + text_height + margin) + margin

    storyboard = Image.new('RGB', (board_width, board_height), 'white')
    draw = ImageDraw.Draw(storyboard)
    try:
        font_title = ImageFont.truetype("DejaVuSans-Bold.ttf", 16)
        font_desc = ImageFont.truetype("DejaVuSans.ttf", 12)
    except:
        font_title = ImageFont.load_default()
        font_desc = ImageFont.load_default()

    for idx, (img, shot) in enumerate(zip(images, shots_data)):
        row = idx // cols
        col = idx % cols
        x = col * (img_width + margin) + margin
        y = row * (img_height + text_height + margin) + margin
        storyboard.paste(img, (x, y))
        text_y = y + img_height + 10
        title = f"Shot {shot.get('shot_number', idx+1)}: {shot.get('scene_id', 'Scene')}"
        draw.text((x, text_y), title, fill='black', font=font_title)
        desc = (shot.get('description', '')[:60] + "...") if len(shot.get('description', '')) > 60 else shot.get('description', '')
        draw.text((x, text_y + 25), desc, fill='gray', font=font_desc)
        camera = shot.get('camera', {})
        camera_info = f"{camera.get('shot_size', '')}, {camera.get('angle', '')}"
        draw.text((x, text_y + 45), camera_info, fill='darkgray', font=font_desc)
    return storyboard

def generate_full_storyboard(script_text: str, character_description: str, base_seed: int = 42, cols: int = 3, hf_token: str = None):
    if model_gemini is None:
        raise RuntimeError("GenAI not initialized (call init_genai).")
    pipeline = load_pipeline()

    prepare_pipeline_and_models(hf_token)

    shots = generate_shot_breakdown(script_text)

    reference_img = generate_reference_character(pipeline, character_description, seed=base_seed)

    generated_images = []

    for idx, shot in enumerate(shots):
        shot_seed = base_seed + idx
        img = generate_shot_image(pipeline, reference_img, shot, seed=shot_seed)
        generated_images.append(img)
    storyboard = create_storyboard(generated_images, shots, cols=cols)

    return storyboard, generated_images, shots, reference_img
