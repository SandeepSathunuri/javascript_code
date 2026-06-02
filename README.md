# Free Cluely

> A free, open-source AI interview and meeting assistant. Real-time answers, live transcription, coding mode, stealth screen protection, and resume-aware responses — no subscription required.

---

## What it does

Free Cluely is an always-on-top desktop overlay that listens to your interviews and meetings, then generates spoken-word answers using your resume as context. It stays invisible to screen recording software and works with any video call platform.

**Key capabilities:**
- Real-time AI answers tailored to your resume — sounds like you, not a chatbot
- Live speech-to-text via Web Speech API or Groq Whisper (52 languages)
- Coding interview mode — screenshots a problem and generates a full solution
- Post-session analysis with scoring, strengths, and improvement areas
- Pre-call brief generator — talking points and questions before any meeting
- Stealth mode — blocked from PrintScreen, OBS, Zoom/Teams screen share
- 100% free — BYOK (bring your own API key) for Groq, Gemini, or Ollama

---

## Quick start

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- A [Groq API key](https://console.groq.com) — free tier is sufficient

### Install

```bash
git clone https://github.com/your-username/free-cluely.git
cd free-cluely
npm install
```

### Configure

Create a `.env` file in the project root:

```env
# Groq (recommended — free, fast, supports Whisper STT)
USE_GROQ=true
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Or Gemini
# GEMINI_API_KEY=AIza_your_key_here

# Or local Ollama
# USE_OLLAMA=true
# OLLAMA_MODEL=llama3.2
# OLLAMA_URL=http://localhost:11434
```

### Run

```bash
npm start
```

---

## Setup walkthrough

**1. Add your resume**

Open the dashboard → Context Docs tab → Add Document. Paste your resume text and select type "Resume". The AI uses this to answer every question as you, with your real companies, projects, and numbers.

**2. Start a session**

Click "Start Session" or use `Ctrl+Enter` when ready. The overlay appears at the top of your screen.

**3. Get answers**

Speak naturally during your interview. Press `Ctrl+Enter` to trigger an AI answer on demand, or enable Auto-detect in Settings to have it fire automatically when a question is detected.

**4. End and review**

Click "End" in the overlay to save the session. Open the Recap tab to generate a post-interview score, strengths/improvements breakdown, or structured meeting notes.

---

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl/Cmd + Enter` | Get AI answer for current transcript |
| `Ctrl/Cmd + H` | Screenshot + analyze (triggers answer automatically) |
| `Ctrl/Cmd + Shift + C` | Coding mode — capture and solve problem on screen |
| `Ctrl/Cmd + Shift + R` | Regenerate — get a different answer |
| `Ctrl/Cmd + Shift + S` | Toggle stealth mode |
| `Ctrl/Cmd + B` | Show / hide the window |
| `Ctrl/Cmd + ↑↓←→` | Move the window (50px per press) |

---

## Features

### Resume-aware answers
Upload your resume in Context Docs. Every answer the AI generates will reference your real name, companies, projects, and numbers — not generic examples. The system prompt explicitly instructs the model to speak as you, in first person.

### Live transcription
Two modes available:
- **Web Speech API** (default) — works out of the box, uses Google's servers
- **Whisper mode** — Groq's `whisper-large-v3` for higher accuracy, 52 languages, works even when Google's service is blocked. Automatically activates if Web Speech hits a network error.

### Coding interview mode
Press `Ctrl+Shift+C` during a coding round. The app screenshots your screen, extracts the problem via OCR (Gemini) or text analysis, and returns a complete solution in your preferred language with time/space complexity and hints.

### Post-interview analysis
After ending a session, click "Analyze Performance" in the Recap tab. The AI scores your answers 0–100, identifies strengths, lists specific improvements, and writes a 2-3 sentence overall assessment.

### Pre-call brief
Before a meeting, go to the Pre-Call Brief tab, enter the meeting title and participants, and generate a preparation brief with talking points, questions to ask, and background context.

### Auto question detection
Enable in Settings → Behavior. Polls the transcript every 3 seconds, detects when a question was asked (>65% confidence), and fires an answer automatically — no hotkey needed.

### Follow-up questions
After every answer, 3 likely follow-up questions are generated and shown as clickable chips. Clicking one adds it to the transcript and triggers an answer immediately.

### Stealth mode
Uses Electron's `setContentProtection(true)` + frameless transparent window to be invisible to:
- Windows PrintScreen / Snipping Tool
- OBS and screen recording software
- Zoom, Teams, Meet screen sharing
- Window enumeration tools

Content protection is always on. Stealth mode additionally hides from the taskbar and enables periodic micro-movements to defeat positional pattern detection.

### Session history
Every session is saved locally with transcript, Q&A pairs, duration, performance score, and meeting notes. Accessible from the History tab on the dashboard.

### Knowledge base
Store multiple documents — resume, job descriptions, company notes, anything. All are injected as context for every AI call. Documents persist across sessions in Electron's userData directory.

---

## AI providers

| Provider | Best for | Setup |
|---|---|---|
| **Groq** (recommended) | Speed + quality — `llama-3.3-70b-versatile` for answers, `whisper-large-v3` for STT | [console.groq.com](https://console.groq.com) — free tier |
| **Gemini** | Vision/OCR for coding mode screenshots | [aistudio.google.com](https://aistudio.google.com) |
| **Ollama** | 100% private, offline, no API costs | [ollama.ai](https://ollama.ai) |

You can mix providers — e.g. Groq for answers + Gemini for screenshot analysis. Switch at any time from Settings without restarting.

---

## Troubleshooting

**App shows a blank window**
Make sure port 5180 is free. Kill anything using it and run `npm start` again.

**"Groq API key not configured" on Whisper**
Web Speech hit a network error and tried to switch to Whisper. Add your Groq key in Settings → AI Provider, save, then restart the session.

**Answers are generic / don't mention my background**
Make sure you've added your resume in Context Docs. Without it the model has no personal details to work with.

**STT transcribing noise / hallucinations**
Switch to Whisper mode in Settings. It's more accurate than Web Speech and the app filters out silence using `no_speech_prob` per segment plus a pattern-based hallucination blocklist.

**App visible in screen share despite stealth**
Restart the app — content protection initializes on window creation. Also confirm Stealth shows as ON (green badge) in the header.

**Window movement not working**
Use `Ctrl+Arrow` keys. Each press moves 50px. The window must be focused — click it first if needed.

**Sharp build errors on install**
```bash
npm install --ignore-scripts
```

---

## System requirements

| | Minimum | Recommended |
|---|---|---|
| RAM | 4 GB | 8 GB+ |
| CPU | Dual-core | Quad-core |
| Storage | 1 GB | 2 GB |
| OS | Windows 10, macOS 11, Ubuntu 20.04 | Latest |

---

## Architecture

```
free-cluely/
├── electron/          # Main process (Node.js)
│   ├── main.ts        # App entry, AppState singleton
│   ├── WindowHelper   # Frameless window, stealth, content protection
│   ├── LLMHelper      # Groq / Gemini / Ollama — answers + STT
│   ├── HistoryHelper  # JSON persistence — sessions, docs, settings
│   ├── ipcHandlers    # All IPC channels between main and renderer
│   ├── shortcuts      # Global keyboard shortcuts
│   └── preload        # Secure contextBridge API surface
└── src/               # Renderer process (React + Vite)
    └── _pages/
        └── CluelyUI   # Full UI — dashboard + overlay
```

---

## Contributing

PRs welcome. The codebase is intentionally kept simple — one main UI component, one LLM helper, straightforward IPC.

Good first issues:
- Additional hallucination patterns for the STT filter
- Support for more Groq models as they're released
- i18n for the dashboard UI
- System audio capture (interviewer's voice without mic)

---

## License

MIT — free for personal and commercial use.
