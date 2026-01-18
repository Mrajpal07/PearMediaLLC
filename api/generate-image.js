/**
 * Generate Image API Route
 *
 * POST /api/generate-image
 *
 * Generates images using any OpenAI-compatible image generation API.
 * Supports: OpenAI DALL-E, Hugging Face, and other compatible providers.
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
 * - OPENAI_API_KEY: API key (OpenAI, Hugging Face, etc.) - REQUIRED
 * - OPENAI_BASE_URL: Custom base URL (default: https://api.openai.com/v1)
 * - IMAGE_MODEL: Model to use (default: dall-e-3)
 * - IMAGE_COUNT: Number of images to generate (1-10, default: 2)
 * - IMAGE_SIZE: Image dimensions (default: 1024x1024)
 * - IMAGE_QUALITY: Quality setting (default: standard, options: standard/hd)
 * - USE_HUGGINGFACE: Set to 'true' for Hugging Face compatibility
 *
 * Provider Examples:
 * - OpenAI DALL-E 3: IMAGE_MODEL=dall-e-3, OPENAI_BASE_URL=https://api.openai.com/v1
 * - Hugging Face SDXL: IMAGE_MODEL=stabilityai/stable-diffusion-xl-base-1.0,
 *                      OPENAI_BASE_URL=https://api-inference.huggingface.co/v1,
 *                      USE_HUGGINGFACE=true
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

    // Subtle style incorporation based on common styles
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
 * Call LLM provider's image generation API
 * Supports: OpenAI DALL-E, Hugging Face, and other OpenAI-compatible APIs
 */
async function generateImages(prompt, imageCount) {
    const apiKey = process.env.OPENAI_API_KEY
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    const model = process.env.IMAGE_MODEL || 'dall-e-3'
    const size = process.env.IMAGE_SIZE || '1024x1024'
    const quality = process.env.IMAGE_QUALITY || 'standard'
    const useHuggingFace = process.env.USE_HUGGINGFACE === 'true'

    if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not set')
    }

    const images = []

    // Determine if we need sequential generation (DALL-E 3 limitation: n=1)
    const isDallE3 = model.toLowerCase().includes('dall-e-3')
    const needsSequential = isDallE3 || useHuggingFace

    if (needsSequential) {
        // Generate images sequentially
        for (let i = 0; i < imageCount; i++) {
            const response = await fetch(`${baseUrl}/images/generations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model,
                    prompt,
                    n: 1,
                    size,
                    quality: isDallE3 ? quality : undefined, // Only DALL-E 3 supports quality
                    response_format: 'url' // 'url' or 'b64_json'
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                const errorMessage = errorData.error?.message || `Image generation failed with status ${response.status}`
                throw new Error(errorMessage)
            }

            const data = await response.json()

            if (!data.data || !data.data[0] || !data.data[0].url) {
                throw new Error('Invalid response from image generation API')
            }

            images.push(data.data[0].url)
        }
    } else {
        // Generate all images in one request (DALL-E 2, other providers)
        const response = await fetch(`${baseUrl}/images/generations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                prompt,
                n: imageCount,
                size,
                response_format: 'url'
            })
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            const errorMessage = errorData.error?.message || `Image generation failed with status ${response.status}`
            throw new Error(errorMessage)
        }

        const data = await response.json()

        if (!data.data || data.data.length === 0) {
            throw new Error('Invalid response from image generation API')
        }

        images.push(...data.data.map(item => item.url))
    }

    return images
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

        // Generate images via DALL-E API
        const imageUrls = await generateImages(finalPrompt, imageCount)

        // Return strict output format
        return res.status(200).json({
            images: imageUrls
        })
    } catch (error) {
        console.error('Error in generate-image:', error.message)

        // Check for specific error types
        if (error.message.includes('OPENAI_API_KEY')) {
            return res.status(500).json({
                error: 'Server configuration error. API key not configured.'
            })
        }

        if (error.message.includes('Image generation failed') || error.message.includes('Invalid response')) {
            return res.status(502).json({
                error: 'Failed to generate images. Please try again.'
            })
        }

        if (error.message.includes('content policy')) {
            return res.status(400).json({
                error: 'Prompt violates content policy. Please modify your description.'
            })
        }

        return res.status(500).json({
            error: 'Internal server error. Please try again later.'
        })
    }
}
