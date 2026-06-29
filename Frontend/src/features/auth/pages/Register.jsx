import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import "../auth.form.scss"

const Register = () => {
    const navigate = useNavigate()
    const [error, setError] = useState("")
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isWakeUpNotice, setIsWakeUpNotice] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [agreeTerms, setAgreeTerms] = useState(false)

    // Password strength state
    const [pwdStrength, setPwdStrength] = useState({ score: 0, text: "", color: "" })

    const { loading, handleRegister } = useAuth()

    const checkPasswordStrength = (pwd) => {
        if (!pwd) {
            return { score: 0, text: "", color: "" }
        }
        let score = 0
        if (pwd.length >= 8) score++
        if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++
        if (/[0-9]/.test(pwd)) score++
        if (/[^A-Za-z0-9]/.test(pwd)) score++

        let text = "Weak"
        let color = "#ff4d4d" // Red
        if (score === 2 || score === 3) {
            text = "Medium"
            color = "#ffbd2e" // Yellow
        } else if (score === 4) {
            text = "Strong"
            color = "#27c93f" // Green
        }

        return { score, text, color }
    }

    useEffect(() => {
        setPwdStrength(checkPasswordStrength(password))
    }, [password])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }
        if (!agreeTerms) {
            setError("Please agree to the Terms & Privacy Policy")
            return
        }
        setIsSubmitting(true)
        try {
            const res = await handleRegister({ username, email, password })
            if (res.success) {
                navigate("/")
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
                            <h1>Create Account</h1>
                            <p>Join thousands of candidates preparing for their dream roles.</p>
                        </div>

                        {error && <p className="error-message">{error}</p>}

                        {/* Registration Form */}
                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="input-group">
                                <label htmlFor="username">Username</label>
                                <input
                                    onChange={(e) => { setUsername(e.target.value) }}
                                    type="text"
                                    id="username"
                                    name="username"
                                    placeholder="yourusername"
                                    disabled={isSubmitting}
                                    required
                                />
                            </div>

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
                                <label htmlFor="password">Password</label>
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

                                {/* Password strength bar */}
                                {password && (
                                    <div className="pwd-strength-container">
                                        <div className="pwd-strength-bar-bg">
                                            <div 
                                                className="pwd-strength-bar-fill" 
                                                style={{ 
                                                    width: `${(pwdStrength.score / 4) * 100}%`, 
                                                    backgroundColor: pwdStrength.color 
                                                }}
                                            />
                                        </div>
                                        <span className="pwd-strength-text" style={{ color: pwdStrength.color }}>
                                            {pwdStrength.text} Password
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="input-group password-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        onChange={(e) => { setConfirmPassword(e.target.value) }}
                                        type={showConfirmPassword ? "text" : "password"}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        placeholder="••••••••"
                                        disabled={isSubmitting}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        title={showConfirmPassword ? "Hide password" : "Show password"}
                                    >
                                        {showConfirmPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Terms check */}
                            <div className="auth-options-row">
                                <label className="remember-checkbox agree-terms">
                                    <input
                                        type="checkbox"
                                        checked={agreeTerms}
                                        onChange={(e) => setAgreeTerms(e.target.checked)}
                                        required
                                    />
                                    <span>I agree to the <a href="#" onClick={(e) => { e.preventDefault(); alert("Terms & Privacy Policy feature coming soon!") }}>Terms &amp; Privacy Policy</a></span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="button primary-button auth-submit-btn"
                                disabled={isSubmitting}
                                style={{ opacity: isSubmitting ? 0.7 : 1 }}
                            >
                                {isSubmitting ? "Creating Account..." : "Create Account"}
                            </button>
                        </form>

                        {/* Footer */}
                        <div className="auth-footer">
                            <p>Already have an account? <Link to={"/login"}>Sign In</Link></p>
                        </div>
                    </div>
                </div>

                {/* ── Right Side: Design Illustration ── */}
                <div className="auth-right">
                    <div className="auth-illustration-container">
                        <div className="auth-floating-art">
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
                                <circle cx="250" cy="200" r="130" fill="url(#glowGrad)" />
                                <rect x="80" y="50" width="340" height="230" rx="10" fill="#161b22" stroke="#2a3348" strokeWidth="1.5" />
                                <circle cx="105" cy="65" r="4" fill="#ff5f56" />
                                <circle cx="117" cy="65" r="4" fill="#ffbd2e" />
                                <circle cx="129" cy="65" r="4" fill="#27c93f" />
                                <rect x="100" y="90" width="300" height="15" rx="3" fill="#1e2535" />
                                <rect x="100" y="120" width="130" height="60" rx="6" fill="url(#cardGrad)" stroke="rgba(255, 45, 120, 0.2)" strokeWidth="1" />
                                <rect x="250" y="120" width="150" height="60" rx="6" fill="url(#cardGrad)" stroke="#2a3348" strokeWidth="1" />
                                <rect x="100" y="195" width="300" height="60" rx="6" fill="url(#cardGrad)" stroke="#2a3348" strokeWidth="1" />
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

export default Register

