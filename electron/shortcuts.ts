import { globalShortcut, app } from "electron"
import { AppState } from "./main"

export class ShortcutsHelper {
  private appState: AppState

  constructor(appState: AppState) {
    this.appState = appState
  }

  public registerGlobalShortcuts(): void {
    globalShortcut.register("CommandOrControl+B", () => {
      this.appState.toggleMainWindow()
    })

    globalShortcut.register("CommandOrControl+H", async () => {
      try {
        const path = await this.appState.takeScreenshot()
        const preview = await this.appState.screenshotHelper.getImagePreview(path)
        this.appState.getMainWindow()?.webContents.send("screenshot-taken", { path, preview })
      } catch (e) { console.error("Screenshot error:", e) }
    })

    globalShortcut.register("CommandOrControl+R", () => {
      this.appState.clearQueues()
      this.appState.getMainWindow()?.webContents.send("reset-view")
    })

    globalShortcut.register("CommandOrControl+Left", () => this.appState.moveWindowLeft())
    globalShortcut.register("CommandOrControl+Right", () => this.appState.moveWindowRight())
    globalShortcut.register("CommandOrControl+Up", () => this.appState.moveWindowUp())
    globalShortcut.register("CommandOrControl+Down", () => this.appState.moveWindowDown())

    app.on("will-quit", () => globalShortcut.unregisterAll())
  }
}