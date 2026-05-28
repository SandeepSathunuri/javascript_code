import { ipcMain, app } from "electron"
import { AppState } from "./main"

export function initializeIpcHandlers(appState: AppState): void {
  const llm = () => appState.processingHelper.getLLMHelper()
  const history = () => appState.historyHelper

  ipcMain.handle("get-screenshots", async () => {
    const paths = appState.getScreenshotHelper().getScreenshotQueue()
    return Promise.all(paths.map(async (path) => ({
      path,
      preview: await appState.getScreenshotHelper().getImagePreview(path)
    })))
  })

  ipcMain.handle("delete-screenshot", async (_, path: string) => {
    return appState.getScreenshotHelper().deleteScreenshot(path)
  })

  ipcMain.handle("take-screenshot", async () => {
    const path = await appState.takeScreenshot()
    const preview = await appState.getScreenshotHelper().getImagePreview(path)
    return { path, preview }
  })

  ipcMain.handle("quit-app", () => app.quit())
  ipcMain.handle("minimize-app", () => {
    const win = appState.windowHelper.getMainWindow()
    if (win) win.minimize()
  })

  ipcMain.handle("toggle-stealth", () => appState.windowHelper.toggleStealth())
  ipcMain.handle("get-stealth-status", () => appState.windowHelper.isStealthEnabled())

  ipcMain.handle("get-current-llm-config", () => ({
    provider: llm().getCurrentProvider(),
    model: llm().getCurrentModel(),
  }))

  ipcMain.handle("get-available-ollama-models", () => llm().getOllamaModels())
  ipcMain.handle("get-available-groq-models", async () => ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "mixtral-8x7b-32768"])
  ipcMain.handle("switch-to-ollama", async (_, model?: string, url?: string) => {
    try { await llm().switchToOllama(model, url); return { success: true } }
    catch (e: any) { return { success: false, error: e.message } }
  })
  ipcMain.handle("switch-to-groq", async (_, apiKey?: string, model?: string) => {
    try { await llm().switchToGroq(apiKey, model); return { success: true } }
    catch (e: any) { return { success: false, error: e.message } }
  })
  ipcMain.handle("switch-to-gemini", async (_, apiKey?: string) => {
    try { await llm().switchToGemini(apiKey); return { success: true } }
    catch (e: any) { return { success: false, error: e.message } }
  })
  ipcMain.handle("test-llm-connection", () => llm().testConnection())

  ipcMain.handle("chat-with-llm", async (_, message: string, context?: string) => {
    try {
      if (context) llm().setContextDocuments(context)
      return await llm().chat(message)
    } catch (e: any) { throw new Error(e.message) }
  })

  ipcMain.handle("analyze-current-context", async (_, transcript: string, screenshotPaths?: string[]) => {
    try {
      const ctx = history().getAllContextText()
      llm().setContextDocuments(ctx)
      let screenText: string | undefined
      if (screenshotPaths && screenshotPaths.length > 0) {
        const result = await llm().analyzeImageFile(screenshotPaths[0])
        screenText = result.text
      }
      return await llm().analyzeContext(transcript, screenText)
    } catch (e: any) { return `Error: ${e.message}` }
  })

  ipcMain.handle("get-call-history", () => history().getSessions())
  ipcMain.handle("save-call-session", (_, session) => history().saveSession(session))
  ipcMain.handle("delete-call-session", (_, id) => history().deleteSession(id))

  ipcMain.handle("get-context-documents", () => history().getDocuments())
  ipcMain.handle("add-context-document", async (_, name: string, content: string) => {
    history().addDocument(name, content)
    llm().setContextDocuments(history().getAllContextText())
  })
  ipcMain.handle("delete-context-document", (_, id) => history().deleteDocument(id))
  ipcMain.handle("save-context-document", (_, id, content) => history().updateDocument(id, content))

  ipcMain.handle("update-content-dimensions", async (_, { width, height }) => {
    if (width && height) appState.setWindowDimensions(width, height)
  })

  ipcMain.on("resize-window", (_, width: number, height: number, center?: boolean) => {
    const win = appState.windowHelper.getMainWindow()
    if (win) {
      win.setSize(width, height)
      if (center) {
        win.center()
      }
    }
  })

  ipcMain.handle("transcribe-audio", async (_, audioBuffer: Buffer) => {
    try {
      return await llm().transcribeAudio(audioBuffer)
    } catch (e: any) { throw new Error(e.message) }
  })

  ipcMain.handle("invoke", async (_, channel: string, ...args: any[]) => {
    console.warn("Generic invoke for:", channel, "not found")
    return null
  })
}