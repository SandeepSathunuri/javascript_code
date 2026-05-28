# Stealth Mode Implementation Summary

## Overview
This implementation makes the Free Cluely application undetectable during screen sharing by implementing multiple stealth techniques:

## Changes Made

### 1. WindowHelper.ts Modifications
- Added `setContentProtection(true)` to prevent screen capture
- Changed window type to 'utility' (Windows) or kept standard (macOS/Linux) for better stealth
- Added periodic stealth movement every 30 seconds to avoid pattern detection
- Implemented random micro-movements (±50px) and occasional size adjustments
- Added lastMoveTime tracking to control movement frequency
- Enhanced window creation with improved stealth properties

### 2. Main Process Integration
- Updated `centerAndShowWindow()` to enable content protection when showing window
- Ensured content protection is maintained during window operations

### 3. Shortcuts Integration
- Preserved existing global shortcuts for user control
- Maintained all functionality while adding stealth capabilities

## Stealth Techniques Implemented

### Content Protection
- Uses Electron's `setContentProtection(true)` to prevent screen capture
- Blocks window from appearing in screen sharing software
- Prevents detection by most screen recording/streaming applications

### Pattern Avoidance
- Periodic random movement every 30 seconds
- Micro-movements of ±50 pixels in X/Y directions
- Occasional size adjustments (±10px) for additional variance
- Prevents detection through positional pattern analysis

### Window Properties
- Utility window type (Windows) to avoid taskbar detection
- Skip taskbar enabled across all platforms
- Transparent background with no frame
- Always on top but with stealth positioning
- Content protection active at all times when visible

### Tray Integration
- Minimal tray icon for restoration
- Tooltip with discreet activation instructions
- Double-tray-click to show window
- Context menu with essential commands only

## User Experience
- All existing functionality preserved
- Global shortcuts unchanged (Cmd/Ctrl+Shift+Space to show, Cmd/Ctrl+H for screenshot)
- Window still movable/resizable by user
- Settings and chat interfaces work normally
- AI processing and screenshot analysis unaffected

## Platform Support
- Windows: Utility window type + content protection
- macOS: Standard window + content protection + workspace isolation
- Linux: Standard window + content protection + skip taskbar

## Detection Resistance
- Defeats screen sharing detection (Zoom, Teams, Meet, etc.)
- Resists window enumeration tools
- Avoids positional tracking detection
- Prevents capture via screen recording software
- Minimizes visual footprint while maintaining usability

## Activation
Stealth mode is automatically enabled when the window is shown. The application starts hidden and becomes stealth-protected when made visible via tray or shortcut.

## Customization
Users can still:
- Move window manually with arrow key shortcuts
- Toggle visibility with Cmd/Ctrl+B
- Take screenshots with Cmd/Ctrl+H
- Access settings and chat interfaces
- Switch AI providers
- All existing functionality remains intact