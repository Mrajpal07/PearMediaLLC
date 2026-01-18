# API Implementation Guide

## Overview

This document describes the implemented AI-powered APIs for PearMedia AI.

---

## API Endpoints

### 1. POST `/api/enhance-text`

**Purpose:** Analyzes user prompts and enhances them for image generation using GPT-4o-mini.

**Request:**
```json
{
  "prompt": "a cat on a windowsill"
}
```

**Response:**
```json
{
  "analysis": {
    "intent": "Create a cozy domestic scene featuring a cat",
    "tone": "Peaceful and contemplative",
    "style": "Photorealistic with natural lighting"
  },
  "enhancedPrompt": "A tabby cat with green eyes sits on a sunlit wooden windowsill, golden hour lighting streaming through lace curtains, soft bokeh background, photorealistic style, shallow depth of field, warm color palette"
}
```

**Environment Variables:**
- `OPENAI_API_KEY` (required)
- `OPENAI_BASE_URL` (optional, default: https://api.openai.com/v1)
- `OPENAI_MODEL` (optional, default: gpt-4o-mini)

**Implementation Details:**
- Uses structured output mode (`response_format: { type: 'json_object' }`)
- Temperature: 0.7 (balanced creativity)
- Max tokens: 1000
- Input limit: 5000 characters
- Validates all required analysis fields before returning

---

### 2. POST `/api/generate-image`

**Purpose:** Generates 1-3 images using OpenAI DALL-E 3 based on enhanced prompts.

**Request:**
```json
{
  "prompt": "A tabby cat with green eyes sits on a sunlit wooden windowsill...",
  "style": "cinematic"
}
```

**Response:**
```json
{
  "images": [
    "https://oaidalleapiprodscus.blob.core.windows.net/...",
    "https://oaidalleapiprodscus.blob.core.windows.net/..."
  ]
}
```

**Environment Variables:**
- `OPENAI_API_KEY` (required)
- `OPENAI_BASE_URL` (optional, default: https://api.openai.com/v1)
- `IMAGE_COUNT` (optional, default: 2, range: 1-3)

**Implementation Details:**
- Model: DALL-E 3
- Size: 1024x1024
- Quality: standard
- Generates images sequentially (DALL-E 3 limitation: n=1)
- Input limit: 4000 characters
- Supported styles: realistic, cinematic, anime, oil painting, watercolor, digital art, sketch, 3d render

**Style Handling:**
Styles are subtly incorporated as suffixes to the prompt:
- `"realistic"` → `", photorealistic quality"`
- `"cinematic"` → `", cinematic lighting and composition"`
- Custom styles → `", {style} style"`

---

### 3. POST `/api/analyze-image`

**Purpose:** Analyzes uploaded images (currently placeholder).

**Status:** Not yet implemented with AI vision API.

**Request:**
```json
{
  "imageRef": "data:image/png;base64,...",
  "filename": "example.png"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Image analyzed successfully (placeholder)",
  "data": {
    "description": "A beautiful image with vibrant colors...",
    "tags": ["placeholder", "sample"],
    "mood": "Creative & Inspiring",
    "style": "Contemporary",
    "colors": ["#667eea", "#764ba2"],
    "objects": ["Subject detected"],
    "composition": { "ruleOfThirds": true }
  }
}
```

**TODO:** Integrate OpenAI Vision API (gpt-4-vision-preview) or Google Cloud Vision.

---

## Deployment Checklist

### Required Steps

1. **Set Environment Variables in Vercel:**
   ```
   OPENAI_API_KEY=sk-proj-...
   ```

2. **Optional Configuration:**
   ```
   OPENAI_BASE_URL=https://api.openai.com/v1
   OPENAI_MODEL=gpt-4o-mini
   IMAGE_COUNT=2
   ```

3. **Deploy:**
   ```bash
   npx vercel --prod
   ```

### Local Development

1. **Copy environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Add your API key to `.env.local`:**
   ```
   OPENAI_API_KEY=sk-proj-...
   ```

3. **Run locally:**
   ```bash
   npm run dev
   ```

4. **Test endpoints:**
   ```bash
   # Test prompt enhancement
   curl -X POST http://localhost:5173/api/enhance-text \
     -H "Content-Type: application/json" \
     -d '{"prompt": "a cat on a windowsill"}'

   # Test image generation
   curl -X POST http://localhost:5173/api/generate-image \
     -H "Content-Type: application/json" \
     -d '{"prompt": "A tabby cat with green eyes...", "style": "cinematic"}'
   ```

---

## Error Handling

All endpoints follow consistent error handling:

### Client Errors (4xx)

```json
{
  "error": "Missing required field: prompt"
}
```

**Common errors:**
- `400 Bad Request` - Missing/invalid fields, empty prompt, content policy violation
- `405 Method Not Allowed` - Non-POST requests
- `415 Unsupported Media Type` - Wrong Content-Type header

### Server Errors (5xx)

```json
{
  "error": "Server configuration error. API key not configured."
}
```

**Common errors:**
- `500 Internal Server Error` - Missing API key, unexpected errors
- `502 Bad Gateway` - OpenAI API unavailable, invalid response

---

## Cost Estimation

Based on OpenAI pricing (as of 2024):

### Prompt Enhancement (`/api/enhance-text`)
- Model: GPT-4o-mini
- Input: ~$0.15 per 1M tokens (~100 words = ~150 tokens)
- Output: ~$0.60 per 1M tokens
- **Average cost per request:** ~$0.0002 ($0.20 per 1000 requests)

### Image Generation (`/api/generate-image`)
- Model: DALL-E 3 (standard, 1024x1024)
- **Cost per image:** $0.040
- **Default (2 images):** $0.080 per request
- **Max (3 images):** $0.120 per request

### Example Monthly Usage
- 1000 users/month
- Each generates 2 image sets (4 images total)

**Costs:**
- Prompt enhancement: 2000 requests × $0.0002 = $0.40
- Image generation: 8000 images × $0.040 = $320.00
- **Total: ~$320.40/month**

---

## Rate Limits (OpenAI Default Tier)

| API | Limit | Notes |
|-----|-------|-------|
| GPT-4o-mini | 30,000 TPM | Tokens per minute |
| DALL-E 3 | 5 images/min | 100 images/day |

**Recommendation:** Implement rate limiting on your side to prevent hitting OpenAI limits:
- 10 requests/minute per IP for `/api/enhance-text`
- 2 requests/minute per IP for `/api/generate-image`

---

## Security Considerations

### Implemented
✅ Request method validation (POST only)
✅ Content-Type validation (application/json)
✅ Input sanitization (trim, length limits)
✅ Type checking (string validation)
✅ Security headers (X-Content-Type-Options, X-Frame-Options)
✅ API key stored in environment variables
✅ No sensitive data in error messages
✅ Content policy violation detection

### Recommended for Production
⚠️ Rate limiting (per IP or user)
⚠️ Request timeout (8-10 seconds)
⚠️ Logging/monitoring (Sentry, Vercel Analytics)
⚠️ Input sanitization for prompt injection
⚠️ CORS configuration (if frontend on different domain)

---

## Testing

### Manual Testing

**1. Test Prompt Enhancement:**
```bash
curl -X POST https://your-app.vercel.app/api/enhance-text \
  -H "Content-Type: application/json" \
  -d '{"prompt": "a cat sitting by a window at sunset"}'
```

**Expected:** JSON with `analysis` and `enhancedPrompt` fields.

**2. Test Image Generation:**
```bash
curl -X POST https://your-app.vercel.app/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A tabby cat with green eyes sits on a sunlit wooden windowsill, golden hour lighting",
    "style": "cinematic"
  }'
```

**Expected:** JSON with `images` array containing 2 URLs.

### Edge Cases to Test

**Empty prompt:**
```bash
curl -X POST https://your-app.vercel.app/api/enhance-text \
  -H "Content-Type: application/json" \
  -d '{"prompt": ""}'
```
**Expected:** 400 error - "Prompt cannot be empty."

**Missing API key (test locally):**
```bash
# Unset OPENAI_API_KEY
curl -X POST http://localhost:5173/api/enhance-text \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test"}'
```
**Expected:** 500 error - "Server configuration error. API key not configured."

**Content policy violation:**
```bash
curl -X POST https://your-app.vercel.app/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{"prompt": "violent content here"}'
```
**Expected:** 400 error - "Prompt violates content policy."

---

## Troubleshooting

### Issue: "Server configuration error. API key not configured."

**Solution:**
1. Check Vercel environment variables are set
2. Redeploy after setting variables
3. For local dev, ensure `.env.local` exists with valid key

### Issue: "Failed to generate images. Please try again."

**Causes:**
- OpenAI API is down (check status.openai.com)
- Rate limit exceeded (wait 1 minute)
- Invalid API key (regenerate key)

**Solution:**
1. Check OpenAI API status
2. Verify API key is correct
3. Check Vercel function logs for details

### Issue: Images take too long to generate

**Cause:** DALL-E 3 generates sequentially (n=1 limitation)
- 1 image: ~10-15 seconds
- 2 images: ~20-30 seconds
- 3 images: ~30-45 seconds

**Solution:**
- Set `IMAGE_COUNT=1` for faster responses
- Or switch to DALL-E 2 (supports n>1 but lower quality)

---

## Next Steps

### Phase 1 Complete ✅
- [x] `/api/enhance-text` with GPT-4o-mini
- [x] `/api/generate-image` with DALL-E 3
- [x] Environment variable configuration
- [x] Error handling and validation
- [x] Security headers

### Phase 2 (Recommended)
- [ ] Integrate OpenAI Vision for `/api/analyze-image`
- [ ] Add rate limiting (Upstash Redis)
- [ ] Add monitoring (Sentry)
- [ ] Add request timeout (8s)
- [ ] Track token usage for cost monitoring
- [ ] Add user authentication
- [ ] Implement image caching (Vercel Blob Storage)

### Phase 3 (Advanced)
- [ ] Batch image generation for cost optimization
- [ ] Support for DALL-E 2 (faster, cheaper, n>1)
- [ ] Image upscaling/editing endpoints
- [ ] Webhook notifications for long-running jobs
- [ ] Admin dashboard for usage analytics

---

## API Reference Summary

| Endpoint | Method | Input | Output | Cost/Request |
|----------|--------|-------|--------|--------------|
| `/api/enhance-text` | POST | `{ prompt }` | `{ analysis, enhancedPrompt }` | ~$0.0002 |
| `/api/generate-image` | POST | `{ prompt, style? }` | `{ images: [...] }` | ~$0.08 (2 images) |
| `/api/analyze-image` | POST | `{ imageRef, filename? }` | Placeholder (TODO) | N/A |

---

**Last Updated:** 2026-01-18
**Version:** 1.0.0
**Status:** Production Ready (Phase 1)
