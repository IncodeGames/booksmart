import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Destinations } from '../lib/routes';
import './styles/LandingPage.css';

interface WindowSize {
    width: number;
    height: number;
}

const LandingPage = () => {
    const navigate = useNavigate();
    const [windowSize, setWindowSize] = useState<WindowSize>({
        width: window.innerWidth,
        height: window.innerHeight
    });

    useEffect(() => {
        const handleResize = (): void => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile: boolean = windowSize.width <= 768;

    const handleNavigateToAuth = () => {
        navigate(Destinations.AUTH);
    };

    return (
        <div className="landing-page">
            {/* Background Elements */}
            <div className="landing-background">
                <div className="bg-shape shape-1"></div>
                <div className="bg-shape shape-2"></div>
                <div className="bg-shape shape-3"></div>
                <div className="bg-shape shape-4"></div>
            </div>

            {/* Header */}
            <header className="landing-header">
                <div className="header-content">
                    <div className="logo">
                        <div className="logo-icon"></div>
                        <span className="logo-text">Booksmart</span>
                    </div>
                    <button
                        className="btn btn-login"
                        onClick={handleNavigateToAuth}
                    >
                        Sign In
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="landing-main">
                <div className="hero-section">
                    <div className="hero-content">
                        <h1 className="hero-title">
                            Build Something
                            <span className="gradient-text"> Amazing</span>
                        </h1>
                        <p className="hero-description">
                            Create, collaborate, and scale your ideas with our powerful platform.
                            Join thousands of users who are already building the future.
                        </p>
                        <div className="hero-actions">
                            <button
                                className="btn btn-primary btn-large"
                                onClick={handleNavigateToAuth}
                            >
                                Get Started Free
                            </button>
                            <button className="btn btn-secondary btn-large">
                                Watch Demo
                            </button>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="visual-card card-1">
                            <div className="card-header"></div>
                            <div className="card-body">
                                <div className="card-line"></div>
                                <div className="card-line short"></div>
                                <div className="card-line"></div>
                            </div>
                        </div>
                        <div className="visual-card card-2">
                            <div className="card-chart">
                                <div className="chart-bar" style={{ height: '60%' }}></div>
                                <div className="chart-bar" style={{ height: '80%' }}></div>
                                <div className="chart-bar" style={{ height: '40%' }}></div>
                                <div className="chart-bar" style={{ height: '90%' }}></div>
                            </div>
                        </div>
                        <div className="visual-card card-3">
                            <div className="card-avatar"></div>
                            <div className="card-info">
                                <div className="info-line"></div>
                                <div className="info-line short"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <section className="features-section">
                    <div className="features-content">
                        <h2 className="section-title">Why Choose Us</h2>
                        <div className="features-grid">
                            <div className="feature-card">
                                <div className="feature-icon icon-fast"></div>
                                <h3>Lightning Fast</h3>
                                <p>Built for speed and performance with modern technologies</p>
                            </div>
                            <div className="feature-card">
                                <div className="feature-icon icon-secure"></div>
                                <h3>Secure by Default</h3>
                                <p>Enterprise-grade security to protect your data</p>
                            </div>
                            <div className="feature-card">
                                <div className="feature-icon icon-scale"></div>
                                <h3>Scales with You</h3>
                                <p>From startup to enterprise, we grow with your needs</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Call to Action */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2>Ready to Get Started?</h2>
                    <p>Join our community and start building today</p>
                    <button
                        className="btn btn-primary btn-large"
                        onClick={handleNavigateToAuth}
                    >
                        Create Account
                    </button>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;