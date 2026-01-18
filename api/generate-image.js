/**
 * Generate Image API Route
 *
 * POST /api/generate-image
 *
 * Generates images using multiple providers with sophisticated fallback:
 * 1. Google Gemini (Imagen 3) - Primary (if configured)
 * 2. Together.ai (FLUX) - Secondary (if configured)
 * 3. OpenAI (DALL-E) - Tertiary (if configured)
 * 4. Pollinations.ai (Flux) - Free high-quality fallback
 * 5. LoremFlickr - Visual Failsafe (Stock photos)
 * 
 * Environment Variables:
 * - IMAGE_PROVIDER: Force provider (gemini, together, openai, pollinations, fallback)
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

    // Improved style merging
    return `${prompt}. Image style: ${style}`
}

/**
 * Level 5: LoremFlickr (Stock Photos)
 * Absolute last resort failsafe
 */
async function generateWithStockFallback(prompt, imageCount) {
    const images = []
    // Extract first valid noun-like keyword (simplified)
    const words = prompt.split(' ').filter(w => w.length > 3)
    const keyword = words[0] || 'nature' // Use single strong keyword for better relevance

    for (let i = 0; i < imageCount; i++) {
        const random = Math.floor(Math.random() * 100000)
        const imageUrl = `https://loremflickr.com/1024/1024/${encodeURIComponent(keyword)}?random=${random}`
        images.push(imageUrl)
    }
    return images
}

/**
 * Level 4: Pollinations.ai (Flux Model)
 * Free, high quality AI generation. Rate limited sometimes.
 */
async function generateWithPollinations(prompt, imageCount) {
    const images = []

    for (let i = 0; i < imageCount; i++) {
        const seed = Math.floor(Math.random() * 10000000)
        const encodedPrompt = encodeURIComponent(prompt)
        // Use Flux model, no logo, private to avoid caching issues
        // enhance=false speeds it up
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux&private=true&enhance=false`
        images.push(imageUrl)
    }
    return images
}

/**
 * Level 1: Google Gemini (Imagen 3)
 * Free tier, high quality
 */
async function generateWithGemini(prompt, imageCount) {
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) throw new Error('GOOGLE_API_KEY not set')

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
                // Add safety settings to reduce aggressive filtering
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
        throw new Error(errorData.error?.message || `Gemini API error ${response.status}`)
    }

    const data = await response.json()
    if (!data.predictions) throw new Error('Gemini returned no predictions')

    return data.predictions.map(pred => `data:${pred.mimeType};base64,${pred.bytesBase64Encoded}`)
}

async function generateWithTogether(prompt, imageCount) {
    const apiKey = process.env.TOGETHER_API_KEY
    if (!apiKey) throw new Error('TOGETHER_API_KEY not set')

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
        else provider = 'pollinations' // Use Free AI by default instead of fallback
    }

    // Try Primary Provider
    try {
        switch (provider) {
            case 'gemini': return await generateWithGemini(prompt, imageCount)
            case 'together': return await generateWithTogether(prompt, imageCount)
            case 'openai': return await generateWithOpenAI(prompt, imageCount)
            case 'pollinations': return await generateWithPollinations(prompt, imageCount)
            default: return await generateWithStockFallback(prompt, imageCount)
        }
    } catch (e) {
        console.warn(`Primary provider ${provider} failed: ${e.message}`)

        // 1st Fallback: Pollinations (Free AI)
        if (provider !== 'pollinations') {
            try {
                console.log('Falling back to Pollinations AI...')
                return await generateWithPollinations(prompt, imageCount)
            } catch (pError) {
                console.warn('Pollinations failed, moving to stock photos.')
            }
        }

        // 2nd Fallback: Stock Photos (Guaranteed)
        return await generateWithStockFallback(prompt, imageCount)
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
        console.error('Final generation error:', error)
        return res.status(500).json({ error: 'Failed to generate images' })
    }
}
