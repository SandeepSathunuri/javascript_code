import { useState, useEffect, useRef, useCallback } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

type DashTab = "history" | "docs" | "brief" | "settings"
type OverlayTab = "answer" | "followups" | "coding" | "recap"

interface CallSession {
  id: string; title: string; date: string; duration: number
  transcript: string; notes: string
  suggestions: Array<{ question: string; answer: string }>
  analysis?: any; meetingNotes?: any
}

interface ContextDoc { id: string; name: string; content: string; date: string; type: string }

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icon = {
  Sparkle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.18 3.64a3 3 0 0 0 2.18 2.18L19 10l-3.64 1.18a3 3 0 0 0-2.18 2.18L12 17l-1.18-3.64a3 3 0 0 0-2.18-2.18L5 10l3.64-1.18a3 3 0 0 0 2.18-2.18z"/>
    </svg>
  ),
  Send: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/>
    </svg>
  ),
  X: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Minus: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Play: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  Stop: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><rect x="9" y="9" width="6" height="6"/>
    </svg>
  ),
  Mic: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  ),
  Camera: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  Code: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  Clock: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Chat: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Eye: ({ off = false }: { off?: boolean }) => off ? (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Refresh: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  Copy: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  Plus: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Doc: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  Settings: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  History: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Brief: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  Check: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Star: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Zap: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Home: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Cloud: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
    </svg>
  ),
  Upload: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  ),
  Globe: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
}

// ─── Small reusable components ────────────────────────────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div className={`toggle ${on ? "on" : ""}`} onClick={onToggle}>
      <div className="toggle-thumb" />
    </div>
  )
}

function ToggleRow({ label, sub, on, onToggle }: { label: string; sub?: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="toggle-wrap mb-2">
      <div>
        <div className="toggle-label">{label}</div>
        {sub && <div className="toggle-sub">{sub}</div>}
      </div>
      <Toggle on={on} onToggle={onToggle} />
    </div>
  )
}

function ScoreRing({ score }: { score: number }) {
  const pct = `${score * 3.6}deg`
  const color = score >= 80 ? "var(--green)" : score >= 60 ? "var(--amber)" : "var(--red)"
  return (
    <div className="score-ring" style={{ background: `conic-gradient(${color} ${pct}, var(--surface3) 0%)` }}>
      <div className="score-ring-inner">
        <div className="score-num">{score}</div>
        <div className="score-label">Score</div>
      </div>
    </div>
  )
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  }
  return (
    <button className="btn-secondary" onClick={copy} style={{ padding: "4px 10px", fontSize: 11 }}>
      {copied ? <><Icon.Check /> Copied</> : <><Icon.Copy /> Copy</>}
    </button>
  )
}

function Dots() {
  return <div className="dots"><span/><span/><span/></div>
}

function MicBars({ active }: { active: boolean }) {
  return (
    <div className={`mic-bars ${active ? "" : "inactive"}`}>
      <div className="mic-bar"/><div className="mic-bar"/><div className="mic-bar"/>
      <div className="mic-bar"/><div className="mic-bar"/>
    </div>
  )
}

function ShortcutKey({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="shortcut-item">
      <div className="shortcut-keys">
        {keys.map((k, i) => (
          <span key={i} className="shortcut-key">{k}</span>
        ))}
      </div>
      <span className="shortcut-label">{label}</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const CluelyUI: React.FC = () => {
  // ── Mode ──────────────────────────────────────────────────────────────────
  const [isStarted, setIsStarted] = useState(false)

  // ── Dashboard state ────────────────────────────────────────────────────────
  const [dashTab, setDashTab] = useState<DashTab>("history")
  const [callHistory, setCallHistory] = useState<CallSession[]>([])
  const [contextDocs, setContextDocs] = useState<ContextDoc[]>([])
  const [settings, setSettings] = useState<AppSettings>({
    preferredCodingLanguage: "Python",
    transcriptionLanguage: "en",
    autoDetectQuestions: false,
    whisperMode: false,
    stealthMode: false,
    selectedProvider: "groq",
    selectedModel: "llama-3.3-70b-versatile",
    groqApiKey: "",
    geminiApiKey: "",
    ollamaUrl: "http://localhost:11434",
    ollamaModel: "llama3.2",
  })

  // ── Doc form ───────────────────────────────────────────────────────────────
  const [showDocForm, setShowDocForm] = useState(false)
  const [docName, setDocName] = useState("")
  const [docContent, setDocContent] = useState("")
  const [docType, setDocType] = useState<"resume" | "jd" | "notes" | "other">("resume")

  // ── Pre-call brief ─────────────────────────────────────────────────────────
  const [briefTitle, setBriefTitle] = useState("")
  const [briefParticipants, setBriefParticipants] = useState("")
  const [briefNotes, setBriefNotes] = useState("")
  const [brief, setBrief] = useState<any>(null)
  const [briefLoading, setBriefLoading] = useState(false)

  // ── Settings form ──────────────────────────────────────────────────────────
  const [settingsForm, setSettingsForm] = useState<AppSettings | null>(null)
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [groqModels, setGroqModels] = useState<string[]>([])
  const [connStatus, setConnStatus] = useState<"idle" | "testing" | "ok" | "error">("idle")
  const [connError, setConnError] = useState("")

  // ── Overlay state ──────────────────────────────────────────────────────────
  const [overlayTab, setOverlayTab] = useState<OverlayTab>("answer")
  const [transcript, setTranscript] = useState("")
  const [chatInput, setChatInput] = useState("")
  const [answer, setAnswer] = useState("")
  const [answerLoading, setAnswerLoading] = useState(false)
  const [followups, setFollowups] = useState<string[]>([])
  const [followupsLoading, setFollowupsLoading] = useState(false)
  const [codingResult, setCodingResult] = useState<any>(null)
  const [codingLoading, setCodingLoading] = useState(false)
  const [recapNotes, setRecapNotes] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [sessionStart, setSessionStart] = useState<number>(0)
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [sessionQA, setSessionQA] = useState<Array<{ question: string; answer: string }>>([])
  const [postAnalysis, setPostAnalysis] = useState<any>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [meetingNotes, setMeetingNotes] = useState<any>(null)
  const [notesLoading, setNotesLoading] = useState(false)
  const [stealthOn, setStealthOn] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [speechError, setSpeechError] = useState("")
  const [llmError, setLlmError] = useState("")
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(false)
  const [modelInfo, setModelInfo] = useState({ provider: "groq", model: "llama-3.3-70b-versatile" })

  // ── Refs ───────────────────────────────────────────────────────────────────
  const transcriptRef = useRef("")
  const isListeningRef = useRef(false)
  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const answerLoadingRef = useRef(false)
  const lastProcessedLengthRef = useRef(0)
  const autoDetectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null)

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    window.electronAPI.getSettings().then(s => {
      setSettings(s)
      setSettingsForm(s)
      setAutoDetectEnabled(s.autoDetectQuestions)
    }).catch(() => {})
    window.electronAPI.getCurrentLlmConfig().then(setModelInfo).catch(() => {})
    window.electronAPI.getStealthStatus().then(setStealthOn).catch(() => {})
    loadHistory()
    loadDocs()
    window.electronAPI.getAvailableGroqModels().then(setGroqModels).catch(() => {})

    // ── Global shortcut listeners from main process ──────────────────────────
    const unsubAnswer    = window.electronAPI.onShortcutGetAnswer(() => handleGetAnswer())
    const unsubRegen     = window.electronAPI.onShortcutRegenerate(() => handleRegenerate())
    const unsubStealth   = window.electronAPI.onStealthChanged((state) => setStealthOn(state))
    const unsubCoding    = window.electronAPI.onShortcutCodingMode(async ({ path }) => {
      setIsStarted(true)   // ensure overlay is open
      setOverlayTab("coding")
      setCodingLoading(true)
      try {
        const s = await window.electronAPI.getSettings()
        const result = await window.electronAPI.analyzeCodingProblem(path, s.preferredCodingLanguage)
        setCodingResult(result)
      } catch (e: any) { setLlmError(e.message) }
      finally { setCodingLoading(false) }
    })
    const unsubScreenshot = window.electronAPI.onScreenshotTaken(() => {
      // screenshot was taken by shortcut — answer will fire via shortcut-get-answer
    })

    return () => {
      unsubAnswer(); unsubRegen(); unsubStealth(); unsubCoding(); unsubScreenshot()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadHistory = async () => {
    try { setCallHistory(await window.electronAPI.getCallHistory()) } catch {}
  }
  const loadDocs = async () => {
    try { setContextDocs(await window.electronAPI.getContextDocuments()) } catch {}
  }

  // ── Session timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isStarted) {
      const id = Date.now().toString()
      setSessionId(id)
      setSessionStart(Date.now())
      setSessionSeconds(0)
      sessionTimerRef.current = setInterval(() => {
        setSessionSeconds(s => s + 1)
      }, 1000)
      window.electronAPI.resizeWindow(700, 520, true)
    } else {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current)
      window.electronAPI.resizeWindow(900, 700, true)
    }
    return () => { if (sessionTimerRef.current) clearInterval(sessionTimerRef.current) }
  }, [isStarted])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  // ── Auto question detection ────────────────────────────────────────────────
  useEffect(() => {
    if (!autoDetectEnabled || !isStarted) return
    autoDetectTimerRef.current = setInterval(async () => {
      const t = transcriptRef.current
      if (t.length <= lastProcessedLengthRef.current + 20) return
      try {
        const result = await window.electronAPI.detectQuestion(t, lastProcessedLengthRef.current)
        if (result.detected && result.confidence > 0.65 && !answerLoadingRef.current) {
          lastProcessedLengthRef.current = t.length
          handleGetAnswer()
        }
      } catch {}
    }, 3000)
    return () => { if (autoDetectTimerRef.current) clearInterval(autoDetectTimerRef.current) }
  }, [autoDetectEnabled, isStarted])

  // ── Speech recognition ─────────────────────────────────────────────────────

  // Whisper hallucinates these phrases on silence/noise — comprehensive list
  const WHISPER_HALLUCINATIONS = [
    "thank you", "thanks for watching", "thanks for listening",
    "please subscribe", "like and subscribe", "see you next time",
    "bye bye", "goodbye", "good bye",
    "i'm not sure", "i don't know", "i have no idea",
    "tick tock", "tik tok", "rek rek", "marekin",
    "the first time i was going to", "i was going to take a look",
    "subtitles by", "captions by", "transcribed by",
    "return empty", "return empty if", "if only silence",
    "♪", "♫", "[music]", "[applause]", "[laughter]",
    "you", // single word hallucination
  ]

  const isHallucination = (text: string): boolean => {
    const lower = text.toLowerCase().trim()
    const words = lower.split(/\s+/).filter(Boolean)
    // Strip all punctuation to get real word content
    const stripped = lower.replace(/[.,!?;:\-'"()\[\]]/g, "").trim()

    // Pure punctuation or whitespace
    if (stripped.length < 3) return true

    // Single word that's very short (noise like "Self.", ".", "Mm")
    if (words.length === 1 && words[0].replace(/[.,!?]/g, "").length < 4) return true

    // Two identical words (e.g. "Self. Self.")
    if (words.length === 2 && words[0].replace(/[.,!?]/g, "") === words[1].replace(/[.,!?]/g, "")) return true

    // Known Whisper silence hallucinations
    if (WHISPER_HALLUCINATIONS.some(h => lower === h || lower === h + "." || lower.startsWith(h + " "))) return true

    // Contains a known hallucination phrase as the whole content (for longer phrases)
    if (WHISPER_HALLUCINATIONS.some(h => h.length > 8 && lower.includes(h))) return true

    // Repetitive words (e.g. "rek rek rek", "tick tock tick tock")
    if (words.length >= 2 && words.length <= 6) {
      const unique = new Set(words.map(w => w.replace(/[.,!?]/g, "")))
      if (unique.size <= 2 && words.length >= 3) return true
    }

    return false
  }

  const startWhisperRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 }
      })
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : ""
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }

      recorder.onstop = async () => {
        if (!audioChunksRef.current.length) {
          if (isListeningRef.current) setTimeout(startWhisperRecording, 100)
          return
        }
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" })
        const buf = await blob.arrayBuffer()
        setIsTranscribing(true)
        try {
          const text = await window.electronAPI.transcribeAudio(new Uint8Array(buf), settings.transcriptionLanguage)
          const clean = text?.trim() ?? ""
          console.log("[STT] Whisper raw:", JSON.stringify(clean))
          if (clean.length > 1 && !isHallucination(clean)) {
            console.log("[STT] Accepted:", clean)
            transcriptRef.current += clean + " "
            setTranscript(transcriptRef.current)
          } else if (clean.length > 1) {
            console.log("[STT] Rejected hallucination:", JSON.stringify(clean))
          }
        } catch (err: any) {
          if (!err.message?.includes("429")) setSpeechError(err.message || "Transcription failed")
        } finally {
          setIsTranscribing(false)
        }
        if (isListeningRef.current) setTimeout(startWhisperRecording, 100)
      }

      recorder.start()
      setIsRecording(true)
      setSpeechError("")
      // 6s chunks — shorter = less hallucination, more responsive
      setTimeout(() => { if (recorder.state === "recording") recorder.stop() }, 6000)
    } catch (err: any) {
      setSpeechError(`Mic error: ${err.message}`)
      setIsRecording(false)
    }
  }, [settings.transcriptionLanguage])

  const startWebSpeech = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setSpeechError("Speech recognition not available. Enable Whisper Mode."); return }
    if (recognitionRef.current) { try { recognitionRef.current.stop() } catch {} }
    const r = new SR()
    r.continuous = true; r.interimResults = true
    r.lang = settings.transcriptionLanguage || "en-US"
    r.onstart = () => { setSpeechError(""); isListeningRef.current = true; setIsRecording(true) }
    r.onresult = (e: any) => {
      let final = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " "
      }
      if (final) { transcriptRef.current += final; setTranscript(transcriptRef.current) }
    }
    r.onerror = (e: any) => {
      if (e.error === "no-speech") return

      if (e.error === "network") {
        // Web Speech API requires Google's cloud service — blocked in many
        // Electron environments. Auto-switch to Whisper silently.
        isListeningRef.current = false
        setIsRecording(false)
        recognitionRef.current = null
        setSpeechError("network-fallback") // special sentinel, handled in render
        // Switch to Whisper and restart
        setSettings(prev => {
          const updated = { ...prev, whisperMode: true }
          window.electronAPI.saveSettings({ whisperMode: true }).catch(() => {})
          return updated
        })
        setTimeout(() => {
          isListeningRef.current = true
          startWhisperRecording()
        }, 300)
        return
      }

      setSpeechError(`Speech error: ${e.error}`)
      setIsRecording(false)
      if (e.error === "not-allowed") isListeningRef.current = false
    }
    r.onend = () => {
      setIsRecording(false)
      if (isListeningRef.current) setTimeout(() => { try { r.start() } catch {} }, 300)
    }
    recognitionRef.current = r
    try { r.start() } catch (e: any) { setSpeechError("Failed to start speech recognition") }
    transcriptRef.current = ""; setTranscript("")
  }, [settings.transcriptionLanguage])

  const startListening = useCallback(() => {
    isListeningRef.current = true
    if (settings.whisperMode) {
      // Whisper needs a Groq key — check before starting
      if (!settings.groqApiKey) {
        setSpeechError("no-groq-key")
        setIsRecording(false)
        return
      }
      startWhisperRecording()
    } else {
      startWebSpeech()
    }
  }, [settings.whisperMode, settings.groqApiKey, startWhisperRecording, startWebSpeech])

  const stopListening = useCallback(() => {
    isListeningRef.current = false
    if (recognitionRef.current) { try { recognitionRef.current.stop() } catch {}; recognitionRef.current = null }
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop()
    setIsRecording(false)
  }, [])

  useEffect(() => {
    if (isStarted) { startListening() }
    else { stopListening() }
    return stopListening
  }, [isStarted, startListening, stopListening])

  // ── AI actions ─────────────────────────────────────────────────────────────
  const log = (...args: any[]) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[Cluely]", ...args)
    }
  }

  const handleGetAnswer = async () => {
    const fullTranscript = transcriptRef.current.trim()
    const t = fullTranscript.slice(-800)
    const wordCount = t.split(/\s+/).filter(Boolean).length

    log("handleGetAnswer — chars:", t.length, "| words:", wordCount, "| locked:", answerLoadingRef.current)

    // Need at least 25 chars and 4 words — filters out "So, let's go." (13 chars, 3 words)
    if (t.length < 25 || wordCount < 4) {
      log("SKIP — transcript too short to be a real question:", JSON.stringify(t))
      return
    }
    if (answerLoadingRef.current) { log("SKIP — already loading"); return }

    answerLoadingRef.current = true
    setAnswerLoading(true)
    setLlmError("")
    setOverlayTab("answer")

    try {
      const shots = await window.electronAPI.getScreenshots().catch(() => [])
      const paths = shots.slice(-1).map((s: any) => s.path)
      log("Sending to LLM — transcript:", t.slice(-120), "| screenshots:", paths.length)

      const result = await window.electronAPI.analyzeCurrentContext(t, paths)
      log("LLM result:", result?.slice(0, 80))

      if (!result || result.startsWith("Error:")) {
        setLlmError(result || "Empty response from LLM")
        // DO NOT return here — fall through to finally so the lock is released
      } else {
        setAnswer(result)
        // Snapshot the question context for session QA log
        setSessionQA(prev => [...prev, { question: t.slice(-200), answer: result }])
        // Clear transcript after answering — next question starts fresh
        // This prevents the LLM from seeing old answered questions as "recent"
        transcriptRef.current = ""
        setTranscript("")
        log("Transcript cleared — ready for next question")
        // Auto-generate followups in background — don't block the lock
        setFollowupsLoading(true)
        window.electronAPI.generateFollowups(t, result)
          .then(fups => { log("Followups:", fups); setFollowups(fups) })
          .catch(err => log("Followups error:", err))
          .finally(() => setFollowupsLoading(false))
      }
    } catch (e: any) {
      log("handleGetAnswer error:", e.message)
      setLlmError(e.message || "Analysis failed")
    } finally {
      // Always release the lock — this is the critical fix
      log("Releasing answer lock")
      setAnswerLoading(false)
      answerLoadingRef.current = false
    }
  }

  const handleRegenerate = async () => {
    const t = transcriptRef.current.trim().slice(-800)
    log("handleRegenerate — window:", t.length, "chars | locked:", answerLoadingRef.current)
    if (!t) { log("SKIP — empty transcript"); return }
    if (answerLoadingRef.current) { log("SKIP — already loading"); return }

    answerLoadingRef.current = true
    setAnswerLoading(true)
    setLlmError("")

    try {
      const shots = await window.electronAPI.getScreenshots().catch(() => [])
      const paths = shots.slice(-1).map((s: any) => s.path)
      log("Regenerating answer...")
      const result = await window.electronAPI.regenerateAnswer(t, paths)
      log("Regen result:", result?.slice(0, 80))
      if (result && !result.startsWith("Error:")) setAnswer(result)
      else setLlmError(result || "Empty response")
    } catch (e: any) {
      log("handleRegenerate error:", e.message)
      setLlmError(e.message)
    } finally {
      log("Releasing regen lock")
      setAnswerLoading(false)
      answerLoadingRef.current = false
    }
  }

  const handleCodingMode = async () => {
    setOverlayTab("coding"); setCodingLoading(true); setLlmError("")
    try {
      const path = await window.electronAPI.takeScreenshot()
      const result = await window.electronAPI.analyzeCodingProblem(path.path, settings.preferredCodingLanguage)
      setCodingResult(result)
    } catch (e: any) { setLlmError(e.message) }
    finally { setCodingLoading(false) }
  }

  const handleChatSend = async () => {
    const text = chatInput.trim()
    if (!text || answerLoadingRef.current) return
    setChatInput(""); answerLoadingRef.current = true
    setAnswerLoading(true); setLlmError(""); setOverlayTab("answer")
    try {
      const result = await window.electronAPI.chatWithLLM(text)
      setAnswer(result)
    } catch (e: any) { setLlmError(e.message) }
    finally { setAnswerLoading(false); answerLoadingRef.current = false }
  }

  const handleEndSession = async () => {
    stopListening()
    const t = transcriptRef.current
    if (t.trim()) {
      const session: CallSession = {
        id: sessionId, title: t.split(".")[0].substring(0, 60) || "Session",
        date: new Date().toISOString(), duration: sessionSeconds,
        transcript: t, notes: recapNotes, suggestions: sessionQA,
      }
      await window.electronAPI.saveCallSession(session).catch(() => {})
      await loadHistory()
    }
    setIsStarted(false)
    setTranscript(""); transcriptRef.current = ""
    setAnswer(""); setFollowups([]); setCodingResult(null)
    setSessionQA([]); setPostAnalysis(null); setMeetingNotes(null)
    lastProcessedLengthRef.current = 0
  }

  const handlePostAnalysis = async () => {
    setAnalysisLoading(true)
    try {
      const result = await window.electronAPI.generatePostAnalysis(sessionId, transcriptRef.current, sessionQA)
      setPostAnalysis(result); setOverlayTab("recap")
    } catch (e: any) { setLlmError(e.message) }
    finally { setAnalysisLoading(false) }
  }

  const handleMeetingNotes = async () => {
    setNotesLoading(true)
    try {
      const result = await window.electronAPI.generateMeetingNotes(sessionId, transcriptRef.current)
      setMeetingNotes(result); setOverlayTab("recap")
    } catch (e: any) { setLlmError(e.message) }
    finally { setNotesLoading(false) }
  }

  const handleToggleStealth = async () => {
    try { setStealthOn(await window.electronAPI.toggleStealth()) } catch {}
  }

  // ── Settings actions ───────────────────────────────────────────────────────
  const handleSaveSettings = async () => {
    if (!settingsForm) return
    setConnStatus("testing")
    try {
      let res: any
      if (settingsForm.selectedProvider === "groq") res = await window.electronAPI.switchToGroq(settingsForm.groqApiKey || undefined, settingsForm.selectedModel)
      else if (settingsForm.selectedProvider === "ollama") res = await window.electronAPI.switchToOllama(settingsForm.ollamaModel, settingsForm.ollamaUrl)
      else res = await window.electronAPI.switchToGemini(settingsForm.geminiApiKey || undefined)
      if (res.success) {
        setConnStatus("ok"); setConnError("")
        const saved = await window.electronAPI.saveSettings(settingsForm)
        setSettings(saved); setModelInfo(await window.electronAPI.getCurrentLlmConfig())
        setAutoDetectEnabled(saved.autoDetectQuestions)
      } else { setConnStatus("error"); setConnError(res.error || "Connection failed") }
    } catch (e: any) { setConnStatus("error"); setConnError(e.message) }
  }

  const handleLoadOllamaModels = async () => {
    try { setOllamaModels(await window.electronAPI.getAvailableOllamaModels()) } catch {}
  }

  // ── Doc actions ────────────────────────────────────────────────────────────
  const handleAddDoc = async () => {
    if (!docName.trim() || !docContent.trim()) return
    await window.electronAPI.addContextDocument(docName, docContent, docType)
    setDocName(""); setDocContent(""); setDocType("resume"); setShowDocForm(false)
    loadDocs()
  }

  const handleDeleteDoc = async (id: string) => {
    await window.electronAPI.deleteContextDocument(id); loadDocs()
  }

  // ── Pre-call brief ─────────────────────────────────────────────────────────
  const handleGenerateBrief = async () => {
    setBriefLoading(true); setBrief(null)
    try {
      const participants = briefParticipants.split(",").map(s => s.trim()).filter(Boolean)
      const result = await window.electronAPI.generatePreCallBrief(briefTitle, participants, briefNotes)
      setBrief(result)
    } catch (e: any) { setLlmError(e.message) }
    finally { setBriefLoading(false) }
  }

  const providerIcon = (p: string) => p === "groq" ? "⚡" : p === "ollama" ? "🏠" : "☁️"
  const docTypeIcon = (t: string) => t === "resume" ? "📄" : t === "jd" ? "💼" : t === "notes" ? "📝" : "📎"

  // ─────────────────────────────────────────────────────────────────────────────
  // OVERLAY MODE
  // ─────────────────────────────────────────────────────────────────────────────
  if (isStarted) {
    return (
      <div className="overlay-root">
        {/* Toolbar */}
        <div className="toolbar">
          <button className={`tb-btn ${overlayTab === "answer" ? "active" : ""}`} onClick={() => { setOverlayTab("answer"); handleGetAnswer() }}>
            <Icon.Sparkle /> Assist
          </button>
          <button className={`tb-btn ${overlayTab === "followups" ? "active" : ""}`} onClick={() => setOverlayTab("followups")}>
            <Icon.Chat /> Follow-ups
          </button>
          <button className={`tb-btn coding ${overlayTab === "coding" ? "active" : ""}`} onClick={handleCodingMode}>
            <Icon.Code /> Coding
          </button>
          <button className={`tb-btn ${overlayTab === "recap" ? "active" : ""}`} onClick={() => setOverlayTab("recap")}>
            <Icon.Clock /> Recap
          </button>

          <div className="tb-divider" />

          <div className="mic-indicator" style={{ padding: "0 6px" }}>
            <MicBars active={isRecording} />
            {isTranscribing && <div className="spinner" style={{ width: 10, height: 10 }} />}
          </div>

          <div className="session-timer active">{formatTime(sessionSeconds)}</div>

          <div className="tb-divider" />

          <button className={`tb-icon-btn ${stealthOn ? "on" : ""}`} onClick={handleToggleStealth} title={stealthOn ? "Stealth ON" : "Stealth OFF"}>
            <Icon.Eye off={!stealthOn} />
          </button>

          <button className="tb-icon-btn" onClick={handleRegenerate} title="Regenerate answer" disabled={answerLoadingRef.current}>
            <Icon.Refresh />
          </button>

          <button className="tb-icon-btn" onClick={() => window.electronAPI.takeScreenshot().then(() => {})} title="Screenshot (Ctrl+H)">
            <Icon.Camera />
          </button>

          <div className="tb-divider" />

          <button className="tb-btn" onClick={handleEndSession} style={{ color: "var(--red)", fontSize: 11 }}>
            <Icon.Stop /> End
          </button>
        </div>

        {/* Shortcut hint strip */}
        <div className="overlay-shortcuts">
          <span><kbd>Ctrl+Enter</kbd> Answer</span>
          <span><kbd>Ctrl+H</kbd> Screenshot</span>
          <span><kbd>Ctrl+⇧+C</kbd> Coding</span>
          <span><kbd>Ctrl+⇧+R</kbd> Regen</span>
          <span><kbd>Ctrl+⇧+S</kbd> Stealth</span>
          <span><kbd>Ctrl+B</kbd> Hide</span>
        </div>

        {/* Main panel */}
        <div className="overlay-panel fade-up">
          <div className="overlay-tabs">
            {(["answer", "followups", "coding", "recap"] as OverlayTab[]).map(tab => (
              <button key={tab} className={`overlay-tab ${overlayTab === tab ? "active" : ""}`} onClick={() => setOverlayTab(tab)}>
                {tab === "answer" && <><Icon.Sparkle /> Answer</>}
                {tab === "followups" && <><Icon.Chat /> Follow-ups</>}
                {tab === "coding" && <><Icon.Code /> Coding</>}
                {tab === "recap" && <><Icon.Clock /> Recap</>}
              </button>
            ))}
          </div>

          <div className="overlay-content">
            {/* ── Answer tab ── */}
            {overlayTab === "answer" && (
              <>
                {answerLoading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                    <Dots /> Analyzing conversation...
                  </div>
                ) : answer ? (
                  <div className="answer-card fade-up">
                    <div className="answer-label">
                      <Icon.Sparkle /> Suggested Answer
                      <div style={{ marginLeft: "auto" }}><CopyBtn text={answer} /></div>
                    </div>
                    <div className="answer-text">{answer}</div>
                  </div>
                ) : (
                  <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, padding: "8px 0" }}>
                    Press <kbd style={{ background: "rgba(255,255,255,0.1)", padding: "1px 6px", borderRadius: 4, fontSize: 11 }}>Assist</kbd> or speak to get AI suggestions
                  </div>
                )}

                {llmError && (
                  <div style={{ background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#fca5a5" }}>
                    {llmError}
                  </div>
                )}

                {transcript && (
                  <div className="transcript-area">
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>Live Transcript</div>
                    {transcript}
                  </div>
                )}
              </>
            )}

            {/* ── Follow-ups tab ── */}
            {overlayTab === "followups" && (
              <>
                {followupsLoading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                    <Dots /> Generating follow-up questions...
                  </div>
                ) : followups.length > 0 ? (
                  <>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                      Likely next questions
                    </div>
                    {followups.map((q, i) => (
                      <button key={i} className="followup-chip" onClick={() => {
                        transcriptRef.current += " " + q; setTranscript(transcriptRef.current); handleGetAnswer()
                      }}>
                        <span style={{ color: "var(--accent2)", marginRight: 6 }}>{i + 1}.</span>{q}
                      </button>
                    ))}
                  </>
                ) : (
                  <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
                    Get an answer first to see follow-up questions
                  </div>
                )}
              </>
            )}

            {/* ── Coding tab ── */}
            {overlayTab === "coding" && (
              <>
                {codingLoading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                    <Dots /> Analyzing coding problem...
                  </div>
                ) : codingResult ? (
                  <div className="coding-panel fade-up">
                    <div className="coding-label"><Icon.Code /> Coding Solution — {settings.preferredCodingLanguage}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 10, lineHeight: 1.6 }}>
                      <strong style={{ color: "var(--green)" }}>Problem:</strong> {codingResult.problem}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 10, lineHeight: 1.6 }}>
                      <strong style={{ color: "var(--green)" }}>Approach:</strong> {codingResult.approach}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Solution</span>
                      <CopyBtn text={codingResult.solution} />
                    </div>
                    <div className="code-block">{codingResult.solution}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>{codingResult.complexity}</div>
                    {codingResult.hints?.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Hints if stuck</div>
                        {codingResult.hints.map((h: string, i: number) => (
                          <div key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, paddingLeft: 10, borderLeft: "2px solid rgba(16,185,129,0.3)" }}>{h}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
                    Click <strong style={{ color: "var(--green)" }}>Coding</strong> to capture and solve the problem on screen
                  </div>
                )}
              </>
            )}

            {/* ── Recap tab ── */}
            {overlayTab === "recap" && (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <button className="btn-secondary" onClick={handlePostAnalysis} disabled={analysisLoading} style={{ flex: 1, justifyContent: "center" }}>
                    {analysisLoading ? <><div className="spinner" /> Analyzing...</> : <><Icon.Star /> Analyze Performance</>}
                  </button>
                  <button className="btn-secondary" onClick={handleMeetingNotes} disabled={notesLoading} style={{ flex: 1, justifyContent: "center" }}>
                    {notesLoading ? <><div className="spinner" /> Generating...</> : <><Icon.Doc /> Meeting Notes</>}
                  </button>
                </div>

                {postAnalysis && (
                  <div className="fade-up" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                      <ScoreRing score={postAnalysis.overallScore} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>{postAnalysis.summary}</div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 10, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Strengths</div>
                        {postAnalysis.strengths?.map((s: string, i: number) => (
                          <div key={i} className="strength-item"><Icon.Check />{s}</div>
                        ))}
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Improve</div>
                        {postAnalysis.improvements?.map((s: string, i: number) => (
                          <div key={i} className="improvement-item"><Icon.ChevronRight />{s}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {meetingNotes && (
                  <div className="fade-up" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 8 }}>{meetingNotes.title}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 10, lineHeight: 1.6 }}>{meetingNotes.summary}</div>
                    {meetingNotes.keyPoints?.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>Key Points</div>
                        {meetingNotes.keyPoints.map((p: string, i: number) => (
                          <div key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 3, paddingLeft: 10, borderLeft: "2px solid var(--accent)" }}>• {p}</div>
                        ))}
                      </div>
                    )}
                    {meetingNotes.actionItems?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>Action Items</div>
                        {meetingNotes.actionItems.map((a: string, i: number) => (
                          <div key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 3, paddingLeft: 10, borderLeft: "2px solid var(--green)" }}>☐ {a}</div>
                        ))}
                      </div>
                    )}
                    <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                      <CopyBtn text={`${meetingNotes.title}\n\n${meetingNotes.summary}\n\nKey Points:\n${meetingNotes.keyPoints?.join("\n")}\n\nAction Items:\n${meetingNotes.actionItems?.join("\n")}`} />
                    </div>
                  </div>
                )}

                {!postAnalysis && !meetingNotes && (
                  <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
                    End your session to generate analysis and meeting notes
                  </div>
                )}
              </>
            )}
          </div>

          {/* Chat input */}
          <div className="chat-input-row">
            <div className="mic-indicator">
              <MicBars active={isRecording} />
            </div>
            <input
              className="chat-input"
              placeholder="Ask anything about your screen or conversation..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleChatSend()}
            />
            <button className="chat-send" onClick={handleChatSend} disabled={!chatInput.trim() || answerLoadingRef.current}>
              <Icon.Send />
            </button>
          </div>
        </div>

        {/* Error / info banner */}
        {speechError && (
          <div className={`error-banner fade-up ${speechError === "network-fallback" || speechError === "no-groq-key" ? "info" : ""}`}>
            {speechError === "network-fallback" ? (
              <>
                <span style={{ fontSize: 16 }}>🔄</span>
                <span style={{ flex: 1 }}>
                  <strong>Switched to Whisper Mode</strong> — Web Speech needs Google's servers (blocked in Electron).
                  Whisper runs via Groq. Make sure your Groq API key is set in Settings.
                </span>
              </>
            ) : speechError === "no-groq-key" ? (
              <>
                <span style={{ fontSize: 16 }}>🔑</span>
                <span style={{ flex: 1 }}>
                  <strong>Groq API key required for Whisper.</strong> Go to Settings → add your Groq key, then restart the session.
                </span>
              </>
            ) : (
              <>
                <Icon.Mic />
                <span style={{ flex: 1 }}>{speechError}</span>
              </>
            )}
            <button className="btn-icon" onClick={() => setSpeechError("")} style={{ color: "white" }}><Icon.X /></button>
          </div>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DASHBOARD MODE
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="dash">
      {/* Header */}
      <div className="dash-header">
        <div className="dash-logo">
          <div className="dash-logo-dot" />
          Cluely
          <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 400, marginLeft: 4 }}>
            {providerIcon(modelInfo.provider)} {modelInfo.model}
          </span>
        </div>
        <div className="dash-header-right">
          <button className={`stealth-badge ${stealthOn ? "on" : "off"}`} onClick={handleToggleStealth}>
            <Icon.Eye off={!stealthOn} />
            {stealthOn ? "Stealth ON" : "Stealth OFF"}
          </button>
          <button className="btn-primary" onClick={() => setIsStarted(true)}>
            <Icon.Play /> Start Session
          </button>
          <button className="btn-icon" onClick={() => window.electronAPI.minimizeApp()} title="Minimize"><Icon.Minus /></button>
          <button className="btn-icon" onClick={() => window.electronAPI.quitApp()} title="Quit"><Icon.X size={12} /></button>
        </div>
      </div>

      {/* Nav */}
      <div className="dash-nav">
        {([
          { id: "history", label: "History", icon: <Icon.History /> },
          { id: "docs", label: "Context Docs", icon: <Icon.Doc /> },
          { id: "brief", label: "Pre-Call Brief", icon: <Icon.Brief /> },
          { id: "settings", label: "Settings", icon: <Icon.Settings /> },
        ] as { id: DashTab; label: string; icon: React.ReactNode }[]).map(t => (
          <button key={t.id} className={`nav-tab ${dashTab === t.id ? "active" : ""}`} onClick={() => setDashTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Shortcuts bar */}
      <div className="shortcuts-bar">
        <span className="shortcuts-bar-label">Shortcuts</span>
        <ShortcutKey keys={["Ctrl", "Enter"]} label="Get Answer" />
        <ShortcutKey keys={["Ctrl", "H"]} label="Screenshot + Analyze" />
        <ShortcutKey keys={["Ctrl", "⇧", "C"]} label="Coding Mode" />
        <ShortcutKey keys={["Ctrl", "⇧", "R"]} label="Regenerate" />
        <ShortcutKey keys={["Ctrl", "⇧", "S"]} label="Stealth" />
        <ShortcutKey keys={["Ctrl", "B"]} label="Show / Hide" />
        <ShortcutKey keys={["Ctrl", "↑↓←→"]} label="Move Window" />
      </div>

      <div className="dash-body">

        {/* ── History tab ── */}
        {dashTab === "history" && (
          <div className="fade-up">
            <div className="section-header">
              <div className="section-title">Session History</div>
              <span style={{ fontSize: 11, color: "var(--text3)" }}>{callHistory.length} sessions</span>
            </div>
            {callHistory.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">🎙️</div>
                <div className="empty-title">No sessions yet</div>
                <div className="empty-sub">Start a session to begin recording your interviews and meetings</div>
              </div>
            ) : (
              callHistory.map(s => (
                <div key={s.id} className="history-card">
                  <div className="history-card-icon"><Icon.History /></div>
                  <div className="history-card-info">
                    <div className="history-card-title">{s.title || "Untitled Session"}</div>
                    <div className="history-card-meta">
                      <span>{new Date(s.date).toLocaleDateString()}</span>
                      <span>{new Date(s.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      {s.duration > 0 && <span className="badge badge-gray">{Math.floor(s.duration / 60)}m {s.duration % 60}s</span>}
                      {s.analysis && <span className="badge badge-green"><Icon.Star /> {s.analysis.overallScore}</span>}
                      {s.meetingNotes && <span className="badge badge-blue"><Icon.Doc /> Notes</span>}
                    </div>
                  </div>
                  <button className="btn-danger" onClick={() => window.electronAPI.deleteCallSession(s.id).then(loadHistory)}>
                    <Icon.X size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Docs tab ── */}
        {dashTab === "docs" && (
          <div className="fade-up">
            <div className="section-header">
              <div className="section-title">Context Documents</div>
              <button className="btn-secondary" onClick={() => setShowDocForm(!showDocForm)}>
                <Icon.Plus /> Add Document
              </button>
            </div>

            <div className="card mb-3" style={{ background: "rgba(99,102,241,0.06)", borderColor: "rgba(99,102,241,0.2)" }}>
              <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7 }}>
                Add your <strong style={{ color: "var(--accent2)" }}>resume</strong>, <strong style={{ color: "var(--accent2)" }}>job descriptions</strong>, or any context documents. The AI will use these to personalize every answer to your background.
              </div>
            </div>

            {showDocForm && (
              <div className="card mb-3 fade-up">
                <div className="field">
                  <label className="label">Document Name</label>
                  <input className="input" placeholder="e.g. My Resume, Senior Engineer JD" value={docName} onChange={e => setDocName(e.target.value)} />
                </div>
                <div className="field">
                  <label className="label">Type</label>
                  <select className="select" value={docType} onChange={e => setDocType(e.target.value as any)}>
                    <option value="resume">📄 Resume</option>
                    <option value="jd">💼 Job Description</option>
                    <option value="notes">📝 Notes</option>
                    <option value="other">📎 Other</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label">Content</label>
                  <textarea className="textarea" placeholder="Paste your resume or job description here..." value={docContent} onChange={e => setDocContent(e.target.value)} style={{ minHeight: 140 }} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-primary" onClick={handleAddDoc} disabled={!docName.trim() || !docContent.trim()}>
                    <Icon.Check /> Save Document
                  </button>
                  <button className="btn-secondary" onClick={() => setShowDocForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            {contextDocs.length === 0 && !showDocForm ? (
              <div className="empty">
                <div className="empty-icon">📄</div>
                <div className="empty-title">No documents yet</div>
                <div className="empty-sub">Add your resume or job description to get personalized AI answers</div>
              </div>
            ) : (
              contextDocs.map(doc => (
                <div key={doc.id} className="doc-card">
                  <div className="doc-card-icon">{docTypeIcon(doc.type)}</div>
                  <div className="doc-card-info">
                    <div className="doc-card-name">{doc.name}</div>
                    <div className="doc-card-preview">{doc.content.substring(0, 120)}...</div>
                    <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 4 }}>
                      <span className="badge badge-gray">{doc.type}</span>
                      <span style={{ marginLeft: 8 }}>{new Date(doc.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button className="btn-danger" onClick={() => handleDeleteDoc(doc.id)}><Icon.X size={12} /></button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Pre-call brief tab ── */}
        {dashTab === "brief" && (
          <div className="fade-up">
            <div className="section-header">
              <div className="section-title">Pre-Call Brief</div>
            </div>
            <div className="card mb-3" style={{ background: "rgba(99,102,241,0.06)", borderColor: "rgba(99,102,241,0.2)" }}>
              <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7 }}>
                Generate a preparation brief before your meeting or interview. The AI will create talking points, questions to ask, and background context.
              </div>
            </div>
            <div className="field">
              <label className="label">Meeting / Interview Title</label>
              <input className="input" placeholder="e.g. Senior Engineer Interview at Stripe" value={briefTitle} onChange={e => setBriefTitle(e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Participants (comma-separated)</label>
              <input className="input" placeholder="e.g. John Smith (Hiring Manager), Jane Doe (Tech Lead)" value={briefParticipants} onChange={e => setBriefParticipants(e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Additional Notes</label>
              <textarea className="textarea" placeholder="Any additional context, topics to cover, or goals for this meeting..." value={briefNotes} onChange={e => setBriefNotes(e.target.value)} style={{ minHeight: 80 }} />
            </div>
            <button className="btn-primary" onClick={handleGenerateBrief} disabled={briefLoading || !briefTitle.trim()} style={{ marginBottom: 20 }}>
              {briefLoading ? <><div className="spinner" /> Generating Brief...</> : <><Icon.Brief /> Generate Brief</>}
            </button>

            {brief && (
              <div className="fade-up">
                <div className="card mb-3" style={{ background: "rgba(99,102,241,0.06)", borderColor: "rgba(99,102,241,0.2)" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>Overview</div>
                  <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7 }}>{brief.summary}</div>
                </div>
                <div className="brief-section">
                  <div className="brief-section-title">💬 Talking Points</div>
                  {brief.talkingPoints?.map((p: string, i: number) => (
                    <div key={i} className="brief-item"><Icon.ChevronRight />{p}</div>
                  ))}
                </div>
                <div className="brief-section">
                  <div className="brief-section-title">❓ Questions to Ask</div>
                  {brief.questionsToAsk?.map((q: string, i: number) => (
                    <div key={i} className="brief-item"><Icon.Chat />{q}</div>
                  ))}
                </div>
                {brief.backgroundInfo && (
                  <div className="brief-section">
                    <div className="brief-section-title">📚 Background</div>
                    <div className="card-sm" style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7 }}>{brief.backgroundInfo}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Settings tab ── */}
        {dashTab === "settings" && settingsForm && (
          <div className="fade-up">
            {/* AI Provider */}
            <div className="settings-section">
              <div className="settings-section-title"><Icon.Zap /> AI Provider</div>
              <div className="provider-group">
                {["groq", "ollama", "gemini"].map(p => (
                  <button key={p} className={`provider-btn ${settingsForm.selectedProvider === p ? "active" : ""}`}
                    onClick={() => { setSettingsForm({ ...settingsForm, selectedProvider: p }); if (p === "ollama") handleLoadOllamaModels() }}>
                    {p === "groq" ? <><Icon.Zap /> Groq</> : p === "ollama" ? <><Icon.Home /> Ollama</> : <><Icon.Cloud /> Gemini</>}
                  </button>
                ))}
              </div>

              {settingsForm.selectedProvider === "groq" && (
                <>
                  <div className="field">
                    <label className="label">Groq API Key</label>
                    <input className="input" type="password" placeholder="gsk_..." value={settingsForm.groqApiKey} onChange={e => setSettingsForm({ ...settingsForm, groqApiKey: e.target.value })} />
                  </div>
                  <div className="field">
                    <label className="label">Model</label>
                    <select className="select" value={settingsForm.selectedModel} onChange={e => setSettingsForm({ ...settingsForm, selectedModel: e.target.value })}>
                      {groqModels.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </>
              )}

              {settingsForm.selectedProvider === "ollama" && (
                <>
                  <div className="field">
                    <label className="label">Ollama URL</label>
                    <input className="input" placeholder="http://localhost:11434" value={settingsForm.ollamaUrl} onChange={e => setSettingsForm({ ...settingsForm, ollamaUrl: e.target.value })} />
                  </div>
                  <div className="field">
                    <label className="label">Model</label>
                    <select className="select" value={settingsForm.ollamaModel} onChange={e => setSettingsForm({ ...settingsForm, ollamaModel: e.target.value })}>
                      {ollamaModels.length > 0 ? ollamaModels.map(m => <option key={m} value={m}>{m}</option>) : <option value={settingsForm.ollamaModel}>{settingsForm.ollamaModel}</option>}
                    </select>
                  </div>
                </>
              )}

              {settingsForm.selectedProvider === "gemini" && (
                <div className="field">
                  <label className="label">Gemini API Key</label>
                  <input className="input" type="password" placeholder="AIza..." value={settingsForm.geminiApiKey} onChange={e => setSettingsForm({ ...settingsForm, geminiApiKey: e.target.value })} />
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                <button className="btn-primary" onClick={handleSaveSettings} disabled={connStatus === "testing"}>
                  {connStatus === "testing" ? <><div className="spinner" /> Testing...</> : <><Icon.Check /> Save & Connect</>}
                </button>
                {connStatus === "ok" && <span style={{ fontSize: 12, color: "var(--green)", display: "flex", alignItems: "center", gap: 4 }}><div className="status-dot green" /> Connected</span>}
                {connStatus === "error" && <span style={{ fontSize: 12, color: "var(--red)" }}>{connError}</span>}
              </div>
            </div>

            {/* Transcription */}
            <div className="settings-section">
              <div className="settings-section-title"><Icon.Globe /> Transcription & Language</div>
              <div className="field">
                <label className="label">Transcription Language</label>
                <select className="select" value={settingsForm.transcriptionLanguage} onChange={e => setSettingsForm({ ...settingsForm, transcriptionLanguage: e.target.value })}>
                  <option value="en">🇺🇸 English</option>
                  <option value="es">🇪🇸 Spanish</option>
                  <option value="fr">🇫🇷 French</option>
                  <option value="de">🇩🇪 German</option>
                  <option value="zh">🇨🇳 Chinese</option>
                  <option value="ja">🇯🇵 Japanese</option>
                  <option value="ko">🇰🇷 Korean</option>
                  <option value="pt">🇧🇷 Portuguese</option>
                  <option value="ru">🇷🇺 Russian</option>
                  <option value="ar">🇸🇦 Arabic</option>
                  <option value="hi">🇮🇳 Hindi</option>
                  <option value="it">🇮🇹 Italian</option>
                  <option value="nl">🇳🇱 Dutch</option>
                  <option value="pl">🇵🇱 Polish</option>
                  <option value="tr">🇹🇷 Turkish</option>
                  <option value="vi">🇻🇳 Vietnamese</option>
                  <option value="th">🇹🇭 Thai</option>
                  <option value="id">🇮🇩 Indonesian</option>
                </select>
              </div>
              <ToggleRow label="Whisper Mode" sub="High-accuracy transcription via Groq Whisper (requires Groq API key)" on={settingsForm.whisperMode} onToggle={() => setSettingsForm({ ...settingsForm, whisperMode: !settingsForm.whisperMode })} />
            </div>

            {/* Coding */}
            <div className="settings-section">
              <div className="settings-section-title"><Icon.Code /> Coding Interview</div>
              <div className="field">
                <label className="label">Preferred Coding Language</label>
                <select className="select" value={settingsForm.preferredCodingLanguage} onChange={e => setSettingsForm({ ...settingsForm, preferredCodingLanguage: e.target.value })}>
                  {["Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "Swift", "Kotlin", "Ruby", "PHP", "Scala", "R"].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Behavior */}
            <div className="settings-section">
              <div className="settings-section-title"><Icon.Settings /> Behavior</div>
              <ToggleRow label="Auto-detect Questions" sub="Automatically trigger AI when a question is detected in speech" on={settingsForm.autoDetectQuestions} onToggle={() => setSettingsForm({ ...settingsForm, autoDetectQuestions: !settingsForm.autoDetectQuestions })} />
              <ToggleRow label="Stealth Mode" sub="Hide window from screen sharing and recordings" on={settingsForm.stealthMode} onToggle={() => { setSettingsForm({ ...settingsForm, stealthMode: !settingsForm.stealthMode }); handleToggleStealth() }} />
            </div>

            <button className="btn-primary" onClick={handleSaveSettings} disabled={connStatus === "testing"} style={{ width: "100%", justifyContent: "center" }}>
              {connStatus === "testing" ? <><div className="spinner" /> Saving...</> : <><Icon.Check /> Save All Settings</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CluelyUI
