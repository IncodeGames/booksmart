import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './components/RegistrationPage.css';

const RegistrationPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [mode, setMode] = useState('signup'); // 'signup' or 'signin'
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const validateForm = () => {
        if (!email) {
            setMessage({ text: 'Email is required', type: 'error' });
            return false;
        }

        if (!password) {
            setMessage({ text: 'Password is required', type: 'error' });
            return false;
        }

        if (mode === 'signup' && password !== confirmPassword) {
            setMessage({ text: 'Passwords do not match', type: 'error' });
            return false;
        }

        if (mode === 'signup' && password.length < 8) {
            setMessage({ text: 'Password must be at least 8 characters', type: 'error' });
            return false;
        }

        return true;
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setMessage({
                    text: 'Registration successful! Check your email for verification.',
                    type: 'success'
                });
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                setMessage({ text: 'Login successful!', type: 'success' });
            }
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleOAuthSignIn = async (provider) => {
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: window.location.origin,
                },
            });
            if (error) throw error;
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setMode(mode === 'signup' ? 'signin' : 'signup');
        setMessage({ text: '', type: '' });
    };

    // Determine if we're in mobile/tablet view
    const isMobile = windowSize.width <= 768;
    const isTablet = windowSize.width <= 1024 && windowSize.width > 768;

    return (
        <div className="auth-fullscreen">
            <div className="auth-background">
                {/* Animated background elements */}
                <div className="bg-shape shape-1"></div>
                <div className="bg-shape shape-2"></div>
                <div className="bg-shape shape-3"></div>
            </div>

            <div className="auth-container">
                <div className={`auth-card ${isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'}`}>
                    <div className="auth-header">
                        <div className="logo">
                            <div className="logo-icon"></div>
                        </div>
                        <h1>{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</h1>
                        <p>{mode === 'signup'
                            ? 'Sign up to get started with our service'
                            : 'Sign in to access your account'}
                        </p>
                    </div>

                    {message.text && (
                        <div className={`message ${message.type}`}>
                            <div className="message-content">
                                {message.text}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleEmailAuth} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {mode === 'signup' && (
                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="loading-spinner"></div>
                            ) : (
                                mode === 'signup' ? 'Create Account' : 'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="divider">
                        <span>or continue with</span>
                    </div>

                    <div className="oauth-buttons">
                        <button
                            type="button"
                            className="btn btn-oauth google"
                            onClick={() => handleOAuthSignIn('google')}
                            disabled={loading}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
                                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                            </svg>
                            <span>Google</span>
                        </button>
                        <button
                            type="button"
                            className="btn btn-oauth apple"
                            onClick={() => handleOAuthSignIn('apple')}
                            disabled={loading}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 384 512" fill="currentColor">
                                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                            </svg>
                            <span>Apple</span>
                        </button>
                    </div>

                    <div className="auth-footer">
                        <p>
                            {mode === 'signup'
                                ? 'Already have an account?'
                                : 'Don\'t have an account?'
                            }
                            <button
                                type="button"
                                className="btn-link"
                                onClick={toggleMode}
                            >
                                {mode === 'signup' ? 'Sign In' : 'Sign Up'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegistrationPage;