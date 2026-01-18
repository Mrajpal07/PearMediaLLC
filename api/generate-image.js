/**
 * Generate Image API Route
 *
 * POST /api/generate-image
 *
 * Generates images using multiple providers:
 * - OpenAI DALL-E 3 (paid, best quality)
 * - Hugging Face (free tier, 1000 req/month)
 * - Pollinations.ai (free, unlimited, no key needed)
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
 * - IMAGE_PROVIDER: Provider to use (openai, huggingface, pollinations) - default: pollinations
 * - OPENAI_API_KEY: Required for openai provider
 * - HUGGINGFACE_API_KEY: Required for huggingface provider
 * - IMAGE_COUNT: Number of images (1-3, default: 2)
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
 * Generate images using Pollinations.ai (FREE, no API key needed)
 * https://pollinations.ai - Unlimited free image generation
 */
async function generateWithPollinations(prompt, imageCount) {
    const images = []

    for (let i = 0; i < imageCount; i++) {
        // Add slight variation to get different images
        const seed = Math.floor(Math.random() * 1000000)
        const encodedPrompt = encodeURIComponent(prompt)

        // Pollinations.ai direct image URL
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true`

        images.push(imageUrl)
    }

    return images
}

/**
 * Generate images using Hugging Face Inference API (FREE tier: 1000 req/month)
 * Requires HUGGINGFACE_API_KEY environment variable
 */
async function generateWithHuggingFace(prompt, imageCount) {
    const apiKey = process.env.HUGGINGFACE_API_KEY

    if (!apiKey) {
        throw new Error('HUGGINGFACE_API_KEY environment variable is not set')
    }

    const images = []
    // Use Stable Diffusion XL - more reliable on free Inference API than FLUX
    const model = 'stabilityai/stable-diffusion-xl-base-1.0'
    const endpoint = `https://api-inference.huggingface.co/models/${model}`

    for (let i = 0; i < imageCount; i++) {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: prompt,
            })
        })

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error')

            // Check for model loading
            if (errorText.includes('loading') || response.status === 503) {
                throw new Error('Model is loading. Please wait 20-30 seconds and try again.')
            }

            throw new Error(`Hugging Face API error: ${response.status}`)
        }

        // HF returns binary image data
        const imageBuffer = await response.arrayBuffer()
        const base64 = Buffer.from(imageBuffer).toString('base64')
        const mimeType = response.headers.get('content-type') || 'image/jpeg'
        const dataUrl = `data:${mimeType};base64,${base64}`

        images.push(dataUrl)
    }

    return images
}

/**
 * Generate images using OpenAI DALL-E 3 (PAID)
 * Requires OPENAI_API_KEY environment variable
 */
async function generateWithOpenAI(prompt, imageCount) {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not set')
    }

    const images = []
    const size = process.env.IMAGE_SIZE || '1024x1024'
    const quality = process.env.IMAGE_QUALITY || 'standard'

    // DALL-E 3: Sequential generation (n=1 limitation)
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
 * Includes AUTO-FALLBACK to Pollinations if primary provider fails
 */
async function generateImages(prompt, imageCount) {
    const provider = (process.env.IMAGE_PROVIDER || 'pollinations').toLowerCase()

    try {
        // Attempt primary provider
        switch (provider) {
            case 'openai':
                return await generateWithOpenAI(prompt, imageCount)

            case 'huggingface':
            case 'hf':
                return await generateWithHuggingFace(prompt, imageCount)

            case 'pollinations':
            default:
                return await generateWithPollinations(prompt, imageCount)
        }
    } catch (error) {
        // If primary provider fails (e.g. 410 Gone, 402 Billing, 500 Error), 
        // fallback to free Pollinations API automatically
        console.warn(`Provider ${provider} failed: ${error.message}. Falling back to Pollinations.`)

        // Return Pollinations result immediately
        return await generateWithPollinations(prompt, imageCount)
    }
}

export default async function handler(req, res) {
    // Set security headers
    setSecurityHeaders(res)

    // Only allow POST requests
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        return res.status(405).json({
            error: 'Method not allowed. Use POST.'
        })
    }

    // Validate Content-Type
    const contentType = req.headers['content-type'] || ''
    if (!contentType.includes('application/json')) {
        return res.status(415).json({
            error: 'Unsupported Media Type. Use application/json.'
        })
    }

    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({
            error: 'Invalid request body.'
        })
    }

    const { prompt, style } = req.body

    // Validate prompt field (required)
    if (prompt === undefined || prompt === null) {
        return res.status(400).json({
            error: 'Missing required field: prompt'
        })
    }

    if (typeof prompt !== 'string') {
        return res.status(400).json({
            error: 'Invalid field type: prompt must be a string.'
        })
    }

    const trimmedPrompt = prompt.trim()

    if (trimmedPrompt.length === 0) {
        return res.status(400).json({
            error: 'Prompt cannot be empty.'
        })
    }

    if (trimmedPrompt.length > 4000) {
        return res.status(400).json({
            error: 'Prompt too long. Maximum 4,000 characters allowed.'
        })
    }

    // Validate optional style field
    if (style !== undefined && typeof style !== 'string') {
        return res.status(400).json({
            error: 'Invalid field type: style must be a string.'
        })
    }

    // Determine number of images to generate (1-3)
    const imageCount = Math.min(Math.max(1, parseInt(process.env.IMAGE_COUNT || '2', 10)), 3)

    try {
        // Build final prompt with optional style
        const finalPrompt = buildPrompt(trimmedPrompt, style)

        // Generate images using configured provider
        const imageUrls = await generateImages(finalPrompt, imageCount)

        return res.status(200).json({
            images: imageUrls
        })
    } catch (error) {
        console.error('Error in generate-image:', error.message)

        // Check for specific error types
        if (error.message.includes('API_KEY')) {
            return res.status(500).json({
                error: 'Server configuration error. API key not configured.'
            })
        }

        if (error.message.includes('loading')) {
            return res.status(503).json({
                error: 'Model is loading. Please wait 20-30 seconds and try again.'
            })
        }

        if (error.message.includes('Billing') || error.message.includes('limit')) {
            return res.status(402).json({
                error: 'API billing limit reached. Please try a free provider.'
            })
        }

        if (error.message.includes('content policy')) {
            return res.status(400).json({
                error: 'Prompt violates content policy. Please modify your description.'
            })
        }

        return res.status(500).json({
            error: 'Image generation failed. Please try again.'
        })
    }
}
