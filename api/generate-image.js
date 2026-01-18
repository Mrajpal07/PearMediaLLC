/**
 * Generate Image API Route
 *
 * POST /api/generate-image
 *
 * Generates images using multiple providers:
 * - Google Gemini (Imagen 3) - Free tier, high quality
 * - Together.ai (FLUX.1-schnell) - Best quality/price balance
 * - OpenAI DALL-E 3 (paid, best prompt adherence)
 * - LoremFlickr (visual fallback)
 *
 * Request:
 * - Content-Type: application/json
 * - Body: {
 *     prompt: string (required) - Image generation prompt
 *     style?: string (optional) - Style hint (realistic, cinematic, anime, etc.)
 *   }
 *
 * Response:
 * {
 *   "images": ["url1", "url2", ...]
 * }
 *
 * Environment Variables:
 * - IMAGE_PROVIDER: Provider to use (gemini, together, openai, fallback)
 * - GOOGLE_API_KEY: Required for gemini provider
 * - TOGETHER_API_KEY: Required for together provider
 * - OPENAI_API_KEY: Required for openai provider
 * - IMAGE_COUNT: Number of images (1-4, default: 2)
 */

/**
 * Set security headers
 */
function setSecurityHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
}

/**
 * Build the final prompt with optional style hint
 */
function buildPrompt(prompt, style) {
    if (!style) {
        return prompt
    }

    const styleModifiers = {
        'realistic': ', photorealistic quality',
        'cinematic': ', cinematic lighting and composition',
        'anime': ', anime art style',
        'oil painting': ', oil painting style',
        'watercolor': ', watercolor painting style',
        'digital art': ', digital art style',
        'sketch': ', pencil sketch style',
        '3d render': ', 3D rendered style'
    }

    const normalizedStyle = style.toLowerCase()
    const modifier = styleModifiers[normalizedStyle] || `, ${style} style`

    return `${prompt}${modifier}`
}

/**
 * Generate images using LoremFlickr (Visual Fallback)
 * Returns relevant stock photos based on keywords features in prompt
 */
async function generateWithFallback(prompt, imageCount) {
    const images = []
    const words = prompt.split(' ').filter(w => w.length > 3).slice(0, 2).join(',')
    const keywords = encodeURIComponent(words || 'art')

    for (let i = 0; i < imageCount; i++) {
        const random = Math.floor(Math.random() * 10000)
        const imageUrl = `https://loremflickr.com/1024/1024/${keywords}?random=${random}`
        images.push(imageUrl)
    }

    return images
}

/**
 * Generate images using Google Gemini (Imagen 3)
 * Requires GOOGLE_API_KEY environment variable
 */
async function generateWithGemini(prompt, imageCount) {
    const apiKey = process.env.GOOGLE_API_KEY

    if (!apiKey) {
        throw new Error('GOOGLE_API_KEY environment variable is not set')
    }

    // Using Imagen 3 via Gemini API
    // Note: This endpoint is subject to change as it is in preview/beta
    const model = 'imagen-3.0-generate-001'
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`

    const images = []

    // Gemini generates 1-4 images per request
    // We make one request for simplicity if count <= 4
    const count = Math.min(imageCount, 4)

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            instances: [
                { prompt: prompt }
            ],
            parameters: {
                sampleCount: count,
                aspectRatio: "1:1"
            }
        })
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error?.message || `Gemini API error: ${response.status}`
        throw new Error(errorMessage)
    }

    const data = await response.json()

    if (!data.predictions) {
        throw new Error('Invalid response from Gemini API')
    }

    // predictions contains array of { bytesBase64Encoded: string, mimeType: string }
    return data.predictions.map(pred => `data:${pred.mimeType};base64,${pred.bytesBase64Encoded}`)
}

/**
 * Generate images using Together.ai (FLUX.1-schnell)
 */
async function generateWithTogether(prompt, imageCount) {
    const apiKey = process.env.TOGETHER_API_KEY

    if (!apiKey) {
        throw new Error('TOGETHER_API_KEY environment variable is not set')
    }

    // Using FLUX.1 Schell - Fast, cheap, and high quality
    const model = 'black-forest-labs/FLUX.1-schnell'
    const endpoint = 'https://api.together.xyz/v1/images/generations'

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            prompt: prompt,
            n: imageCount,
            width: 1024,
            height: 1024,
            steps: 4,
            response_format: 'base64'
        })
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error?.message || `Together.ai API error: ${response.status}`
        throw new Error(errorMessage)
    }

    const data = await response.json()

    if (!data.data) {
        throw new Error('Invalid response from Together.ai API')
    }

    return data.data.map(item => `data:image/jpeg;base64,${item.b64_json}`)
}

/**
 * Generate images using OpenAI DALL-E 3
 */
async function generateWithOpenAI(prompt, imageCount) {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not set')
    }

    const images = []
    const size = process.env.IMAGE_SIZE || '1024x1024'
    const quality = process.env.IMAGE_QUALITY || 'standard'

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
                size,
                quality,
                response_format: 'url'
            })
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            const errorMessage = errorData.error?.message || `OpenAI API error: ${response.status}`
            throw new Error(errorMessage)
        }

        const data = await response.json()

        if (!data.data || !data.data[0] || !data.data[0].url) {
            throw new Error('Invalid response from OpenAI API')
        }

        images.push(data.data[0].url)
    }

    return images
}

/**
 * Main image generation function - routes to appropriate provider
 */
async function generateImages(prompt, imageCount) {
    let provider = (process.env.IMAGE_PROVIDER || '').toLowerCase()

    // Smart default: Prioritize GOOGLE_API_KEY if present for free Imagen 3
    if (!provider && process.env.GOOGLE_API_KEY) {
        provider = 'gemini'
    } else if (!provider && process.env.TOGETHER_API_KEY) {
        provider = 'together'
    } else if (!provider && process.env.OPENAI_API_KEY) {
        provider = 'openai'
    }

    // Default fallback
    if (!provider) {
        provider = 'fallback'
    }

    try {
        switch (provider) {
            case 'gemini':
            case 'google':
                return await generateWithGemini(prompt, imageCount)

            case 'together':
                return await generateWithTogether(prompt, imageCount)

            case 'openai':
                return await generateWithOpenAI(prompt, imageCount)

            case 'fallback':
            default:
                return await generateWithFallback(prompt, imageCount)
        }
    } catch (error) {
        console.warn(`Provider ${provider} failed: ${error.message}. Falling back to visual simulation.`)
        return await generateWithFallback(prompt, imageCount)
    }
}

export default async function handler(req, res) {
    setSecurityHeaders(res)

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        return res.status(405).json({ error: 'Method not allowed. Use POST.' })
    }

    const contentType = req.headers['content-type'] || ''
    if (!contentType.includes('application/json')) {
        return res.status(415).json({ error: 'Unsupported Media Type. Use application/json.' })
    }

    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Invalid request body.' })
    }

    const { prompt, style } = req.body

    if (!prompt) return res.status(400).json({ error: 'Missing required field: prompt' })
    if (typeof prompt !== 'string') return res.status(400).json({ error: 'Invalid prompt type.' })

    const trimmedPrompt = prompt.trim()
    if (trimmedPrompt.length === 0) return res.status(400).json({ error: 'Prompt cannot be empty.' })
    if (trimmedPrompt.length > 4000) return res.status(400).json({ error: 'Prompt too long.' })

    const imageCount = Math.min(Math.max(1, parseInt(process.env.IMAGE_COUNT || '2', 10)), 4)

    try {
        const finalPrompt = buildPrompt(trimmedPrompt, style)
        const imageUrls = await generateImages(finalPrompt, imageCount)

        return res.status(200).json({ images: imageUrls })
    } catch (error) {
        console.error('Error in generate-image:', error.message)
        return res.status(500).json({ error: 'Image generation failed. Please try again.' })
    }
}
