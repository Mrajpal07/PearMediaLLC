import { useState } from 'react'
import './TextWorkflow.css'

/**
 * TextWorkflow Component
 * 
 * A multi-step workflow for prompt enhancement and image generation:
 * 1. Input - User enters a prompt description
 * 2. Analyze - Calls /api/enhance-text, displays analysis + enhanced prompt
 * 3. Approve - User reviews and approves the enhanced prompt
 * 4. Generate - Calls /api/generate-image, displays generated images
 * 
 * @component
 */
function TextWorkflow() {
    // Workflow state
    const [step, setStep] = useState(1) // 1: Input, 2: Analyze, 3: Approve, 4: Generate
    const [inputPrompt, setInputPrompt] = useState('')
    const [analysis, setAnalysis] = useState(null)
    const [enhancedPrompt, setEnhancedPrompt] = useState('')
    const [generatedImages, setGeneratedImages] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState(null)

    /**
     * Step 1 → 2: Submit prompt for AI analysis and enhancement
     * API: POST /api/enhance-text { prompt }
     * Response: { analysis: { intent, tone, style }, enhancedPrompt }
     */
    const handleEnhance = async () => {
        if (!inputPrompt.trim()) return

        setIsLoading(true)
        setStatus({ type: 'processing', message: 'Analyzing and enhancing prompt...' })

        try {
            const response = await fetch('/api/enhance-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: inputPrompt })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Enhancement failed')
            }

            // Store the analysis and enhanced prompt from API response
            setAnalysis(data.analysis)
            setEnhancedPrompt(data.enhancedPrompt)
            setStep(2)
            setStatus({ type: 'success', message: 'Prompt analyzed and enhanced!' })
        } catch (error) {
            setStatus({ type: 'error', message: error.message || 'Enhancement failed. Please try again.' })
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Step 2 → 3: Approve the enhanced prompt
     */
    const handleApprove = () => {
        setStep(3)
        setStatus({ type: 'success', message: 'Enhanced prompt approved!' })
    }

    /**
     * Step 3 → 4: Generate images using the enhanced prompt
     * API: POST /api/generate-image { prompt, style? }
     * Response: { images: [url1, url2, ...] }
     */
    const handleGenerate = async () => {
        setIsLoading(true)
        setStatus({ type: 'processing', message: 'Generating images with DALL-E 3...' })

        try {
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: enhancedPrompt,
                    style: analysis?.style || undefined
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Image generation failed')
            }

            // Store generated image URLs
            setGeneratedImages(data.images || [])
            setStep(4)
            setStatus({ type: 'success', message: `Generated ${data.images?.length || 0} images!` })
        } catch (error) {
            setStatus({ type: 'error', message: error.message || 'Generation failed. Please try again.' })
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Reset workflow to initial state
     */
    const handleReset = () => {
        setStep(1)
        setInputPrompt('')
        setAnalysis(null)
        setEnhancedPrompt('')
        setGeneratedImages([])
        setStatus(null)
    }

    return (
        <div className="text-workflow">
            {/* Progress Steps */}
            <div className="workflow-progress">
                <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                    <div className="step-number">1</div>
                    <span>Input</span>
                </div>
                <div className="progress-line"></div>
                <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                    <div className="step-number">2</div>
                    <span>Analyze</span>
                </div>
                <div className="progress-line"></div>
                <div className={`progress-step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
                    <div className="step-number">3</div>
                    <span>Approve</span>
                </div>
                <div className="progress-line"></div>
                <div className={`progress-step ${step >= 4 ? 'active' : ''}`}>
                    <div className="step-number">4</div>
                    <span>Generate</span>
                </div>
            </div>

            {/* Workflow Card */}
            <div className="workflow-card glass-panel">
                {/* Step 1: Input */}
                {step === 1 && (
                    <div className="workflow-step animate-fade-in">
                        <h2>📝 Describe Your Image</h2>
                        <p className="step-description">
                            Enter a description of the image you want to create. Our AI will analyze and enhance your prompt for optimal results.
                        </p>
                        <textarea
                            value={inputPrompt}
                            onChange={(e) => setInputPrompt(e.target.value)}
                            placeholder="Describe what you want to create, e.g., 'A cat sitting on a windowsill at sunset'"
                            rows={6}
                        />
                        <div className="step-actions">
                            <button
                                className="btn btn-primary"
                                onClick={handleEnhance}
                                disabled={!inputPrompt.trim() || isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <span>✨</span>
                                        Enhance Prompt
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Review Analysis */}
                {step === 2 && (
                    <div className="workflow-step animate-fade-in">
                        <h2>🔍 AI Analysis Results</h2>
                        <p className="step-description">
                            Review the AI analysis and enhanced prompt for image generation.
                        </p>

                        {/* Analysis Cards */}
                        <div className="analysis-cards">
                            <div className="analysis-card">
                                <h4>🎯 Intent</h4>
                                <p>{analysis?.intent || 'N/A'}</p>
                            </div>
                            <div className="analysis-card">
                                <h4>🎨 Tone</h4>
                                <p>{analysis?.tone || 'N/A'}</p>
                            </div>
                            <div className="analysis-card">
                                <h4>✨ Style</h4>
                                <p>{analysis?.style || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Comparison View */}
                        <div className="comparison-view">
                            <div className="comparison-panel">
                                <h4>Original Prompt</h4>
                                <div className="text-preview">{inputPrompt}</div>
                            </div>
                            <div className="comparison-panel enhanced">
                                <h4>Enhanced Prompt</h4>
                                <div className="text-preview">{enhancedPrompt}</div>
                            </div>
                        </div>

                        <div className="step-actions">
                            <button className="btn btn-secondary" onClick={() => setStep(1)}>
                                ← Back
                            </button>
                            <button className="btn btn-primary" onClick={handleApprove}>
                                <span>✓</span>
                                Approve & Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Approve & Generate */}
                {step === 3 && (
                    <div className="workflow-step animate-fade-in">
                        <h2>🚀 Ready to Generate</h2>
                        <p className="step-description">
                            Your enhanced prompt is approved. Click generate to create images with DALL-E 3.
                        </p>

                        <div className="approved-text">
                            <div className="approved-badge">
                                <span>✓</span> Approved
                            </div>
                            <div className="text-preview">{enhancedPrompt}</div>
                        </div>

                        <div className="step-actions">
                            <button className="btn btn-secondary" onClick={() => setStep(2)}>
                                ← Back
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleGenerate}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <span>🖼️</span>
                                        Generate Images
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Generated Images */}
                {step === 4 && (
                    <div className="workflow-step animate-fade-in">
                        <h2>🎉 Images Generated!</h2>
                        <p className="step-description">
                            Your AI-generated images are ready. Click on any image to view full size.
                        </p>

                        <div className="generated-images-grid">
                            {generatedImages.map((imageUrl, index) => (
                                <div key={index} className="generated-image-card">
                                    <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                                        <img src={imageUrl} alt={`Generated ${index + 1}`} />
                                    </a>
                                    <div className="image-label">Image {index + 1}</div>
                                </div>
                            ))}
                        </div>

                        <div className="prompt-used">
                            <h4>Prompt Used</h4>
                            <p>{enhancedPrompt}</p>
                        </div>

                        <div className="step-actions">
                            <button className="btn btn-secondary" onClick={() => setStep(3)}>
                                ← Regenerate
                            </button>
                            <button className="btn btn-primary" onClick={handleReset}>
                                <span>↻</span>
                                Start New
                            </button>
                        </div>
                    </div>
                )}

                {/* Status Message */}
                {status && (
                    <div className={`status-message ${status.type}`}>
                        {status.message}
                    </div>
                )}
            </div>
        </div>
    )
}

export default TextWorkflow
