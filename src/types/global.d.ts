interface Window {
  electronAPI: {
    getScreenshots: () => Promise<Array<{ path: string; preview: string }>>
    deleteScreenshot: (path: string) => Promise<{ success: boolean; error?: string }>
    takeScreenshot: () => Promise<{ path: string; preview: string }>
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
    transcribeAudio: (audioBuffer: Uint8Array) => Promise<string>
    resizeWindow: (width: number, height: number, center?: boolean) => void
    onAudioTranscript: (callback: (text: string) => void) => () => void
    onContextSuggestion: (callback: (suggestion: any) => void) => () => void
    toggleStealth: () => Promise<boolean>
    getStealthStatus: () => Promise<boolean>
  }
}