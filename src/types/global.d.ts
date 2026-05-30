interface AppSettings {
  preferredCodingLanguage: string
  transcriptionLanguage: string
  autoDetectQuestions: boolean
  whisperMode: boolean
  stealthMode: boolean
  selectedProvider: string
  selectedModel: string
  groqApiKey: string
  geminiApiKey: string
  ollamaUrl: string
  ollamaModel: string
}

interface PostInterviewAnalysis {
  overallScore: number
  strengths: string[]
  improvements: string[]
  answerScores: Array<{ question: string; score: number; feedback: string }>
  summary: string
}

interface MeetingNotes {
  title: string
  summary: string
  keyPoints: string[]
  actionItems: string[]
  transcript: string
}

interface CodingAnalysis {
  problem: string
  approach: string
  solution: string
  complexity: string
  hints: string[]
}

interface PreCallBrief {
  summary: string
  talkingPoints: string[]
  questionsToAsk: string[]
  backgroundInfo: string
}

interface Window {
  electronAPI: {
    // Screenshots
    getScreenshots: () => Promise<Array<{ path: string; preview: string }>>
    deleteScreenshot: (path: string) => Promise<{ success: boolean; error?: string }>
    takeScreenshot: () => Promise<{ path: string; preview: string }>

    // App control
    quitApp: () => Promise<void>
    minimizeApp: () => Promise<void>
    resizeWindow: (width: number, height: number, center?: boolean) => void
    invoke: (channel: string, ...args: any[]) => Promise<any>

    // Stealth
    toggleStealth: () => Promise<boolean>
    getStealthStatus: () => Promise<boolean>

    // LLM config
    getCurrentLlmConfig: () => Promise<{ provider: string; model: string }>
    getAvailableOllamaModels: () => Promise<string[]>
    getAvailableGroqModels: () => Promise<string[]>
    switchToOllama: (model?: string, url?: string) => Promise<{ success: boolean; error?: string }>
    switchToGroq: (apiKey?: string, model?: string) => Promise<{ success: boolean; error?: string }>
    switchToGemini: (apiKey?: string) => Promise<{ success: boolean; error?: string }>
    testLlmConnection: () => Promise<{ success: boolean; error?: string }>

    // Chat & analysis
    chatWithLLM: (message: string, context?: string) => Promise<string>
    analyzeCurrentContext: (transcript: string, screenshotPaths?: string[]) => Promise<string>
    regenerateAnswer: (transcript: string, screenshotPaths?: string[]) => Promise<string>

    // Follow-ups
    generateFollowups: (transcript: string, currentAnswer: string) => Promise<string[]>

    // Post-interview analysis
    generatePostAnalysis: (sessionId: string, transcript: string, answers: any[]) => Promise<PostInterviewAnalysis>

    // Meeting notes
    generateMeetingNotes: (sessionId: string, transcript: string) => Promise<MeetingNotes>

    // Coding interview
    analyzeCodingProblem: (screenshotPath: string, preferredLanguage?: string) => Promise<CodingAnalysis>

    // Auto question detection
    detectQuestion: (transcript: string, lastProcessedLength: number) => Promise<{ detected: boolean; question: string; confidence: number }>

    // Pre-call brief
    generatePreCallBrief: (meetingTitle: string, participants: string[], notes: string) => Promise<PreCallBrief>

    // History
    getCallHistory: () => Promise<any[]>
    saveCallSession: (session: any) => Promise<void>
    deleteCallSession: (id: string) => Promise<void>

    // Context documents
    getContextDocuments: () => Promise<any[]>
    addContextDocument: (name: string, content: string, type?: string) => Promise<void>
    deleteContextDocument: (id: string) => Promise<void>
    saveContextDocument: (id: string, content: string) => Promise<void>

    // Settings
    getSettings: () => Promise<AppSettings>
    saveSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>

    // Audio
    transcribeAudio: (audioBuffer: Uint8Array, language?: string) => Promise<string>

    // Events
    onAudioTranscript: (callback: (text: string) => void) => () => void
    onContextSuggestion: (callback: (suggestion: any) => void) => () => void
    onShortcutGetAnswer: (callback: () => void) => () => void
    onShortcutRegenerate: (callback: () => void) => () => void
    onShortcutCodingMode: (callback: (data: { path: string }) => void) => () => void
    onStealthChanged: (callback: (state: boolean) => void) => () => void
    onScreenshotTaken: (callback: (data: { path: string; preview: string }) => void) => () => void
  }
}
