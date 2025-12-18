import React from 'react';
import './LandingPage.css';

const LandingPage = ({ onLaunchApp }) => {
    return (
        <div className="landing-page">
            <nav className="landing-nav">
                <div className="logo-container">
                    <img src="data:image/svg+xml,%3csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3clinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3e%3cstop offset='0%25' style='stop-color:%2361dafb;stop-opacity:1' /%3e%3cstop offset='100%25' style='stop-color:%239261fb;stop-opacity:1' /%3e%3c/linearGradient%3e%3c/defs%3e%3cpath d='M 50 10 L 10 90 H 30 L 50 40 L 70 90 H 90 L 50 10 Z' fill='url(%23grad1)' /%3e%3cpath d='M 40 60 H 60 L 50 80 Z' fill='url(%23grad1)' /%3e%3c/svg%3e" alt="AYA Logo" />
                    <span className="logo-text">AYA</span>
                </div>
                <div className="nav-links">
                    <button className="launch-btn" onClick={onLaunchApp}>Launch App</button>
                </div>
            </nav>

            <main>
                <div className="hero-section">
                    <h1 className="hero-title">
                        The Future of <br />
                        <span className="gradient-text">Intelligent Trading</span>
                    </h1>
                    <p className="hero-subtitle">
                        Experience the power of AI-driven portfolio analysis and seamless token swaps on the Sepolia Testnet.
                    </p>
                    <div className="cta-group">
                        <button className="launch-btn cta-primary" onClick={onLaunchApp}>Start Trading Now</button>
                    </div>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">🤖</div>
                        <h3>AI-Powered Insights</h3>
                        <p>Get real-time analysis of your portfolio composition and personalized diversification strategies powered by Google Gemini.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">⚡</div>
                        <h3>Instant Swaps</h3>
                        <p>Execute trades instantly with Uniswap V2 integration. Secure, fast, and reliable token exchanges.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📊</div>
                        <h3>Portfolio Tracking</h3>
                        <p>Monitor your assets with a clean, intuitive dashboard. Track real-time values and diversity scores.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LandingPage;
