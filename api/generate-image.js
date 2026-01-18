/**
 * Generate Image API Route
 *
 * POST /api/generate-image
 *
 * Generates images using AI providers ONLY:
 * 1. Google Gemini (Imagen 3) - Primary (if configured)
 * 2. Together.ai (FLUX) - Secondary (if configured)
 * 3. OpenAI (DALL-E) - Tertiary (if configured)
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

async function generateWithGemini(prompt, imageCount) {
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) throw new Error('GOOGLE_API_KEY not set')

    console.log('Using Gemini (Imagen 3)...')
    const model = 'imagen-3.0-generate-001'
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`

    // Optimize prompt for Imagen
    const enhancedPrompt = `High quality, highly detailed image of: ${prompt}`

    // Add TIMEOUT to prevent Vercel 10s Limit
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

async function generateWithTogether(prompt, imageCount) {
    const apiKey = process.env.TOGETHER_API_KEY
    if (!apiKey) throw new Error('TOGETHER_API_KEY not set')

    console.log('Using Together.ai (FLUX)...')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    try {
        const response = await fetch('https://api.together.xyz/v1/images/generations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'black-forest-labs/FLUX.1-schnell',
                prompt: prompt,
                n: imageCount,
                width: 1024,
                height: 1024,
                steps: 4,
                response_format: 'base64'
            }),
            signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (!response.ok) throw new Error(`Together API error ${response.status}`)
        const data = await response.json()
        return data.data.map(item => `data:image/jpeg;base64,${item.b64_json}`)
    } catch (error) {
        clearTimeout(timeoutId)
        throw error
    }
}

async function generateWithOpenAI(prompt, imageCount) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY not set')

    console.log('Using OpenAI (DALL-E 3)...')
    const images = []

    for (let i = 0; i < imageCount; i++) {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt,
                n: 1,
                size: process.env.IMAGE_SIZE || '1024x1024',
                quality: process.env.IMAGE_QUALITY || 'standard',
                response_format: 'url'
            })
        })

        if (!response.ok) throw new Error(`OpenAI API error ${response.status}`)
        const data = await response.json()
        images.push(data.data[0].url)
    }
    return images
}

async function generateImages(prompt, imageCount) {
    let provider = (process.env.IMAGE_PROVIDER || '').toLowerCase()

    if (!provider) {
        if (process.env.GOOGLE_API_KEY) provider = 'gemini'
        else if (process.env.TOGETHER_API_KEY) provider = 'together'
        else if (process.env.OPENAI_API_KEY) provider = 'openai'
    }

    // If no keys configured, throw immediately so Frontend Puter.js takes over
    if (!provider) {
        throw new Error('No API keys configured. Switching to Puter.js fallback.')
    }

    console.log(`Selected Provider: ${provider}`)

    switch (provider) {
        case 'gemini': return await generateWithGemini(prompt, imageCount)
        case 'together': return await generateWithTogether(prompt, imageCount)
        case 'openai': return await generateWithOpenAI(prompt, imageCount)
        default:
            throw new Error(`Unknown provider: ${provider}`)
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

        // Return 503 to signal Frontend -> Use Puter.js
        return res.status(503).json({
            error: error.message || 'Service Unavailable'
        })
    }
}
