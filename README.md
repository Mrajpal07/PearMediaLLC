# PearMedia AI

AI-Powered Content Enhancement & Generation Platform

![React](https://img.shields.io/badge/React-18.3-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-6.0-purple?logo=vite)
![Vercel](https://img.shields.io/badge/Vercel-Serverless-black?logo=vercel)

## Overview

PearMedia AI is a prototype application featuring two AI-powered workflows:

- **Text Workflow** — Input → Enhance → Approve → Generate
- **Image Workflow** — Upload → Analyze → Generate Variations

> ⚠️ This is a skeleton project. AI logic is placeholder-only and returns mock data.

---

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd PearMedia

# Install dependencies
npm install

# Start development server
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

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
│   │   ├── TextWorkflow.jsx      # 4-step text workflow
│   │   ├── ImageWorkflow.jsx     # 3-step image workflow
│   │   └── *.css                 # Component styles
│   ├── App.jsx                   # Main app with navigation
│   ├── App.css
│   ├── index.css                 # Design system
│   └── main.jsx                  # Entry point
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
└── claude.md                     # AI assistant reference
```

---

## API Routes

All API routes accept `POST` requests with `Content-Type: application/json`.

### POST `/api/enhance-text`

Analyzes user input and rewrites it into a high-quality image generation prompt.

**Request:** `application/json`
```json
{ "prompt": "A cat sitting on a windowsill" }
```

**Response:**
```json
{
  "analysis": {
    "intent": "Create an image of a cat in a cozy indoor setting",
    "tone": "peaceful, contemplative",
    "style": "Natural lighting, warm atmosphere, domestic scene"
  },
  "enhancedPrompt": "A fluffy tabby cat sitting gracefully on a sunlit windowsill, warm golden hour lighting streaming through sheer curtains, photorealistic style, shallow depth of field, cozy domestic interior, soft shadows, peaceful contemplative mood"
}
```

**Environment Variables:**
- `OPENAI_API_KEY` — Required
- `OPENAI_BASE_URL` — Optional (for Claude-compatible APIs)
- `OPENAI_MODEL` — Optional (defaults to `gpt-4o-mini`)

### POST `/api/analyze-image`

Analyzes an image using OpenAI Vision (GPT-4o) and generates a suggested prompt.

**Request:** `application/json` (provide ONE of these)
```json
{ "imageUrl": "https://example.com/image.jpg" }
// OR
{ "imageBase64": "data:image/png;base64,..." }
```

**Response:**
```json
{
  "analysis": {
    "objects": ["cat", "windowsill", "curtains"],
    "style": "Photorealistic, natural photography",
    "mood": "Peaceful, contemplative",
    "lighting": "Warm golden hour sunlight"
  },
  "suggestedPrompt": "A fluffy tabby cat sitting on a sunlit windowsill..."
}
```

**Environment Variables:**
- `OPENAI_API_KEY` — Required
- `VISION_MODEL` — Optional (defaults to `gpt-4o`)

### POST `/api/generate-image`

Generates images using OpenAI DALL-E 3.

**Request:** `application/json`
```json
{
  "prompt": "A cat sitting on a windowsill at sunset",
  "style": "cinematic"
}
```

**Response:**
```json
{
  "images": ["https://oaidalleapi...", "https://oaidalleapi..."]
}
```

**Environment Variables:**
- `OPENAI_API_KEY` — Required
- `IMAGE_COUNT` — Optional (1-3, defaults to 2)

---

## Local API Testing

The Vite dev server does **not** run the serverless functions. To test APIs locally:

### Option 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Run with serverless functions
vercel dev
```

### Option 2: Deploy to Vercel

Push to GitHub and connect to Vercel for automatic deployment.

---

## Deployment

### Deploy to Vercel

1. Push your code to GitHub/GitLab/Bitbucket
2. Import project in [Vercel Dashboard](https://vercel.com/new)
3. Vercel auto-detects Vite + serverless functions
4. Deploy!

Or use the CLI:

```bash
vercel
```

### Environment Variables (Future)

When adding AI integrations, set these in Vercel:

```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Tech Stack

- **Frontend:** React 18, Vite 6
- **Styling:** Vanilla CSS with custom design system
- **Backend:** Vercel Serverless Functions
- **Deployment:** Vercel

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## AI Assistant Reference

See [`claude.md`](claude.md) for detailed project documentation useful for AI coding assistants.
