import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai"
import fs from "fs"

export class LLMHelper {
  private model: GenerativeModel | null = null
  private useOllama: boolean = false
  private ollamaModel: string = "llama3.2"
  private ollamaUrl: string = "http://localhost:11434"
  private useGroq: boolean = false
  private groqApiKey: string = ""
  private groqModel: string = "llama-3.1-8b-instant"
  private groqUrl: string = "https://api.groq.com/openai/v1"
  private contextDocuments: string = ""

  constructor(
    apiKey?: string,
    useOllama: boolean = false,
    ollamaModel?: string,
    ollamaUrl?: string,
    useGroq: boolean = false,
    groqApiKey?: string,
    groqModel?: string,
  ) {
    this.useOllama = useOllama
    this.useGroq = useGroq

    if (useGroq) {
      this.groqApiKey = groqApiKey || ""
      this.groqModel = groqModel || "llama-3.1-8b-instant"
      this.initializeGroqModel()
    } else if (useOllama) {
      this.ollamaUrl = ollamaUrl || "http://localhost:11434"
      this.ollamaModel = ollamaModel || "gemma:latest"
      this.initializeOllamaModel()
    } else if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey)
      this.model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    } else {
      throw new Error("No AI provider configured. Set Groq, Ollama, or Gemini.")
    }
  }

  setContextDocuments(text: string) {
    this.contextDocuments = text
  }

  private async callOllama(prompt: string): Promise<string> {
    const response = await fetch(`${this.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.ollamaModel, prompt, stream: false, options: { temperature: 0.7 } }),
    })
    if (!response.ok) throw new Error(`Ollama error: ${response.status}`)
    const data = await response.json()
    return data.response
  }

  private async callGroq(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.groqApiKey) throw new Error("Groq API key not configured")
    const response = await fetch(`${this.groqUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.groqApiKey}` },
      body: JSON.stringify({
        model: this.groqModel,
        messages: [
          { 
            role: "system", 
            content: systemPrompt || "You are a highly capable AI assistant specializing in technical interviews and meeting notes. Provide accurate, professional, and concise answers based on the provided context." 
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2, // Lower temperature for more consistent technical answers
        max_tokens: 2048,
      }),
    })
    if (!response.ok) throw new Error(`Groq error: ${response.status}`)
    const data = await response.json()
    return data.choices?.[0]?.message?.content ?? ""
  }

  private async initializeOllamaModel(): Promise<void> {
    try {
      const models = await this.getOllamaModels()
      if (models.length > 0 && !models.includes(this.ollamaModel)) {
        this.ollamaModel = models[0]
      }
    } catch (e) { console.warn("Ollama init failed:", e) }
  }

  private async initializeGroqModel(): Promise<void> {
    try {
      await this.callGroq("Hello")
    } catch {
      try { this.groqModel = "llama-3.1-8b-instant"; await this.callGroq("Hello") } catch {}
    }
  }

  async chat(message: string): Promise<string> {
    const ctx = this.contextDocuments ? `\n\n[USER BACKGROUND/CONTEXT]\n${this.contextDocuments}\n[END BACKGROUND]` : ""
    const prompt = `Question: ${message}${ctx}

Instructions:
1. Provide a natural, conversational answer as if you are a candidate in a technical interview.
2. Use the first person ("I", "my experience").
3. If context documents (resume/JD) are provided, weave them into your answer naturally.
4. Keep it concise (3-5 sentences) and ready to be spoken aloud.
5. Avoid bullet points or textbook definitions. Speak like a real engineer.`
    
    const systemPrompt = "You are a top-tier software engineer and architect undergoing a high-stakes technical interview. Your goal is to provide human-like, conversational, and highly impressive answers. Do not sound like an AI; sound like a seasoned professional speaking naturally."

    if (this.useOllama) return this.callOllama(prompt)
    if (this.useGroq) return this.callGroq(prompt, systemPrompt)
    if (this.model) {
      const result = await this.model.generateContent({
        contents: [
          { role: "user", parts: [{ text: systemPrompt + "\n\n" + prompt }] }
        ],
        generationConfig: { temperature: 0.4 } // Slightly higher for more natural variety
      })
      return (await result.response).text()
    }
    throw new Error("No LLM provider configured")
  }

  async analyzeContext(conversationContext: string, screenshotText?: string): Promise<string> {
    const ctx = this.contextDocuments ? `\n\n[USER RESUME/JD]\n${this.contextDocuments}\n[END RESUME/JD]` : ""
    const screen = screenshotText ? `\n\n[SCREEN CONTENT]\n${screenshotText}\n[END SCREEN CONTENT]` : ""
    
    const systemPrompt = "You are a real-time interview wingman. Your job is to listen to the interview and give the user natural, spoken-word answers they can use immediately. Sound like a human candidate, not a documentation bot."

    const prompt = `[CONVERSATION SO FAR]
${conversationContext}
[END CONVERSATION]
${screen}
${ctx}

TASK:
1. Identify the core technical question or topic from the conversation above.
2. IMPORTANT: The transcript may contain errors. If you see phrases like "Black system", "Rag system", "Rat system", "Rack system", etc., assume the topic is "RAG (Retrieval-Augmented Generation)".
3. Give me a conversational, human-like answer I can say right now.

RULES:
- Start directly with the answer.
- Use natural phrasing ("In my experience...", "Actually, I've worked with...").
- Max 4 sentences.
- Be technically precise but sound like a person.`
    
    if (this.useOllama) return this.callOllama(prompt)
    if (this.useGroq) return this.callGroq(prompt, systemPrompt)
    if (this.model) {
      const result = await this.model.generateContent({
        contents: [
          { role: "user", parts: [{ text: systemPrompt + "\n\n" + prompt }] }
        ],
        generationConfig: { temperature: 0.3 }
      })
      return (await result.response).text()
    }
    throw new Error("No LLM provider configured")
  }

  async analyzeImageFile(imagePath: string) {
    if (this.useOllama || this.useGroq) {
      const name = imagePath.split(/[\\/]/).pop()
      const prompt = `[Image analysis not available with current provider. Image: ${name}]`
      return { text: prompt, timestamp: Date.now() }
    }
    if (!this.model) throw new Error("No model configured for image analysis")
    const imageData = await fs.promises.readFile(imagePath)
    const imagePart = { inlineData: { data: imageData.toString("base64"), mimeType: "image/png" } }
    const prompt = "Describe the content of this image concisely. Focus on text, code, or important visual elements."
    const result = await this.model.generateContent([prompt, imagePart])
    const text = (await result.response).text()
    return { text, timestamp: Date.now() }
  }

  async getOllamaModels(): Promise<string[]> {
    if (!this.useOllama) return []
    try {
      const resp = await fetch(`${this.ollamaUrl}/api/tags`)
      if (!resp.ok) return []
      const data = await resp.json()
      return (data.models || []).map((m: any) => m.name)
    } catch { return [] }
  }

  getCurrentProvider(): string {
    if (this.useGroq) return "groq"
    if (this.useOllama) return "ollama"
    return "gemini"
  }

  getCurrentModel(): string {
    if (this.useGroq) return this.groqModel
    if (this.useOllama) return this.ollamaModel
    return "gemini-2.0-flash"
  }

  async switchToGroq(apiKey?: string, model?: string): Promise<void> {
    this.useGroq = true; this.useOllama = false
    if (apiKey) this.groqApiKey = apiKey
    if (model) this.groqModel = model; else await this.initializeGroqModel()
  }

  async switchToOllama(model?: string, url?: string): Promise<void> {
    this.useOllama = true; this.useGroq = false
    if (url) this.ollamaUrl = url
    if (model) this.ollamaModel = model; else await this.initializeOllamaModel()
  }

  async switchToGemini(apiKey?: string): Promise<void> {
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey)
      this.model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    }
    this.useOllama = false; this.useGroq = false
  }

  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    if (!this.groqApiKey) throw new Error("Groq API key required for transcription fallback")
    
    const formData = new FormData()
    // Use any cast to bypass mismatch between Node Buffer and DOM BlobPart types
    formData.append("file", new Blob([audioBuffer as any]), "audio.webm")
    formData.append("model", "whisper-large-v3-turbo")
    formData.append("language", "en")
    formData.append("prompt", "Technical interview: RAG (Retrieval-Augmented Generation), LLM, GPT, Python, PyTest, React, TypeScript, Backend, Frontend, SQL, Database. Ignore silence, background noise, and avoid repeating phrases like 'I'm not sure what I'm doing'.")
    formData.append("response_format", "json")

    const response = await fetch(`${this.groqUrl}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.groqApiKey}` },
      body: formData as any,
    })

    if (!response.ok) {
      const err = await response.text()
      if (response.status === 429) {
        throw new Error("Groq Rate Limit: You've sent too many audio requests. If you're on the free tier, wait a few minutes or try again later.")
      }
      throw new Error(`Groq transcription error: ${response.status} ${err}`)
    }
    const data = await response.json()
    return data.text || ""
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.useOllama) {
        const resp = await fetch(`${this.ollamaUrl}/api/tags`)
        if (!resp.ok) return { success: false, error: "Ollama not available" }
        await this.callOllama("Hi")
        return { success: true }
      }
      if (this.useGroq) {
        if (!this.groqApiKey) return { success: false, error: "No Groq API key" }
        await this.callGroq("Hi")
        return { success: true }
      }
      if (!this.model) return { success: false, error: "No model configured" }
      await this.model.generateContent("Hi")
      return { success: true }
    } catch (e: any) { return { success: false, error: e.message } }
  }
}