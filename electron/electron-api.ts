// Electron API shim - works around require("electron") returning the path string
// in certain embedding contexts. All electron process main files should import
// from here instead of from "electron" directly.
import process from "node:process"

// In the actual electron main process, the real API is exposed through
// process._linkedBinding or through the node:electron binding.
// We detect the electron main process and resolve accordingly.
const isElectronMain = typeof process !== "undefined" && (process as any).type === "browser"

function resolveElectron(): Record<string, any> {
  if (isElectronMain && typeof (globalThis as any).process !== "undefined") {
    // Try built-in electron first (will fail gracefully if not available)
    try {
      // @ts-ignore - electron built-in
      const builtin = require("node:electron")
      if (builtin && typeof builtin === "object") return builtin
    } catch {
      // fall through to hardcoded resolve
    }
    // Hard-coded resolve picks up the correct module when inside electron.exe
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const full = require("electron") as any
    if (typeof full === "object" && full !== null) return full
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("electron") as any
}

export const electronApi = resolveElectron()

// Re-export everything from the resolved API so consumers can
// destructure e.g. `import { app, BrowserWindow } from "./electron-api"`
export const app = electronApi.app
export const BrowserWindow = electronApi.BrowserWindow
export const Tray = electronApi.Tray
export const Menu = electronApi.Menu
export const nativeImage = electronApi.nativeImage
export const ipcMain = electronApi.ipcMain
export const globalShortcut = electronApi.globalShortcut
export const screen = electronApi.screen
export const dialog = electronApi.dialog
export const clipboard = electronApi.clipboard
export const shell = electronApi.shell
export const session = electronApi.session
export const powerMonitor = electronApi.powerMonitor
export const powerSaveBlocker = electronApi.powerSaveBlocker
export const crashReporter = electronApi.crashReporter
export const webContents = electronApi.webContents
