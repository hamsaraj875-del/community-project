import os
import io
import logging
from typing import Optional, Dict, List
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("civicvision-ai")

app = FastAPI(title="CivicVision AI Verification Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_NAME = os.getenv("CLIP_MODEL_NAME", "openai/clip-vit-base-patch32")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

logger.info(f"Loading CLIP model '{MODEL_NAME}' on {DEVICE}...")
clip_model = None
clip_processor = None

try:
    clip_model = CLIPModel.from_pretrained(MODEL_NAME).to(DEVICE)
    clip_processor = CLIPProcessor.from_pretrained(MODEL_NAME)
    clip_model.eval()
    logger.info("CLIP model loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load CLIP model: {e}")

# ─── Multi-Class Civic & Negative Hypothesis Registry ─────────────────────────
# When an image is submitted, we evaluate it across:
# 1. Target Category Positive Prompts (e.g. pothole / damaged road)
# 2. Target Category Counter/Normal Prompts (e.g. clear smooth undamaged road)
# 3. Other Civic Issue Prompts (to catch category cross-mismatches, e.g. streetlight submitted for pothole)
# 4. Non-civic Negative Prompts (cars, books, selfies, food, indoor furniture)

CIVIC_CATEGORIES: Dict[str, Dict[str, List[str]]] = {
    "Roads & Infrastructure": {
        "positive": [
            "a photo of a pothole or deep crater in an asphalt road",
            "a photo of a broken, cracked damaged road needing repair",
            "a photo of broken damaged concrete footpath pavement slabs",
            "a photo of a damaged smashed concrete road divider or barrier",
            "a photo of a broken uneven dangerous road speed breaker",
        ],
        "counter": [
            "a photo of a clean smooth undamaged asphalt road with no potholes",
            "a photo of an undamaged normal pedestrian footpath",
        ],
    },
    "Drainage": {
        "positive": [
            "a photo of an open sewer manhole with missing cover on a street",
            "a photo of a blocked drainage canal with overflowing dirty sewage water",
            "a photo of flooded rainwater waterlogging covering a city road",
            "a photo of black sewage water leaking onto the street",
        ],
        "counter": [
            "a photo of a dry clean road with no flooding or sewage",
            "a photo of an intact closed manhole on clean road",
        ],
    },
    "Water Supply": {
        "positive": [
            "a photo of a burst broken water pipeline gushing clean water onto road",
            "a photo of a leaking civic water meter valve flooding pavement",
            "a photo of dirty contaminated brown tap water in a container",
            "a photo of a broken municipal drinking water tap leaking",
            "a photo of a dry empty water tap with no water coming out",
        ],
        "counter": [
            "a photo of clean clear drinking water running smoothly",
            "a photo of an undamaged indoor bathroom or kitchen wall",
        ],
    },
    "Electricity": {
        "positive": [
            "a photo of a fallen collapsed electric concrete utility pole on a road",
            "a photo of dangerous low-hanging live electric power wires outdoors",
            "a photo of a smoking sparking electrical transformer or substation",
            "a photo of dark city blackout during power outage",
        ],
        "counter": [
            "a photo of an intact safely mounted electric utility pole with wires",
            "a photo of a brightly lit street with working power",
        ],
    },
    "Garbage & Sanitation": {
        "positive": [
            "a photo of an overflowing community garbage dumpster with trash spilling",
            "a photo of an illegal open garbage dump on roadside perimeter",
            "a photo of stray animals rummaging through an uncollected trash mound",
            "a photo of a dirty unhygienic neglected broken public toilet with stains",
            "a photo of an unattended dead animal on the street",
        ],
        "counter": [
            "a photo of a clean street with zero trash or garbage",
            "a photo of a clean sanitary modern public restroom",
        ],
    },
    "Street Lights": {
        "positive": [
            "a photo of an outdoor street light or street lamp pole at night or dusk",
            "a photo of a broken damaged knocked down street light lamppost",
            "a photo of a street lamp fixture on a road pole",
            "a photo of a dark unlit city street at night",
        ],
        "counter": [
            "a photo of a brightly illuminated city highway in full daylight",
            "a photo of clean sunny daytime sky",
        ],
    },
    "Parks & Recreation": {
        "positive": [
            "a photo of broken damaged rusted swings or slide in a playground park",
            "a photo of a broken shattered park bench with sharp edges",
            "a photo of a dark abandoned park walkway at night",
        ],
        "counter": [
            "a photo of a clean green public park with intact lawns and benches",
            "a photo of children playing happily on safe modern playground equipment",
        ],
    },
    "Public Safety": {
        "positive": [
            "a photo of a damaged broken CCTV surveillance camera on a pole",
            "a photo of heavy footpath encroachment by market stalls blocking pedestrians",
            "a photo of a broken non-working traffic signal light at a junction",
        ],
        "counter": [
            "a photo of a working security camera mounted on building",
            "a photo of a clear open pedestrian sidewalk",
            "a photo of functional green or red traffic signals directing cars",
        ],
    },
    "Other": {
        "positive": [
            "a photo of damaged public civic municipal infrastructure problem",
            "a photo of an urban hazard needing city repair",
        ],
        "counter": [
            "a photo of normal undamaged urban environment",
        ],
    },
}

NEGATIVE_PROMPTS = [
    ("vehicle", "a photo of an automobile, car, sedan, suv or motorcycle"),
    ("book", "a photo of an open book, notebook, printed document or paper text"),
    ("portrait", "a close-up portrait selfie photograph of a person face"),
    ("indoor", "a photo of an indoor living room, bedroom or office furniture"),
    ("food", "a photo of food, meal, snacks or restaurant dish"),
    ("pet", "a photo of a pet cat or dog indoors"),
]

class VerificationResponse(BaseModel):
    success: bool
    status: str  # "matched" | "mismatch_detected" | "needs_review"
    match_score: float
    reason: str
    category: str
    details: Optional[dict] = None

@app.get("/")
def health_check():
    return {
        "service": "CivicVision AI Verification Service",
        "status": "online",
        "model": MODEL_NAME,
        "device": DEVICE,
        "loaded": clip_model is not None,
    }

@app.post("/verify", response_model=VerificationResponse)
async def verify_complaint(
    category: str = Form(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    image: UploadFile = File(...),
):
    """
    Verifies if the uploaded complaint photograph matches the reported civic issue category.
    Performs competitive multi-class hypothesis testing using CLIP zero-shot cross-modal embeddings.
    """
    if clip_model is None or clip_processor is None:
        raise HTTPException(
            status_code=503,
            detail="AI model is currently not loaded or unavailable."
        )

    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid image.")

    content = await image.read()
    if len(content) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image size exceeds 15MB limit.")

    try:
        pil_image = Image.open(io.BytesIO(content)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")

    target_category = category if category in CIVIC_CATEGORIES else "Other"

    # Assemble candidate prompts with class metadata
    prompts: List[str] = []
    classes: List[str] = []  # "target_pos", "target_counter", "other_civic:<cat>", "negative:<type>"

    # 1. Target Positive Prompts
    target_pos = list(CIVIC_CATEGORIES[target_category]["positive"])
    if title and len(title.strip()) > 3:
        target_pos.append(f"a photo showing {title.strip().lower()}")
    for p in target_pos:
        prompts.append(p)
        classes.append("target_pos")

    # 2. Target Counter/Normal Prompts
    for p in CIVIC_CATEGORIES[target_category]["counter"]:
        prompts.append(p)
        classes.append("target_counter")

    # 3. Other Civic Categories (representative positive prompt each)
    for other_cat, cfg in CIVIC_CATEGORIES.items():
        if other_cat != target_category and cfg["positive"]:
            prompts.append(cfg["positive"][0])
            classes.append(f"other_civic:{other_cat}")

    # 4. Non-civic Negative Prompts
    for neg_type, p in NEGATIVE_PROMPTS:
        prompts.append(p)
        classes.append(f"negative:{neg_type}")

    # Compute softmax probabilities over the full hypothesis set
    with torch.no_grad():
        inputs = clip_processor(
            text=prompts,
            images=pil_image,
            return_tensors="pt",
            padding=True
        ).to(DEVICE)
        outputs = clip_model(**inputs)
        probs = outputs.logits_per_image.softmax(dim=1).cpu().numpy()[0]

    # Aggregate scores by class group
    score_target_pos = float(sum(p for p, c in zip(probs, classes) if c == "target_pos"))
    score_target_counter = float(sum(p for p, c in zip(probs, classes) if c == "target_counter"))
    score_other_civic = float(sum(p for p, c in zip(probs, classes) if c.startswith("other_civic:")))
    score_negative = float(sum(p for p, c in zip(probs, classes) if c.startswith("negative:")))

    best_idx = int(probs.argmax())
    best_prompt = str(prompts[best_idx])
    best_class = str(classes[best_idx])
    best_prob = float(probs[best_idx])

    logger.info(
        f"Verification: '{target_category}' | TargetPos: {score_target_pos:.3f} | Counter: {score_target_counter:.3f} | OtherCivic: {score_other_civic:.3f} | Negative: {score_negative:.3f} | Best: [{best_class}] '{best_prompt}' ({best_prob:.3f})"
    )

    # ── Decision Rules ──────────────────────────────────────────────────────────

    # Case 1: Unrelated object (car, book, portrait, indoor, food)
    if best_class.startswith("negative:") and score_negative > score_target_pos * 1.5:
        neg_type = best_class.split(":")[1]
        status = "mismatch_detected"
        match_score = float(round(max(0.01, score_target_pos), 2))
        if neg_type == "vehicle":
            reason = "Uploaded image appears to be a photograph of a vehicle rather than the reported civic issue."
        elif neg_type == "book":
            reason = "Uploaded image appears to be a book or printed document rather than the reported civic problem."
        elif neg_type == "portrait":
            reason = "Uploaded image appears to be a portrait/selfie photograph rather than municipal infrastructure."
        elif neg_type == "indoor":
            reason = "Uploaded image depicts an indoor room rather than outdoor municipal infrastructure."
        elif neg_type == "food":
            reason = "Uploaded image appears to be food or a meal rather than a civic complaint."
        else:
            reason = f"Uploaded image does not match the reported category of {target_category}."

    # Case 2: Cross-Category Civic Mismatch (e.g. uploaded pothole under Street Lights or Garbage)
    elif best_class.startswith("other_civic:") and score_other_civic > score_target_pos * 2.0:
        other_cat = best_class.split(":")[1]
        status = "mismatch_detected"
        match_score = float(round(max(0.02, score_target_pos), 2))
        reason = f"Mismatch detected: The uploaded photograph appears to show an issue related to {other_cat} rather than {target_category}."

    # Case 3: Counter/Absence of Issue (e.g. Pothole reported, but image shows clean smooth road)
    elif score_target_counter > score_target_pos * 1.5 and score_target_counter > 0.40:
        status = "mismatch_detected"
        match_score = float(round(max(0.05, score_target_pos), 2))
        reason = f"The uploaded image shows normal, intact conditions without the reported {target_category.lower()} problem."

    # Case 4: Clear Positive Match
    elif score_target_pos >= 0.50 or (score_target_pos > score_other_civic and score_target_pos > score_negative and score_target_pos > score_target_counter):
        status = "matched"
        match_score = float(round(min(0.98, max(0.65, score_target_pos)), 2))
        reason = f"Uploaded photograph clearly shows evidence consistent with reported {target_category.lower()}."

    # Case 5: Ambiguous / Low confidence
    else:
        status = "needs_review"
        match_score = float(round(score_target_pos, 2))
        reason = f"The reported {target_category.lower()} issue cannot be confidently identified in the image; official inspection recommended."

    return VerificationResponse(
        success=True,
        status=status,
        match_score=match_score,
        reason=reason,
        category=target_category,
        details={
            "score_target_pos": float(round(score_target_pos, 3)),
            "score_target_counter": float(round(score_target_counter, 3)),
            "score_other_civic": float(round(score_other_civic, 3)),
            "score_negative": float(round(score_negative, 3)),
            "best_class": best_class,
            "best_prompt": best_prompt,
        }
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
