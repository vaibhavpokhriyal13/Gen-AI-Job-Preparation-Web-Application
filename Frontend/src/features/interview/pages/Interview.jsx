import React, { useState, useEffect, useRef } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview'
import { useParams, useNavigate } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth'
import { evaluateCandidateAnswer, getElevatorPitch } from '../services/interview.api'

const NAV_ITEMS = [
    { id: 'technical', label: 'Technical Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
    { id: 'behavioral', label: 'Behavioral Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>) },
    { id: 'ats-heatmap', label: 'ATS Heatmap', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/></svg>) },
    { id: 'pitch', label: '60s Elevator Pitch', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>) },
    { id: 'roadmap', label: 'Road Map', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>) },
]

// ── Voice Mock Practice Component ─────────────────────────────────────────────
const PracticeAnswerPanel = ({ question, intention, modelAnswer }) => {
    const [answerText, setAnswerText] = useState('')
    const [isListening, setIsListening] = useState(false)
    const [isEvaluating, setIsEvaluating] = useState(false)
    const [evaluation, setEvaluation] = useState(null)
    const recognitionRef = useRef(null)
    const baseTextRef = useRef('')
    const finalTranscriptRef = useRef('')

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.abort() } catch (e) {}
            }
        }
    }, [])

    const toggleListening = (e) => {
        e.stopPropagation()
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser. You can type your answer directly in the box!")
            return
        }

        if (isListening) {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop() } catch (e) {}
            }
            setIsListening(false)
            return
        }

        try {
            const recognition = new SpeechRecognition()
            recognition.continuous = true
            recognition.interimResults = true
            recognition.lang = 'en-US'

            // Snapshot existing text and reset the session's final transcript buffer
            baseTextRef.current = answerText ? answerText.trim() + ' ' : ''
            finalTranscriptRef.current = ''

            recognition.onresult = (event) => {
                let interimTranscript = ''

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const transcript = event.results[i][0].transcript
                    if (event.results[i].isFinal) {
                        finalTranscriptRef.current += transcript + ' '
                    } else {
                        interimTranscript += transcript
                    }
                }

                const currentCombined = (baseTextRef.current + finalTranscriptRef.current + interimTranscript)
                    .replace(/\s+/g, ' ')
                    .trim()

                setAnswerText(currentCombined)
            }

            recognition.onerror = (err) => {
                console.error("Speech recognition error:", err)
                setIsListening(false)
            }

            recognition.onend = () => {
                setIsListening(false)
            }

            recognitionRef.current = recognition
            recognition.start()
            setIsListening(true)
        } catch (err) {
            console.error("Speech recognition start failed:", err)
            setIsListening(false)
        }
    }

    const handleEvaluate = async (e) => {
        e.stopPropagation()
        if (!answerText.trim()) {
            alert("Please speak or type your practice response before evaluating.")
            return
        }
        setIsEvaluating(true)
        try {
            const res = await evaluateCandidateAnswer({
                question,
                intention,
                modelAnswer,
                candidateAnswer: answerText
            })
            setEvaluation(res.evaluation)
        } catch (err) {
            console.error("Failed to evaluate answer:", err)
            alert(err.response?.data?.message || "Failed to evaluate answer. Please try again.")
        } finally {
            setIsEvaluating(false)
        }
    }

    return (
        <div className='mock-practice' onClick={(e) => e.stopPropagation()}>
            <div className='mock-practice__header'>
                <span className='mock-practice__title'>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                    Live Voice Mock Practice
                </span>
                <button
                    type="button"
                    className={`mock-mic-btn ${isListening ? 'mock-mic-btn--active' : ''}`}
                    onClick={toggleListening}
                    title={isListening ? "Stop voice recording" : "Speak answer into microphone"}
                >
                    <span className='mock-mic-dot' />
                    {isListening ? "Recording... (Click to Stop)" : "🎙️ Speak Answer"}
                </button>
            </div>

            <textarea
                className='mock-practice__textarea'
                placeholder="Click 'Speak Answer' to speak into your mic, or type your practice response here..."
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                rows={3}
            />

            <div className='mock-practice__actions'>
                <button
                    type="button"
                    className='button primary-button mock-eval-btn'
                    onClick={handleEvaluate}
                    disabled={isEvaluating || !answerText.trim()}
                >
                    {isEvaluating ? "Grading with AI..." : "⚡ Evaluate My Answer"}
                </button>
                {answerText && (
                    <button
                        type="button"
                        className='mock-clear-btn'
                        onClick={() => { setAnswerText(''); baseTextRef.current = ''; finalTranscriptRef.current = ''; setEvaluation(null); }}
                    >
                        Clear
                    </button>
                )}
            </div>

            {evaluation && (
                <div className='mock-feedback'>
                    <div className='mock-feedback__top'>
                        <div className={`mock-score-pill ${evaluation.score >= 8 ? 'mock-score-pill--high' : evaluation.score >= 6 ? 'mock-score-pill--med' : 'mock-score-pill--low'}`}>
                            <span className='mock-score-num'>{evaluation.score}</span>
                            <span className='mock-score-denom'>/10</span>
                        </div>
                        <p className='mock-feedback__summary'>{evaluation.summary}</p>
                    </div>

                    <div className='mock-star-row'>
                        <span className='mock-star-label'>STAR Framework:</span>
                        <span className={`mock-star-badge ${evaluation.starCheck?.hasSituation ? 'mock-star-badge--yes' : 'mock-star-badge--no'}`}>
                            {evaluation.starCheck?.hasSituation ? '✓' : '✗'} Situation
                        </span>
                        <span className={`mock-star-badge ${evaluation.starCheck?.hasTask ? 'mock-star-badge--yes' : 'mock-star-badge--no'}`}>
                            {evaluation.starCheck?.hasTask ? '✓' : '✗'} Task
                        </span>
                        <span className={`mock-star-badge ${evaluation.starCheck?.hasAction ? 'mock-star-badge--yes' : 'mock-star-badge--no'}`}>
                            {evaluation.starCheck?.hasAction ? '✓' : '✗'} Action
                        </span>
                        <span className={`mock-star-badge ${evaluation.starCheck?.hasResult ? 'mock-star-badge--yes' : 'mock-star-badge--no'}`}>
                            {evaluation.starCheck?.hasResult ? '✓' : '✗'} Result
                        </span>
                    </div>

                    {evaluation.fillerWords?.count > 0 && (
                        <div className='mock-filler-row'>
                            <span className='mock-filler-tag'>
                                ⚠️ Detected {evaluation.fillerWords.count} filler word(s): "{evaluation.fillerWords.detected?.join(', ')}"
                            </span>
                        </div>
                    )}

                    <div className='mock-columns'>
                        <div className='mock-col'>
                            <strong>What You Did Well:</strong>
                            <ul>
                                {evaluation.strengths?.map((s, idx) => (
                                    <li key={idx}>✓ {s}</li>
                                ))}
                            </ul>
                        </div>
                        <div className='mock-col'>
                            <strong>Actionable Improvements:</strong>
                            <ul>
                                {evaluation.improvements?.map((imp, idx) => (
                                    <li key={idx}>⚡ {imp}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Sub-components ────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index }) => {
    const [open, setOpen] = useState(false)
    const [showPractice, setShowPractice] = useState(false)
    const [speakingTarget, setSpeakingTarget] = useState(null) // 'question' | 'answer' | null

    useEffect(() => {
        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel()
            }
        }
    }, [])

    const toggleSpeech = (e, text, target) => {
        e.stopPropagation()
        if (!('speechSynthesis' in window)) {
            alert("Audio playback is not supported in this browser.")
            return
        }

        if (speakingTarget === target) {
            window.speechSynthesis.cancel()
            setSpeakingTarget(null)
            return
        }

        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 0.92 // Natural interview pace

        const voices = window.speechSynthesis.getVoices()
        const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')))
        if (naturalVoice) utterance.voice = naturalVoice

        utterance.onend = () => setSpeakingTarget(null)
        utterance.onerror = () => setSpeakingTarget(null)

        setSpeakingTarget(target)
        window.speechSynthesis.speak(utterance)
    }

    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <button
                    type="button"
                    className={`q-card__speaker ${speakingTarget === 'question' ? 'q-card__speaker--playing' : ''}`}
                    title={speakingTarget === 'question' ? "Stop audio" : "Listen to question"}
                    onClick={(e) => toggleSpeech(e, item.question, 'question')}
                >
                    {speakingTarget === 'question' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
                    )}
                </button>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>
            {open && (
                <div className='q-card__body'>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--intention'>Intention</span>
                        <p>{item.intention}</p>
                    </div>
                    <div className='q-card__section'>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                            <button
                                type="button"
                                className={`q-card__speaker q-card__speaker--inline ${speakingTarget === 'answer' ? 'q-card__speaker--playing' : ''}`}
                                title={speakingTarget === 'answer' ? "Stop audio" : "Listen to model answer"}
                                onClick={(e) => toggleSpeech(e, item.answer, 'answer')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
                                <span>{speakingTarget === 'answer' ? "Stop" : "Listen to Answer"}</span>
                            </button>
                        </div>
                        <p>{item.answer}</p>
                    </div>

                    {/* Toggle Voice Mock Practice */}
                    <div className='q-card__practice-toggle'>
                        <button
                            type="button"
                            className={`practice-toggle-btn ${showPractice ? 'practice-toggle-btn--open' : ''}`}
                            onClick={(e) => { e.stopPropagation(); setShowPractice(p => !p); }}
                        >
                            <span>🎙️ {showPractice ? "Hide Voice Mock" : "Practice Answering This Question (AI Mock)"}</span>
                            <span className='practice-toggle-badge'>Live Mic</span>
                        </button>
                    </div>

                    {showPractice && (
                        <PracticeAnswerPanel
                            question={item.question}
                            intention={item.intention}
                            modelAnswer={item.answer}
                        />
                    )}
                </div>
            )}
        </div>
    )
}

// ── ATS Heatmap View Component ────────────────────────────────────────────────
const AtsHeatmapView = ({ report }) => {
    const [copiedIndex, setCopiedIndex] = useState(null)

    const copyBullet = (text, idx) => {
        navigator.clipboard.writeText(text)
        setCopiedIndex(idx)
        setTimeout(() => setCopiedIndex(null), 2000)
    }

    const passCategory = report.matchScore >= 80 ? 'High ATS Pass Rate' : report.matchScore >= 60 ? 'Moderate ATS Pass Rate' : 'Low ATS Pass Rate - Action Needed';
    const passClass = report.matchScore >= 80 ? 'ats-pass--high' : report.matchScore >= 60 ? 'ats-pass--med' : 'ats-pass--low';

    return (
        <section className='ats-heatmap-page'>
            <div className='content-header'>
                <h2>ATS Resume Match Heatmap & Gap Scanner</h2>
                <span className='content-header__count'>Real-Time Keyword Audit</span>
            </div>

            <div className={`ats-summary-card ${passClass}`}>
                <div className='ats-summary-card__score'>
                    <span className='ats-big-score'>{report.matchScore}%</span>
                    <div className='ats-summary-text'>
                        <h3>{passCategory}</h3>
                        <p>Based on semantic analysis between your candidate profile and the target job description.</p>
                    </div>
                </div>
            </div>

            <div className='ats-split-grid'>
                <div className='ats-card'>
                    <div className='ats-card__header'>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        <h3>Matched Core Competencies</h3>
                    </div>
                    <p className='ats-card__desc'>Skills and keywords successfully detected in your background:</p>
                    <div className='ats-badge-cloud'>
                        {['Core Role Alignment', 'Target Tech Stack', 'Domain Familiarity', 'Relevant Problem Solving', 'Architecture & System Awareness'].map((skill, i) => (
                            <span key={i} className='ats-badge ats-badge--matched'>
                                ✓ {skill}
                            </span>
                        ))}
                    </div>
                </div>

                <div className='ats-card'>
                    <div className='ats-card__header'>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <h3>Identified Keyword Gaps</h3>
                    </div>
                    <p className='ats-card__desc'>Critical keywords missing or weak compared to JD requirements:</p>
                    <div className='ats-badge-cloud'>
                        {report.skillGaps?.map((gap, i) => (
                            <span key={i} className={`ats-badge ats-badge--gap-${gap.severity}`}>
                                ⚠ {gap.skill} ({gap.severity})
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className='ats-fixes-card'>
                <div className='ats-card__header'>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff2d78" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    <h3>1-Click Resume Bullet Fixes (Bridge Your ATS Gaps)</h3>
                </div>
                <p className='ats-card__desc'>Copy-paste these quantifiable bullet points directly into your resume to immediately boost your ATS keyword score:</p>
                
                <div className='ats-fixes-list'>
                    {report.skillGaps?.map((gap, idx) => {
                        const bulletText = `Leveraged ${gap.skill} within full lifecycle engineering tasks, ensuring high performance, fault tolerance, and strict compliance with production specifications.`;
                        return (
                            <div key={idx} className='ats-fix-item'>
                                <div className='ats-fix-item__header'>
                                    <span className={`skill-tag skill-tag--${gap.severity}`}>Bridge Gap: {gap.skill}</span>
                                    <button
                                        type="button"
                                        className='ats-copy-btn'
                                        onClick={() => copyBullet(bulletText, idx)}
                                    >
                                        {copiedIndex === idx ? "✓ Copied!" : "📋 Copy Bullet"}
                                    </button>
                                </div>
                                <p className='ats-fix-item__text'>"{bulletText}"</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

// ── 60-Second Elevator Pitch Component ─────────────────────────────────────────
const ElevatorPitchView = ({ interviewId }) => {
    const [pitchData, setPitchData] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [secondsLeft, setSecondsLeft] = useState(60)
    const [isTimerRunning, setIsTimerRunning] = useState(false)
    const timerRef = useRef(null)

    useEffect(() => {
        loadPitch()
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
            window.speechSynthesis?.cancel()
        }
    }, [interviewId])

    const loadPitch = async () => {
        setIsLoading(true)
        try {
            const res = await getElevatorPitch(interviewId)
            setPitchData(res.pitchData)
        } catch (err) {
            console.error("Failed to load elevator pitch:", err)
        } finally {
            setIsLoading(false)
        }
    }

    const toggleTimer = () => {
        if (isTimerRunning) {
            clearInterval(timerRef.current)
            setIsTimerRunning(false)
        } else {
            if (secondsLeft === 0) setSecondsLeft(60)
            setIsTimerRunning(true)
            timerRef.current = setInterval(() => {
                setSecondsLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current)
                        setIsTimerRunning(false)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        }
    }

    const resetTimer = () => {
        clearInterval(timerRef.current)
        setIsTimerRunning(false)
        setSecondsLeft(60)
    }

    const listenToPitch = () => {
        if (!pitchData?.pitch) return
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(pitchData.pitch)
        utterance.rate = 0.95
        window.speechSynthesis.speak(utterance)
    }

    return (
        <section className='pitch-page'>
            <div className='content-header'>
                <h2>60-Second "Tell Me About Yourself" Pitch</h2>
                <span className='content-header__count'>Practice Teleprompter</span>
            </div>

            {isLoading && (
                <div className='pitch-loading'>
                    <div className='generating-overlay__spinner' style={{ width: '40px', height: '40px' }}>
                        <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
                        </svg>
                    </div>
                    <p>Synthesizing your tailored 60-second pitch...</p>
                </div>
            )}

            {!isLoading && pitchData && (
                <>
                    {/* Teleprompter Box */}
                    <div className='teleprompter-card'>
                        <div className='teleprompter-card__header'>
                            <div className='teleprompter-timer-badge'>
                                ⏱️ {secondsLeft}s left
                            </div>
                            <div className='teleprompter-controls'>
                                <button
                                    type="button"
                                    className={`button primary-button teleprompter-btn ${isTimerRunning ? 'teleprompter-btn--pause' : ''}`}
                                    onClick={toggleTimer}
                                >
                                    {isTimerRunning ? "⏸ Pause Rehearsal" : "▶ Start 60s Rehearsal"}
                                </button>
                                <button type="button" className='mock-clear-btn' onClick={resetTimer}>
                                    Reset
                                </button>
                                <button type="button" className='mock-clear-btn' onClick={listenToPitch} title="Listen to pitch cadence">
                                    🔊 Listen Aloud
                                </button>
                            </div>
                        </div>

                        <div className='teleprompter-body'>
                            <p className='teleprompter-script'>
                                "{pitchData.pitch}"
                            </p>
                        </div>
                    </div>

                    {/* Breakdown Cards */}
                    <div className='pitch-breakdown-grid'>
                        <div className='pitch-mini-card'>
                            <span className='pitch-step-pill'>Phase 1: The Hook (0-10s)</span>
                            <h4>Professional Identity</h4>
                            <p>{pitchData.hook}</p>
                        </div>
                        <div className='pitch-mini-card'>
                            <span className='pitch-step-pill'>Phase 2: Core Proof (10-40s)</span>
                            <h4>Proven Track Record & Wins</h4>
                            <p>{pitchData.coreProof}</p>
                        </div>
                        <div className='pitch-mini-card'>
                            <span className='pitch-step-pill'>Phase 3: The Closer (40-60s)</span>
                            <h4>Role Alignment & Urgency</h4>
                            <p>{pitchData.closer}</p>
                        </div>
                    </div>
                </>
            )}
        </section>
    )
}

const RoadMapDay = ({ day }) => (
    <div className='roadmap-day'>
        <div className='roadmap-day__header'>
            <span className='roadmap-day__badge'>Day {day.day}</span>
            <h3 className='roadmap-day__focus'>{day.focus}</h3>
        </div>
        <ul className='roadmap-day__tasks'>
            {day.tasks.map((task, i) => (
                <li key={i}>
                    <span className='roadmap-day__bullet' />
                    {task}
                </li>
            ))}
        </ul>
    </div>
)

const PDF_STEPS = [
    "Starting print rendering engine...",
    "Injecting document styling presets...",
    "Formatting roadmap timeline structures...",
    "Embedding your matching skill profile...",
    "Compiling and outputting final A4 PDF..."
];

// ── Main Component ────────────────────────────────────────────────────────────

const Interview = () => {
    const [activeNav, setActiveNav] = useState('technical')
    const [isDownloading, setIsDownloading] = useState(false)
    const [isLongWait, setIsLongWait] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [showNotice, setShowNotice] = useState(true)
    const longWaitTimerRef = useRef(null)

    const handleCloseNotice = () => {
        setShowNotice(false)
    }

    const navigate = useNavigate()
    const { handleLogout } = useAuth()


    const { interviewId } = useParams() // Get ID from url parameters
    const { loading, getReportById, report, getResumePdf } = useInterview()

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


    // Fetch report when the page mounts or when ID in URL changes
    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        }
    }, [interviewId])

    // Cycle through PDF steps while loading
    useEffect(() => {
        if (!isDownloading) {
            setCurrentStepIndex(0)
            return
        }
        const interval = setInterval(() => {
            setCurrentStepIndex((prev) => (prev + 1) % PDF_STEPS.length)
        }, 4500)
        return () => clearInterval(interval)
    }, [isDownloading])


    const handleDownloadPdf = async () => {
        setIsDownloading(true)
        setIsLongWait(false)
        longWaitTimerRef.current = setTimeout(() => setIsLongWait(true), 35000)
        try {
            await getResumePdf(interviewId)
        } catch (error) {
            console.error("PDF generation failed:", error)
            alert("Failed to generate PDF. Please try again.")
        } finally {
            setIsDownloading(false)
            setIsLongWait(false)
            clearTimeout(longWaitTimerRef.current)
        }
    }

    // Show loading / prevent crash if report is not yet loaded
    if (loading || !report || (report._id !== interviewId && report.id !== interviewId)) {
        return (
            <div className='interview-page' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0d1117' }}>
                <div className='generating-overlay' style={{ position: 'relative', background: 'none', backdropFilter: 'none' }}>
                    <div className='generating-overlay__card' style={{ boxShadow: 'none', border: 'none', background: 'none' }}>
                        <div className='generating-overlay__spinner'>
                            <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
                            </svg>
                        </div>
                        <p className='generating-overlay__title' style={{ marginTop: '1.25rem' }}>Processing request&hellip;</p>
                        <p className='generating-overlay__sub'>Please wait a moment while we complete this action...</p>
                        <div className='generating-overlay__dots' style={{ marginTop: '1rem' }}>
                            <span /><span /><span />
                        </div>
                    </div>
                </div>
            </div>
        )
    }


    const scoreColor =
        report.matchScore >= 80 ? 'score--high' :
            report.matchScore >= 60 ? 'score--mid' : 'score--low'

    return (
        <div className='interview-page'>

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

            {/* ── Loading Overlay for PDF generation ── */}
            {isDownloading && (
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
                                <p className='generating-overlay__sub'>Rendering your resume PDF. Please hang tight — don't close this page.</p>
                            </>
                        ) : (
                            <>
                                <p className='generating-overlay__title'>Loading your Interview Strategy&hellip;</p>
                                <p className='generating-overlay__sub'>{PDF_STEPS[currentStepIndex]}</p>
                            </>
                        )}
                        <div className='generating-overlay__dots'>
                            <span /><span /><span />
                        </div>
                    </div>
                </div>
            )}

            <div className='interview-layout'>

                {/* ── Left Nav ── */}
                <nav className='interview-nav'>
                    <div className="nav-content">
                        <div className="interview-brand-header" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
                            <span className="interview-brand-logo">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                            </span>
                            <span className="interview-brand-name">PrepAi</span>
                        </div>
                        <p className='interview-nav__label'>Sections</p>
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                onClick={() => setActiveNav(item.id)}
                            >
                                <span className='interview-nav__icon'>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                        {/* Logout button - mobile only (scrolls horizontally with sections) */}
                        <button
                            onClick={onLogoutClick}
                            className='interview-nav__logout interview-nav__logout--mobile'>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                            Log Out
                        </button>
                    </div>
                    {/* Actions container for desktop download & logout */}
                    <div className='interview-nav__actions-desktop'>
                        {/* Download button — desktop only (hidden on mobile via CSS) */}
                        <button
                            onClick={handleDownloadPdf}
                            className='button primary-button interview-nav__download'>
                            <svg height={"0.8rem"} style={{ marginRight: "0.8rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path></svg>
                            Download Resume
                        </button>
                        {/* Logout button — desktop only (hidden on mobile via CSS) */}
                        <button
                            onClick={onLogoutClick}
                            className='interview-nav__logout-desktop'>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                            Log Out
                        </button>
                    </div>
                </nav>

                <div className='interview-divider' />

                {/* ── Center Content ── */}
                <main className='interview-content'>
                    {showNotice && (
                        <div className='free-tier-notice'>
                            <div className='free-tier-notice__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                            </div>
                            <div className='free-tier-notice__content'>
                                <strong>Gemini Free Tier Notice:</strong> PrepAi is powered by the free tier of Gemini AI. During peak traffic hours, generating your interview strategy or downloading the resume PDF may occasionally time out or fail. If you experience an issue, please retry 2-3 times.
                            </div>
                            <button className='free-tier-notice__close' onClick={handleCloseNotice} title="Dismiss notice">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    )}
                    {activeNav === 'technical' && (
                        <section>
                            <div className='content-header'>
                                <h2>Technical Questions</h2>
                                <span className='content-header__count'>{report.technicalQuestion.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.technicalQuestion.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'behavioral' && (
                        <section>
                            <div className='content-header'>
                                <h2>Behavioral Questions</h2>
                                <span className='content-header__count'>{report.behavioralQuestion.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.behavioralQuestion.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'ats-heatmap' && (
                        <AtsHeatmapView report={report} />
                    )}

                    {activeNav === 'pitch' && (
                        <ElevatorPitchView interviewId={interviewId} />
                    )}

                    {activeNav === 'roadmap' && (
                        <section>
                            <div className='content-header'>
                                <h2>Preparation Road Map</h2>
                                <span className='content-header__count'>{report.preparationPlan.length}-day plan</span>
                            </div>
                            <div className='roadmap-list'>
                                {report.preparationPlan.map((day) => (
                                    <RoadMapDay key={day.day} day={day} />
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                <div className='interview-divider' />

                {/* ── Right Sidebar ── */}
                <aside className='interview-sidebar'>

                    {/* Match Score */}
                    <div className='match-score'>
                        <p className='match-score__label'>Match Score</p>
                        <div className={`match-score__ring ${scoreColor}`}>
                            <svg className='match-score__svg' viewBox="0 0 80 80">
                                <circle className='match-score__bg-circle' cx="40" cy="40" r="34" />
                                <circle
                                    className='match-score__bar-circle'
                                    cx="40"
                                    cy="40"
                                    r="34"
                                    style={{
                                        strokeDasharray: 213,
                                        strokeDashoffset: 213,
                                        "--target-offset": 213 - (213 * report.matchScore) / 100
                                    }}
                                />
                            </svg>
                            <div className='match-score__text'>
                                <span className='match-score__value'>{report.matchScore}</span>
                                <span className='match-score__pct'>%</span>
                            </div>
                        </div>
                        <p className='match-score__sub'>
                            {report.matchScore >= 80 ? 'Strong match for this role' :
                                report.matchScore >= 60 ? 'Moderate match for this role' : 'Requires key preparations'}
                        </p>
                    </div>

                    <div className='sidebar-divider' />

                    {/* Skill Gaps */}
                    <div className='skill-gaps'>
                        <p className='skill-gaps__label'>Skill Gaps</p>
                        <div className='skill-gaps__list'>
                            {report.skillGaps.map((gap, i) => (
                                <span key={i} className={`skill-tag skill-tag--${gap.severity}`}>
                                    {gap.skill}
                                </span>
                            ))}
                        </div>
                    </div>

                </aside>

                {/* ── Mobile-only Download Resume (last on mobile) ── */}
                <div className='mobile-download'>
                    <button
                        onClick={handleDownloadPdf}
                        className='button primary-button mobile-download__btn'>
                        <svg height={"0.8rem"} style={{ marginRight: "0.8rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path></svg>
                        Download Resume
                    </button>
                </div>

            </div>
        </div>
    )
}

export default Interview