import React, { useState, useEffect } from 'react'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'
import { Link, useNavigate } from 'react-router'

const Login = () => {
    const { loading, handleLogin } = useAuth()
    const navigate = useNavigate()
    const [error, setError] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isWakeUpNotice, setIsWakeUpNotice] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setIsSubmitting(true)
        try {
            const res = await handleLogin({ email, password })
            if (res.success) {
                navigate('/')
            } else {
                setError(res.error)
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    // Detect if the session verification request is taking long (sleeping Render server)
    useEffect(() => {
        if (loading) {
            const timer = setTimeout(() => setIsWakeUpNotice(true), 6000)
            return () => clearTimeout(timer)
        } else {
            setIsWakeUpNotice(false)
        }
    }, [loading])

    if (loading) {
        return (
            <main className="auth-page" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className='generating-overlay' style={{ position: 'relative', background: 'none', backdropFilter: 'none' }}>
                    <div className='generating-overlay__card' style={{ boxShadow: 'none', border: 'none', background: 'none', maxWidth: '420px', width: '90%' }}>
                        <div className='generating-overlay__spinner'>
                            <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'spinRotate 1.4s linear infinite', width: '56px', height: '56px' }}>
                                <circle cx="25" cy="25" r="20" fill="none" stroke="#ff2d78" strokeWidth="4" strokeLinecap="round" style={{ strokeDasharray: '80 120', animation: 'spinDash 1.4s ease-in-out infinite' }} />
                            </svg>
                        </div>
                        {isWakeUpNotice ? (
                            <>
                                <p className='generating-overlay__title' style={{ color: '#e6edf3', marginTop: '1.25rem', fontWeight: 'bold' }}>Waking up the free server&hellip;</p>
                                <p className='generating-overlay__sub' style={{ color: '#7d8590', fontSize: '0.8rem', marginTop: '0.5rem', lineHeight: '1.5' }}>
                                    Render free servers spin down after 15 minutes of inactivity. Waking it up can take 40-50 seconds. We appreciate your patience!
                                </p>
                            </>
                        ) : (
                            <p className='generating-overlay__title' style={{ color: '#e6edf3', marginTop: '1.25rem', fontWeight: 'bold' }}>Verifying your session&hellip;</p>
                        )}
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="auth-page">
            <div className="auth-split-layout">
                {/* ── Left Side: Form ── */}
                <div className="auth-left">
                    <div className="auth-card-wrapper">
                        {/* Logo / Brand Header */}
                        <div className="auth-brand">
                            <span className="auth-brand__logo">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                            </span>
                            <span className="auth-brand__name">PrepAi</span>
                        </div>

                        {/* Welcomes */}
                        <div className="auth-header">
                            <h1>Welcome Back</h1>
                            <p>Sign in to continue your preparation journey.</p>
                        </div>

                        {error && <p className="error-message">{error}</p>}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="input-group">
                                <label htmlFor="email">Email</label>
                                <input 
                                    onChange={(e) => { setEmail(e.target.value) }}
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder="name@company.com"
                                    disabled={isSubmitting}
                                    required
                                />
                            </div>

                            <div className="input-group password-group">
                                <div className="password-header">
                                    <label htmlFor="password">Password</label>
                                </div>
                                <div className="password-input-wrapper">
                                    <input 
                                        onChange={(e) => { setPassword(e.target.value) }}
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        placeholder="••••••••"
                                        disabled={isSubmitting}
                                        required
                                    />
                                    <button 
                                        type="button" 
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        title={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Remember / Forgot Row */}
                            <div className="auth-options-row">
                                <label className="remember-checkbox">
                                    <input 
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <span>Remember Me</span>
                                </label>
                                <a href="#" className="forgot-link" onClick={(e) => { e.preventDefault(); alert("Feature coming soon!") }}>Forgot Password?</a>
                            </div>

                            <button
                                type="submit"
                                className="button primary-button auth-submit-btn"
                                disabled={isSubmitting}
                                style={{ opacity: isSubmitting ? 0.7 : 1 }}
                            >
                                {isSubmitting ? "Logging In..." : "Log In"}
                            </button>
                        </form>

                        {/* OR Divider */}
                        <div className="or-divider">
                            <span className="or-divider__line" />
                            <span className="or-divider__text">or continue with</span>
                            <span className="or-divider__line" />
                        </div>

                        {/* Social Buttons */}
                        <div className="social-logins">
                            <button className="social-btn" onClick={() => alert("Google Login coming soon!")} type="button">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/></svg>
                                Google
                            </button>
                            <button className="social-btn" onClick={() => alert("GitHub Login coming soon!")} type="button">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
                                GitHub
                            </button>
                        </div>

                        {/* Footer */}
                        <div className="auth-footer">
                            <p>Don't have an account? <Link to={"/register"}>Create Account</Link></p>
                        </div>
                    </div>
                </div>

                {/* ── Right Side: Design Illustration ── */}
                <div className="auth-right">
                    <div className="auth-illustration-container">
                        <div className="auth-floating-art">
                            {/* SVG mockup representing interactive dashboard with glowing cards */}
                            <svg className="art-svg" viewBox="0 0 500 400" width="100%" height="100%">
                                <defs>
                                    <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#ff2d78" stopOpacity="0.4" />
                                        <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
                                    </linearGradient>
                                    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#1f293d" />
                                        <stop offset="100%" stopColor="#111827" />
                                    </linearGradient>
                                </defs>
                                {/* Background grid lines */}
                                <g stroke="rgba(255, 45, 120, 0.05)" strokeWidth="1">
                                    <line x1="50" y1="0" x2="50" y2="400" />
                                    <line x1="150" y1="0" x2="150" y2="400" />
                                    <line x1="250" y1="0" x2="250" y2="400" />
                                    <line x1="350" y1="0" x2="350" y2="400" />
                                    <line x1="450" y1="0" x2="450" y2="400" />
                                    <line x1="0" y1="100" x2="500" y2="100" />
                                    <line x1="0" y1="200" x2="500" y2="200" />
                                    <line x1="0" y1="300" x2="500" y2="300" />
                                </g>

                                {/* Glowing sphere in background */}
                                <circle cx="250" cy="200" r="130" fill="url(#glowGrad)" />

                                {/* Mock Browser Window */}
                                <rect x="80" y="50" width="340" height="230" rx="10" fill="#161b22" stroke="#2a3348" strokeWidth="1.5" />
                                {/* Dots */}
                                <circle cx="105" cy="65" r="4" fill="#ff5f56" />
                                <circle cx="117" cy="65" r="4" fill="#ffbd2e" />
                                <circle cx="129" cy="65" r="4" fill="#27c93f" />

                                {/* Browser Mock UI blocks */}
                                <rect x="100" y="90" width="300" height="15" rx="3" fill="#1e2535" />
                                <rect x="100" y="120" width="130" height="60" rx="6" fill="url(#cardGrad)" stroke="rgba(255, 45, 120, 0.2)" strokeWidth="1" />
                                <rect x="250" y="120" width="150" height="60" rx="6" fill="url(#cardGrad)" stroke="#2a3348" strokeWidth="1" />
                                <rect x="100" y="195" width="300" height="60" rx="6" fill="url(#cardGrad)" stroke="#2a3348" strokeWidth="1" />

                                {/* Mini Chart/Details inside mock blocks */}
                                <circle cx="130" cy="150" r="16" fill="none" stroke="#ff2d78" strokeWidth="3" strokeDasharray="60 40" />
                                <rect x="160" y="140" width="50" height="6" rx="2" fill="#ff2d78" opacity="0.8" />
                                <rect x="160" y="152" width="35" height="4" rx="2" fill="#7d8590" />

                                <rect x="270" y="140" width="80" height="6" rx="2" fill="#7d8590" />
                                <rect x="270" y="152" width="110" height="4" rx="2" fill="#ff2d78" opacity="0.6" />

                                <circle cx="130" cy="225" r="12" fill="rgba(192, 132, 252, 0.2)" />
                                <rect x="160" y="215" width="120" height="6" rx="2" fill="#e6edf3" />
                                <rect x="160" y="227" width="80" height="4" rx="2" fill="#7d8590" />
                            </svg>
                        </div>
                        {/* Title text */}
                        <div className="auth-illustration-text">
                            <h2>Elevate Your Interview Prep</h2>
                            <p>Analyze job targets, build strategic responses, and land your next role with custom AI interview insights.</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default Login