# CivicVision – Citizen Complaint & Vision System

CivicVision is a civic complaint management platform connecting citizens with municipal authorities in Bengaluru, Karnataka. Citizens can report infrastructure and civic issues with auto-detected GPS location and photo uploads, while authorities can monitor, filter, update statuses, and review complaints.

Now featuring an **AI-Powered Complaint–Image Verification System** powered by OpenAI CLIP.

---

## Architecture Overview

1. **Frontend (`frontend/`)**: React 19 + Vite, Leaflet OpenStreetMap, Lucide icons, responsive card views.
2. **Backend API (`Server/`)**: Node.js & Express 5, MongoDB Atlas (Mongoose), Cloudinary photo streaming.
3. **AI Verification Microservice (`ai-service/`)**: Python FastAPI + PyTorch + Hugging Face Transformers (`openai/clip-vit-base-patch32`).

---

## AI-Powered Image Verification System

When a citizen submits a complaint with an image:
1. The image is securely streamed to Cloudinary.
2. The image buffer and reported civic category/title are forwarded to the Python AI service (`http://localhost:8000/verify`).
3. The CLIP model performs competitive multi-hypothesis cross-modal similarity matching across:
   - Target category civic issue prompts (e.g., potholes, overflowing dumpsters, pipe bursts).
   - Target category normal/intact counter-prompts (e.g., smooth undamaged road).
   - Cross-category civic prompts (e.g., detecting if a streetlight issue photo was submitted under potholes).
   - Non-civic negative prompts (vehicles, books, indoor furniture, selfies, food).
4. The result (`matched`, `mismatch_detected`, `needs_review`, or `verification_failed`) and confidence score are saved in MongoDB.
5. Verification status badges and explanation reasons are displayed on Citizen and Authority cards.
6. Authorities have an administrative override panel to manually approve or reject complaints after field inspection without deleting or altering citizen records.

---

## Getting Started

### 1. Python AI Microservice Setup (`ai-service`)

#### Prerequisites
- Python 3.10+ installed

#### Setup & Run
```bash
cd ai-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the AI microservice (runs on port 8000)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### Running AI Verification Tests
```bash
python test_verification.py
```
This runs 7 standard verification cases covering:
- Real pothole image under Roads & Infrastructure -> `matched`
- Clean road under Roads & Infrastructure -> `mismatch_detected`
- Car photo under Roads & Infrastructure -> `mismatch_detected`
- Book photo under Roads & Infrastructure -> `mismatch_detected`
- Garbage pile under Garbage & Sanitation -> `matched`
- Street lamp under Street Lights -> `matched`
- Pothole photo under Street Lights -> `mismatch_detected`

---

### 2. Node.js Backend Setup (`Server`)

```bash
cd Server

# Install dependencies
npm install

# Configure environment variables in Server/.env:
# PORT=5000
# MONGODB_URI=your_mongodb_atlas_uri
# JWT_SECRET=your_jwt_secret
# CLOUDINARY_CLOUD_NAME=dbaqcimmp
# CLOUDINARY_API_KEY=792833983991128
# CLOUDINARY_API_SECRET=V8_Yhm_Tb1_OeuuylMuN5IVMzvQ
# AI_SERVICE_URL=http://localhost:8000

# Seed realistic Bengaluru civic data (optional)
node seed.js

# Start server
npm run dev
```

---

### 3. Frontend Setup (`frontend`)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

---

## Demo Credentials

Click the one-click demo login buttons on the login page:
- **Authority**: `authority@civicvision.com` / `authority123`
- **Citizen**: `rahul@example.com` / `citizen123`
