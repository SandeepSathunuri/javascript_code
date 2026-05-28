import { useState, useEffect, useRef, useCallback } from "react"

type Tab = "answer" | "followups" | "recap"
type SettingsView = "models" | "docs" | "history" | null

interface Suggestion { text: string; label?: string }

interface CallSession {
  id: string; title: string; date: string; duration: number
  transcript: string; notes: string
  suggestions: Array<{ question: string; answer: string }>
}

interface ContextDoc {
  id: string; name: string; content: string; date: string
}

function SparkleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.18 3.64a3 3 0 0 0 2.18 2.18L19 10l-3.64 1.18a3 3 0 0 0-2.18 2.18L12 17l-1.18-3.64a3 3 0 0 0-2.18-2.18L5 10l3.64-1.18a3 3 0 0 0 2.18-2.18z" />
      <path d="M18 5l.59 1.77a1.5 1.5 0 0 0 1.09 1.09L21.5 8l-1.77.59a1.5 1.5 0 0 0-1.09 1.09L18 11.5l-.59-1.77a1.5 1.5 0 0 0-1.09-1.09L14.5 8l1.77-.59a1.5 1.5 0 0 0 1.09-1.09z" />
    </svg>
  )
}

function SendIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
    </svg>
  )
}

function SettingsIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function HistoryIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function DocIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function CrossIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function MinimizeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function PencilSparkleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.18 3.64a3 3 0 0 0 2.18 2.18L19 10l-3.64 1.18a3 3 0 0 0-2.18 2.18L12 17l-1.18-3.64a3 3 0 0 0-2.18-2.18L5 10l3.64-1.18a3 3 0 0 0 2.18-2.18z" />
      <path d="M18 5l.59 1.77a1.5 1.5 0 0 0 1.09 1.09L21.5 8l-1.77.59a1.5 1.5 0 0 0-1.09 1.09L18 11.5l-.59-1.77a1.5 1.5 0 0 0-1.09-1.09L14.5 8l1.77-.59a1.5 1.5 0 0 0 1.09-1.09z" />
      <path d="M7.5 13.5l1.5 1.5 3-3" />
    </svg>
  )
}

function ChatBubbleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

function ClockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function StopCircleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><rect x="9" y="9" width="6" height="6" />
    </svg>
  )
}

const CluelyUI: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("answer")
  const [settingsView, setSettingsView] = useState<SettingsView>(null)
  const [transcript, setTranscript] = useState("")
  const [chatInput, setChatInput] = useState("")
  const [chatMessages, setChatMessages] = useState<Array<{role: string; text: string}>>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [currentSuggestion, setCurrentSuggestion] = useState<Suggestion | null>(null)
  const [followups, setFollowups] = useState<string[]>([])
  const [recapNotes, setRecapNotes] = useState("")
  const [modelInfo, setModelInfo] = useState({ provider: "groq", model: "llama-3.1-8b-instant" })
  const [selectedProvider, setSelectedProvider] = useState("groq")
  const [selectedModel, setSelectedModel] = useState("llama-3.1-8b-instant")
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434")
  const [groqApiKey, setGroqApiKey] = useState("")
  const [geminiApiKey, setGeminiApiKey] = useState("")
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null)
  const [availableOllamaModels, setAvailableOllamaModels] = useState<string[]>([])
  const [availableGroqModels] = useState(["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "mixtral-8x7b-32768"])
  const [contextDocs, setContextDocs] = useState<ContextDoc[]>([])
  const [callHistory, setCallHistory] = useState<CallSession[]>([])
  const [showDocInput, setShowDocInput] = useState(false)
  const [docName, setDocName] = useState("")
  const [docContent, setDocContent] = useState("")
  const [stealthOn, setStealthOn] = useState(true)
  const [llmError, setLlmError] = useState<string | null>(null)
  const [speechError, setSpeechError] = useState<string | null>(null)
  const [isStableMode, setIsStableMode] = useState(false)
  const [useWhisperFallback, setUseWhisperFallback] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isRecognitionActive, setIsRecognitionActive] = useState(false)
  const [isCluelyStarted, setIsCluelyStarted] = useState(false)
  const [dashTab, setDashTab] = useState<"history" | "docs">("history")
  const [analyzing, setAnalyzing] = useState(false)

  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const isListeningRef = useRef(false)
  const transcriptRef = useRef("")
  const contentRef = useRef<HTMLDivElement>(null)
  const analyzingRef = useRef(false)
  const llmErrorRef = useRef<string | null>(null)

  const setLlmErrorState = (msg: string | null) => {
    llmErrorRef.current = msg
    setLlmError(msg)
  }

  useEffect(() => {
    window.electronAPI.getCurrentLlmConfig().then(c => {
      setModelInfo(c); setSelectedProvider(c.provider); setSelectedModel(c.model)
      setConnectionStatus("connected")
    }).catch(() => { setConnectionStatus("error: init failed") })
    window.electronAPI.getStealthStatus().then(setStealthOn).catch(() => {})
    loadContextDocs()
    loadCallHistory()
  }, [])

  const handleToggleStealth = async () => {
    try { setStealthOn(await window.electronAPI.toggleStealth()) } catch {}
  }

  const loadContextDocs = async () => { try { setContextDocs(await window.electronAPI.getContextDocuments()) } catch {} }
  const loadCallHistory = async () => { try { setCallHistory(await window.electronAPI.getCallHistory()) } catch {} }
  const loadOllamaModels = async () => { try { setAvailableOllamaModels(await window.electronAPI.getAvailableOllamaModels()) } catch {} }

  const saveCallSession = async (finalTranscript: string) => {
    if (!finalTranscript.trim()) return
    const session: CallSession = {
      id: Date.now().toString(),
      title: finalTranscript.split(".")[0].substring(0, 60) || "Call",
      date: new Date().toISOString(), duration: 0,
      transcript: finalTranscript, notes: recapNotes,
      suggestions: currentSuggestion ? [{ question: "AI Suggestion", answer: currentSuggestion.text }] : [],
    }
    try { await window.electronAPI.saveCallSession(session); loadCallHistory() } catch {}
  }

  const analyzeContext = async (text: string) => {
    const trimmed = text.trim()
    if (trimmed.length < 5 || analyzingRef.current) return
    analyzingRef.current = true
    setAnalyzing(true)
    setLlmErrorState(null)
    setActiveTab("answer")
    try {
      const screenshotPaths: string[] = []
      try { const shots = await window.electronAPI.getScreenshots(); if (shots.length > 0) screenshotPaths.push(shots[shots.length - 1].path) } catch {}
      const result = await window.electronAPI.analyzeCurrentContext(trimmed, screenshotPaths)
      if (result && !result.startsWith("Error:")) {
        setCurrentSuggestion({ text: result, label: "Suggested Answer" })
        const lines = result.split("\n").filter(l => l.trim())
        const fups = lines.filter(l => l.includes("?")).slice(0, 3)
        if (fups.length > 0) setFollowups(fups)
      } else {
        setLlmErrorState(result || "LLM returned empty response")
      }
    } catch (e: any) {
      setLlmErrorState(e.message || "LLM analysis failed")
    } finally {
      setAnalyzing(false)
      analyzingRef.current = false
    }
  }

  const handleGetAnswer = () => {
    analyzeContext(transcriptRef.current)
  }

  useEffect(() => {
    if (isCluelyStarted) {
      // Small overlay size
      window.electronAPI.resizeWindow(700, 450, true)
    } else {
      // Larger dashboard size
      window.electronAPI.resizeWindow(850, 680, true)
    }
  }, [isCluelyStarted])

  const startWhisperRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      const options = { mimeType: 'audio/webm;codecs=opus' }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        delete (options as any).mimeType
      }

      const recorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        if (audioChunksRef.current.length === 0) {
          if (isListeningRef.current) setTimeout(startWhisperRecording, 100)
          return
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType })
        const arrayBuffer = await audioBlob.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        
        setIsTranscribing(true)
        try {
          let text = await window.electronAPI.transcribeAudio(uint8Array)
          if (text && text.trim().length > 1) {
            const cleanedText = text.trim()
            
            // Basic hallucination filter: ignore common filler repetitions
            const commonHallucinations = ["I'm not sure what I'm doing", "Thank you", "Okay"]
            const isRepetitiveHallucination = commonHallucinations.some(h => 
              cleanedText.toLowerCase().includes(h.toLowerCase()) && 
              cleanedText.split(" ").length < 10
            )

            if (!isRepetitiveHallucination) {
              transcriptRef.current += cleanedText + " "
              setTranscript(transcriptRef.current)
            }
          }
        } catch (err: any) {
          console.error("Whisper fallback error:", err)
          // Don't show error banner for every rate limit to avoid annoyance
          if (!err.message.includes("429")) {
            setSpeechError(`Whisper Error: ${err.message || "Failed to transcribe"}`)
          }
        } finally {
          setIsTranscribing(false)
        }

        // Restart recording if still listening
        if (isListeningRef.current) {
          setTimeout(startWhisperRecording, 100)
        }
      }

      // Record in 8-second chunks for a balance of context and responsiveness
      recorder.start()
      setIsRecognitionActive(true)
      setSpeechError(null)
      
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop()
        }
      }, 8000)

    } catch (err: any) {
      console.error("Failed to start Whisper recording:", err)
      setSpeechError(`Microphone access error: ${err.message}`)
      setIsRecognitionActive(false)
    }
  }, [])

  const startListening = useCallback(() => {
    if (useWhisperFallback) {
      isListeningRef.current = true
      startWhisperRecording()
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechError("Speech recognition not available in this browser.")
      return
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch (e) {}
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = !isStableMode
    recognition.interimResults = !isStableMode
    recognition.lang = "en-US"

    recognition.onstart = () => {
      setSpeechError(null)
      isListeningRef.current = true
      setIsRecognitionActive(true)
    }

    recognition.onresult = (event: any) => {
      let interim = ""
      let final = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += text + " "
        } else {
          interim += text
        }
      }
      if (final) {
        transcriptRef.current += final
      }
      setTranscript(transcriptRef.current + interim)
    }

    recognition.onerror = (event: any) => {
      console.error("Speech Error:", event.error)
      if (event.error === 'no-speech') return // Ignore no-speech errors
      
      let msg = event.error
      if (event.error === 'network') {
        msg = "Network error: The speech service is unreachable. This usually happens if Google's speech service is blocked. Try 'Whisper Mode' or check your connection."
        isListeningRef.current = false 
      }
      
      setSpeechError(`Speech Error: ${msg}`)
      setIsRecognitionActive(false)
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        isListeningRef.current = false
      }
    }

    recognition.onend = () => {
      setIsRecognitionActive(false)
      if (isListeningRef.current) {
        setTimeout(() => {
          if (isListeningRef.current) {
            try { recognition.start() } catch (e) {
              console.error("Failed to restart recognition:", e)
            }
          }
        }, 300)
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch (e) {
      console.error("Failed to start recognition:", e)
      setSpeechError("Failed to start speech recognition")
    }
    transcriptRef.current = ""
    setTranscript("")
  }, [isStableMode, useWhisperFallback, startWhisperRecording])

  useEffect(() => {
    startListening()
    return () => {
      isListeningRef.current = false
      if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop()
      }
    }
  }, [startListening])

  const handleChatSend = async () => {
    const text = chatInput.trim()
    if (!text || chatLoading) return
    setChatInput(""); setChatMessages(prev => [...prev, { role: "user", text }])
    setChatLoading(true)
    setLlmErrorState(null)
    setActiveTab("answer")
    setCurrentSuggestion({ text: "Thinking...", label: "AI Assistant" })
    try {
      const ctx = contextDocs.map(d => `--- ${d.name} ---\n${d.content}`).join("\n\n")
      const response = await window.electronAPI.chatWithLLM(text, ctx)
      setChatMessages(prev => [...prev, { role: "assistant", text: response }])
      setCurrentSuggestion({ text: response, label: "AI Assistant" })
    } catch (e: any) {
      const msg = e.message || "Chat request failed"
      setChatMessages(prev => [...prev, { role: "assistant", text: `Error: ${msg}` }])
      setCurrentSuggestion({ text: `Error: ${msg}`, label: "Error" })
      setLlmErrorState(msg)
    } finally { setChatLoading(false) }
  }

  const handleApplyChanges = async () => {
    setConnectionStatus("testing")
    setLlmErrorState(null)
    try {
      let result: any
      if (selectedProvider === "ollama") result = await window.electronAPI.switchToOllama(selectedModel, ollamaUrl)
      else if (selectedProvider === "groq") result = await window.electronAPI.switchToGroq(groqApiKey || undefined, selectedModel)
      else result = await window.electronAPI.switchToGemini(geminiApiKey || undefined)
      if (result.success) {
        setConnectionStatus("connected")
        setModelInfo(await window.electronAPI.getCurrentLlmConfig())
      } else {
        setConnectionStatus(`error: ${result.error}`)
        setLlmErrorState(result.error)
      }
    } catch (e: any) { setConnectionStatus(`error: ${e.message}`); setLlmErrorState(e.message) }
  }

  const handleAddDocument = async () => {
    if (!docName.trim() || !docContent.trim()) {
      setLlmErrorState("Please enter both a document name and content.")
      return
    }
    try {
      setLlmErrorState(null)
      await window.electronAPI.addContextDocument(docName, docContent)
      setDocName(""); setDocContent(""); setShowDocInput(false)
      await loadContextDocs()
    } catch (e: any) {
      setLlmErrorState(`Failed to save document: ${e.message}`)
    }
  }

  const handleDeleteDocument = async (id: string) => { try { await window.electronAPI.deleteContextDocument(id); loadContextDocs() } catch {} }
  const handleDeleteHistory = async (id: string) => { try { await window.electronAPI.deleteCallSession(id); loadCallHistory() } catch {} }

  const handleHistoryClick = (session: CallSession) => {
    setTranscript(session.transcript); setRecapNotes(session.notes)
    setChatMessages(session.suggestions.map(s => ({ role: "assistant", text: s.answer })))
    setActiveTab("recap")
  }

  const getModelDisplay = () => {
    const icons: Record<string, string> = { groq: "⚡", ollama: "🏠", gemini: "☁️" }
    return `${icons[modelInfo.provider] || "☁️"} ${modelInfo.model}`
  }

  if (!isCluelyStarted) {
    return (
      <div className="cl-dashboard">
        <div className="cl-dash-header">
          <div className="cl-dash-brand">
            Cluely
            <button className="cl-header-btn" style={{ marginLeft: 8, color: "#9ca3af" }}><SyncIcon size={20} /></button>
          </div>
          <div className="cl-dash-actions">
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#4b5563" }}>
              <span>Detectable</span>
              <div 
                className={`cl-stealth-toggle ${stealthOn ? "off" : "on"}`}
                onClick={handleToggleStealth}
                style={{
                  width: 44, height: 22, borderRadius: 11, background: stealthOn ? "#e5e7eb" : "#10b981",
                  position: "relative", cursor: "pointer", transition: "0.2s"
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", background: "white",
                  position: "absolute", top: 2, left: stealthOn ? 2 : 24, transition: "0.2s"
                }} />
              </div>
            </div>
            <button className="cl-start-btn" onClick={() => setIsCluelyStarted(true)}>
              <PowerIcon size={18} />
              Start Cluely
            </button>
            <button 
              className="cl-header-btn" 
              onClick={() => window.electronAPI.minimizeApp()} 
              style={{ color: "#9ca3af", marginLeft: 8 }}
              title="Minimize"
            >
              <MinimizeIcon size={20} />
            </button>
            <button 
              className="cl-header-btn" 
              onClick={() => window.electronAPI.quitApp()} 
              style={{ color: "#9ca3af", marginLeft: 4 }}
              title="Close App"
            >
              <CrossIcon size={22} />
            </button>
          </div>
        </div>

        <div className="cl-dash-content">
          <div style={{ display: "flex", gap: 24, marginBottom: 24, borderBottom: "1px solid #f3f4f6" }}>
            <div 
              onClick={() => setDashTab("history")}
              style={{ 
                padding: "8px 4px", fontSize: 15, fontWeight: dashTab === "history" ? 600 : 400,
                color: dashTab === "history" ? "#111827" : "#9ca3af", cursor: "pointer",
                borderBottom: dashTab === "history" ? "2px solid #3b82f6" : "none"
              }}
            >
              History
            </div>
            <div 
              onClick={() => setDashTab("docs")}
              style={{ 
                padding: "8px 4px", fontSize: 15, fontWeight: dashTab === "docs" ? 600 : 400,
                color: dashTab === "docs" ? "#111827" : "#9ca3af", cursor: "pointer",
                borderBottom: dashTab === "docs" ? "2px solid #3b82f6" : "none"
              }}
            >
              Context Documents
            </div>
          </div>

          {dashTab === "history" ? (
            <div className="cl-history-section">
              <div className="cl-section-title">Interview History</div>
              {callHistory.length > 0 ? (
                callHistory.map(session => (
                  <div key={session.id} className="cl-history-card" onClick={() => handleHistoryClick(session)}>
                    <div className="info">
                      <div className="title">{session.title || "Untitled Interview"}</div>
                      <div className="meta">
                        <span className="duration">{session.duration || "N/A"}</span>
                        <span>{new Date(session.date).toLocaleDateString()}</span>
                        <span>{new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <button 
                      className="cl-header-btn" 
                      onClick={(e) => { e.stopPropagation(); handleDeleteHistory(session.id) }}
                      style={{ color: "#9ca3af" }}
                    >
                      ✕
                    </button>
                  </div>
                ))
              ) : (
                <div className="cl-empty" style={{ background: "transparent" }}>
                  <div className="icon">🎙️</div>
                  No interview history yet. Start Cluely to begin.
                </div>
              )}
            </div>
          ) : (
            <div className="cl-history-section">
              <div className="cl-section-title">JD & Resume Context</div>
              <div style={{ background: "#f3f4f6", padding: "14px 20px", borderRadius: 12, marginBottom: 20, fontSize: 14, color: "#4b5563" }}>
                Add your resume or job descriptions below. The AI will use this context to provide personalized answers during your interview.
              </div>
              
              {contextDocs.map(doc => (
                <div key={doc.id} className="cl-history-card" style={{ border: "1px solid #f3f4f6", borderRadius: 12, padding: "12px 16px", marginBottom: 10 }}>
                  <div className="info">
                    <div className="title" style={{ fontWeight: 600 }}>📄 {doc.name}</div>
                    <div className="meta" style={{ marginTop: 4 }}>{doc.content.substring(0, 100)}...</div>
                  </div>
                  <button className="cl-header-btn" onClick={() => handleDeleteDocument(doc.id)} style={{ color: "#ef4444" }}>✕</button>
                </div>
              ))}

              {showDocInput ? (
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginTop: 10 }}>
                  <input className="cl-input" style={{ width: "100%", marginBottom: 10, background: "#f9fafb" }} placeholder="Document Name (e.g. My Resume, QA Job Description)" value={docName} onChange={e => setDocName(e.target.value)} />
                  <textarea className="cl-input" style={{ width: "100%", minHeight: 120, background: "#f9fafb", resize: "none" }} placeholder="Paste the content of your JD or Resume here..." value={docContent} onChange={e => setDocContent(e.target.value)} />
                  <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <button className="cl-action-btn primary" onClick={handleAddDocument}>Save Document</button>
                    <button className="cl-action-btn" onClick={() => setShowDocInput(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button className="cl-start-btn" style={{ width: "100%", justifyContent: "center", marginTop: 10 }} onClick={() => setShowDocInput(true)}>
                  + Add JD or Resume
                </button>
              )}
            </div>
          )}

          <div style={{ marginTop: 24, display: "flex", gap: 10, borderTop: "1px solid #f3f4f6", paddingTop: 20 }}>
            <button className="cl-action-btn" onClick={() => setSettingsView("models")}>⚙️ AI Settings</button>
            <div style={{ flex: 1 }} />
            <button 
              className={`cl-action-btn ${useWhisperFallback ? "primary" : ""}`} 
              onClick={() => setUseWhisperFallback(!useWhisperFallback)}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              🎙️ {useWhisperFallback ? "Whisper Mode: ON (High Accuracy)" : "Whisper Mode: OFF (Standard)"}
            </button>
          </div>
        </div>

        {settingsView === "models" && (
          <div className="cl-panel-settings" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", padding: 20, borderTop: "1px solid #e5e7eb", maxHeight: "none", zIndex: 100 }}>
            <div className="cl-section-label">AI Model Configuration</div>
            <div className="cl-provider-group" style={{ margin: "10px 0" }}>
              {["groq", "ollama", "gemini"].map(p => (
                <button key={p} className={`cl-provider-btn ${selectedProvider === p ? "active" : ""}`}
                  onClick={() => { setSelectedProvider(p); if (p === "ollama") loadOllamaModels() }}>
                  {p === "groq" ? "⚡ Groq" : p === "ollama" ? "🏠 Ollama" : "☁️ Gemini"}
                </button>
              ))}
            </div>
            <input className="cl-input" type="password" placeholder="API Key" value={selectedProvider === "groq" ? groqApiKey : geminiApiKey} 
              onChange={e => selectedProvider === "groq" ? setGroqApiKey(e.target.value) : setGeminiApiKey(e.target.value)} style={{ marginBottom: 10 }} />
            <div className="cl-action-row">
              <button className="cl-action-btn primary" onClick={handleApplyChanges}>Apply</button>
              <button className="cl-action-btn" onClick={() => setSettingsView(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="cl-overlay-wrapper">
      <div className="cl-toolbar-pill">
        <button className={`cl-toolbar-btn ${activeTab === "answer" ? "active" : ""}`} onClick={() => { setActiveTab("answer"); handleGetAnswer(); }}>
          <SparkleIcon size={16} /> Assist
        </button>
        <button className="cl-toolbar-btn" onClick={() => analyzeContext(transcriptRef.current + "\n[Instruction: Based on the conversation above, suggest exactly what I should say next to keep the conversation professional and impressive.]")}>
          <PencilSparkleIcon size={16} /> What should I say?
        </button>
        <button className={`cl-toolbar-btn ${activeTab === "followups" ? "active" : ""}`} onClick={() => { setActiveTab("followups"); if (followups.length === 0) handleGetAnswer(); }}>
          <ChatBubbleIcon size={16} /> Follow-up questions
        </button>
        <button className={`cl-toolbar-btn recap ${activeTab === "recap" ? "active" : ""}`} onClick={() => setActiveTab("recap")}>
          <ClockIcon size={16} /> Recap
        </button>
        
        <div className="cl-toolbar-divider" />
        
        <button className={`cl-toolbar-action-btn ${useWhisperFallback ? "active" : ""}`} 
          onClick={() => setUseWhisperFallback(!useWhisperFallback)} 
          title={useWhisperFallback ? "Whisper Mode ON" : "Whisper Mode OFF"}
          style={{ color: useWhisperFallback ? "var(--cl-green)" : "white" }}
        >
          <span>🎙️</span>
        </button>

        <button className="cl-toolbar-action-btn" onClick={() => setIsCluelyStarted(false)} title="Hide">
          <span style={{ fontSize: 13, fontWeight: 500, marginRight: 4 }}>✕ Hide</span>
        </button>
        <button className="cl-toolbar-action-btn" title="Stop">
          <StopCircleIcon size={20} />
        </button>
      </div>

      <div className="cl-chat-overlay">
        {/* Active Suggestion/Transcript Area */}
        {(currentSuggestion || transcript || analyzing) && (
          <div style={{ 
            background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 12, 
            maxHeight: 180, overflowY: "auto", border: "1px solid rgba(255,255,255,0.08)" 
          }}>
            {analyzing ? (
              <div className="cl-loading"><span></span><span></span><span></span></div>
            ) : currentSuggestion ? (
              <div style={{ color: "white", fontSize: 14, lineHeight: 1.5 }}>
                <div style={{ color: "#3b82f6", fontWeight: 600, fontSize: 11, marginBottom: 4, textTransform: "uppercase" }}>Suggestion</div>
                {currentSuggestion.text}
              </div>
            ) : isTranscribing ? (
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <div className="cl-loading" style={{ margin: 0 }}><span></span><span></span><span></span></div>
                <span>Transcribing voice...</span>
              </div>
            ) : (
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{transcript || "Speak to start transcribing..."}</div>
            )}
          </div>
        )}

        <div className="cl-chat-input-row">
          <div className="cl-chat-smart-tag">Smart</div>
          <input 
            className="cl-chat-input-field" 
            placeholder="Ask about your screen or conversation, or Shift ← for Assist"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleChatSend()}
          />
          <button className="cl-chat-send-blue" onClick={handleChatSend}>
            <SendIcon size={18} />
          </button>
        </div>
      </div>

      {speechError && (
        <div className="cl-error-banner-overlay">
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
            <span>🎙️</span>
            <div style={{ fontSize: 14 }}>{speechError}</div>
          </div>
          <button onClick={() => setSpeechError(null)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
      )}
    </div>
  )
}

function SyncIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" />
    </svg>
  )
}

function PowerIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 2v10" />
    </svg>
  )
}

export default CluelyUI
