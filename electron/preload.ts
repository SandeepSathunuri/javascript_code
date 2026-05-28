import { contextBridge, ipcRenderer } from "electron"

interface ElectronAPI {
  getScreenshots: () => Promise<Array<{ path: string; preview: string }>>
  deleteScreenshot: (path: string) => Promise<{ success: boolean; error?: string }>
  takeScreenshot: () => Promise<void>
  quitApp: () => Promise<void>
  minimizeApp: () => Promise<void>
  invoke: (channel: string, ...args: any[]) => Promise<any>
  getCurrentLlmConfig: () => Promise<{ provider: string; model: string }>
  getAvailableOllamaModels: () => Promise<string[]>
  getAvailableGroqModels: () => Promise<string[]>
  switchToOllama: (model?: string, url?: string) => Promise<{ success: boolean; error?: string }>
  switchToGroq: (apiKey?: string, model?: string) => Promise<{ success: boolean; error?: string }>
  switchToGemini: (apiKey?: string) => Promise<{ success: boolean; error?: string }>
  testLlmConnection: () => Promise<{ success: boolean; error?: string }>
  chatWithLLM: (message: string, context?: string) => Promise<string>
  getCallHistory: () => Promise<any[]>
  saveCallSession: (session: any) => Promise<void>
  deleteCallSession: (id: string) => Promise<void>
  getContextDocuments: () => Promise<any[]>
  addContextDocument: (name: string, content: string) => Promise<void>
  deleteContextDocument: (id: string) => Promise<void>
  saveContextDocument: (id: string, content: string) => Promise<void>
  analyzeCurrentContext: (transcript: string, screenshotPaths?: string[]) => Promise<string>
  transcribeAudio: (audioBuffer: Buffer) => Promise<string>
  resizeWindow: (width: number, height: number, center?: boolean) => void
  onAudioTranscript: (callback: (text: string) => void) => () => void
  onContextSuggestion: (callback: (suggestion: any) => void) => () => void
  toggleStealth: () => Promise<boolean>
  getStealthStatus: () => Promise<boolean>
}

contextBridge.exposeInMainWorld("electronAPI", {
  getScreenshots: () => ipcRenderer.invoke("get-screenshots"),
  deleteScreenshot: (path: string) => ipcRenderer.invoke("delete-screenshot", path),
  takeScreenshot: () => ipcRenderer.invoke("take-screenshot"),
  quitApp: () => ipcRenderer.invoke("quit-app"),
  minimizeApp: () => ipcRenderer.invoke("minimize-app"),
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  getCurrentLlmConfig: () => ipcRenderer.invoke("get-current-llm-config"),
  getAvailableOllamaModels: () => ipcRenderer.invoke("get-available-ollama-models"),
  getAvailableGroqModels: () => ipcRenderer.invoke("get-available-groq-models"),
  switchToOllama: (model?: string, url?: string) => ipcRenderer.invoke("switch-to-ollama", model, url),
  switchToGroq: (apiKey?: string, model?: string) => ipcRenderer.invoke("switch-to-groq", apiKey, model),
  switchToGemini: (apiKey?: string) => ipcRenderer.invoke("switch-to-gemini", apiKey),
  testLlmConnection: () => ipcRenderer.invoke("test-llm-connection"),
  chatWithLLM: (message: string, context?: string) => ipcRenderer.invoke("chat-with-llm", message, context),
  getCallHistory: () => ipcRenderer.invoke("get-call-history"),
  saveCallSession: (session: any) => ipcRenderer.invoke("save-call-session", session),
  deleteCallSession: (id: string) => ipcRenderer.invoke("delete-call-session", id),
  getContextDocuments: () => ipcRenderer.invoke("get-context-documents"),
  addContextDocument: (name: string, content: string) => ipcRenderer.invoke("add-context-document", name, content),
  deleteContextDocument: (id: string) => ipcRenderer.invoke("delete-context-document", id),
  saveContextDocument: (id: string, content: string) => ipcRenderer.invoke("save-context-document", id, content),
  analyzeCurrentContext: (transcript: string, screenshotPaths?: string[]) => ipcRenderer.invoke("analyze-current-context", transcript, screenshotPaths),
  transcribeAudio: (audioBuffer: Buffer) => ipcRenderer.invoke("transcribe-audio", audioBuffer),
  resizeWindow: (width: number, height: number, center?: boolean) => ipcRenderer.send("resize-window", width, height, center),
  onAudioTranscript: (callback: (text: string) => void) => {
    ipcRenderer.on("audio-transcript", (_e, text) => callback(text))
    return () => ipcRenderer.removeAllListeners("audio-transcript")
  },
      onContextSuggestion: (callback: (suggestion: any) => void) => {
    ipcRenderer.on("context-suggestion", (_e, suggestion) => callback(suggestion))
    return () => ipcRenderer.removeAllListeners("context-suggestion")
  },
  toggleStealth: () => ipcRenderer.invoke("toggle-stealth"),
  getStealthStatus: () => ipcRenderer.invoke("get-stealth-status"),
})
