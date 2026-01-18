/**
 * Test Environment Variables
 * GET /api/test-env
 *
 * Simple endpoint to check if environment variables are loaded
 * DELETE THIS FILE after testing!
 */

export default function handler(req, res) {
    const envStatus = {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ? `Set (${process.env.OPENAI_API_KEY.substring(0, 7)}...)` : 'NOT SET',
        OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || 'NOT SET (using default)',
        OPENAI_MODEL: process.env.OPENAI_MODEL || 'NOT SET (using default)',
        VISION_MODEL: process.env.VISION_MODEL || 'NOT SET (using default)',
        IMAGE_MODEL: process.env.IMAGE_MODEL || 'NOT SET (using default)',
        USE_HUGGINGFACE: process.env.USE_HUGGINGFACE || 'NOT SET (using default)'
    }

    return res.status(200).json({
        message: 'Environment Variables Status',
        variables: envStatus,
        note: 'Delete api/test-env.js after testing!'
    })
}
