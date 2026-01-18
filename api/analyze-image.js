/**
 * Analyze Image API Route
 *
 * POST /api/analyze-image
 *
 * Analyzes an image using OpenAI Vision (GPT-4o) and generates a suggested prompt.
 *
 * Request:
 * - Content-Type: application/json
 * - Body (one of):
 *     { "imageUrl": "https://..." }
 *     { "imageBase64": "data:image/png;base64,..." }
 *
 * Response:
 * {
 *   "analysis": {
 *     "objects": ["object1", "object2", ...],
 *     "style": "visual style description",
 *     "mood": "emotional mood/atmosphere",
 *     "lighting": "lighting description"
 *   },
 *   "suggestedPrompt": "A detailed prompt suitable for DALL-E / diffusion models"
 * }
 *
 * Environment Variables Required:
 * - OPENAI_API_KEY: OpenAI API key
 * - OPENAI_BASE_URL: (Optional) Custom base URL for compatible APIs
 * - VISION_MODEL: (Optional) Model to use, defaults to gpt-4o
 */

const SYSTEM_PROMPT = `You are an expert image analyst specializing in visual content analysis for AI image generation.

Analyze the provided image and extract:
1. Objects: List the main objects, subjects, and elements visible in the image
2. Style: Describe the visual/artistic style (e.g., photorealistic, illustration, oil painting, digital art, etc.)
3. Mood: Describe the emotional mood and atmosphere (e.g., peaceful, dramatic, joyful, mysterious, etc.)
4. Lighting: Describe the lighting conditions (e.g., natural sunlight, golden hour, studio lighting, dramatic shadows, etc.)

Then generate a detailed prompt that could recreate a similar image using DALL-E or Stable Diffusion.

Respond ONLY with valid JSON in this exact format:
{
  "analysis": {
    "objects": ["object1", "object2", "object3"],
    "style": "Description of the visual/artistic style",
    "mood": "Description of the mood and atmosphere",
    "lighting": "Description of the lighting"
  },
  "suggestedPrompt": "A detailed, professional image generation prompt that captures the essence of this image. Include style, lighting, mood, composition, and key elements."
}

Guidelines for the suggested prompt:
- Be specific and descriptive
- Include art style and medium
- Mention lighting and atmosphere
- Describe composition when relevant
- Keep it focused and coherent (under 500 characters)`

/**
 * Set security headers
 */
function setSecurityHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
}

/**
 * Validate base64 image data URL format
 */
function isValidBase64Image(str) {
    if (typeof str !== 'string') return false

    // Check for data URL format
    const dataUrlPattern = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/
    if (!dataUrlPattern.test(str)) return false

    // Check reasonable size (max ~20MB base64 = ~27MB string)
    if (str.length > 27 * 1024 * 1024) return false

    return true
}

/**
 * Validate URL format
 */
function isValidUrl(str) {
    if (typeof str !== 'string') return false

    try {
        const url = new URL(str)
        return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
        return false
    }
}

/**
 * Call OpenAI Vision API to analyze the image
 */
async function analyzeImage(imageSource, isUrl) {
    const apiKey = process.env.OPENAI_API_KEY
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    const model = process.env.VISION_MODEL || 'gpt-4o'

    if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not set')
    }

    // Build the image content based on source type
    const imageContent = isUrl
        ? { type: 'image_url', image_url: { url: imageSource, detail: 'high' } }
        : { type: 'image_url', image_url: { url: imageSource, detail: 'high' } }

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Analyze this image and provide the analysis with a suggested generation prompt.' },
                        imageContent
                    ]
                }
            ],
            temperature: 0.7,
            max_tokens: 1000,
            response_format: { type: 'json_object' }
        })
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`
        throw new Error(errorMessage)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
        throw new Error('No response content from Vision API')
    }

    // Parse and validate the JSON response
    const parsed = JSON.parse(content)

    // Validate required fields
    if (!parsed.analysis || !parsed.suggestedPrompt) {
        throw new Error('Invalid response format from Vision API')
    }

    if (!parsed.analysis.objects || !parsed.analysis.style ||
        !parsed.analysis.mood || !parsed.analysis.lighting) {
        throw new Error('Missing required analysis fields from Vision API')
    }

    // Ensure objects is an array
    if (!Array.isArray(parsed.analysis.objects)) {
        parsed.analysis.objects = [parsed.analysis.objects]
    }

    return parsed
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

    const { imageUrl, imageBase64 } = req.body

    // Validate exactly one of imageUrl or imageBase64 is provided
    const hasImageUrl = imageUrl !== undefined && imageUrl !== null
    const hasImageBase64 = imageBase64 !== undefined && imageBase64 !== null

    if (!hasImageUrl && !hasImageBase64) {
        return res.status(400).json({
            error: 'Missing required field: provide either imageUrl or imageBase64'
        })
    }

    if (hasImageUrl && hasImageBase64) {
        return res.status(400).json({
            error: 'Provide only one of imageUrl or imageBase64, not both.'
        })
    }

    // Validate imageUrl if provided
    if (hasImageUrl) {
        if (!isValidUrl(imageUrl)) {
            return res.status(400).json({
                error: 'Invalid imageUrl. Must be a valid HTTP/HTTPS URL.'
            })
        }
    }

    // Validate imageBase64 if provided
    if (hasImageBase64) {
        if (!isValidBase64Image(imageBase64)) {
            return res.status(400).json({
                error: 'Invalid imageBase64. Must be a valid data URL (e.g., data:image/png;base64,...)'
            })
        }
    }

    try {
        // Determine image source
        const imageSource = hasImageUrl ? imageUrl : imageBase64
        const isUrl = hasImageUrl

        // Analyze the image via OpenAI Vision API
        const result = await analyzeImage(imageSource, isUrl)

        // Return strict output format
        return res.status(200).json({
            analysis: result.analysis,
            suggestedPrompt: result.suggestedPrompt
        })
    } catch (error) {
        console.error('Error in analyze-image:', error.message)

        // Check for specific error types
        if (error.message.includes('OPENAI_API_KEY')) {
            return res.status(500).json({
                error: 'Server configuration error. API key not configured.'
            })
        }

        if (error.message.includes('API request failed')) {
            return res.status(502).json({
                error: 'Failed to connect to Vision API. Please try again.'
            })
        }

        if (error instanceof SyntaxError || error.message.includes('Invalid response')) {
            return res.status(502).json({
                error: 'Invalid response from Vision API. Please try again.'
            })
        }

        if (error.message.includes('Could not process image') ||
            error.message.includes('Invalid image')) {
            return res.status(400).json({
                error: 'Could not process the provided image. Please check the image URL or data.'
            })
        }

        return res.status(500).json({
            error: 'Internal server error. Please try again later.'
        })
    }
}
