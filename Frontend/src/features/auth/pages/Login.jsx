import React, { useState } from 'react'
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

    if (loading) {
        return (
            <main style={{ background: '#0d1117', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className='generating-overlay' style={{ position: 'relative', background: 'none', backdropFilter: 'none' }}>
                    <div className='generating-overlay__card' style={{ boxShadow: 'none', border: 'none', background: 'none' }}>
                        <div className='generating-overlay__spinner'>
                            <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'spinRotate 1.4s linear infinite', width: '56px', height: '56px' }}>
                                <circle cx="25" cy="25" r="20" fill="none" stroke="#ff2d78" strokeWidth="4" strokeLinecap="round" style={{ strokeDasharray: '80 120', animation: 'spinDash 1.4s ease-in-out infinite' }} />
                            </svg>
                        </div>
                        <p className='generating-overlay__title' style={{ color: '#e6edf3', marginTop: '1.25rem', fontWeight: 'bold' }}>Verifying your session&hellip;</p>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main>
            <div className="form-container">
                <h1>Login</h1>
                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input onChange={(e) => { setEmail(e.target.value) }}
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Enter your email"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input onChange={(e) => { setPassword(e.target.value) }}
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Enter your password"
                            disabled={isSubmitting}
                        />
                    </div>

                    <button
                        type="submit"
                        className="button primary-button"
                        disabled={isSubmitting}
                        style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                    >
                        {isSubmitting ? "Logging In..." : "Log In"}
                    </button>
                </form>
                <p>Don't have an account? <Link to={"/register"}>Register</Link></p>
            </div>
        </main>
    )
}

export default Login