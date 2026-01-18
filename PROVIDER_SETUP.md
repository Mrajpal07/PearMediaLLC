# LLM Provider Setup Guide

This document provides detailed setup instructions for using different LLM providers with PearMedia AI.

---

## 🎯 Supported Providers

PearMedia AI supports any OpenAI-compatible API provider:

- ✅ **OpenAI** (default)
- ✅ **Hugging Face Inference API**
- ✅ **Azure OpenAI**
- ✅ **Together.ai**
- ✅ **Anyscale Endpoints**
- ✅ **Replicate**
- ✅ **Self-hosted LiteLLM**
- ✅ **Any OpenAI-compatible endpoint**

---

## 🔧 Configuration Overview

All providers use the same environment variables:

```bash
OPENAI_API_KEY=<your-api-key>        # API key from your provider
OPENAI_BASE_URL=<api-endpoint>       # Provider's API endpoint
OPENAI_MODEL=<model-name>            # Text enhancement model
VISION_MODEL=<vision-model>          # Image analysis model
IMAGE_MODEL=<image-model>            # Image generation model
```

---

## 1️⃣ OpenAI (Default)

### Setup

1. Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Configure environment variables:

```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
VISION_MODEL=gpt-4o
IMAGE_MODEL=dall-e-3
IMAGE_COUNT=2
IMAGE_SIZE=1024x1024
IMAGE_QUALITY=standard
```

### Pricing (as of 2024)

| Service | Model | Cost |
|---------|-------|------|
| Text Enhancement | GPT-4o-mini | $0.15/1M input, $0.60/1M output |
| Image Analysis | GPT-4o | $2.50/1M input, $10/1M output |
| Image Generation | DALL-E 3 (standard) | $0.040 per image |
| Image Generation | DALL-E 3 (hd) | $0.080 per image |

### Models

- **Text:** `gpt-4o-mini`, `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`
- **Vision:** `gpt-4o`, `gpt-4-turbo`, `gpt-4-vision-preview`
- **Images:** `dall-e-3`, `dall-e-2`

---

## 2️⃣ Hugging Face Inference API

### Setup

1. Get API token from [Hugging Face Settings](https://huggingface.co/settings/tokens)
2. Configure environment variables:

```bash
OPENAI_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api-inference.huggingface.co/v1
OPENAI_MODEL=meta-llama/Meta-Llama-3.1-70B-Instruct
VISION_MODEL=llava-hf/llava-v1.6-mistral-7b-hf
IMAGE_MODEL=black-forest-labs/FLUX.1-dev
USE_HUGGINGFACE=true
IMAGE_COUNT=2
```

### Pricing

| Tier | Price | Limits |
|------|-------|--------|
| **Free** | $0 | Rate limited, models may cold start |
| **PRO** | $9/month | Higher rate limits, faster inference |
| **Enterprise** | Custom | Dedicated endpoints, SLA |

### Recommended Models

**Text Enhancement:**
- `meta-llama/Meta-Llama-3.1-70B-Instruct` (best quality)
- `mistralai/Mixtral-8x7B-Instruct-v0.1` (fast, good quality)
- `microsoft/Phi-3-medium-4k-instruct` (lightweight)

**Vision (Image Analysis):**
- `llava-hf/llava-v1.6-mistral-7b-hf` (best)
- `llava-hf/llava-1.5-7b-hf` (faster)

**Image Generation:**
- `black-forest-labs/FLUX.1-dev` (best quality, slower)
- `stabilityai/stable-diffusion-xl-base-1.0` (SDXL, good balance)
- `stabilityai/stable-diffusion-2-1` (fastest)

### Important Notes

⚠️ **Cold Starts:** Free tier models may take 10-30 seconds to load on first request
⚠️ **Rate Limits:** Free tier is heavily rate-limited during peak hours
⚠️ **Image Generation:** Hugging Face returns base64-encoded images, not URLs (handled automatically)

---

## 3️⃣ Azure OpenAI

### Setup

1. Create Azure OpenAI resource in Azure Portal
2. Deploy models (e.g., `gpt-4o-mini`, `gpt-4o`, `dall-e-3`)
3. Get API key and endpoint from Azure Portal
4. Configure environment variables:

```bash
OPENAI_API_KEY=your-azure-api-key
OPENAI_BASE_URL=https://<your-resource>.openai.azure.com/openai/deployments/<deployment-name>
OPENAI_MODEL=your-text-deployment-name
VISION_MODEL=your-vision-deployment-name
IMAGE_MODEL=your-dalle-deployment-name
```

### Notes

- Model name = your deployment name (not the underlying model)
- Endpoint includes deployment name in URL
- Pricing similar to OpenAI but billed through Azure

---

## 4️⃣ Together.ai

### Setup

1. Get API key from [Together.ai](https://api.together.xyz/)
2. Configure environment variables:

```bash
OPENAI_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.together.xyz/v1
OPENAI_MODEL=meta-llama/Llama-3-70b-chat-hf
VISION_MODEL=meta-llama/Llama-Vision-Free
IMAGE_MODEL=stabilityai/stable-diffusion-xl-base-1.0
```

### Pricing

- Pay-per-use pricing
- Generally cheaper than OpenAI
- Check [Together.ai Pricing](https://www.together.ai/pricing)

---

## 5️⃣ Anyscale Endpoints

### Setup

1. Get API key from [Anyscale](https://app.endpoints.anyscale.com/)
2. Configure environment variables:

```bash
OPENAI_API_KEY=esecret_xxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.endpoints.anyscale.com/v1
OPENAI_MODEL=meta-llama/Llama-3-70b-chat-hf
```

### Notes

- Primarily supports text models (no vision or image generation yet)
- Competitive pricing
- Good for text enhancement use case

---

## 6️⃣ Self-Hosted (LiteLLM)

### Setup

1. Install LiteLLM Proxy:

```bash
pip install litellm
```

2. Run proxy server:

```bash
litellm --port 4000
```

3. Configure environment variables:

```bash
OPENAI_API_KEY=sk-1234  # Any value for local proxy
OPENAI_BASE_URL=http://localhost:4000
OPENAI_MODEL=ollama/llama3
```

### Use Cases

- Testing locally with Ollama
- Routing to multiple providers
- Cost tracking and logging
- Rate limiting

---

## 🔄 Switching Between Providers

### Option 1: Environment Variables (Recommended)

Set different variables for each environment:

**Development (.env.local):**
```bash
OPENAI_API_KEY=hf_xxx  # Hugging Face for free testing
OPENAI_BASE_URL=https://api-inference.huggingface.co/v1
USE_HUGGINGFACE=true
```

**Production (Vercel):**
```bash
OPENAI_API_KEY=sk-proj-xxx  # OpenAI for production
OPENAI_BASE_URL=https://api.openai.com/v1
```

### Option 2: Multiple Configurations

Create separate `.env` files:

```bash
# .env.openai
OPENAI_API_KEY=sk-proj-xxx
OPENAI_BASE_URL=https://api.openai.com/v1

# .env.huggingface
OPENAI_API_KEY=hf_xxx
OPENAI_BASE_URL=https://api-inference.huggingface.co/v1
USE_HUGGINGFACE=true

# Load specific config
cp .env.huggingface .env.local
```

---

## ⚙️ Provider-Specific Optimizations

### For Hugging Face:

1. **Enable Hugging Face mode:**
   ```bash
   USE_HUGGINGFACE=true
   ```

2. **Reduce image count for free tier:**
   ```bash
   IMAGE_COUNT=1
   ```

3. **Use smaller models for faster response:**
   ```bash
   OPENAI_MODEL=mistralai/Mistral-7B-Instruct-v0.2
   ```

### For OpenAI:

1. **Use cheaper models for development:**
   ```bash
   OPENAI_MODEL=gpt-3.5-turbo  # Instead of gpt-4o-mini
   IMAGE_MODEL=dall-e-2        # Instead of dall-e-3
   ```

2. **Optimize image generation:**
   ```bash
   IMAGE_COUNT=1               # Reduce cost by 50%
   IMAGE_QUALITY=standard      # Don't use 'hd' unless needed
   ```

### For Azure OpenAI:

1. **Set correct endpoint format:**
   ```bash
   OPENAI_BASE_URL=https://YOUR_RESOURCE.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT
   ```

2. **Use deployment names, not model names:**
   ```bash
   OPENAI_MODEL=my-gpt4-deployment  # Your Azure deployment name
   ```

---

## 🧪 Testing Your Configuration

### 1. Test Text Enhancement

```bash
curl -X POST http://localhost:3000/api/enhance-text \
  -H "Content-Type: application/json" \
  -d '{"prompt": "a cat on a windowsill"}'
```

**Expected:** JSON with `analysis` and `enhancedPrompt`

### 2. Test Image Analysis

```bash
curl -X POST http://localhost:3000/api/analyze-image \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://example.com/cat.jpg"}'
```

**Expected:** JSON with `analysis` and `suggestedPrompt`

### 3. Test Image Generation

```bash
curl -X POST http://localhost:3000/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A fluffy cat sitting on a windowsill", "style": "cinematic"}'
```

**Expected:** JSON with `images` array

---

## 🐛 Troubleshooting

### Issue: "Invalid API key"

**Solution:**
- Verify API key is correct and not expired
- Check if key has proper permissions
- Ensure no extra spaces in `.env.local`

### Issue: "Model not found"

**Solution:**
- Verify model name is correct for your provider
- For Azure: Use deployment name, not model name
- For Hugging Face: Check model exists on hub

### Issue: "Rate limit exceeded"

**Solution:**
- Wait and retry (exponential backoff)
- Upgrade to paid tier (Hugging Face PRO)
- Switch to different provider
- Reduce `IMAGE_COUNT`

### Issue: Slow image generation with Hugging Face

**Cause:** Model cold start on free tier

**Solutions:**
- Use PRO tier for dedicated endpoints
- Switch to smaller/faster model
- Use OpenAI for image generation, HF for text

---

## 💡 Cost Optimization Strategies

### 1. Hybrid Approach

Use different providers for different tasks:

```bash
# Text enhancement (cheap, frequent)
OPENAI_MODEL=mistralai/Mixtral-8x7B-Instruct-v0.1
OPENAI_BASE_URL=https://api-inference.huggingface.co/v1

# Image generation (expensive, less frequent)
IMAGE_MODEL=dall-e-3
# Override base URL for image generation in code
```

### 2. Tiered Strategy

- **Development:** Hugging Face free tier
- **Staging:** Hugging Face PRO or OpenAI with reduced counts
- **Production:** OpenAI or Azure with full features

### 3. Caching

Implement response caching for common prompts:

```javascript
// Pseudo-code
const cachedEnhancement = await cache.get(prompt)
if (cachedEnhancement) return cachedEnhancement

const result = await enhanceText(prompt)
await cache.set(prompt, result, { ttl: 3600 })
```

---

## 📊 Provider Comparison

| Feature | OpenAI | Hugging Face | Azure OpenAI | Together.ai |
|---------|--------|--------------|--------------|-------------|
| **Text Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Vision Support** | ✅ GPT-4o | ✅ LLaVA | ✅ GPT-4o | ⚠️ Limited |
| **Image Gen** | ✅ DALL-E 3 | ✅ FLUX, SDXL | ✅ DALL-E 3 | ✅ SDXL |
| **Cost** | $$$ | $ (Free-$$) | $$$ | $$ |
| **Speed** | Fast | Slow (free) | Fast | Fast |
| **Reliability** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Best For** | Production | Development | Enterprise | Cost-saving |

---

## 🚀 Recommended Setups

### For Development/Testing

```bash
OPENAI_API_KEY=hf_xxx
OPENAI_BASE_URL=https://api-inference.huggingface.co/v1
OPENAI_MODEL=mistralai/Mixtral-8x7B-Instruct-v0.1
VISION_MODEL=llava-hf/llava-v1.6-mistral-7b-hf
IMAGE_MODEL=stabilityai/stable-diffusion-xl-base-1.0
USE_HUGGINGFACE=true
IMAGE_COUNT=1
```

**Cost:** Free (with rate limits)

### For Production (Cost-Optimized)

```bash
OPENAI_API_KEY=sk-proj-xxx
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
VISION_MODEL=gpt-4o
IMAGE_MODEL=dall-e-3
IMAGE_COUNT=1
IMAGE_QUALITY=standard
```

**Cost:** ~$0.05 per full workflow

### For Production (Best Quality)

```bash
OPENAI_API_KEY=sk-proj-xxx
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o
VISION_MODEL=gpt-4o
IMAGE_MODEL=dall-e-3
IMAGE_COUNT=2
IMAGE_QUALITY=hd
```

**Cost:** ~$0.20 per full workflow

---

## 📝 Next Steps

1. Choose your provider based on needs (cost, quality, features)
2. Copy `.env.example` to `.env.local`
3. Fill in your API credentials
4. Test each API endpoint
5. Deploy to Vercel with production credentials
6. Monitor usage and costs

For detailed API documentation, see [README.md](README.md) and [API_IMPLEMENTATION.md](API_IMPLEMENTATION.md).
