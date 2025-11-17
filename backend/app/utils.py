import base64
import io
import zipfile
import json
from PIL import Image
import os

def pil_to_base64(img: Image.Image, fmt="PNG") -> str:
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")

def base64_to_pil(b64: str) -> Image.Image:
    data = base64.b64decode(b64)
    return Image.open(io.BytesIO(data)).convert("RGB")

def make_zip(output_dir: str, shots_json: dict, storyboard_img, generated_images):
    os.makedirs(output_dir, exist_ok=True)
    sb_path = os.path.join(output_dir, "storyboard.png")

    storyboard_img.save(sb_path)

    for i, img in enumerate(generated_images):
        img.save(os.path.join(output_dir, f"shot_{i+1}.png"))

    with open(os.path.join(output_dir, "shots.json"), "w") as f:
        json.dump(shots_json, f, indent=2)

    zip_path = output_dir + ".zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        for root, _, files in os.walk(output_dir):
            for fn in files:
                zf.write(os.path.join(root, fn), arcname=fn)
                
    return zip_path
