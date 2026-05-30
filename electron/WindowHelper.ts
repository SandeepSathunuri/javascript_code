import { BrowserWindow, screen } from "electron"
import { AppState } from "./main"
import path from "path"

const isDev = process.env.NODE_ENV === "development"

const startUrl = isDev
  ? "http://localhost:5180"
  : `file://${path.join(__dirname, "../dist/index.html")}`

export class WindowHelper {
  private mainWindow: BrowserWindow | null = null
  private isWindowVisible: boolean = false
  private windowPosition: { x: number; y: number } | null = null
  private windowSize: { width: number; height: number } | null = null
  private appState: AppState

  // Initialize with explicit number type and 0 value
  private screenWidth: number = 0
  private screenHeight: number = 0
  private step: number = 50
  private currentX: number = 0
  private currentY: number = 0
  private lastMoveTime: number = 0
  private readonly MOVE_INTERVAL: number = 30000 // Move every 30 seconds to avoid pattern detection
  private isStealthMode: boolean = true
  private stealthIntervalId: NodeJS.Timeout | null = null

  constructor(appState: AppState) {
      this.appState = appState
      // this.startStealthMovement()
  }

  /**
   * Performs subtle, random movement to avoid pattern detection in screen sharing
   * This helps make the window less detectable by constantly changing its position
   */
  private performStealthMovement(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return

    try {
      const primaryDisplay = screen.getPrimaryDisplay()
      const workArea = primaryDisplay.workAreaSize
      
      // Get current window bounds
      const bounds = this.mainWindow.getBounds()
      const windowWidth = bounds.width
      const windowHeight = bounds.height
      
      // Generate small random movements (max 50px in any direction)
      const maxMove = 50
      const moveX = Math.floor(Math.random() * (maxMove * 2)) - maxMove
      const moveY = Math.floor(Math.random() * (maxMove * 2)) - maxMove
      
      // Calculate new position
      let newX = bounds.x + moveX
      let newY = bounds.y + moveY
      
      // Ensure window stays within work area bounds
      newX = Math.max(0, Math.min(newX, workArea.width - windowWidth))
      newY = Math.max(0, Math.min(newY, workArea.height - windowHeight))
      
      // Apply the movement
      this.mainWindow.setPosition(newX, newY)
      
      // Update internal tracking
      this.windowPosition = { x: newX, y: newY }
      this.currentX = newX
      this.currentY = newY
      this.lastMoveTime = Date.now()
      
      // Optional: Occasionally change window size slightly for additional stealth
      if (Math.random() < 0.3) { // 30% chance to adjust size
        const sizeChange = Math.floor(Math.random() * 20) - 10 // -10 to +10 pixels
        const newWidth = Math.max(300, Math.min(windowWidth + sizeChange, workArea.width * 0.8))
        const newHeight = Math.max(200, Math.min(windowHeight + sizeChange, workArea.height * 0.8))
        
        // Only adjust if change is significant enough
        if (Math.abs(sizeChange) > 5) {
          this.mainWindow.setSize(newWidth, newHeight)
          this.windowSize = { width: newWidth, height: newHeight }
        }
      }
    } catch (error) {
      console.error("Error performing stealth movement:", error)
    }
  }

  public setWindowDimensions(width: number, height: number): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return

    // Get current window position
    const [currentX, currentY] = this.mainWindow.getPosition()

    // Get screen dimensions
    const primaryDisplay = screen.getPrimaryDisplay()
    const workArea = primaryDisplay.workAreaSize

    const maxAllowedWidth = Math.floor(workArea.width * 0.5)

    // Ensure width doesn't exceed max allowed width and height is reasonable
    const newWidth = Math.min(width + 32, maxAllowedWidth)
    const newHeight = Math.ceil(height)

    // Center the window horizontally if it would go off screen
    const maxX = workArea.width - newWidth
    const newX = Math.min(Math.max(currentX, 0), maxX)

    // Update window bounds
    this.mainWindow.setBounds({
      x: newX,
      y: currentY,
      width: newWidth,
      height: newHeight
    })

    // Update internal state
    this.windowPosition = { x: newX, y: currentY }
    this.windowSize = { width: newWidth, height: newHeight }
    this.currentX = newX
  }

  public createWindow(): void {
    if (this.mainWindow !== null) return

    const primaryDisplay = screen.getPrimaryDisplay()
    const workArea = primaryDisplay.workAreaSize
    this.screenWidth = workArea.width
    this.screenHeight = workArea.height

    
    const windowSettings: Electron.BrowserWindowConstructorOptions = {
      width: 900,
      height: 700,
      minWidth: 300,
      minHeight: 200,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js"),
        webSecurity: false,
      },
      show: false,
      alwaysOnTop: true,
      // Frameless + transparent = no OS chrome to screenshot
      frame: false,
      transparent: true,
      fullscreenable: false,
      hasShadow: false,
      backgroundColor: "#00000000",
      focusable: true,
      resizable: true,
      movable: true,
      x: 100,
      y: 100,
      type: process.platform === "win32" ? "toolbar" : "panel",
      skipTaskbar: true,
    }

    this.mainWindow = new BrowserWindow(windowSettings)
    // Enable content protection immediately — blocks PrintScreen, screen capture APIs,
    // OBS, screen share in Zoom/Teams/Meet, and Windows Game Bar
    this.mainWindow.setContentProtection(true)

    if (process.platform === "darwin") {
      this.mainWindow.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true
      })
      this.mainWindow.setHiddenInMissionControl(true)
      this.mainWindow.setAlwaysOnTop(true, "floating")
    }
    if (process.platform === "linux") {
      // Linux-specific optimizations for better compatibility
      if (this.mainWindow.setHasShadow) {
        this.mainWindow.setHasShadow(false)
      }
      // Keep window focusable on Linux for proper interaction
      this.mainWindow.setFocusable(true)
    } 
    this.mainWindow.setSkipTaskbar(false)
    this.mainWindow.setAlwaysOnTop(true)

    this.mainWindow.loadURL(startUrl).catch((err) => {
      console.error("Failed to load URL:", err)
    })

    this.mainWindow.once("ready-to-show", () => {
      if (this.mainWindow) {
        // @ts-ignore
        this.mainWindow.webContents.on("permission-request", (_event, permission: string, callback: (result: boolean) => void) => {
          if (["media", "mediaKeySystem", "notifications", "audio-capture"].includes(permission)) {
            callback(true)
          } else {
            callback(false)
          }
        })
        this.centerWindow()
        this.mainWindow.show()
        this.mainWindow.focus()
        this.mainWindow.setAlwaysOnTop(true, "screen-saver")
        // Keep content protection ON — never disable on show
        this.mainWindow.setContentProtection(true)
        console.log("Window visible — content protection active")
      }
    })

    const bounds = this.mainWindow.getBounds()
    this.windowPosition = { x: bounds.x, y: bounds.y }
    this.windowSize = { width: bounds.width, height: bounds.height }
    this.currentX = bounds.x
    this.currentY = bounds.y

    this.setupWindowListeners()
    this.isWindowVisible = true
  }

  private setupWindowListeners(): void {
    if (!this.mainWindow) return

    this.mainWindow.on("move", () => {
      if (this.mainWindow) {
        const bounds = this.mainWindow.getBounds()
        this.windowPosition = { x: bounds.x, y: bounds.y }
        this.currentX = bounds.x
        this.currentY = bounds.y
      }
    })

    this.mainWindow.on("resize", () => {
      if (this.mainWindow) {
        const bounds = this.mainWindow.getBounds()
        this.windowSize = { width: bounds.width, height: bounds.height }
      }
    })

    this.mainWindow.on("closed", () => {
      this.mainWindow = null
      this.isWindowVisible = false
      this.windowPosition = null
      this.windowSize = null
    })
  }

  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow
  }

  public isVisible(): boolean {
    return this.isWindowVisible
  }

  public hideMainWindow(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      console.warn("Main window does not exist or is destroyed.")
      return
    }

    const bounds = this.mainWindow.getBounds()
    this.windowPosition = { x: bounds.x, y: bounds.y }
    this.windowSize = { width: bounds.width, height: bounds.height }
    this.mainWindow.hide()
    this.isWindowVisible = false
  }

  public showMainWindow(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      console.warn("Main window does not exist or is destroyed.")
      return
    }

    if (this.windowPosition && this.windowSize) {
      this.mainWindow.setBounds({
        x: this.windowPosition.x,
        y: this.windowPosition.y,
        width: this.windowSize.width,
        height: this.windowSize.height,
      })
    }

    this.mainWindow.showInactive()
    // Always re-apply content protection — it can be reset by some OS operations
    this.mainWindow.setContentProtection(true)
    this.isWindowVisible = true
  }

  public toggleMainWindow(): void {
    if (this.isWindowVisible) {
      this.hideMainWindow()
    } else {
      this.showMainWindow()
    }
  }

  private centerWindow(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return
    }

    const primaryDisplay = screen.getPrimaryDisplay()
    const workArea = primaryDisplay.workAreaSize
    
    // Get current window size or use defaults
    const windowBounds = this.mainWindow.getBounds()
    const windowWidth = windowBounds.width || 400
    const windowHeight = windowBounds.height || 600
    
    // Calculate center position
    const centerX = Math.floor((workArea.width - windowWidth) / 2)
    const centerY = Math.floor((workArea.height - windowHeight) / 2)
    
    // Set window position
    this.mainWindow.setBounds({
      x: centerX,
      y: centerY,
      width: windowWidth,
      height: windowHeight
    })
    
    // Update internal state
    this.windowPosition = { x: centerX, y: centerY }
    this.windowSize = { width: windowWidth, height: windowHeight }
    this.currentX = centerX
    this.currentY = centerY
  }

  public centerAndShowWindow(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return
    this.centerWindow()
    this.mainWindow.show()
    this.mainWindow.focus()
    this.mainWindow.setAlwaysOnTop(true, "screen-saver")
    this.mainWindow.setContentProtection(true)
    this.isWindowVisible = true
  }

  public toggleStealth(): boolean {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return this.isStealthMode
    this.isStealthMode = !this.isStealthMode

    if (this.isStealthMode) {
      // Full stealth: hidden from taskbar, screen-saver level always-on-top,
      // content protection always on, no shadow, periodic micro-movements
      this.mainWindow.setContentProtection(true)
      this.mainWindow.setSkipTaskbar(true)
      this.mainWindow.setAlwaysOnTop(true, "screen-saver")
      this.mainWindow.setHasShadow(false)
      this.startStealthMovement()
      console.log("Stealth ON — undetectable")
    } else {
      // Detectable mode: visible in taskbar, normal always-on-top level,
      // BUT content protection stays ON — we never allow screenshots of the app
      this.mainWindow.setContentProtection(true)
      this.mainWindow.setSkipTaskbar(false)
      this.mainWindow.setAlwaysOnTop(true, "floating")
      this.mainWindow.setHasShadow(true)
      this.stopStealthMovement()
      console.log("Stealth OFF — visible in taskbar (content still protected)")
    }
    return this.isStealthMode
  }

  public isStealthEnabled(): boolean {
    return this.isStealthMode
  }

  private startStealthMovement(): void {
    this.stopStealthMovement()
    this.stealthIntervalId = setInterval(() => {
      if (this.mainWindow && !this.mainWindow.isDestroyed() && this.isWindowVisible && this.isStealthMode) {
        this.performStealthMovement()
      }
    }, this.MOVE_INTERVAL)
  }

  private stopStealthMovement(): void {
    if (this.stealthIntervalId) {
      clearInterval(this.stealthIntervalId)
      this.stealthIntervalId = null
    }
  }

  // New methods for window movement
  public moveWindowRight(): void {
    if (!this.mainWindow) return

    const windowWidth = this.windowSize?.width || 0
    const halfWidth = windowWidth / 2

    // Ensure currentX and currentY are numbers
    this.currentX = Number(this.currentX) || 0
    this.currentY = Number(this.currentY) || 0

    this.currentX = Math.min(
      this.screenWidth - halfWidth,
      this.currentX + this.step
    )
    this.mainWindow.setPosition(
      Math.round(this.currentX),
      Math.round(this.currentY)
    )
  }

  public moveWindowLeft(): void {
    if (!this.mainWindow) return

    const windowWidth = this.windowSize?.width || 0
    const halfWidth = windowWidth / 2

    // Ensure currentX and currentY are numbers
    this.currentX = Number(this.currentX) || 0
    this.currentY = Number(this.currentY) || 0

    this.currentX = Math.max(-halfWidth, this.currentX - this.step)
    this.mainWindow.setPosition(
      Math.round(this.currentX),
      Math.round(this.currentY)
    )
  }

  public moveWindowDown(): void {
    if (!this.mainWindow) return

    const windowHeight = this.windowSize?.height || 0
    const halfHeight = windowHeight / 2

    // Ensure currentX and currentY are numbers
    this.currentX = Number(this.currentX) || 0
    this.currentY = Number(this.currentY) || 0

    this.currentY = Math.min(
      this.screenHeight - halfHeight,
      this.currentY + this.step
    )
    this.mainWindow.setPosition(
      Math.round(this.currentX),
      Math.round(this.currentY)
    )
  }

  public moveWindowUp(): void {
    if (!this.mainWindow) return

    const windowHeight = this.windowSize?.height || 0
    const halfHeight = windowHeight / 2

    // Ensure currentX and currentY are numbers
    this.currentX = Number(this.currentX) || 0
    this.currentY = Number(this.currentY) || 0

    this.currentY = Math.max(-halfHeight, this.currentY - this.step)
    this.mainWindow.setPosition(
      Math.round(this.currentX),
      Math.round(this.currentY)
    )
  }
}