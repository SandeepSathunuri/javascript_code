import { app, BrowserWindow, screen } from "electron"
import { initializeIpcHandlers } from "./ipcHandlers"
import { WindowHelper } from "./WindowHelper"
import { ScreenshotHelper } from "./ScreenshotHelper"
import { ShortcutsHelper } from "./shortcuts"
import { ProcessingHelper } from "./ProcessingHelper"
import { HistoryHelper } from "./HistoryHelper"

export class AppState {
  private static instance: AppState | null = null
  windowHelper: WindowHelper
  screenshotHelper: ScreenshotHelper
  shortcutsHelper: ShortcutsHelper
  processingHelper: ProcessingHelper
  historyHelper: HistoryHelper

  constructor() {
    this.windowHelper = new WindowHelper(this)
    this.screenshotHelper = new ScreenshotHelper("queue")
    this.processingHelper = new ProcessingHelper(this)
    this.shortcutsHelper = new ShortcutsHelper(this)
    this.historyHelper = new HistoryHelper()
  }

  static getInstance(): AppState {
    if (!AppState.instance) AppState.instance = new AppState()
    return AppState.instance
  }

  getMainWindow(): BrowserWindow | null { return this.windowHelper.getMainWindow() }
  getScreenshotHelper(): ScreenshotHelper { return this.screenshotHelper }
  isVisible(): boolean { return this.windowHelper.isVisible() }
  setWindowDimensions(w: number, h: number) { this.windowHelper.setWindowDimensions(w, h) }
  hideMainWindow() { this.windowHelper.hideMainWindow() }
  showMainWindow() { this.windowHelper.showMainWindow() }
  toggleMainWindow() { this.windowHelper.toggleMainWindow() }
  centerAndShowWindow() { this.windowHelper.centerAndShowWindow() }
  moveWindowLeft() { this.windowHelper.moveWindowLeft() }
  moveWindowRight() { this.windowHelper.moveWindowRight() }
  moveWindowUp() { this.windowHelper.moveWindowUp() }
  moveWindowDown() { this.windowHelper.moveWindowDown() }

  async takeScreenshot(): Promise<string> {
    return this.screenshotHelper.takeScreenshot(
      () => this.hideMainWindow(),
      () => this.showMainWindow()
    )
  }

  clearQueues(): void {
    this.screenshotHelper.clearQueues()
  }
}

async function initializeApp() {
  const appState = AppState.getInstance()

  app.whenReady().then(() => {
    initializeIpcHandlers(appState)
    appState.screenshotHelper.ensureDirs()
    appState.windowHelper.createWindow()
    appState.shortcutsHelper.registerGlobalShortcuts()
  })

  app.on("activate", () => {
    if (!appState.getMainWindow()) appState.windowHelper.createWindow()
  })

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit()
  })

  app.dock?.hide()
  app.commandLine.appendSwitch("disable-background-timer-throttling")
  app.commandLine.appendSwitch("disable-features", "BlockInsecurePrivateNetworkRequests")
  app.commandLine.appendSwitch("unsafely-treat-insecure-origin-as-secure", "http://localhost:5180")
  app.commandLine.appendSwitch("enable-speech-input")
  app.commandLine.appendSwitch("enable-speech-dispatcher") // For Linux support if needed
}

initializeApp().catch(console.error)