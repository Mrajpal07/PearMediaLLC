# PearMedia AI

**AI-Powered Content Enhancement & Generation Platform**

![React](https://img.shields.io/badge/React-18.3-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-6.0-purple?logo=vite)
![Vercel](https://img.shields.io/badge/Vercel-Serverless-black?logo=vercel)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-green?logo=openai)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Data Flow Diagrams](#data-flow-diagrams)
- [Features](#features)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Environment Configuration](#environment-configuration)
- [Deployment](#deployment)
- [Cost Analysis](#cost-analysis)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## 🎯 Overview

PearMedia AI is a production-ready AI content platform featuring two intelligent workflows:

### **Text Workflow** (4 Steps)
1. **Input** — User enters a basic text prompt
2. **Analyze** — AI analyzes intent, tone, and style
3. **Approve** — User reviews enhanced prompt
4. **Generate** — Creates images using AI

### **Image Workflow** (3 Steps)
1. **Upload** — User uploads an image (drag & drop or file picker)
2. **Analyze** — AI analyzes image using vision models
3. **Generate** — Creates variations based on analysis

**Status:** ✅ Production-ready with **provider-agnostic** API integration

### **Supported LLM Providers**

PearMedia AI works with **any OpenAI-compatible API**:

- ✅ **OpenAI** (GPT-4o, DALL-E 3) — Best quality, recommended for production
- ✅ **Hugging Face** (Llama, FLUX, SDXL) — Free tier available, great for development
- ✅ **Azure OpenAI** — Enterprise-grade with SLA
- ✅ **Together.ai, Anyscale** — Cost-effective alternatives
- ✅ **Self-hosted** (LiteLLM, Ollama) — Full control

**See [PROVIDER_SETUP.md](PROVIDER_SETUP.md) for detailed configuration guides.**

---

## 🏗️ Architecture

### **System Components**

```
┌─────────────────────────────────────────────────────────────┐
│                        React Frontend                        │
│  ┌──────────────────┐          ┌──────────────────┐         │
│  │  TextWorkflow    │          │  ImageWorkflow   │         │
│  │  Component       │          │  Component       │         │
│  └──────────────────┘          └──────────────────┘         │
└─────────────────┬───────────────────────┬───────────────────┘
                  │                       │
                  │   HTTPS/JSON          │
                  │                       │
┌─────────────────▼───────────────────────▼───────────────────┐
│              Vercel Serverless Functions                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ enhance-text │  │analyze-image │  │generate-image│      │
│  │    .js       │  │    .js       │  │    .js       │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          │   OpenAI API     │   OpenAI API     │   OpenAI API
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼─────────────┐
│                     OpenAI Platform                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ GPT-4o-mini  │  │   GPT-4o     │  │  DALL-E 3    │      │
│  │ (Text Enh.)  │  │  (Vision)    │  │ (Generation) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

### **Tech Stack**

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite 6 | Fast, modern UI with HMR |
| **Styling** | Vanilla CSS | Custom design system with glassmorphism |
| **Backend** | Vercel Serverless Functions | Scalable, auto-scaling API endpoints |
| **AI - Text Enhancement** | OpenAI GPT-4o-mini | Prompt analysis and enhancement |
| **AI - Vision** | OpenAI GPT-4o | Image analysis and description |
| **AI - Generation** | OpenAI DALL-E 3 | High-quality image generation |
| **Deployment** | Vercel | Edge network with global CDN |

---

## 🔄 Data Flow Diagrams

### **Text Workflow Data Flow**

```
┌──────────────┐
│  User Input  │  "a cat on a windowsill"
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Frontend: TextWorkflow.jsx                              │
│  - handleEnhance()                                       │
│  - Sends: { prompt: "a cat on a windowsill" }           │
└──────┬───────────────────────────────────────────────────┘
       │ POST /api/enhance-text
       ▼
┌──────────────────────────────────────────────────────────┐
│  API: enhance-text.js                                    │
│  1. Validate input (required, length < 5000)             │
│  2. Build system prompt for image generation             │
│  3. Call OpenAI GPT-4o-mini                              │
│  4. Parse structured JSON response                       │
└──────┬───────────────────────────────────────────────────┘
       │ OpenAI API Call
       ▼
┌──────────────────────────────────────────────────────────┐
│  OpenAI: GPT-4o-mini                                     │
│  Temperature: 0.7                                        │
│  Response Format: JSON                                   │
│  Output:                                                 │
│  {                                                       │
│    "analysis": {                                         │
│      "intent": "Create cozy cat scene",                  │
│      "tone": "peaceful, contemplative",                  │
│      "style": "photorealistic, warm lighting"            │
│    },                                                    │
│    "enhancedPrompt": "A fluffy tabby cat with green..."  │
│  }                                                       │
└──────┬───────────────────────────────────────────────────┘
       │ Return to frontend
       ▼
┌──────────────────────────────────────────────────────────┐
│  Frontend: Display Analysis                              │
│  - Show intent, tone, style cards                        │
│  - Compare original vs enhanced prompt                   │
│  - User approves → Step 3                                │
└──────┬───────────────────────────────────────────────────┘
       │ User approves
       ▼
┌──────────────────────────────────────────────────────────┐
│  Frontend: handleGenerate()                              │
│  Sends: {                                                │
│    prompt: "A fluffy tabby cat with green...",           │
│    style: "photorealistic, warm lighting"                │
│  }                                                       │
└──────┬───────────────────────────────────────────────────┘
       │ POST /api/generate-image
       ▼
┌──────────────────────────────────────────────────────────┐
│  API: generate-image.js                                  │
│  1. Validate prompt (required, length < 4000)            │
│  2. Apply style modifier if provided                     │
│  3. Generate images sequentially (DALL-E 3: n=1)         │
│  4. Return array of image URLs                           │
└──────┬───────────────────────────────────────────────────┘
       │ OpenAI DALL-E 3 API
       ▼
┌──────────────────────────────────────────────────────────┐
│  OpenAI: DALL-E 3                                        │
│  Model: dall-e-3                                         │
│  Size: 1024x1024                                         │
│  Quality: standard                                       │
│  Loops: IMAGE_COUNT times (default: 2)                   │
│  Returns: [url1, url2]                                   │
└──────┬───────────────────────────────────────────────────┘
       │ Return to frontend
       ▼
┌──────────────────────────────────────────────────────────┐
│  Frontend: Display Generated Images                      │
│  - Render image grid                                     │
│  - Show prompt used                                      │
│  - Options: Regenerate or Start New                      │
└──────────────────────────────────────────────────────────┘
```

### **Image Workflow Data Flow**

```
┌──────────────┐
│ User Uploads │  image.jpg (< 5MB)
│    Image     │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Frontend: ImageWorkflow.jsx                             │
│  - FileReader converts to base64 data URL                │
│  - Preview displayed to user                             │
│  - User clicks "Analyze Image"                           │
└──────┬───────────────────────────────────────────────────┘
       │ POST /api/analyze-image
       │ Sends: { imageBase64: "data:image/png;base64,..." }
       ▼
┌──────────────────────────────────────────────────────────┐
│  API: analyze-image.js                                   │
│  1. Validate exactly one of imageUrl OR imageBase64      │
│  2. Validate base64 format (data:image/...)              │
│  3. Check size limit (< 27MB string = ~20MB image)       │
│  4. Call OpenAI GPT-4o Vision                            │
└──────┬───────────────────────────────────────────────────┘
       │ OpenAI Vision API
       ▼
┌──────────────────────────────────────────────────────────┐
│  OpenAI: GPT-4o (Vision)                                 │
│  Model: gpt-4o                                           │
│  Image Detail: high                                      │
│  Response Format: JSON                                   │
│  Output:                                                 │
│  {                                                       │
│    "analysis": {                                         │
│      "objects": ["cat", "windowsill", "curtains"],       │
│      "style": "Photorealistic photography",              │
│      "mood": "Peaceful, contemplative",                  │
│      "lighting": "Warm golden hour sunlight"             │
│    },                                                    │
│    "suggestedPrompt": "A fluffy tabby cat sitting..."    │
│  }                                                       │
└──────┬───────────────────────────────────────────────────┘
       │ Return to frontend
       ▼
┌──────────────────────────────────────────────────────────┐
│  Frontend: Display Analysis Results                      │
│  - Show detected objects                                 │
│  - Display style, mood, lighting                         │
│  - Show suggested prompt                                 │
│  - User clicks "Generate Variations"                     │
└──────┬───────────────────────────────────────────────────┘
       │ POST /api/generate-image
       │ Sends: { prompt: suggestedPrompt, style: analysis.style }
       ▼
┌──────────────────────────────────────────────────────────┐
│  API: generate-image.js                                  │
│  (Same flow as Text Workflow → Generate)                 │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Frontend: Display Generated Variations                  │
│  - Render variations grid                                │
│  - Show original image + variations                      │
│  - Options: Regenerate or Start New                      │
└──────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### **Implemented**

✅ **Text Prompt Enhancement**
  - AI-powered prompt analysis (intent, tone, style)
  - Side-by-side comparison (original vs enhanced)
  - Professional image generation prompts
  - GPT-4o-mini integration with structured output

✅ **Image Analysis**
  - Object detection and classification
  - Style and mood analysis
  - Lighting condition detection
  - Suggested prompt generation
  - Supports both URL and base64 upload

✅ **AI Image Generation**
  - DALL-E 3 integration (1024x1024, standard quality)
  - Configurable image count (1-3 images)
  - Style modifiers (realistic, cinematic, anime, etc.)
  - Sequential generation for quality consistency

✅ **Production-Ready Backend**
  - Comprehensive input validation
  - Security headers (XSS, clickjacking protection)
  - Structured error handling (400, 405, 415, 500, 502)
  - Environment-based configuration

✅ **Modern UI/UX**
  - Dark theme with glassmorphism design
  - Multi-step workflows with progress indicators
  - Loading states and status messages
  - Responsive design (mobile-friendly)
  - Smooth animations and transitions

---

## 🚀 Quick Start

### **Prerequisites**

- Node.js 18+ and npm
- LLM API key from one of:
  - [OpenAI](https://platform.openai.com/api-keys) (recommended for production)
  - [Hugging Face](https://huggingface.co/settings/tokens) (free tier available)
  - Azure OpenAI, Together.ai, or any OpenAI-compatible API
- Git

### **Installation**

```bash
# Clone the repository
git clone https://github.com/Mrajpal07/PearMediaLLC.git
cd PearMedia

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Add your OpenAI API key to .env.local
# OPENAI_API_KEY=sk-proj-...

# Start development server (frontend only)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### **Testing Serverless Functions Locally**

The Vite dev server does **not** run serverless functions. To test the full stack locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Run with serverless functions
vercel dev
```

This starts the frontend at [http://localhost:3000](http://localhost:3000) with working API routes.

---

## 📚 API Documentation

### **Base URL**

- **Production:** `https://your-app.vercel.app/api`
- **Local (Vercel CLI):** `http://localhost:3000/api`

All endpoints accept `POST` requests with `Content-Type: application/json`.

---

### **POST `/api/enhance-text`**

Analyzes a user prompt and enhances it for optimal image generation.

#### **Request**

```json
{
  "prompt": "a cat on a windowsill"
}
```

**Validation:**
- `prompt` (required, string, 1-5000 characters)

#### **Response** (200 OK)

```json
{
  "analysis": {
    "intent": "Create an image of a cat in a cozy indoor setting",
    "tone": "Peaceful and contemplative",
    "style": "Photorealistic with natural lighting and warm atmosphere"
  },
  "enhancedPrompt": "A fluffy tabby cat with green eyes sits gracefully on a sunlit wooden windowsill, warm golden hour lighting streaming through sheer white curtains, soft bokeh background of an outdoor garden, photorealistic style, shallow depth of field, cozy domestic interior, soft shadows, peaceful contemplative mood, 8k detail"
}
```

#### **Error Responses**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `Missing required field: prompt` | No prompt provided |
| 400 | `Prompt cannot be empty.` | Empty or whitespace-only prompt |
| 400 | `Prompt too long. Maximum 5,000 characters allowed.` | Exceeds length limit |
| 405 | `Method not allowed. Use POST.` | Wrong HTTP method |
| 415 | `Unsupported Media Type. Use application/json.` | Wrong Content-Type header |
| 500 | `Server configuration error. API key not configured.` | Missing `OPENAI_API_KEY` |
| 502 | `Failed to connect to AI service. Please try again.` | OpenAI API unavailable |

#### **Implementation Details**

- **Model:** GPT-4o-mini
- **Temperature:** 0.7 (balanced creativity)
- **Max Tokens:** 1000
- **Response Format:** JSON object (structured output)
- **Average Latency:** 2-4 seconds
- **Cost:** ~$0.0002 per request

---

### **POST `/api/analyze-image`**

Analyzes an image using GPT-4o Vision and generates a suggested prompt.

#### **Request** (Option 1: URL)

```json
{
  "imageUrl": "https://example.com/image.jpg"
}
```

#### **Request** (Option 2: Base64)

```json
{
  "imageBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**Validation:**
- Provide **exactly one** of `imageUrl` OR `imageBase64` (not both)
- `imageUrl`: Valid HTTP/HTTPS URL
- `imageBase64`: Valid data URL format (`data:image/(png|jpeg|jpg|gif|webp);base64,...`)
- Maximum size: ~20MB (base64 string < 27MB)

#### **Response** (200 OK)

```json
{
  "analysis": {
    "objects": ["cat", "windowsill", "wooden surface", "curtains", "outdoor view"],
    "style": "Photorealistic, natural photography",
    "mood": "Peaceful, contemplative, serene",
    "lighting": "Warm golden hour sunlight, soft natural light from window"
  },
  "suggestedPrompt": "A fluffy tabby cat with green eyes sitting on a wooden windowsill, warm golden hour sunlight streaming through sheer curtains, soft outdoor garden background with bokeh effect, photorealistic style, shallow depth of field, peaceful contemplative mood, natural lighting, cozy domestic scene, 8k detail"
}
```

#### **Error Responses**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `Missing required field: provide either imageUrl or imageBase64` | Neither field provided |
| 400 | `Provide only one of imageUrl or imageBase64, not both.` | Both fields provided |
| 400 | `Invalid imageUrl. Must be a valid HTTP/HTTPS URL.` | Malformed URL |
| 400 | `Invalid imageBase64. Must be a valid data URL (...)` | Wrong base64 format |
| 400 | `Could not process the provided image. Please check...` | Corrupted or invalid image |
| 500 | `Server configuration error. API key not configured.` | Missing `OPENAI_API_KEY` |
| 502 | `Failed to connect to Vision API. Please try again.` | OpenAI API unavailable |

#### **Implementation Details**

- **Model:** GPT-4o (Vision)
- **Image Detail:** High
- **Temperature:** 0.7
- **Max Tokens:** 1000
- **Response Format:** JSON object
- **Average Latency:** 4-8 seconds
- **Cost:** ~$0.0043 per request (varies by image size)

---

### **POST `/api/generate-image`**

Generates images using OpenAI DALL-E 3 based on a prompt.

#### **Request**

```json
{
  "prompt": "A fluffy tabby cat with green eyes sits gracefully on a sunlit wooden windowsill...",
  "style": "cinematic"
}
```

**Validation:**
- `prompt` (required, string, 1-4000 characters)
- `style` (optional, string) — Supported values: `realistic`, `cinematic`, `anime`, `oil painting`, `watercolor`, `digital art`, `sketch`, `3d render`, or custom

#### **Response** (200 OK)

```json
{
  "images": [
    "https://oaidalleapiprodscus.blob.core.windows.net/private/org-...",
    "https://oaidalleapiprodscus.blob.core.windows.net/private/org-..."
  ]
}
```

**Notes:**
- Image URLs are temporary (expire after ~1 hour)
- Number of images controlled by `IMAGE_COUNT` env var (default: 2)
- Images are 1024x1024 PNG format

#### **Error Responses**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `Missing required field: prompt` | No prompt provided |
| 400 | `Prompt cannot be empty.` | Empty prompt |
| 400 | `Prompt too long. Maximum 4,000 characters allowed.` | Exceeds limit |
| 400 | `Prompt violates content policy. Please modify...` | Content policy violation |
| 500 | `Server configuration error. API key not configured.` | Missing `OPENAI_API_KEY` |
| 502 | `Failed to generate images. Please try again.` | OpenAI API error |

#### **Implementation Details**

- **Model:** DALL-E 3
- **Size:** 1024x1024
- **Quality:** Standard
- **Images per Request:** 1-3 (configurable via `IMAGE_COUNT`)
- **Generation Method:** Sequential (DALL-E 3 limitation: n=1)
- **Average Latency:**
  - 1 image: 10-15 seconds
  - 2 images: 20-30 seconds
  - 3 images: 30-45 seconds
- **Cost:** $0.040 per image (~$0.080 for 2 images)

#### **Style Modifiers**

Styles are appended to prompts as suffixes:

| Style | Modifier Applied |
|-------|------------------|
| `realistic` | `, photorealistic quality` |
| `cinematic` | `, cinematic lighting and composition` |
| `anime` | `, anime art style` |
| `oil painting` | `, oil painting style` |
| `watercolor` | `, watercolor painting style` |
| `digital art` | `, digital art style` |
| `sketch` | `, pencil sketch style` |
| `3d render` | `, 3D rendered style` |
| Custom | `, {style} style` |

---

## ⚙️ Environment Configuration

PearMedia AI supports **any OpenAI-compatible LLM provider** including OpenAI, Hugging Face, Azure OpenAI, and more.

### **Required Variables**

Create a `.env.local` file (local) or set in Vercel Dashboard (production):

```bash
# Required: LLM API Key (works with any provider)
# OpenAI: sk-proj-...
# Hugging Face: hf_...
# Azure/Others: your-api-key
OPENAI_API_KEY=your-api-key-here
```

### **Optional Variables**

```bash
# Optional: Custom API endpoint (supports any OpenAI-compatible provider)
# Default: https://api.openai.com/v1
# Examples:
#   - OpenAI: https://api.openai.com/v1
#   - Hugging Face: https://api-inference.huggingface.co/v1
#   - Azure: https://YOUR_RESOURCE.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT
#   - Together.ai: https://api.together.xyz/v1
OPENAI_BASE_URL=https://api.openai.com/v1

# Optional: Model for text enhancement
# Default: gpt-4o-mini
# Examples:
#   - OpenAI: gpt-4o-mini, gpt-4o, gpt-3.5-turbo
#   - Hugging Face: meta-llama/Meta-Llama-3.1-70B-Instruct
OPENAI_MODEL=gpt-4o-mini

# Optional: Model for image analysis (vision)
# Default: gpt-4o
# Examples:
#   - OpenAI: gpt-4o, gpt-4-vision-preview
#   - Hugging Face: llava-hf/llava-v1.6-mistral-7b-hf
VISION_MODEL=gpt-4o

# Optional: Model for image generation
# Default: dall-e-3
# Examples:
#   - OpenAI: dall-e-3, dall-e-2
#   - Hugging Face: black-forest-labs/FLUX.1-dev, stabilityai/stable-diffusion-xl-base-1.0
IMAGE_MODEL=dall-e-3

# Optional: Number of images to generate (1-10, depends on provider)
# Default: 2
IMAGE_COUNT=2

# Optional: Enable Hugging Face compatibility mode
# Default: false
USE_HUGGINGFACE=false
```

### **Getting an API Key**

#### OpenAI (Recommended for Production)
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy and save the key (starts with `sk-proj-...`)

#### Hugging Face (Free Tier Available)
1. Visit [Hugging Face](https://huggingface.co/)
2. Sign up or log in
3. Navigate to [Settings → Access Tokens](https://huggingface.co/settings/tokens)
4. Click "New token" → Select "Read" permissions
5. Copy and save the token (starts with `hf_...`)

**For detailed setup with Hugging Face, Azure OpenAI, and other providers, see [PROVIDER_SETUP.md](PROVIDER_SETUP.md)**

**Important:** Never commit API keys to version control. Always use environment variables.

---

## 🌐 Deployment

### **Deploy to Vercel (Recommended)**

#### **Option 1: GitHub Integration (Recommended)**

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. Visit [Vercel Dashboard](https://vercel.com/new)

3. Click "Import Project" → Select your repository

4. Configure Environment Variables:
   - Navigate to **Settings** → **Environment Variables**
   - Add `OPENAI_API_KEY` with your API key
   - Add optional variables if needed

5. Click "Deploy"

6. Vercel will:
   - Auto-detect Vite configuration
   - Build the frontend (`npm run build`)
   - Deploy serverless functions from `/api` directory
   - Provide a production URL (e.g., `https://your-app.vercel.app`)

#### **Option 2: Vercel CLI**

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# Deploy to production
vercel --prod
```

### **Environment Variables in Vercel**

Set these in the Vercel Dashboard under **Settings** → **Environment Variables**:

| Variable | Value | Environment |
|----------|-------|-------------|
| `OPENAI_API_KEY` | `sk-proj-...` | Production, Preview, Development |
| `IMAGE_COUNT` | `2` (optional) | Production, Preview |

**Important:** After adding environment variables, redeploy the project for changes to take effect.

---

### **Custom Domain (Optional)**

1. Go to **Settings** → **Domains** in Vercel Dashboard
2. Add your custom domain (e.g., `pearmedia.ai`)
3. Follow DNS configuration instructions
4. Vercel automatically provisions SSL certificates

---

### **Deployment Checklist**

Before deploying to production:

- [ ] Set `OPENAI_API_KEY` in Vercel environment variables
- [ ] Test all three API endpoints locally with `vercel dev`
- [ ] Verify build succeeds: `npm run build`
- [ ] Check bundle size: `dist/assets/*.js` should be < 200KB (gzipped)
- [ ] Remove any console.logs or debug code
- [ ] Update `README.md` with production URL
- [ ] Configure custom domain (optional)
- [ ] Enable Vercel Analytics (optional, free tier available)
- [ ] Set up monitoring/alerting (Sentry, LogRocket, etc.)

---

## 💰 Cost Analysis

### **OpenAI API Pricing** (as of 2024)

| Service | Model | Cost | Usage |
|---------|-------|------|-------|
| **Text Enhancement** | GPT-4o-mini | $0.15/1M input tokens<br>$0.60/1M output tokens | ~150 input + 300 output tokens per request<br>≈ **$0.0002 per request** |
| **Image Analysis** | GPT-4o (Vision) | $2.50/1M input tokens<br>$10.00/1M output tokens | ~1000 input (image) + 300 output tokens<br>≈ **$0.0043 per request** |
| **Image Generation** | DALL-E 3 (1024x1024, standard) | $0.040 per image | 2 images default<br>≈ **$0.080 per request** |

### **Example Monthly Cost**

**Scenario:** 1000 users/month, each:
- Enhances 2 text prompts
- Analyzes 1 image
- Generates 2 image sets (4 images total)

| Operation | Requests | Cost per Request | Total Cost |
|-----------|----------|------------------|------------|
| Text Enhancement | 2,000 | $0.0002 | $0.40 |
| Image Analysis | 1,000 | $0.0043 | $4.30 |
| Image Generation | 4,000 images | $0.040/image | $160.00 |
| **Monthly Total** | | | **$164.70** |

### **Cost Optimization Tips**

1. **Set `IMAGE_COUNT=1`** for faster responses and 50% cost reduction
2. **Implement caching** for frequently analyzed images
3. **Add rate limiting** to prevent abuse (e.g., 10 requests/hour per IP)
4. **Use DALL-E 2** for cheaper, faster generation (lower quality)
5. **Monitor token usage** via OpenAI dashboard

---

### **OpenAI Rate Limits** (Free Tier)

| API | Limit | Notes |
|-----|-------|-------|
| GPT-4o-mini | 30,000 tokens/min | ~200 requests/min |
| GPT-4o (Vision) | 30,000 tokens/min | ~30 requests/min |
| DALL-E 3 | 5 images/min<br>100 images/day | Upgrade to Tier 1+ for higher limits |

**Recommendation:** Implement server-side rate limiting to stay within OpenAI limits:
- `/api/enhance-text`: 10 req/min per IP
- `/api/analyze-image`: 5 req/min per IP
- `/api/generate-image`: 2 req/min per IP

---

## 🔒 Security

### **Implemented Security Measures**

✅ **API Key Protection**
  - API keys stored in environment variables (never in code)
  - Keys not exposed to frontend
  - Server-side only access

✅ **Input Validation**
  - Request method enforcement (POST only)
  - Content-Type validation (`application/json`)
  - Field type checking (string, number, etc.)
  - Length limits (5000 chars for prompts, 4000 for generation)
  - Base64 format validation for images
  - URL validation for image URLs

✅ **Security Headers**
  - `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
  - `X-Frame-Options: DENY` (prevents clickjacking)
  - `Referrer-Policy: strict-origin-when-cross-origin`

✅ **Error Handling**
  - No sensitive data in error messages
  - Consistent error response format
  - Proper HTTP status codes

✅ **Content Policy**
  - OpenAI content policy enforcement
  - User-friendly violation messages

---

### **Recommended for Production**

⚠️ **Rate Limiting**
  - Implement per-IP or per-user rate limits
  - Use Upstash Redis or Vercel KV for distributed rate limiting
  - Example: [upstash-ratelimit](https://github.com/upstash/ratelimit)

⚠️ **Request Timeouts**
  - Add 8-10 second timeouts to fetch calls
  - Graceful timeout error messages

⚠️ **Monitoring & Logging**
  - Integrate Sentry for error tracking
  - Use Vercel Analytics for usage metrics
  - Log API failures (without exposing keys)

⚠️ **CORS Configuration**
  - Set up CORS if frontend on different domain
  - Whitelist specific origins only

⚠️ **Prompt Injection Protection**
  - Sanitize user prompts for malicious instructions
  - Use OpenAI's moderation API for flagged content

⚠️ **Image Size Limits**
  - Enforce file size limits client-side (< 5MB)
  - Reject oversized uploads server-side

⚠️ **Authentication** (if needed)
  - Add user authentication (NextAuth.js, Clerk, etc.)
  - Track usage per user for billing

---

## 🛠️ Troubleshooting

### **Common Issues**

#### **Issue: "Server configuration error. API key not configured."**

**Cause:** `OPENAI_API_KEY` environment variable not set

**Solution:**
1. **Local Development:**
   - Create `.env.local` file in project root
   - Add `OPENAI_API_KEY=sk-proj-...`
   - Restart `vercel dev`

2. **Production (Vercel):**
   - Go to Vercel Dashboard → **Settings** → **Environment Variables**
   - Add `OPENAI_API_KEY` with your key
   - Redeploy the project

---

#### **Issue: "Failed to generate images. Please try again."**

**Causes:**
- OpenAI API is down
- Rate limit exceeded
- Invalid API key
- Vercel function timeout (10s on Hobby plan)

**Solutions:**
1. Check [OpenAI Status Page](https://status.openai.com/)
2. Wait 1 minute if rate limited
3. Verify API key is correct (test with curl)
4. Reduce `IMAGE_COUNT` to 1 for faster generation
5. Upgrade to Vercel Pro for 60s timeout

---

#### **Issue: Images take too long to generate**

**Cause:** DALL-E 3 generates sequentially (1 image at a time)

**Solution:**
- Set `IMAGE_COUNT=1` in environment variables (10-15s per request)
- Or switch to DALL-E 2 (supports n>1, but lower quality)
- Default IMAGE_COUNT=2 takes 20-30 seconds

---

#### **Issue: API endpoints return 404 Not Found**

**Cause:** API routes not detected by Vercel

**Solution:**
1. Ensure `/api` directory is at project root
2. Verify `vercel.json` exists with `{"version": 2}`
3. Check file naming: `enhance-text.js` (kebab-case)
4. Redeploy the project

---

#### **Issue: "Prompt violates content policy"**

**Cause:** OpenAI safety system flagged the prompt

**Solution:**
- Modify the prompt to remove potentially harmful content
- Avoid violence, hate speech, explicit content
- Check [OpenAI Usage Policies](https://openai.com/policies/usage-policies)

---

#### **Issue: Frontend can't connect to API in development**

**Cause:** Using `npm run dev` instead of `vercel dev`

**Solution:**
- Use `vercel dev` to run both frontend and serverless functions
- Or deploy to Vercel and test against production URL

---

### **Debugging Tips**

**1. Check Vercel Function Logs:**
- Go to Vercel Dashboard → **Deployments** → Select deployment
- Click on **Functions** tab → View logs
- Look for errors in serverless function execution

**2. Test APIs with curl:**
```bash
# Test enhance-text
curl -X POST https://your-app.vercel.app/api/enhance-text \
  -H "Content-Type: application/json" \
  -d '{"prompt": "a cat on a windowsill"}'

# Test generate-image
curl -X POST https://your-app.vercel.app/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A fluffy cat...", "style": "cinematic"}'
```

**3. Check OpenAI Dashboard:**
- Visit [OpenAI Usage Dashboard](https://platform.openai.com/usage)
- Verify API calls are going through
- Check token usage and costs

---

## 🧪 Testing

### **Manual Testing**

**1. Test Text Workflow:**
```bash
# 1. Enhance text
curl -X POST http://localhost:3000/api/enhance-text \
  -H "Content-Type: application/json" \
  -d '{"prompt": "a sunset over mountains"}'

# Expected: JSON with analysis and enhancedPrompt

# 2. Generate images
curl -X POST http://localhost:3000/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A stunning sunset over snow-capped mountains...", "style": "cinematic"}'

# Expected: JSON with images array
```

**2. Test Image Workflow:**
```bash
# Analyze image (URL)
curl -X POST http://localhost:3000/api/analyze-image \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://example.com/cat.jpg"}'

# Expected: JSON with analysis and suggestedPrompt
```

### **Edge Cases to Test**

```bash
# Empty prompt
curl -X POST http://localhost:3000/api/enhance-text \
  -H "Content-Type: application/json" \
  -d '{"prompt": ""}'
# Expected: 400 error

# Missing field
curl -X POST http://localhost:3000/api/enhance-text \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 400 error

# Wrong method
curl -X GET http://localhost:3000/api/enhance-text
# Expected: 405 error

# Both imageUrl and imageBase64 provided
curl -X POST http://localhost:3000/api/analyze-image \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://...", "imageBase64": "data:..."}'
# Expected: 400 error
```

---

## 📁 Project Structure

```
PearMedia/
├── api/                                # Vercel Serverless Functions
│   ├── enhance-text.js                 # GPT-4o-mini text enhancement
│   ├── analyze-image.js                # GPT-4o Vision image analysis
│   └── generate-image.js               # DALL-E 3 image generation
├── src/
│   ├── components/
│   │   ├── TextWorkflow.jsx            # 4-step text workflow component
│   │   ├── TextWorkflow.css
│   │   ├── ImageWorkflow.jsx           # 3-step image workflow component
│   │   └── ImageWorkflow.css
│   ├── App.jsx                         # Main app with tab navigation
│   ├── App.css                         # App-level styles
│   ├── index.css                       # Design system & global styles
│   └── main.jsx                        # React entry point
├── dist/                               # Production build output (gitignored)
├── node_modules/                       # Dependencies (gitignored)
├── .env.local                          # Local environment variables (gitignored)
├── .env.example                        # Environment variable template
├── .gitignore                          # Git exclusions
├── API_IMPLEMENTATION.md               # Detailed API implementation guide
├── CLAUDE.md                           # AI assistant reference
├── index.html                          # HTML entry with SEO meta tags
├── package.json                        # Dependencies and scripts
├── package-lock.json                   # Dependency lockfile
├── README.md                           # This file
├── vercel.json                         # Vercel deployment config
└── vite.config.js                      # Vite build configuration
```

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server (frontend only, port 5173) |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint on source files |
| `vercel dev` | Run full stack locally (frontend + API, port 3000) |
| `vercel` | Deploy to Vercel preview environment |
| `vercel --prod` | Deploy to Vercel production |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
   ```bash
   git clone https://github.com/Mrajpal07/PearMediaLLC.git
   cd PearMedia
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow existing code style
   - Add comments for complex logic
   - Test thoroughly

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add amazing feature: description"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Describe what you changed and why
   - Reference any related issues

### **Development Guidelines**

- Use ESLint rules defined in the project
- Keep components focused and reusable
- Add proper error handling for all API calls
- Update documentation for API changes
- Test both success and error cases

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/Mrajpal07/PearMediaLLC/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Mrajpal07/PearMediaLLC/discussions)
- **Email:** support@pearmedia.ai (if applicable)

---

## 🔗 Links

- **Live Demo:** [https://your-app.vercel.app](https://your-app.vercel.app)
- **GitHub Repository:** [https://github.com/Mrajpal07/PearMediaLLC](https://github.com/Mrajpal07/PearMediaLLC)
- **OpenAI Platform:** [https://platform.openai.com/](https://platform.openai.com/)
- **Hugging Face:** [https://huggingface.co/](https://huggingface.co/)
- **Vercel Documentation:** [https://vercel.com/docs](https://vercel.com/docs)
- **API Implementation Guide:** [API_IMPLEMENTATION.md](API_IMPLEMENTATION.md)
- **Provider Setup Guide:** [PROVIDER_SETUP.md](PROVIDER_SETUP.md)
- **AI Assistant Reference:** [CLAUDE.md](CLAUDE.md)

---

## 🙏 Acknowledgments

- **OpenAI** for GPT-4o, GPT-4o-mini, and DALL-E 3 APIs
- **Vercel** for serverless infrastructure
- **React Team** for the amazing frontend framework
- **Vite** for blazing-fast build tooling

---

**Built with ❤️ by the PearMedia Team**

*Last Updated: 2026-01-18*
