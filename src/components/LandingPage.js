import React from 'react';
import { Rocket, Shield, Zap, TrendingUp, BarChart2, Globe, ChevronRight } from 'lucide-react';
import './LandingPage.css';

const LandingPage = ({ onLaunchApp }) => {
    return (
        <div className="landing-page">
            <nav className="landing-nav">
                <div className="logo-container">
                    <img src="data:image/svg+xml,%3csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3clinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3e%3cstop offset='0%25' style='stop-color:%2361dafb;stop-opacity:1' /%3e%3cstop offset='100%25' style='stop-color:%239261fb;stop-opacity:1' /%3e%3c/linearGradient%3e%3c/defs%3e%3cpath d='M 50 10 L 10 90 H 30 L 50 40 L 70 90 H 90 L 50 10 Z' fill='url(%23grad1)' /%3e%3cpath d='M 40 60 H 60 L 50 80 Z' fill='url(%23grad1)' /%3e%3c/svg%3e" alt="Nero Logo" />
                    <span className="logo-text">NERO</span>
                </div>
                <div className="nav-links">
                    <button className="nav-item">Features</button>
                    <button className="nav-item">How it Works</button>
                    <button className="launch-btn" onClick={onLaunchApp}>
                        Launch App <Rocket size={16} style={{ marginLeft: '8px' }} />
                    </button>
                </div>
            </nav>

            <main>
                <div className="hero-section">
                    <div className="hero-badge">Sepolia Testnet Live</div>
                    <h1 className="hero-title">
                        The Future of <br />
                        <span className="gradient-text">Intelligent Trading</span>
                    </h1>
                    <p className="hero-subtitle">
                        Experience the power of AI-driven portfolio analysis and seamless token swaps.
                        Optimize your crypto journey with real-time insights.
                    </p>
                    <div className="cta-group">
                        <button className="launch-btn cta-primary" onClick={onLaunchApp}>
                            Start Trading Now
                        </button>
                        <button className="secondary-btn">
                            Learn More <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                <div className="trusted-by">
                    <p>TRUSTED BY INNOVATORS</p>
                    <div className="logos-grid">
                        <span>UNISWAP</span>
                        <span>ETHEREUM</span>
                        <span>GEMINI</span>
                        <span>COINGECKO</span>
                    </div>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <TrendingUp size={32} color="#61dafb" />
                        </div>
                        <h3>AI-Powered Insights</h3>
                        <p>Get real-time analysis of your portfolio composition and personalized diversification strategies powered by Google Gemini.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <Zap size={32} color="#9261fb" />
                        </div>
                        <h3>Instant Swaps</h3>
                        <p>Execute trades instantly with Uniswap V2 integration. Secure, fast, and reliable token exchanges.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <BarChart2 size={32} color="#ec4899" />
                        </div>
                        <h3>Portfolio Tracking</h3>
                        <p>Monitor your assets with a clean, intuitive dashboard. Track real-time values and diversity scores.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <Shield size={32} color="#10b981" />
                        </div>
                        <h3>Secure & Non-Custodial</h3>
                        <p>Your funds, your control. Connect directly with MetaMask and trade directly from your wallet.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <Globe size={32} color="#f59e0b" />
                        </div>
                        <h3>Global Access</h3>
                        <p>Trade from anywhere in the world. Our platform is always available on the Sepolia Testnet.</p>
                    </div>
                </div>

                <div className="how-it-works">
                    <h2>How It Works</h2>
                    <div className="steps-container">
                        <div className="step-item">
                            <div className="step-number">1</div>
                            <h3>Connect Wallet</h3>
                            <p>Link your MetaMask wallet to getting started instantly.</p>
                        </div>
                        <div className="step-item">
                            <div className="step-number">2</div>
                            <h3>Analyze Portfolio</h3>
                            <p>Use our AI assistant to get insights on your current holdings.</p>
                        </div>
                        <div className="step-item">
                            <div className="step-number">3</div>
                            <h3>Swap & Optimize</h3>
                            <p>Execute trades to rebalance and grow your assets.</p>
                        </div>
                    </div>
                </div>
            </main>

            <footer>
                <p>&copy; 2024 Nero Protocol. Built for Hackathon.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
