# Storyboard Generator (Text-to-Ad)

The project combines a FastAPI backend that orchestrates Google Gemini for shot breakdowns and Stable Diffusion for image generation with a React/Vite frontend for prompt entry, previewing shots, and browsing metadata.

---

## 📤 Output Samples
- **Face preservation:**  
  ![Model Output](./assets/example1.png)

- **UI Preview:**  
  ![Storyboard Walkthrough](./assets/example2.jpg)  
  ![Storyboard Walkthrough](./assets/example3.jpg)

---

## 📊 System Data Flow
Below is the complete data flow diagram showing how the storyboard system processes input from script → to shots → to final storyboard:

![Data Flow Diagram](./assets/solution_architecture.jpeg)

> **Full PDF version:**  
> 👉 [Download data_flow_1.pdf](./assets/data_flow_1.pdf)

---

## ⚙️ CI/CD Pipeline

> **Full PDF version:**  
> 👉 [Download CI_CD_2_pipeline.pdf](./assets/CI_CD_2_pipeline.pdf)

---

## ✨ Features
- Multi-shot storyboard generation from long-form ad scripts.
- Consistent character rendering via IP-Adapter-conditioned Stable Diffusion.
- Fully automated data flow, face encoding, and shot-loop rendering.

---

## 📁 Project Structure

```
text-to-ad/
├── assets/ # Diagrams, previews, PDFs
├── backend/                # FastAPI service + diffusion pipeline
│   ├── app/
│   │   ├── main.py         # API surface: generate + download endpoints
│   │   ├── storyboard.py   # Gemini prompt, SD pipeline, compositing
│   │   └── utils.py        # Base64 helpers, ZIP builder, etc.
│   └── requirements.txt
└── frontend/               # React (Vite) single-page client
    ├── src/
    │   ├── App.jsx         # Primary UI layout + interactions
    │   └── api.js          # REST helper for backend calls
    └── package.json
```

## Prerequisites
- Python 3.10+ with CUDA-enabled GPU recommended for fastest diffusion inference.
- Node.js 18+ and npm 9+ (Vite default toolchain).
- Access tokens:
  - `GENAI_API_KEY` – Google Generative AI (Gemini/Gemma) key.
  - `HUGGINGFACE_TOKEN` – enables gated model downloads if needed.

## Environment Variables
| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `GENAI_API_KEY` | Used by `google.generativeai` to produce shot metadata. | ✅ | None |
| `HUGGINGFACE_TOKEN` | Authenticates Stable Diffusion/IP-Adapter downloads. | ✅ | None |
| `VITE_API_BASE` | Frontend -> backend URL (e.g., `http://localhost:8000`). | ✅ (frontend) | `http://localhost:8000` |

## Backend Setup (FastAPI + Diffusers)
```powershell
cd backend
python -m venv .venv
. .venv/Scripts/Activate.ps1
pip install -r requirements.txt
setx GENAI_API_KEY "<your_google_key>"
setx HUGGINGFACE_TOKEN "<your_hf_token>"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Notes:
- First launch downloads SD weights (several GB); allow time and disk space.
- GPU strongly recommended; CPU inference is slow and may require `torch.float32`.
- The `/api/download-zip` endpoint writes a temp folder (`output_tmp`) before creating archives.

## Frontend Setup (React + Vite)
```powershell
cd frontend
npm install
$env:VITE_API_BASE = "http://localhost:8000"  # or remote FastAPI host
npm run dev -- --host
```

Navigate to `http://localhost:5173` (or the port Vite reports) to open the UI. The form contains preset script and character details to test generation quickly.

## API Overview
| Method | Route | Body | Description |
| --- | --- | --- | --- |
| `POST` | `/api/generate` | `{ script, character_description, base_seed?, cols? }` | Returns composite storyboard image, reference portrait, per-shot renders, and metadata (all Base64). |
| `POST` | `/api/download-zip` | same as above | Generates shots, writes them to disk, zips storyboard assets, and responds with the ZIP path. |

## Development Tips
- `storyboard.py` lazily loads Stable Diffusion and IP-Adapter. If you switch models, update `load_pipeline()` and ensure the safety checker logic meets your compliance needs.
- Gemini responses must be valid JSON arrays; errors will bubble up as HTTP 500. Log or cache breakdowns if you want deterministic runs.
- The frontend’s modal viewer already supports keyboard navigation (← → / Esc) and can be extended for download buttons or metadata overlays.


## Roadmap Ideas
- Allow multiple characters and per-scene wardrobe continuity aids.
- Persist generated storyboards in a database for later editing.
- Add progressive rendering status updates (WebSocket or SSE).
- Support fine-grained prompt editing per shot from the UI before regeneration.

Happy storytelling! 🎬

