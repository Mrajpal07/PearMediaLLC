import { useState } from 'react'
import './App.css'
import TextWorkflow from './components/TextWorkflow'
import ImageWorkflow from './components/ImageWorkflow'

function App() {
    const [activeTab, setActiveTab] = useState('text')

    return (
        <div className="app">
            <header className="app-header">
                <div className="logo">
                    <span className="logo-icon">🍐</span>
                    <h1>PearMedia AI</h1>
                </div>
                <p className="tagline">AI-Powered Content Enhancement & Generation</p>
            </header>

            <nav className="workflow-tabs">
                <button
                    className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
                    onClick={() => setActiveTab('text')}
                >
                    <span className="tab-icon">✍️</span>
                    Text Workflow
                </button>
                <button
                    className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`}
                    onClick={() => setActiveTab('image')}
                >
                    <span className="tab-icon">🖼️</span>
                    Image Workflow
                </button>
            </nav>

            <main className="workflow-content">
                {activeTab === 'text' && <TextWorkflow />}
                {activeTab === 'image' && <ImageWorkflow />}
            </main>

            <footer className="app-footer">
                <p>© 2026 PearMedia AI — Prototype</p>
            </footer>
        </div>
    )
}

export default App
