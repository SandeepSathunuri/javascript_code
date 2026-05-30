import { app } from "electron"
import fs from "fs"
import path from "path"

export interface CallSession {
  id: string
  title: string
  date: string
  duration: number
  transcript: string
  notes: string
  suggestions: Array<{ question: string; answer: string }>
  analysis?: PostInterviewAnalysis
  meetingNotes?: MeetingNotes
}

export interface ContextDocument {
  id: string
  name: string
  content: string
  date: string
  type: "resume" | "jd" | "notes" | "other"
}

export interface PostInterviewAnalysis {
  overallScore: number
  strengths: string[]
  improvements: string[]
  answerScores: Array<{ question: string; score: number; feedback: string }>
  summary: string
}

export interface MeetingNotes {
  title: string
  summary: string
  keyPoints: string[]
  actionItems: string[]
  transcript: string
}

export interface AppSettings {
  preferredCodingLanguage: string
  transcriptionLanguage: string
  autoDetectQuestions: boolean
  whisperMode: boolean
  stealthMode: boolean
  selectedProvider: string
  selectedModel: string
  groqApiKey: string
  geminiApiKey: string
  ollamaUrl: string
  ollamaModel: string
}

const DEFAULT_SETTINGS: AppSettings = {
  preferredCodingLanguage: "Python",
  transcriptionLanguage: "en",
  autoDetectQuestions: false,
  whisperMode: false,
  stealthMode: false,
  selectedProvider: "groq",
  selectedModel: "llama-3.1-8b-instant",
  groqApiKey: "",
  geminiApiKey: "",
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "llama3.2",
}

export class HistoryHelper {
  private sessionsPath: string
  private documentsPath: string
  private settingsPath: string

  constructor() {
    const userData = app.getPath("userData")
    this.sessionsPath = path.join(userData, "call-history.json")
    this.documentsPath = path.join(userData, "context-documents.json")
    this.settingsPath = path.join(userData, "app-settings.json")
  }

  private ensureFile(filePath: string, defaultContent: string = "[]"): void {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, defaultContent, "utf-8")
    }
  }

  // ─── Sessions ────────────────────────────────────────────────────────────────

  getSessions(): CallSession[] {
    this.ensureFile(this.sessionsPath)
    try {
      return JSON.parse(fs.readFileSync(this.sessionsPath, "utf-8"))
    } catch {
      return []
    }
  }

  saveSession(session: CallSession): void {
    const sessions = this.getSessions()
    const idx = sessions.findIndex((s) => s.id === session.id)
    if (idx >= 0) sessions[idx] = session
    else sessions.unshift(session)
    fs.writeFileSync(this.sessionsPath, JSON.stringify(sessions, null, 2))
  }

  deleteSession(id: string): void {
    const sessions = this.getSessions().filter((s) => s.id !== id)
    fs.writeFileSync(this.sessionsPath, JSON.stringify(sessions, null, 2))
  }

  updateSessionAnalysis(id: string, analysis: PostInterviewAnalysis): void {
    const sessions = this.getSessions()
    const idx = sessions.findIndex((s) => s.id === id)
    if (idx >= 0) {
      sessions[idx].analysis = analysis
      fs.writeFileSync(this.sessionsPath, JSON.stringify(sessions, null, 2))
    }
  }

  updateSessionMeetingNotes(id: string, notes: MeetingNotes): void {
    const sessions = this.getSessions()
    const idx = sessions.findIndex((s) => s.id === id)
    if (idx >= 0) {
      sessions[idx].meetingNotes = notes
      fs.writeFileSync(this.sessionsPath, JSON.stringify(sessions, null, 2))
    }
  }

  // ─── Documents ───────────────────────────────────────────────────────────────

  getDocuments(): ContextDocument[] {
    this.ensureFile(this.documentsPath)
    try {
      return JSON.parse(fs.readFileSync(this.documentsPath, "utf-8"))
    } catch {
      return []
    }
  }

  addDocument(name: string, content: string, type: ContextDocument["type"] = "other"): ContextDocument {
    const docs = this.getDocuments()
    const doc: ContextDocument = {
      id: Date.now().toString(),
      name,
      content,
      date: new Date().toISOString(),
      type,
    }
    docs.push(doc)
    fs.writeFileSync(this.documentsPath, JSON.stringify(docs, null, 2))
    return doc
  }

  updateDocument(id: string, content: string): void {
    const docs = this.getDocuments()
    const idx = docs.findIndex((d) => d.id === id)
    if (idx >= 0) {
      docs[idx].content = content
      fs.writeFileSync(this.documentsPath, JSON.stringify(docs, null, 2))
    }
  }

  deleteDocument(id: string): void {
    const docs = this.getDocuments().filter((d) => d.id !== id)
    fs.writeFileSync(this.documentsPath, JSON.stringify(docs, null, 2))
  }

  getAllContextText(): string {
    return this.getDocuments()
      .map((d) => `--- ${d.name} (${d.type}) ---\n${d.content}`)
      .join("\n\n")
  }

  // ─── Settings ────────────────────────────────────────────────────────────────

  getSettings(): AppSettings {
    this.ensureFile(this.settingsPath, JSON.stringify(DEFAULT_SETTINGS, null, 2))
    try {
      const saved = JSON.parse(fs.readFileSync(this.settingsPath, "utf-8"))
      return { ...DEFAULT_SETTINGS, ...saved }
    } catch {
      return { ...DEFAULT_SETTINGS }
    }
  }

  saveSettings(settings: Partial<AppSettings>): AppSettings {
    const current = this.getSettings()
    const updated = { ...current, ...settings }
    fs.writeFileSync(this.settingsPath, JSON.stringify(updated, null, 2))
    return updated
  }
}
