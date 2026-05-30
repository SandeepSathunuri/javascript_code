import { ipcMain, app } from "electron"
import { AppState } from "./main"

export function initializeIpcHandlers(appState: AppState): void {
  const llm = () => appState.processingHelper.getLLMHelper()
  const history = () => appState.historyHelper

  // ─── Screenshots ─────────────────────────────────────────────────────────────

  ipcMain.handle("get-screenshots", async () => {
    const paths = appState.getScreenshotHelper().getScreenshotQueue()
    return Promise.all(
      paths.map(async (p) => ({
        path: p,
        preview: await appState.getScreenshotHelper().getImagePreview(p),
      }))
    )
  })

  ipcMain.handle("delete-screenshot", async (_, p: string) => {
    return appState.getScreenshotHelper().deleteScreenshot(p)
  })

  ipcMain.handle("take-screenshot", async () => {
    const p = await appState.takeScreenshot()
    const preview = await appState.getScreenshotHelper().getImagePreview(p)
    return { path: p, preview }
  })

  // ─── App control ─────────────────────────────────────────────────────────────

  ipcMain.handle("quit-app", () => app.quit())
  ipcMain.handle("minimize-app", () => {
    const win = appState.windowHelper.getMainWindow()
    if (win) win.minimize()
  })

  ipcMain.on("resize-window", (_, width: number, height: number, center?: boolean) => {
    const win = appState.windowHelper.getMainWindow()
    if (win) {
      win.setSize(width, height)
      if (center) win.center()
    }
  })

  ipcMain.handle("update-content-dimensions", async (_, { width, height }) => {
    if (width && height) appState.setWindowDimensions(width, height)
  })

  // ─── Stealth ─────────────────────────────────────────────────────────────────

  ipcMain.handle("toggle-stealth", () => appState.windowHelper.toggleStealth())
  ipcMain.handle("get-stealth-status", () => appState.windowHelper.isStealthEnabled())

  // ─── LLM config ──────────────────────────────────────────────────────────────

  ipcMain.handle("get-current-llm-config", () => ({
    provider: llm().getCurrentProvider(),
    model: llm().getCurrentModel(),
  }))

  ipcMain.handle("get-available-ollama-models", () => llm().getOllamaModels())
  ipcMain.handle("get-available-groq-models", async () => [
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "mixtral-8x7b-32768",
    "llama3-70b-8192",
    "gemma2-9b-it",
  ])

  ipcMain.handle("switch-to-ollama", async (_, model?: string, url?: string) => {
    try {
      await llm().switchToOllama(model, url)
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle("switch-to-groq", async (_, apiKey?: string, model?: string) => {
    try {
      await llm().switchToGroq(apiKey, model)
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle("switch-to-gemini", async (_, apiKey?: string) => {
    try {
      await llm().switchToGemini(apiKey)
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle("test-llm-connection", () => llm().testConnection())

  // ─── Chat & Analysis ─────────────────────────────────────────────────────────

  ipcMain.handle("chat-with-llm", async (_, message: string, context?: string) => {
    console.log("[IPC] chat-with-llm — message:", message.slice(0, 60))
    try {
      if (context) llm().setContextDocuments(context)
      const result = await llm().chat(message)
      console.log("[IPC] chat result length:", result?.length)
      return result
    } catch (e: any) {
      console.error("[IPC] chat-with-llm error:", e.message)
      throw new Error(e.message)
    }
  })

  ipcMain.handle("analyze-current-context", async (_, transcript: string, screenshotPaths?: string[]) => {
    console.log("[IPC] analyze-current-context — transcript length:", transcript.length, "| screenshots:", screenshotPaths?.length ?? 0)
    try {
      const ctx = history().getAllContextText()
      llm().setContextDocuments(ctx)
      let screenText: string | undefined
      if (screenshotPaths && screenshotPaths.length > 0) {
        console.log("[IPC] Analyzing screenshot:", screenshotPaths[0])
        const result = await llm().analyzeImageFile(screenshotPaths[0])
        screenText = result.text
        console.log("[IPC] Screenshot text length:", screenText?.length)
      }
      const answer = await llm().analyzeContext(transcript, screenText)
      console.log("[IPC] Answer length:", answer?.length, "| preview:", answer?.slice(0, 60))
      return answer
    } catch (e: any) {
      console.error("[IPC] analyze-current-context error:", e.message)
      return `Error: ${e.message}`
    }
  })

  // ─── Follow-up questions ─────────────────────────────────────────────────────

  ipcMain.handle("generate-followups", async (_, transcript: string, currentAnswer: string) => {
    try {
      return await llm().generateFollowups(transcript, currentAnswer)
    } catch (e: any) {
      return []
    }
  })

  // ─── Post-interview analysis ──────────────────────────────────────────────────

  ipcMain.handle("generate-post-analysis", async (_, sessionId: string, transcript: string, answers: any[]) => {
    try {
      const analysis = await llm().generatePostInterviewAnalysis(transcript, answers)
      if (sessionId) history().updateSessionAnalysis(sessionId, analysis)
      return analysis
    } catch (e: any) {
      return { overallScore: 0, strengths: [], improvements: [], answerScores: [], summary: e.message }
    }
  })

  // ─── Meeting notes ────────────────────────────────────────────────────────────

  ipcMain.handle("generate-meeting-notes", async (_, sessionId: string, transcript: string) => {
    try {
      const notes = await llm().generateMeetingNotes(transcript)
      if (sessionId) history().updateSessionMeetingNotes(sessionId, notes)
      return notes
    } catch (e: any) {
      return { title: "Error", summary: e.message, keyPoints: [], actionItems: [], transcript }
    }
  })

  // ─── Coding interview mode ────────────────────────────────────────────────────

  ipcMain.handle("analyze-coding-problem", async (_, screenshotPath: string, preferredLanguage?: string) => {
    try {
      const settings = history().getSettings()
      const lang = preferredLanguage || settings.preferredCodingLanguage || "Python"
      const result = await llm().analyzeImageFile(screenshotPath)
      return await llm().analyzeCodingProblem(result.text, lang)
    } catch (e: any) {
      return { problem: "Error", approach: e.message, solution: "", complexity: "", hints: [] }
    }
  })

  // ─── Auto question detection ──────────────────────────────────────────────────

  ipcMain.handle("detect-question", async (_, transcript: string, lastProcessedLength: number) => {
    try {
      return await llm().detectAutoQuestion(transcript, lastProcessedLength)
    } catch {
      return { detected: false, question: "", confidence: 0 }
    }
  })

  // ─── Pre-call brief ───────────────────────────────────────────────────────────

  ipcMain.handle("generate-pre-call-brief", async (_, meetingTitle: string, participants: string[], notes: string) => {
    try {
      const ctx = history().getAllContextText()
      llm().setContextDocuments(ctx)
      return await llm().generatePreCallBrief(meetingTitle, participants, notes)
    } catch (e: any) {
      return { summary: e.message, talkingPoints: [], questionsToAsk: [], backgroundInfo: "" }
    }
  })

  // ─── Answer regeneration ─────────────────────────────────────────────────────

  ipcMain.handle("regenerate-answer", async (_, transcript: string, screenshotPaths?: string[]) => {
    console.log("[IPC] regenerate-answer — transcript length:", transcript.length)
    try {
      const ctx = history().getAllContextText()
      llm().setContextDocuments(ctx)
      let screenText: string | undefined
      if (screenshotPaths && screenshotPaths.length > 0) {
        const result = await llm().analyzeImageFile(screenshotPaths[0])
        screenText = result.text
      }
      const answer = await llm().analyzeContext(transcript, screenText)
      console.log("[IPC] regen answer length:", answer?.length)
      return answer
    } catch (e: any) {
      console.error("[IPC] regenerate-answer error:", e.message)
      return `Error: ${e.message}`
    }
  })

  // ─── History ──────────────────────────────────────────────────────────────────

  ipcMain.handle("get-call-history", () => history().getSessions())
  ipcMain.handle("save-call-session", (_, session) => history().saveSession(session))
  ipcMain.handle("delete-call-session", (_, id) => history().deleteSession(id))

  // ─── Context documents ────────────────────────────────────────────────────────

  ipcMain.handle("get-context-documents", () => history().getDocuments())
  ipcMain.handle("add-context-document", async (_, name: string, content: string, type?: string) => {
    history().addDocument(name, content, (type as any) || "other")
    llm().setContextDocuments(history().getAllContextText())
  })
  ipcMain.handle("delete-context-document", (_, id) => {
    history().deleteDocument(id)
    llm().setContextDocuments(history().getAllContextText())
  })
  ipcMain.handle("save-context-document", (_, id, content) => history().updateDocument(id, content))

  // ─── Settings ─────────────────────────────────────────────────────────────────

  ipcMain.handle("get-settings", () => history().getSettings())
  ipcMain.handle("save-settings", (_, settings) => history().saveSettings(settings))

  // ─── Audio transcription ──────────────────────────────────────────────────────

  ipcMain.handle("transcribe-audio", async (_, audioBuffer: Buffer, language?: string) => {
    try {
      const settings = history().getSettings()
      return await llm().transcribeAudio(audioBuffer, language || settings.transcriptionLanguage || "en")
    } catch (e: any) {
      throw new Error(e.message)
    }
  })

  // ─── Generic invoke (legacy) ──────────────────────────────────────────────────

  ipcMain.handle("invoke", async (_, channel: string, ...args: any[]) => {
    console.warn("Generic invoke for:", channel)
    return null
  })
}
