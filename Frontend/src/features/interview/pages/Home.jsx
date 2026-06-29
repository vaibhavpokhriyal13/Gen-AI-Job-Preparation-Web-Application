import React from 'react'
import "../style/home.scss"
import { useInterview } from '../hooks/useInterview'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth'

const GENERATION_STEPS = [
    "Analyzing target job requirements & core skills...",
    "Parsing your profile details and experience...",
    "Calculating candidate matches and key gaps...",
    "Generating customized technical interview questions...",
    "Formulating behavioral scenario questions...",
    "Creating your personalized preparation road map...",
    "Finalizing and formatting your strategy report..."
];

const Home = () => {
    const { generateReport, getAllReports, reports, deleteReport } = useInterview()
    const { handleLogout } = useAuth()
    const [jobDescription, setJobDescription] = useState("")
    const [selfDescription, setSelfDescription] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)
    const [isLongWait, setIsLongWait] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [showNotice, setShowNotice] = useState(() => localStorage.getItem("hideFreeTierNotice") !== "true")
    const resumeInputRef = useRef()
    const longWaitTimerRef = useRef(null)

    const handleCloseNotice = () => {
        setShowNotice(false)
        localStorage.setItem("hideFreeTierNotice", "true")
    }

    const navigate = useNavigate()
    useEffect(() => {
        getAllReports()
    }, [])

    // Cycle through generation steps while loading
    useEffect(() => {
        if (!isGenerating) {
            setCurrentStepIndex(0)
            return
        }
        const interval = setInterval(() => {
            setCurrentStepIndex((prev) => (prev + 1) % GENERATION_STEPS.length)
        }, 4500)
        return () => clearInterval(interval)
    }, [isGenerating])

    const onLogoutClick = async () => {
        if (window.confirm("Are you sure you want to log out?")) {
            setIsLoggingOut(true)
            try {
                await handleLogout()
                navigate("/login")
            } finally {
                setIsLoggingOut(false)
            }
        }
    }

    const handleDeleteReport = async (reportId) => {
        if (window.confirm("Are you sure you want to delete this interview plan? This action cannot be undone.")) {
            await deleteReport(reportId)
        }
    }




    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setSelectedFile(file)
        }
    }

    const handleRemoveFile = () => {
        setSelectedFile(null)
        if (resumeInputRef.current) {
            resumeInputRef.current.value = ""
        }
    }

    const handleGenerateReport = async () => {
        const resumeFile = selectedFile
        if (!resumeFile && !selfDescription.trim()) {
            alert("Please provide either a resume or a self-description to continue.");
            return;
        }
        if (!jobDescription.trim()) {
            alert("Please paste the job description to continue.");
            return;
        }
        setIsGenerating(true)
        setIsLongWait(false)
        // After 35s, show the "taking longer than usual" message
        longWaitTimerRef.current = setTimeout(() => setIsLongWait(true), 35000)
        try {
            const data = await generateReport({ jobDescription, selfDescription, resumeFile })
            if (data && (data._id || data.id)) {
                navigate(`/interview/${data._id || data.id}`);
            } else {
                alert("Something went wrong generating your report. Please try again.");
            }
        } catch (error) {
            console.error("Failed to generate report:", error);
            const errorMsg = error.response?.data?.message || "Something went wrong generating your report. Please try again.";
            alert(errorMsg);
        } finally {
            setIsGenerating(false)
            setIsLongWait(false)
            clearTimeout(longWaitTimerRef.current)
        }
    }



    return (
        <div className='home-page'>

            {/* ── Logging Out Overlay ── */}
            {isLoggingOut && (
                <div className='generating-overlay'>
                    <div className='generating-overlay__card'>
                        <div className='generating-overlay__spinner'>
                            <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'spinRotate 1.4s linear infinite', width: '56px', height: '56px' }}>
                                <circle cx="25" cy="25" r="20" fill="none" stroke="#ff2d78" strokeWidth="4" strokeLinecap="round" style={{ strokeDasharray: '80 120', animation: 'spinDash 1.4s ease-in-out infinite' }} />
                            </svg>
                        </div>
                        <p className='generating-overlay__title' style={{ color: '#e6edf3' }}>Logging Out&hellip;</p>
                        <p className='generating-overlay__sub'>Please wait a moment while we end your session.</p>
                        <div className='generating-overlay__dots'>
                            <span /><span /><span />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Loading Overlay ── */}
            {isGenerating && (
                <div className='generating-overlay'>
                    <div className='generating-overlay__card'>
                        <div className='generating-overlay__spinner'>
                            <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
                            </svg>
                        </div>
                        {isLongWait ? (
                            <>
                                <p className='generating-overlay__title'>Taking longer than usual&hellip;</p>
                                <p className='generating-overlay__sub'>The AI is still working on your plan. Please hang tight — don't close this page.</p>
                            </>
                        ) : (
                            <>
                                <p className='generating-overlay__title'>Generating your Interview Strategy&hellip;</p>
                                <p className='generating-overlay__sub'>{GENERATION_STEPS[currentStepIndex]}</p>
                            </>
                        )}
                        <div className='generating-overlay__dots'>
                            <span /><span /><span />
                        </div>
                    </div>
                </div>
            )}

            {/* Top Navigation Bar */}
            <nav className='home-nav-bar'>
                <div className='home-nav-bar__brand' onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
                    <span className='home-nav-bar__logo'>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                    </span>
                    <span className='home-nav-bar__name'>PrepAi</span>
                </div>
                <button className='home-logout-btn' onClick={onLogoutClick}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    Log Out
                </button>
            </nav>

            <header className='page-header'>
                <h1>Create Your Custom <span className='highlight'>Interview Plan</span></h1>
                <p>Let our AI analyze the job requirements and your unique profile to build a winning strategy.</p>
            </header>

            {showNotice && (
                <div className='free-tier-notice'>
                    <div className='free-tier-notice__icon'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <div className='free-tier-notice__content'>
                        <strong>Gemini Free Tier Notice:</strong> PrepAi is powered by the free tier of Gemini AI. During peak traffic hours, generating your interview strategy or downloading the resume PDF may occasionally time out or fail. If you experience an issue, please retry 2-3 times.
                    </div>
                    <button className='free-tier-notice__close' onClick={handleCloseNotice} title="Dismiss notice">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            )}

            {/* Main Card */}
            <div className='interview-card'>
                <div className='interview-card__body'>

                    {/* Left Panel - Job Description */}
                    <div className='panel panel--left'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                            </span>
                            <h2>Target Job Description</h2>
                            <span className='badge badge--required'>Required</span>
                        </div>
                        <textarea onChange={(e) => setJobDescription(e.target.value)}
                            className='panel__textarea'
                            placeholder={`Paste the full job description here...\ne.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'`}
                            maxLength={5000}
                        />
                        <div className='char-counter'>0 / 5000 chars</div>
                    </div>

                    {/* Vertical Divider */}
                    <div className='panel-divider' />

                    {/* Right Panel - Profile */}
                    <div className='panel panel--right'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </span>
                            <h2>Your Profile</h2>
                        </div>

                        {/* Upload Resume */}
                        <div className='upload-section'>
                            <label className='section-label'>
                                Upload Resume
                                <span className='badge badge--best'>Best Results</span>
                            </label>
                            {selectedFile ? (
                                <div className='file-selected-box'>
                                    <div className='file-selected-details'>
                                        <span className='file-icon'>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                                        </span>
                                        <div className='file-info'>
                                            <p className='file-name'>{selectedFile.name}</p>
                                            <p className='file-size'>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button type='button' className='remove-file-btn' onClick={handleRemoveFile}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                </div>
                            ) : (
                                <label className='dropzone' htmlFor='resume'>
                                    <span className='dropzone__icon'>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
                                    </span>
                                    <p className='dropzone__title'>Click to upload or drag &amp; drop</p>
                                    <p className='dropzone__subtitle'>PDF or DOCX (Max 5MB)</p>
                                    <input ref={resumeInputRef} onChange={handleFileChange} hidden type='file' id='resume' name='resume' accept='.pdf,.docx' />
                                </label>
                            )}
                        </div>

                        {/* OR Divider */}
                        <div className='or-divider'><span>OR</span></div>

                        {/* Quick Self-Description */}
                        <div className='self-description'>
                            <label className='section-label' htmlFor='selfDescription'>Quick Self-Description</label>
                            <textarea onChange={(e) => setSelfDescription(e.target.value)}
                                id='selfDescription'
                                name='selfDescription'
                                className='panel__textarea panel__textarea--short'
                                placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                            />
                        </div>

                        {/* Info Box */}
                        <div className='info-box'>
                            <span className='info-box__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" stroke="#1a1f27" strokeWidth="2" /><line x1="12" y1="16" x2="12.01" y2="16" stroke="#1a1f27" strokeWidth="2" /></svg>
                            </span>
                            <p>Either a <strong>Resume</strong> or a <strong>Self Description</strong> is required to generate a personalized plan.</p>
                        </div>
                    </div>
                </div>

                {/* Card Footer */}
                <div className='interview-card__footer'>
                    <span className='footer-info'>AI-Powered Strategy Generation</span>
                    <button
                        onClick={handleGenerateReport}
                        className='generate-btn'
                        disabled={isGenerating}
                        style={{ opacity: isGenerating ? 0.7 : 1, cursor: isGenerating ? 'not-allowed' : 'pointer' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>
                        {isGenerating ? "Generating..." : "Generate My Interview Strategy"}
                    </button>
                </div>
            </div>

            {/* Recent Reports List (Static Structural Representation) */}
            {reports.length > 0 && (
                <section className='recent-reports '>
                    <h2>My Recent Interview Plans</h2>
                    <ul className='reports-list flex flex-column gap-0.75rem'>
                        {reports.map(report => (
                            <li key={report._id} className='report-item' onClick={() => navigate(`/interview/${report._id}`)}>
                                <div className='report-item__details'>
                                    <h3>{report.title || "Untitled Position"}</h3>
                                    <div className='report-item__meta-row'>
                                        <span className='report-meta'>{new Date(report.createdAt).toLocaleDateString()}</span>
                                        <span className='report-match-score'>Match: {report.matchScore}%</span>
                                    </div>
                                </div>
                                <button
                                    className='delete-report-btn'
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteReport(report._id)
                                    }}
                                    title='Delete Plan'
                                    type='button'
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}




            {/* Page Footer */}
            <footer className='page-footer'>
                <a href='#'>Privacy Policy</a>
                <a href='#'>Terms of Service</a>
                <a href='#'>Help Center</a>
            </footer>
        </div>
    )
}

export default Home
