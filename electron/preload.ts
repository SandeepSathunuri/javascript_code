import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("electronAPI", {
  // Screenshots
  getScreenshots: () => ipcRenderer.invoke("get-screenshots"),
  deleteScreenshot: (path: string) => ipcRenderer.invoke("delete-screenshot", path),
  takeScreenshot: () => ipcRenderer.invoke("take-screenshot"),

  // App control
  quitApp: () => ipcRenderer.invoke("quit-app"),
  minimizeApp: () => ipcRenderer.invoke("minimize-app"),
  resizeWindow: (width: number, height: number, center?: boolean) =>
    ipcRenderer.send("resize-window", width, height, center),
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),

  // Stealth
  toggleStealth: () => ipcRenderer.invoke("toggle-stealth"),
  getStealthStatus: () => ipcRenderer.invoke("get-stealth-status"),

  // LLM config
  getCurrentLlmConfig: () => ipcRenderer.invoke("get-current-llm-config"),
  getAvailableOllamaModels: () => ipcRenderer.invoke("get-available-ollama-models"),
  getAvailableGroqModels: () => ipcRenderer.invoke("get-available-groq-models"),
  switchToOllama: (model?: string, url?: string) => ipcRenderer.invoke("switch-to-ollama", model, url),
  switchToGroq: (apiKey?: string, model?: string) => ipcRenderer.invoke("switch-to-groq", apiKey, model),
  switchToGemini: (apiKey?: string) => ipcRenderer.invoke("switch-to-gemini", apiKey),
  testLlmConnection: () => ipcRenderer.invoke("test-llm-connection"),

  // Chat & analysis
  chatWithLLM: (message: string, context?: string) => ipcRenderer.invoke("chat-with-llm", message, context),
  analyzeCurrentContext: (transcript: string, screenshotPaths?: string[]) =>
    ipcRenderer.invoke("analyze-current-context", transcript, screenshotPaths),
  regenerateAnswer: (transcript: string, screenshotPaths?: string[]) =>
    ipcRenderer.invoke("regenerate-answer", transcript, screenshotPaths),

  // Follow-ups
  generateFollowups: (transcript: string, currentAnswer: string) =>
    ipcRenderer.invoke("generate-followups", transcript, currentAnswer),

  // Post-interview analysis
  generatePostAnalysis: (sessionId: string, transcript: string, answers: any[]) =>
    ipcRenderer.invoke("generate-post-analysis", sessionId, transcript, answers),

  // Meeting notes
  generateMeetingNotes: (sessionId: string, transcript: string) =>
    ipcRenderer.invoke("generate-meeting-notes", sessionId, transcript),

  // Coding interview
  analyzeCodingProblem: (screenshotPath: string, preferredLanguage?: string) =>
    ipcRenderer.invoke("analyze-coding-problem", screenshotPath, preferredLanguage),

  // Auto question detection
  detectQuestion: (transcript: string, lastProcessedLength: number) =>
    ipcRenderer.invoke("detect-question", transcript, lastProcessedLength),

  // Pre-call brief
  generatePreCallBrief: (meetingTitle: string, participants: string[], notes: string) =>
    ipcRenderer.invoke("generate-pre-call-brief", meetingTitle, participants, notes),

  // History
  getCallHistory: () => ipcRenderer.invoke("get-call-history"),
  saveCallSession: (session: any) => ipcRenderer.invoke("save-call-session", session),
  deleteCallSession: (id: string) => ipcRenderer.invoke("delete-call-session", id),

  // Context documents
  getContextDocuments: () => ipcRenderer.invoke("get-context-documents"),
  addContextDocument: (name: string, content: string, type?: string) =>
    ipcRenderer.invoke("add-context-document", name, content, type),
  deleteContextDocument: (id: string) => ipcRenderer.invoke("delete-context-document", id),
  saveContextDocument: (id: string, content: string) => ipcRenderer.invoke("save-context-document", id, content),

  // Settings
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings: any) => ipcRenderer.invoke("save-settings", settings),

  // Audio
  transcribeAudio: (audioBuffer: Buffer, language?: string) =>
    ipcRenderer.invoke("transcribe-audio", audioBuffer, language),

  // Events
  onAudioTranscript: (callback: (text: string) => void) => {
    ipcRenderer.on("audio-transcript", (_e, text) => callback(text))
    return () => ipcRenderer.removeAllListeners("audio-transcript")
  },
  onContextSuggestion: (callback: (suggestion: any) => void) => {
    ipcRenderer.on("context-suggestion", (_e, suggestion) => callback(suggestion))
    return () => ipcRenderer.removeAllListeners("context-suggestion")
  },

  // Shortcut events from main process
  onShortcutGetAnswer: (callback: () => void) => {
    ipcRenderer.on("shortcut-get-answer", () => callback())
    return () => ipcRenderer.removeAllListeners("shortcut-get-answer")
  },
  onShortcutRegenerate: (callback: () => void) => {
    ipcRenderer.on("shortcut-regenerate", () => callback())
    return () => ipcRenderer.removeAllListeners("shortcut-regenerate")
  },
  onShortcutCodingMode: (callback: (data: { path: string }) => void) => {
    ipcRenderer.on("shortcut-coding-mode", (_e, data) => callback(data))
    return () => ipcRenderer.removeAllListeners("shortcut-coding-mode")
  },
  onStealthChanged: (callback: (state: boolean) => void) => {
    ipcRenderer.on("stealth-changed", (_e, state) => callback(state))
    return () => ipcRenderer.removeAllListeners("stealth-changed")
  },
  onScreenshotTaken: (callback: (data: { path: string; preview: string }) => void) => {
    ipcRenderer.on("screenshot-taken", (_e, data) => callback(data))
    return () => ipcRenderer.removeAllListeners("screenshot-taken")
  },
})
