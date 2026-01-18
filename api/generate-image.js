/**
 * Generate Image API Route
 *
 * POST /api/generate-image
 *
 * Generates images using AI providers ONLY:
 * 1. Google Gemini (Imagen 3) - Primary (User Priority)
 * 2. Clipdrop (SDXL) - Secondary (High Quality, 100 credits)
 * 3. Hugging Face (FLUX.1-dev) - Tertiary
 * 4. OpenAI / Together (If available)
 * 
 * NOTE: If all fails, returns 503 so Frontend can fallback to Puter.js
 */

function setSecurityHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
}

function buildPrompt(prompt, style) {
    if (!style) return prompt
    return `${prompt}. Image style: ${style}`
}

/**
 * Google Gemini (Imagen 3)
 */
async function generateWithGemini(prompt, imageCount) {
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) throw new Error('GOOGLE_API_KEY not set')

    console.log('Using Gemini (Imagen 3)...')
    // Provide fallback model IDs if 001 is deprecated/restricted
    const model = 'imagen-3.0-generate-001'
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`

    const enhancedPrompt = `High quality, highly detailed image of: ${prompt}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                instances: [{ prompt: enhancedPrompt }],
                parameters: {
                    sampleCount: Math.min(imageCount, 4),
                    aspectRatio: "1:1"
                }
            }),
            signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            const msg = errorData.error?.message || `Gemini API error ${response.status}`
            throw new Error(msg)
        }

        const data = await response.json()
        if (!data.predictions) throw new Error('Gemini returned no predictions')

        return data.predictions.map(pred => `data:${pred.mimeType};base64,${pred.bytesBase64Encoded}`)

    } catch (error) {
        clearTimeout(timeoutId)
        throw error
    }
}

/**
 * Clipdrop API
 */
async function generateWithClipdrop(prompt, imageCount) {
    const apiKey = process.env.CLIPDROP_API_KEY
    if (!apiKey) throw new Error('CLIPDROP_API_KEY not set')

    console.log('Using Clipdrop API...')
    const requests = []

    for (let i = 0; i < imageCount; i++) {
        const form = new FormData()
        form.append('prompt', prompt)

        const request = fetch('https://clipdrop-api.co/text-to-image/v1', {
            method: 'POST',
            headers: { 'x-api-key': apiKey },
            body: form
        }).then(async (response) => {
            if (!response.ok) {
                const text = await response.text()
                throw new Error(`Clipdrop error ${response.status}: ${text}`)
            }
            const arrayBuffer = await response.arrayBuffer()
            const base64 = Buffer.from(arrayBuffer).toString('base64')
            return `data:image/png;base64,${base64}`
        })
        requests.push(request)
    }

    return Promise.all(requests)
}

/**
 * Hugging Face API (FLUX.1-dev)
 */
async function generateWithHuggingFace(prompt, imageCount) {
    const apiKey = process.env.HUGGINGFACE_API_KEY
    if (!apiKey) throw new Error('HUGGINGFACE_API_KEY not set')

    console.log('Using Hugging Face (FLUX.1-dev)...')
    const model = 'black-forest-labs/FLUX.1-dev'
    const endpoint = `https://api-inference.huggingface.co/models/${model}`

    const requests = []

    for (let i = 0; i < imageCount; i++) {
        const request = fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: prompt })
        }).then(async (response) => {
            if (!response.ok) {
                // Handle 503 (Loading model) specifically could be retried, but for now throw
                throw new Error(`HF error ${response.status}`)
            }
            // HF returns blob/buffer usually
            const arrayBuffer = await response.arrayBuffer()
            const base64 = Buffer.from(arrayBuffer).toString('base64')
            return `data:image/jpeg;base64,${base64}`
        })
        requests.push(request)
    }

    return Promise.all(requests)
}

// Keep OpenAI/Together for compatibility if key present
async function generateWithOpenAI(prompt, imageCount) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('Key not set')
    // ... (Implementation truncated for brevity, assuming standard OpenAI call)
    // Reuse previous OpenAI implementation or standard one
    // Re-writing full function to be safe:
    const images = []
    for (let i = 0; i < imageCount; i++) {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024', response_format: 'url' })
        })
        if (!response.ok) throw new Error(`OpenAI error ${response.status}`)
        const data = await response.json()
        images.push(data.data[0].url)
    }
    return images
}
async function generateWithTogether(prompt, imageCount) {
    const apiKey = process.env.TOGETHER_API_KEY
    if (!apiKey) throw new Error('Key not set')
    const response = await fetch('https://api.together.xyz/v1/images/generations', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'black-forest-labs/FLUX.1-schnell', prompt, n: imageCount, width: 1024, height: 1024, response_format: 'base64' })
    })
    if (!response.ok) throw new Error(`Together error ${response.status}`)
    const data = await response.json()
    return data.data.map(item => `data:image/jpeg;base64,${item.b64_json}`)
}


async function generateImages(prompt, imageCount) {
    let provider = (process.env.IMAGE_PROVIDER || '').toLowerCase()

    // Priority Order Detection
    if (!provider) {
        if (process.env.GOOGLE_API_KEY) provider = 'gemini'
        else if (process.env.CLIPDROP_API_KEY) provider = 'clipdrop'
        else if (process.env.HUGGINGFACE_API_KEY) provider = 'huggingface'
        else if (process.env.OPENAI_API_KEY) provider = 'openai'
        else if (process.env.TOGETHER_API_KEY) provider = 'together'
    }

    if (!provider) {
        throw new Error('No supported API keys configured. Switching to Puter.js fallback.')
    }

    console.log(`Selected Provider: ${provider}`)

    try {
        switch (provider) {
            case 'gemini': return await generateWithGemini(prompt, imageCount)
            case 'clipdrop': return await generateWithClipdrop(prompt, imageCount)
            case 'huggingface': return await generateWithHuggingFace(prompt, imageCount)
            case 'openai': return await generateWithOpenAI(prompt, imageCount)
            case 'together': return await generateWithTogether(prompt, imageCount)
            default:
                // Auto-fallback chain if primary fails?
                // For now, let it throw so Puter.js takes over.
                // Or we can try chain internally.
                throw new Error(`Unknown provider: ${provider}`)
        }
    } catch (e) {
        console.warn(`Provider ${provider} failed: ${e.message}`)

        // Internal Fallback Chain
        if (provider === 'gemini' && process.env.CLIPDROP_API_KEY) {
            console.log('Gemini failed, failing over to Clipdrop...')
            return await generateWithClipdrop(prompt, imageCount)
        }
        if ((provider === 'gemini' || provider === 'clipdrop') && process.env.HUGGINGFACE_API_KEY) {
            console.log('Failing over to Hugging Face...')
            return await generateWithHuggingFace(prompt, imageCount)
        }

        throw e // Throw to trigger Puter.js
    }
}

export default async function handler(req, res) {
    setSecurityHeaders(res)
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { prompt, style } = req.body
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' })

    const imageCount = Math.min(Math.max(1, parseInt(process.env.IMAGE_COUNT || '2', 10)), 4)

    try {
        const finalPrompt = buildPrompt(prompt, style)
        const imageUrls = await generateImages(finalPrompt, imageCount)
        return res.status(200).json({ images: imageUrls })
    } catch (error) {
        console.warn('Backend generation failed:', error.message)
        return res.status(503).json({ error: error.message || 'Service Unavailable' })
    }
}
