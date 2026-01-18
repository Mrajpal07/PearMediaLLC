/**
 * Generate Image API Route
 *
 * POST /api/generate-image
 *
 * Generates images using OpenAI DALL-E 3 based on enhanced prompts.
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
 * Environment Variables Required:
 * - OPENAI_API_KEY: OpenAI API key
 * - OPENAI_BASE_URL: (Optional) Custom base URL for compatible APIs
 * - IMAGE_COUNT: (Optional) Number of images to generate (1-3, default: 2)
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
 * Call OpenAI DALL-E API to generate images
 */
async function generateImages(prompt, imageCount) {
    const apiKey = process.env.OPENAI_API_KEY
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'

    if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not set')
    }

    // DALL-E 3 supports n=1 only, DALL-E 2 supports n=1-10
    // We'll use DALL-E 3 for quality but generate sequentially if needed
    const model = 'dall-e-3'
    const size = '1024x1024'
    const quality = 'standard' // 'standard' or 'hd'

    const images = []

    // Generate images sequentially (DALL-E 3 limitation: n=1 only)
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
                quality,
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
