/**
 * Enhance Text API Route
 *
 * POST /api/enhance-text
 *
 * Analyzes user input and rewrites it into a high-quality image generation prompt.
 * Supports: OpenAI, Hugging Face, Azure OpenAI, and any OpenAI-compatible LLM API.
 *
 * Request:
 * - Content-Type: application/json
 * - Body: { prompt: string }
 *
 * Response:
 * {
 *   "analysis": {
 *     "intent": "What the user wants to create",
 *     "tone": "formal | casual | creative | dramatic | etc.",
 *     "style": "Art style, realism, lighting, mood requirements"
 *   },
 *   "enhancedPrompt": "Rewritten high-quality image generation prompt"
 * }
 *
 * Environment Variables:
 * - OPENAI_API_KEY: API key (OpenAI, Hugging Face, etc.) - REQUIRED
 * - OPENAI_BASE_URL: Custom base URL (default: https://api.openai.com/v1)
 * - OPENAI_MODEL: Model to use (default: gpt-4o-mini)
 *
 * Provider Examples:
 * - OpenAI: OPENAI_MODEL=gpt-4o-mini
 * - Hugging Face: OPENAI_MODEL=meta-llama/Meta-Llama-3.1-70B-Instruct,
 *                 OPENAI_BASE_URL=https://api-inference.huggingface.co/v1
 */

const SYSTEM_PROMPT = `You are an expert prompt engineer specializing in image generation prompts.

Your task is to analyze user input and transform it into a high-quality, detailed image generation prompt.

For each input, you must:
1. Analyze the user's intent (what they want to create)
2. Identify the tone (formal, casual, creative, dramatic, whimsical, etc.)
3. Extract or infer visual/style requirements (art style, realism level, lighting, mood, color palette, composition)
4. Rewrite the input into a detailed, professional image generation prompt

Respond ONLY with valid JSON in this exact format:
{
  "analysis": {
    "intent": "Clear description of what the user wants",
    "tone": "The emotional/stylistic tone",
    "style": "Art style, lighting, mood, and visual requirements"
  },
  "enhancedPrompt": "A detailed, professional image generation prompt that captures all requirements. Include specific details about composition, lighting, style, colors, and mood."
}

Guidelines for enhanced prompts:
- Be specific and descriptive
- Include art style (photorealistic, digital art, oil painting, etc.)
- Specify lighting conditions
- Describe mood and atmosphere
- Add composition details when relevant
- Keep prompts focused and coherent`

/**
 * Set security headers
 */
function setSecurityHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
}

/**
 * Call the LLM API to analyze and enhance the prompt
 */
async function callLLM(prompt) {
    const apiKey = process.env.OPENAI_API_KEY
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

    if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not set')
    }

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
                { role: 'user', content: prompt }
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
        throw new Error('No response content from LLM')
    }

    // Parse and validate the JSON response
    const parsed = JSON.parse(content)

    // Validate required fields
    if (!parsed.analysis || !parsed.enhancedPrompt) {
        throw new Error('Invalid response format from LLM')
    }

    if (!parsed.analysis.intent || !parsed.analysis.tone || !parsed.analysis.style) {
        throw new Error('Missing required analysis fields from LLM')
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

    const { prompt } = req.body

    // Validate prompt field
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

    if (trimmedPrompt.length > 5000) {
        return res.status(400).json({
            error: 'Prompt too long. Maximum 5,000 characters allowed.'
        })
    }

    try {
        // Call LLM to analyze and enhance the prompt
        const result = await callLLM(trimmedPrompt)

        return res.status(200).json({
            analysis: result.analysis,
            enhancedPrompt: result.enhancedPrompt
        })
    } catch (error) {
        console.error('Error in enhance-text:', error.message)

        // Check for specific error types
        if (error.message.includes('OPENAI_API_KEY')) {
            return res.status(500).json({
                error: 'Server configuration error. API key not configured.'
            })
        }

        if (error.message.includes('API request failed')) {
            return res.status(502).json({
                error: 'Failed to connect to AI service. Please try again.'
            })
        }

        if (error instanceof SyntaxError || error.message.includes('Invalid response')) {
            return res.status(502).json({
                error: 'Invalid response from AI service. Please try again.'
            })
        }

        return res.status(500).json({
            error: 'Internal server error. Please try again later.'
        })
    }
}
