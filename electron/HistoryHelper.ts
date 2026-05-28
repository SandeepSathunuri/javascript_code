import { app } from "electron"
import fs from "fs"
import path from "path"

interface CallSession {
  id: string
  title: string
  date: string
  duration: number
  transcript: string
  notes: string
  suggestions: Array<{ question: string; answer: string }>
}

interface ContextDocument {
  id: string
  name: string
  content: string
  date: string
}

export class HistoryHelper {
  private sessionsPath: string
  private documentsPath: string

  constructor() {
    const userData = app.getPath("userData")
    this.sessionsPath = path.join(userData, "call-history.json")
    this.documentsPath = path.join(userData, "context-documents.json")
  }

  private ensureFile(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "[]", "utf-8")
    }
  }

  getSessions(): CallSession[] {
    this.ensureFile(this.sessionsPath)
    try {
      return JSON.parse(fs.readFileSync(this.sessionsPath, "utf-8"))
    } catch { return [] }
  }

  saveSession(session: CallSession): void {
    const sessions = this.getSessions()
    const idx = sessions.findIndex(s => s.id === session.id)
    if (idx >= 0) sessions[idx] = session
    else sessions.unshift(session)
    fs.writeFileSync(this.sessionsPath, JSON.stringify(sessions, null, 2))
  }

  deleteSession(id: string): void {
    const sessions = this.getSessions().filter(s => s.id !== id)
    fs.writeFileSync(this.sessionsPath, JSON.stringify(sessions, null, 2))
  }

  getDocuments(): ContextDocument[] {
    this.ensureFile(this.documentsPath)
    try {
      return JSON.parse(fs.readFileSync(this.documentsPath, "utf-8"))
    } catch { return [] }
  }

  addDocument(name: string, content: string): ContextDocument {
    const docs = this.getDocuments()
    const doc: ContextDocument = {
      id: Date.now().toString(),
      name,
      content,
      date: new Date().toISOString(),
    }
    docs.push(doc)
    fs.writeFileSync(this.documentsPath, JSON.stringify(docs, null, 2))
    return doc
  }

  updateDocument(id: string, content: string): void {
    const docs = this.getDocuments()
    const idx = docs.findIndex(d => d.id === id)
    if (idx >= 0) {
      docs[idx].content = content
      fs.writeFileSync(this.documentsPath, JSON.stringify(docs, null, 2))
    }
  }

  deleteDocument(id: string): void {
    const docs = this.getDocuments().filter(d => d.id !== id)
    fs.writeFileSync(this.documentsPath, JSON.stringify(docs, null, 2))
  }

  getAllContextText(): string {
    return this.getDocuments().map(d => `--- ${d.name} ---\n${d.content}`).join("\n\n")
  }
}