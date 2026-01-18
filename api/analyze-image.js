/**
 * Analyze Image API Route
 *
 * POST /api/analyze-image
 *
 * Analyzes an image using:
 * 1. Google Gemini (Gemini 1.5 Flash/Pro) - Primary (Free/Fast)
 * 2. OpenAI (GPT-4o) - Secondary
 */

const SYSTEM_PROMPT = `Analyze the provided image and extract:
1. Objects: List the main objects, subjects, and elements visible
2. Style: Describe the visual/artistic style
3. Mood: Describe the emotional mood and atmosphere
4. Lighting: Describe the lighting conditions

Then generate a detailed prompt suitable for DALL-E/Flux.

Respond ONLY with valid JSON:
{
  "analysis": {
    "objects": ["obj1", "obj2"],
    "style": "...",
    "mood": "...",
    "lighting": "..."
  },
  "suggestedPrompt": "..."
}`

function setSecurityHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
}

// Helper to clean base64 string
function getBase64Data(dataUrl) {
    return dataUrl.split(',')[1]
}

function getMimeType(dataUrl) {
    return dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'))
}

async function analyzeWithGemini(apiKey, imageBase64) {
    // List of models to try in order of preference/stability
    const models = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-2.0-flash-exp',
        'gemini-1.5-pro'
    ]

    const mimeType = getMimeType(imageBase64)
    const rawBase64 = getBase64Data(imageBase64)
    let lastError = null

    for (const model of models) {
        try {
            console.log(`Trying Gemini model: ${model}...`)
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: SYSTEM_PROMPT },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: rawBase64
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        response_mime_type: "application/json"
                    }
                })
            })

            if (!response.ok) {
                const err = await response.json().catch(() => ({}))
                throw new Error(err.error?.message || `Status ${response.status}`)
            }

            const data = await response.json()
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text
            if (!text) throw new Error('Empty response')

            return JSON.parse(text)

        } catch (e) {
            console.warn(`Gemini model ${model} failed: ${e.message}`)
            lastError = e
            // Continue to next model
        }
    }

    throw lastError || new Error('All Gemini models failed')
}

async function analyzeWithOpenAI(apiKey, imageSource, isUrl) {
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    const imageContent = isUrl
        ? { type: 'image_url', image_url: { url: imageSource } }
        : { type: 'image_url', image_url: { url: imageSource } }

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Analyze this image.' },
                        imageContent
                    ]
                }
            ],
            response_format: { type: 'json_object' }
        })
    })

    if (!response.ok) throw new Error(`OpenAI Vision error ${response.status}`)
    const data = await response.json()
    return JSON.parse(data.choices[0].message.content)
}

export default async function handler(req, res) {
    setSecurityHeaders(res)
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    if (!req.body?.imageBase64) return res.status(400).json({ error: 'imageBase64 required' })

    const { imageBase64 } = req.body

    try {
        let result;

        // Priority: Gemini -> OpenAI
        if (process.env.GOOGLE_API_KEY) {
            console.log('Using Gemini Vision...')
            result = await analyzeWithGemini(process.env.GOOGLE_API_KEY, imageBase64)
        } else if (process.env.OPENAI_API_KEY) {
            console.log('Using OpenAI Vision...')
            result = await analyzeWithOpenAI(process.env.OPENAI_API_KEY, imageBase64, false)
        } else {
            throw new Error('No Vision API keys found (GOOGLE_API_KEY or OPENAI_API_KEY)')
        }

        return res.status(200).json(result)

    } catch (error) {
        console.error('Analysis failed:', error.message)
        return res.status(500).json({ error: error.message || 'Analysis failed' })
    }
}
