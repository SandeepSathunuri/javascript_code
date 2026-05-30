import { globalShortcut, app } from "electron"
import { AppState } from "./main"

export class ShortcutsHelper {
  private appState: AppState

  constructor(appState: AppState) {
    this.appState = appState
  }

  public registerGlobalShortcuts(): void {
    const win = () => this.appState.getMainWindow()

    // ── Visibility ────────────────────────────────────────────────────────────
    // Ctrl/Cmd + B  →  Toggle show/hide window
    globalShortcut.register("CommandOrControl+B", () => {
      this.appState.toggleMainWindow()
    })

    // ── Get AI Answer ─────────────────────────────────────────────────────────
    // Ctrl/Cmd + Enter  →  Trigger AI analysis on current transcript
    globalShortcut.register("CommandOrControl+Return", () => {
      win()?.webContents.send("shortcut-get-answer")
    })

    // ── Screenshot + Analyze ──────────────────────────────────────────────────
    // Ctrl/Cmd + H  →  Take screenshot and send to renderer
    globalShortcut.register("CommandOrControl+H", async () => {
      try {
        const path = await this.appState.takeScreenshot()
        const preview = await this.appState.screenshotHelper.getImagePreview(path)
        win()?.webContents.send("screenshot-taken", { path, preview })
        // Also trigger analysis automatically after screenshot
        win()?.webContents.send("shortcut-get-answer")
      } catch (e) {
        console.error("Screenshot error:", e)
      }
    })

    // ── Stealth Toggle ────────────────────────────────────────────────────────
    // Ctrl/Cmd + Shift + S  →  Toggle stealth mode (hide from screen share)
    globalShortcut.register("CommandOrControl+Shift+S", () => {
      const newState = this.appState.windowHelper.toggleStealth()
      win()?.webContents.send("stealth-changed", newState)
    })

    // ── Coding Mode ───────────────────────────────────────────────────────────
    // Ctrl/Cmd + Shift + C  →  Screenshot + analyze as coding problem
    globalShortcut.register("CommandOrControl+Shift+C", async () => {
      try {
        const path = await this.appState.takeScreenshot()
        win()?.webContents.send("shortcut-coding-mode", { path })
      } catch (e) {
        console.error("Coding screenshot error:", e)
      }
    })

    // ── Regenerate Answer ─────────────────────────────────────────────────────
    // Ctrl/Cmd + Shift + R  →  Regenerate / get a different answer
    globalShortcut.register("CommandOrControl+Shift+R", () => {
      win()?.webContents.send("shortcut-regenerate")
    })

    // ── Reset / Clear ─────────────────────────────────────────────────────────
    // Ctrl/Cmd + R  →  Clear screenshot queue and reset view
    globalShortcut.register("CommandOrControl+R", () => {
      this.appState.clearQueues()
      win()?.webContents.send("reset-view")
    })

    // ── Window Movement ───────────────────────────────────────────────────────
    // Ctrl/Cmd + Arrow Keys  →  Move window 50px in that direction
    globalShortcut.register("CommandOrControl+Left",  () => this.appState.moveWindowLeft())
    globalShortcut.register("CommandOrControl+Right", () => this.appState.moveWindowRight())
    globalShortcut.register("CommandOrControl+Up",    () => this.appState.moveWindowUp())
    globalShortcut.register("CommandOrControl+Down",  () => this.appState.moveWindowDown())

    app.on("will-quit", () => globalShortcut.unregisterAll())
  }
}
