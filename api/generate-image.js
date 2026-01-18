/**
 * Generate Image API Route
 *
 * POST /api/generate-image
 *
 * Generates images using AI providers ONLY (No stock photo fallback):
 * 1. Google Gemini (Imagen 3) - Primary (if configured)
 * 2. Together.ai (FLUX) - Secondary (if configured)
 * 3. OpenAI (DALL-E) - Tertiary (if configured)
 * 4. Pollinations.ai (Flux) - Free high-quality Fallback
 * 
 * Environment Variables:
 * - IMAGE_PROVIDER: Force provider (gemini, together, openai, pollinations)
 * - GOOGLE_API_KEY: Required for gemini
 * - TOGETHER_API_KEY: Required for together
 * - OPENAI_API_KEY: Required for openai
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
 * Pollinations.ai (Flux Model)
 * Free, high quality AI generation. 
 * This is the primary "Free Tier" provider.
 */
async function generateWithPollinations(prompt, imageCount) {
    const images = []

    for (let i = 0; i < imageCount; i++) {
        // Random seed for variation
        const seed = Math.floor(Math.random() * 10000000)
        const encodedPrompt = encodeURIComponent(prompt)

        // Use Flux model for best accuracy
        // nologo=true: Removes watermark
        // private=true: Avoids public gallery (and potential rate limit overlap)
        // enhance=true: Slight prompt enhancement for better results
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux&private=true&enhance=true`

        console.log(`Generated Pollinations URL: ${imageUrl}`)
        images.push(imageUrl)
    }
    return images
}

async function generateWithGemini(prompt, imageCount) {
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) throw new Error('GOOGLE_API_KEY not set')

    console.log('Using Gemini (Imagen 3)...')
    const model = 'imagen-3.0-generate-001'
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`

    // Optimize prompt for Imagen
    const enhancedPrompt = `High quality, highly detailed image of: ${prompt}`

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            instances: [{ prompt: enhancedPrompt }],
            parameters: {
                sampleCount: Math.min(imageCount, 4),
                aspectRatio: "1:1",
                // Reduced safety filters to prevent over-blocking
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
                ]
            }
        })
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const msg = errorData.error?.message || `Gemini API error ${response.status}`
        throw new Error(msg)
    }

    const data = await response.json()
    if (!data.predictions) throw new Error('Gemini returned no predictions')

    return data.predictions.map(pred => `data:${pred.mimeType};base64,${pred.bytesBase64Encoded}`)
}

async function generateWithTogether(prompt, imageCount) {
    const apiKey = process.env.TOGETHER_API_KEY
    if (!apiKey) throw new Error('TOGETHER_API_KEY not set')

    console.log('Using Together.ai (FLUX)...')
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
        })
    })

    if (!response.ok) throw new Error(`Together API error ${response.status}`)
    const data = await response.json()
    return data.data.map(item => `data:image/jpeg;base64,${item.b64_json}`)
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

    // Smart Prioritization
    if (!provider) {
        if (process.env.GOOGLE_API_KEY) provider = 'gemini'
        else if (process.env.TOGETHER_API_KEY) provider = 'together'
        else if (process.env.OPENAI_API_KEY) provider = 'openai'
        else provider = 'pollinations' // Default to Free AI
    }

    console.log(`Selected Provider: ${provider}`)

    try {
        switch (provider) {
            case 'gemini': return await generateWithGemini(prompt, imageCount)
            case 'together': return await generateWithTogether(prompt, imageCount)
            case 'openai': return await generateWithOpenAI(prompt, imageCount)
            case 'pollinations': return await generateWithPollinations(prompt, imageCount)
            default:
                // If unknown, default to Pollinations
                return await generateWithPollinations(prompt, imageCount)
        }
    } catch (e) {
        console.warn(`Primary provider ${provider} failed: ${e.message}`)

        // Auto-Fallback Logic
        // If the primary wasn't Pollinations, try Pollinations (Free Flux)
        if (provider !== 'pollinations') {
            try {
                console.log('Failing over to Pollinations.ai (Flux)...')
                return await generateWithPollinations(prompt, imageCount)
            } catch (pError) {
                console.error('Pollinations fallback failed:', pError.message)
            }
        }

        // NO STOCK PHOTO FALLBACK.
        // Re-throw the error so the UI shows failure message instead of bad image.
        throw new Error(`Generation failed. Provider ${provider} and fallback both failed.`)
    }
}

export default async function handler(req, res) {
    setSecurityHeaders(res)
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { prompt, style } = req.body
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' })

    // Limit count to 4 max
    const imageCount = Math.min(Math.max(1, parseInt(process.env.IMAGE_COUNT || '2', 10)), 4)

    try {
        const finalPrompt = buildPrompt(prompt, style)
        const imageUrls = await generateImages(finalPrompt, imageCount)
        return res.status(200).json({ images: imageUrls })
    } catch (error) {
        console.error('Final generation error:', error.message)

        // Return descriptive error to UI so user knows AI is busy/down
        return res.status(503).json({
            error: 'AI Generation Service Unavailable. Please try again later or check API keys.'
        })
    }
}
