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

    const { loading, handleRegister } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        if (password !== confirmPassword) {
            setError("Passwords do not match")
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
            <main style={{ background: '#0d1117', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        <main>
            <div className="form-container">
                <h1>Register</h1>
                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            onChange={(e) => { setUsername(e.target.value) }}
                            type="text"
                            id="username"
                            name="username"
                            placeholder="Enter your username"
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
                            placeholder="Enter your email"
                            disabled={isSubmitting}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            onChange={(e) => { setPassword(e.target.value) }}
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Enter your password"
                            disabled={isSubmitting}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            onChange={(e) => { setConfirmPassword(e.target.value) }}
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            placeholder="Confirm your password"
                            disabled={isSubmitting}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="button primary-button"
                        disabled={isSubmitting}
                        style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                    >
                        {isSubmitting ? "Creating Account..." : "Register"}
                    </button>
                </form>
                <p>Already have an account? <Link to={"/login"}>Login</Link></p>
            </div>
        </main>
    )
}

export default Register
