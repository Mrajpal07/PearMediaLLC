# PearMedia AI - Project Reference

## Overview

PearMedia AI is an AI-powered content enhancement and generation platform built as a prototype. It provides two main workflows for text and image processing using AI capabilities.

**Tech Stack:**
- **Frontend:** React 18 + Vite 6
- **Styling:** Vanilla CSS with custom design system (dark theme, glassmorphism)
- **Backend:** Vercel Serverless Functions (Node.js)
- **Deployment:** Vercel

---

## Project Structure

```
PearMedia/
├── api/                          # Vercel Serverless Functions
│   ├── enhance-text.js           # POST /api/enhance-text
│   ├── analyze-image.js          # POST /api/analyze-image
│   └── generate-image.js         # POST /api/generate-image
├── src/
│   ├── components/
│   │   ├── TextWorkflow.jsx      # 4-step text enhancement workflow
│   │   ├── TextWorkflow.css
│   │   ├── ImageWorkflow.jsx     # 3-step image processing workflow
│   │   └── ImageWorkflow.css
│   ├── App.jsx                   # Main app with tab navigation
│   ├── App.css
│   ├── index.css                 # Design system & global styles
│   └── main.jsx                  # React entry point
├── dist/                         # Production build output
├── index.html                    # HTML entry with SEO meta tags
├── package.json
├── vite.config.js
└── vercel.json                   # Vercel deployment configuration
```

---

## Components

### TextWorkflow (`src/components/TextWorkflow.jsx`)

A 4-step workflow for text enhancement:

| Step | Name | Description |
|------|------|-------------|
| 1 | Input | User enters text to enhance |
| 2 | Enhance | Text sent to `/api/enhance-text`, displays comparison |
| 3 | Approve | User reviews and approves enhanced text |
| 4 | Generate | Final generation step, shows completion |

**State:**
- `step` (1-4): Current workflow step
- `inputText`: Original user text
- `enhancedText`: AI-enhanced result
- `isLoading`: Loading state for API calls
- `status`: Status message object `{ type, message }`

### ImageWorkflow (`src/components/ImageWorkflow.jsx`)

A 3-step workflow for image processing:

| Step | Name | Description |
|------|------|-------------|
| 1 | Upload | Drag & drop or click to upload image |
| 2 | Analyze | Image sent to `/api/analyze-image`, displays analysis |
| 3 | Generate | Creates variations via `/api/generate-image` |

**State:**
- `step` (1-3): Current workflow step
- `selectedImage`: File object
- `imagePreview`: Base64 data URL for preview
- `analysisResult`: Object with description, tags, mood, style, colors
- `variations`: Array of generated variation placeholders
- `isLoading`: Loading state
- `status`: Status message object

---

## API Routes

All API routes are in the `/api` directory and follow Vercel's serverless function conventions.

### POST `/api/enhance-text`

Enhances text using AI.

**Request:**
```json
{
  "text": "string (required, max 10000 chars)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Text enhanced successfully",
  "data": {
    "originalText": "...",
    "enhancedText": "...",
    "improvements": ["Grammar corrections", "Clarity improved", ...]
  }
}
```

**TODO:** Integrate OpenAI, Anthropic, or similar AI service.

---

### POST `/api/analyze-image`

Analyzes an image using AI.

> ⚠️ **Note:** Multipart file upload is NOT yet supported. Send JSON with base64 data URL.

**Request:** `application/json`
```json
{
  "imageRef": "data:image/png;base64,...",
  "filename": "optional-filename.png"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Image analyzed successfully",
  "data": {
    "description": "...",
    "tags": ["tag1", "tag2"],
    "mood": "Creative",
    "style": "Modern",
    "colors": ["#667eea", "#764ba2"],
    "objects": ["..."],
    "composition": { "ruleOfThirds": true, ... }
  }
}
```

---

### POST `/api/generate-image`

Generates image variations.

**Request:**
```json
{
  "sourceImage": "string (required)",
  "analysis": "object (optional)",
  "prompt": "string (optional)",
  "style": "string (optional)",
  "count": 4
}
```

**Response:**
```json
{
  "success": true,
  "message": "Generated 4 variations",
  "data": {
    "variations": [
      { "id": "...", "url": "...", "style": "...", "description": "..." }
    ],
    "metadata": { "generatedAt": "...", ... }
  }
}
```

**TODO:** Integrate DALL-E, Stable Diffusion, or Midjourney API.

---

## Design System

The design system is defined in `src/index.css` using CSS custom properties.

### Colors
```css
--primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--primary-color: #667eea;
--accent-color: #764ba2;
--bg-dark: #0f0f1a;
--success-color: #10b981;
--warning-color: #f59e0b;
--error-color: #ef4444;
--info-color: #3b82f6;
```

### Utility Classes
- `.glass-panel` - Glassmorphism card with backdrop blur
- `.gradient-text` - Text with primary gradient
- `.btn`, `.btn-primary`, `.btn-secondary` - Button styles
- `.status-badge` - Status indicators (`.pending`, `.processing`, `.success`, `.error`)
- `.animate-fade-in`, `.animate-pulse`, `.animate-spin` - Animations

---

## Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## Deployment

The project is configured for Vercel deployment via `vercel.json`:

1. Push to GitHub/GitLab/Bitbucket
2. Connect repository to Vercel
3. Vercel auto-detects Vite and deploys

Or use CLI:
```bash
npx vercel
```

---

## Integration Points (TODOs)

When implementing actual AI logic, update these files:

| File | Integration |
|------|-------------|
| `api/enhance-text.js` | OpenAI GPT-4, Anthropic Claude, etc. |
| `api/analyze-image.js` | OpenAI Vision, Google Vision API |
| `api/generate-image.js` | DALL-E 3, Stable Diffusion, Midjourney |

Each API file contains commented example code showing how to integrate these services.

---

## Environment Variables (for future use)

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_CLOUD_PROJECT=...
STABILITY_API_KEY=sk-...
```

Add these to Vercel's Environment Variables in the dashboard.

---

## Notes

- All business logic is placeholder — APIs return mock data
- The frontend is fully functional with state management
- Dark theme with glassmorphism and subtle animations
- Responsive design (mobile-friendly)
- SEO meta tags included in `index.html`
