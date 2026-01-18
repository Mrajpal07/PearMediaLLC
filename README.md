# PearMedia AI

**AI-Powered Content Enhancement & Generation Platform**

![React](https://img.shields.io/badge/React-18.3-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-6.0-purple?logo=vite)
![Vercel](https://img.shields.io/badge/Vercel-Serverless-black?logo=vercel)
![Gemini](https://img.shields.io/badge/Google-Gemini_1.5-blue?logo=google)
![Puter](https://img.shields.io/badge/Puter-Scaling-orange)

---

## 📋 Table of Contents

- [Overview](#overview)
- [✨ Resilient Architecture](#-resilient-architecture)
- [Features](#features)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [API Documentation](#api-documentation)
- [Fallback Strategy](#fallback-strategy)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

PearMedia AI is a **production-grade** AI content platform designed for reliability and seamless user experience. It features intelligent fallback mechanisms to ensure users can **always** generate content, regardless of API outages or quota limits.

### **Core Workflows**

#### 1. **Text Workflow** ✍️
- **Enhance:** Transforms basic prompts into professional, detail-rich descriptions using GPT-4o-mini.
- **Analyze:** Detects intent, tone, and style.
- **Generate:** Creates high-quality images from the enhanced prompt.

#### 2. **Image Workflow** 🖼️
- **Vision Analysis:** Analyzes uploaded images (Objects, Style, Mood, Lighting) using **Google Gemini Vision**.
- **Generate Variations:** Creates new images inspired by the analysis.
- **Smart Fallback:** If backend AI fails, the browser takes over using **Puter.js** to complete the task for free.

---

## 🏗️ Resilient Architecture

PearMedia AI uses a **Multi-Provider Fallback Chain** to guarantee service availability.

```mermaid
graph TD
    User[User Request] --> API[Vercel Serverless Function]
    
    API -->|1. Try| Gemini[Google Gemini (Fast/Free)]
    Gemini -->|Success| Return[Return Image]
    Gemini -->|Fail/Quota| Clipdrop[Clipdrop API]
    
    Clipdrop -->|Success| Return
    Clipdrop -->|Fail| HF[Hugging Face (FLUX.1)]
    
    HF -->|Success| Return
    HF -->|Fail| OpenAI[OpenAI / Together (Optional)]
    
    OpenAI -->|Fail| Error[Return 503 Error]
    
    Error -->|Trigger| Frontend[Frontend Client]
    Frontend -->|Ultimate Backup| Puter[Puter.js (Client-Side)]
    Puter -->|Success| Render[Render Result]
```

### **Tech Stack**

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite 6 | High-performance responsive UI |
| **Backend** | Vercel Serverless | Auto-scaling API endpoints |
| **Primary AI** | **Google Gemini 1.5** | Vision Analysis & High-Speed Generation |
| **Secondary AI** | **Clipdrop (Stability)** | High-quality SDXL generation |
| **Fallback AI** | **Hugging Face** | FLUX.1-dev model via Inference API |
| **Safety Net** | **Puter.js** | Client-side cloud integration for $0 cost usage |

---

## ✨ Features

✅ **Indestructible Image Pipeline**
   - Automatically switches providers if one is down or rate-limited.
   - **Gemini > Clipdrop > Hugging Face > OpenAI > Puter.js**

✅ **Smart Vision Analysis**
   - Uses **Gemini 1.5 Flash** (or Pro) to detailedly analyze images.
   - robustly parses JSON for structured data (Objects, Style, Mood).
   - Falls back to OpenAI Vision if Gemini is unavailable.

✅ **Text Enhancement Engine**
   - intelligently expands simple ideas into prompts optimized for DALL-E 3/FLUX.
   - Provides side-by-side comparison of original vs. enhanced text.

✅ **Modern UX/UI**
   - **Glassmorphism Design**: Sleek, modern aesthetic.
   - **Real-time Status**: Users know exactly what the AI is doing.
   - **Responsive**: Works perfectly on mobile and desktop.

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+
- At least **ONE** API Key (Gemini Recommended)

### **Installation**

```bash
# 1. Clone the repository
git clone https://github.com/Mrajpal07/PearMediaLLC.git
cd PearMedia

# 2. Install dependencies
npm install

# 3. Setup Environment
cp .env.example .env.local
```

### **Run Locally**

```bash
# Start Frontend + Backend (requires Vercel CLI)
vercel dev

# OR Start Frontend Only (Mock Mode)
npm run dev
```

---

## ⚙️ Environment Configuration

You do **NOT** need all keys. The system auto-detects what you have.

### **Recommended Setup (Best Performance)**

```bash
# .env.local

# 1. Google Gemini (Primary - Fast & Free Tier)
GOOGLE_API_KEY=AIzaSy...

# 2. Clipdrop (High Quality Fallback)
CLIPDROP_API_KEY=a1b2...

# 3. Hugging Face (Backup)
HUGGINGFACE_API_KEY=hf_...
```

### **Optional / Legacy**

```bash
# OpenAI (Expensive but reliable)
OPENAI_API_KEY=sk-...

# Together.ai (Fast FLUX)
TOGETHER_API_KEY=...
```

---

## 📚 API Documentation

### **1. POST `/api/generate-image`**
Generates images using the best available provider.

**Request:**
```json
{
  "prompt": "A futuristic city with flying cars",
  "style": "cinematic"
}
```

**Response:**
```json
{
  "images": ["data:image/png;base64,..."]
}
```

### **2. POST `/api/analyze-image`**
Analyzes an uploaded image using Vision models.

**Request:**
```json
{
  "imageBase64": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "analysis": {
    "objects": ["Car", "Building"],
    "style": "Cyberpunk",
    "mood": "Energetic",
    "lighting": "Neon"
  },
  "suggestedPrompt": "A cyberpunk city..."
}
```

---

## 🛡️ Fallback Strategy

PearMedia AI implements a **"User-Pays" Hybrid Strategy**:

1.  **Server-Side (Fastest):** We try to generate the image on the server using your configured API keys (Gemini, Clipdrop, etc.).
2.  **Client-Side (Free):** If the server fails (e.g., Quota Exceeded, 503 Error), the frontend catches the error.
3.  **Puter.js Takeover:** The browser seamlessly connects to **Puter.js**, a cloud OS that provides free AI generation tokens to the *user*.
    *   *Result:* The user gets their image even if your server keys are dead.

---

## 🌐 Deployment

### **Vercel (Recommended)**

1.  Push to GitHub.
2.  Import project in Vercel.
3.  Add your Environment Variables in Settings.
4.  **Deploy!**

API Routes are automatically handled as Serverless Functions.

---

## 🔧 Troubleshooting

### **"Model not found" (Gemini)**
We use a robust model-switcher (`gemini-1.5-flash-001`, `gemini-1.5-flash-latest`, `gemini-2.0-flash-exp`). The system will automatically find a working model version for your region/key.

### **Images taking too long?**
- Gemini is usually fastest (3-5s).
- Hugging Face Cold Starts can take 20s+.
- Recommend adding `CLIPDROP_API_KEY` for instant results.

### **Quota Exceeded?**
Don't worry! The system will automatically fall back to the next provider, eventually using Puter.js on the client side.

---
© 2026 PearMedia AI | Built for Scale
