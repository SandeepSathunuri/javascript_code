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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.ollamaModel, prompt, stream: false, options: { temperature: 0.7 } }),
    })
    if (!response.ok) throw new Error(`Ollama error: ${response.status}`)
    const data = await response.json()
    return data.response
  }

  private async callGroq(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.groqApiKey) throw new Error("Groq API key not configured")
    console.log(`[LLM] callGroq — model: ${this.groqModel} | prompt: ${prompt.length} chars`)
    const response = await fetch(`${this.groqUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.groqApiKey}` },
      body: JSON.stringify({
        model: this.groqModel,
        messages: [
          {
            role: "system",
            content: systemPrompt || "You are a highly capable AI assistant specializing in technical interviews and meeting notes. Provide accurate, professional, and concise answers based on the provided context.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 2048,
      }),
    })
    if (!response.ok) throw new Error(`Groq error: ${response.status}`)
    const data = await response.json()
    const text = data.choices?.[0]?.message?.content ?? ""
    console.log(`[LLM] callGroq response: ${text.length} chars | finish_reason: ${data.choices?.[0]?.finish_reason}`)
    return text
  }

  private async callLLM(prompt: string, systemPrompt?: string): Promise<string> {
    if (this.useOllama) return this.callOllama(prompt)
    if (this.useGroq) return this.callGroq(prompt, systemPrompt)
    if (this.model) {
      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: (systemPrompt ? systemPrompt + "\n\n" : "") + prompt }] }],
        generationConfig: { temperature: 0.3 },
      })
      return (await result.response).text()
    }
    throw new Error("No LLM provider configured")
  }

  private async initializeOllamaModel(): Promise<void> {
    try {
      const models = await this.getOllamaModels()
      if (models.length > 0 && !models.includes(this.ollamaModel)) {
        this.ollamaModel = models[0]
      }
    } catch (e) {
      console.warn("Ollama init failed:", e)
    }
  }

  private async initializeGroqModel(): Promise<void> {
    try {
      await this.callGroq("Hello")
    } catch {
      try {
        this.groqModel = "llama-3.1-8b-instant"
        await this.callGroq("Hello")
      } catch {}
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

    const systemPrompt =
      "You are a top-tier software engineer and architect undergoing a high-stakes technical interview. Your goal is to provide human-like, conversational, and highly impressive answers. Do not sound like an AI; sound like a seasoned professional speaking naturally."

    return this.callLLM(prompt, systemPrompt)
  }

  async analyzeContext(conversationContext: string, screenshotText?: string): Promise<string> {
    const ctx = this.contextDocuments ? `\n\n[USER RESUME/JD]\n${this.contextDocuments}\n[END RESUME/JD]` : ""
    const screen = screenshotText ? `\n\n[SCREEN CONTENT]\n${screenshotText}\n[END SCREEN CONTENT]` : ""

    const systemPrompt =
      "You are a real-time interview wingman. Your job is to listen to the interview and give the user natural, spoken-word answers they can use immediately. Sound like a human candidate, not a documentation bot."

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

    console.log(`[LLM] analyzeContext — provider: ${this.getCurrentProvider()} | transcript: ${conversationContext.length} chars | screen: ${screenshotText ? screenshotText.length + " chars" : "none"}`)
    const result = await this.callLLM(prompt, systemPrompt)
    console.log(`[LLM] analyzeContext result: ${result?.length} chars`)
    return result
  }

  async generateFollowups(conversationContext: string, currentAnswer: string): Promise<string[]> {
    const prompt = `Based on this interview conversation and the answer just given, generate exactly 3 smart follow-up questions the interviewer might ask next.

[CONVERSATION]
${conversationContext}
[END CONVERSATION]

[ANSWER JUST GIVEN]
${currentAnswer}
[END ANSWER]

Return ONLY a JSON array of 3 strings, no other text. Example:
["Question 1?", "Question 2?", "Question 3?"]`

    try {
      const raw = await this.callLLM(prompt, "You are an expert technical interviewer. Generate realistic follow-up questions.")
      const match = raw.match(/\[[\s\S]*\]/)
      if (match) {
        const parsed = JSON.parse(match[0])
        if (Array.isArray(parsed)) return parsed.slice(0, 3)
      }
      // Fallback: split by newlines
      return raw
        .split("\n")
        .filter((l) => l.trim().endsWith("?"))
        .slice(0, 3)
    } catch {
      return ["Can you elaborate on that?", "What challenges did you face?", "How would you improve this?"]
    }
  }

  async generatePostInterviewAnalysis(transcript: string, answers: Array<{ question: string; answer: string }>): Promise<{
    overallScore: number
    strengths: string[]
    improvements: string[]
    answerScores: Array<{ question: string; score: number; feedback: string }>
    summary: string
  }> {
    const answersText = answers.map((a, i) => `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer}`).join("\n\n")
    const prompt = `Analyze this technical interview performance and provide detailed feedback.

[FULL TRANSCRIPT]
${transcript}
[END TRANSCRIPT]

[KEY Q&A PAIRS]
${answersText || "No specific Q&A captured."}
[END Q&A]

Return a JSON object with this exact structure:
{
  "overallScore": <number 0-100>,
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "answerScores": [
    {"question": "...", "score": <0-100>, "feedback": "..."}
  ],
  "summary": "2-3 sentence overall assessment"
}

Return ONLY the JSON, no other text.`

    try {
      const raw = await this.callLLM(prompt, "You are an expert technical interview coach. Provide honest, constructive feedback.")
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) return JSON.parse(match[0])
    } catch {}

    return {
      overallScore: 70,
      strengths: ["Clear communication", "Technical knowledge", "Problem-solving approach"],
      improvements: ["Add more specific examples", "Quantify achievements", "Ask clarifying questions"],
      answerScores: [],
      summary: "Good overall performance with room for improvement in specificity and examples.",
    }
  }

  async generateMeetingNotes(transcript: string): Promise<{
    title: string
    summary: string
    keyPoints: string[]
    actionItems: string[]
    transcript: string
  }> {
    const prompt = `Generate structured meeting notes from this transcript.

[TRANSCRIPT]
${transcript}
[END TRANSCRIPT]

Return a JSON object:
{
  "title": "Brief meeting title",
  "summary": "2-3 sentence summary",
  "keyPoints": ["point1", "point2", "point3"],
  "actionItems": ["action1", "action2"],
  "transcript": "${transcript.substring(0, 200)}..."
}

Return ONLY the JSON.`

    try {
      const raw = await this.callLLM(prompt, "You are an expert meeting note-taker. Be concise and actionable.")
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) return JSON.parse(match[0])
    } catch {}

    const firstSentence = transcript.split(".")[0].substring(0, 60) || "Meeting"
    return {
      title: firstSentence,
      summary: "Meeting transcript captured. Review the full transcript for details.",
      keyPoints: ["See full transcript"],
      actionItems: [],
      transcript,
    }
  }

  async analyzeCodingProblem(screenshotText: string, preferredLanguage: string = "Python"): Promise<{
    problem: string
    approach: string
    solution: string
    complexity: string
    hints: string[]
  }> {
    const ctx = this.contextDocuments ? `\n\n[CANDIDATE BACKGROUND]\n${this.contextDocuments}\n[END BACKGROUND]` : ""
    const prompt = `Analyze this coding problem from a technical interview and provide a complete solution.

[PROBLEM FROM SCREEN]
${screenshotText}
[END PROBLEM]
${ctx}

Preferred language: ${preferredLanguage}

Return a JSON object:
{
  "problem": "Restate the problem clearly in 1-2 sentences",
  "approach": "Explain the optimal approach/algorithm in 2-3 sentences",
  "solution": "Complete working code solution in ${preferredLanguage}",
  "complexity": "Time: O(...), Space: O(...)",
  "hints": ["hint1 if stuck", "hint2", "hint3"]
}

Return ONLY the JSON.`

    try {
      const raw = await this.callLLM(
        prompt,
        `You are an expert competitive programmer and software engineer. Provide optimal, clean solutions in ${preferredLanguage}.`
      )
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) return JSON.parse(match[0])
    } catch {}

    return {
      problem: "Unable to parse problem from screen.",
      approach: "Please take a clearer screenshot of the problem.",
      solution: `# Solution in ${preferredLanguage}\n# Please retake screenshot`,
      complexity: "N/A",
      hints: ["Take a clearer screenshot", "Make sure the problem text is visible"],
    }
  }

  async detectAutoQuestion(transcript: string, lastProcessedLength: number): Promise<{
    detected: boolean
    question: string
    confidence: number
  }> {
    const newText = transcript.slice(lastProcessedLength).trim()
    if (newText.length < 10) return { detected: false, question: "", confidence: 0 }

    const prompt = `Analyze this new speech segment from an interview and determine if a question was asked.

[NEW SPEECH]
${newText}
[END SPEECH]

Return JSON:
{
  "detected": true/false,
  "question": "the question if detected, empty string if not",
  "confidence": 0.0-1.0
}

Return ONLY the JSON.`

    try {
      const raw = await this.callLLM(prompt, "You are analyzing interview speech to detect questions. Be precise.")
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        return parsed
      }
    } catch {}

    // Simple heuristic fallback
    const hasQuestion = newText.includes("?") || /\b(what|how|why|when|where|can you|could you|tell me|explain|describe)\b/i.test(newText)
    return { detected: hasQuestion, question: hasQuestion ? newText : "", confidence: hasQuestion ? 0.6 : 0.1 }
  }

  async generatePreCallBrief(meetingTitle: string, participants: string[], notes: string): Promise<{
    summary: string
    talkingPoints: string[]
    questionsToAsk: string[]
    backgroundInfo: string
  }> {
    const ctx = this.contextDocuments ? `\n\n[YOUR BACKGROUND]\n${this.contextDocuments}\n[END BACKGROUND]` : ""
    const prompt = `Generate a pre-call brief for an upcoming meeting.

Meeting: ${meetingTitle}
Participants: ${participants.join(", ") || "Unknown"}
Notes: ${notes || "No additional notes"}
${ctx}

Return JSON:
{
  "summary": "What this meeting is likely about",
  "talkingPoints": ["point1", "point2", "point3"],
  "questionsToAsk": ["question1", "question2"],
  "backgroundInfo": "Relevant background to know"
}

Return ONLY the JSON.`

    try {
      const raw = await this.callLLM(prompt, "You are an expert meeting preparation coach.")
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) return JSON.parse(match[0])
    } catch {}

    return {
      summary: "Prepare for your upcoming meeting.",
      talkingPoints: ["Review agenda", "Prepare questions", "Know your key points"],
      questionsToAsk: ["What are the main goals?", "What decisions need to be made?"],
      backgroundInfo: "Review any relevant documents before the meeting.",
    }
  }

  async analyzeImageFile(imagePath: string): Promise<{ text: string; timestamp: number }> {
    if (this.useOllama || this.useGroq) {
      const name = imagePath.split(/[\\/]/).pop()
      return { text: `[Image: ${name}]`, timestamp: Date.now() }
    }
    if (!this.model) throw new Error("No model configured for image analysis")
    const imageData = await fs.promises.readFile(imagePath)
    const imagePart = { inlineData: { data: imageData.toString("base64"), mimeType: "image/png" } }
    const prompt =
      "Extract ALL text content from this image. If it contains code or a programming problem, reproduce it exactly. Focus on text, code, problem statements, and any important visual elements."
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
    } catch {
      return []
    }
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
    this.useGroq = true
    this.useOllama = false
    if (apiKey) this.groqApiKey = apiKey
    if (model) this.groqModel = model
    else await this.initializeGroqModel()
  }

  async switchToOllama(model?: string, url?: string): Promise<void> {
    this.useOllama = true
    this.useGroq = false
    if (url) this.ollamaUrl = url
    if (model) this.ollamaModel = model
    else await this.initializeOllamaModel()
  }

  async switchToGemini(apiKey?: string): Promise<void> {
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey)
      this.model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    }
    this.useOllama = false
    this.useGroq = false
  }

  async transcribeAudio(audioBuffer: Buffer, language: string = "en"): Promise<string> {
    if (!this.groqApiKey) throw new Error("Groq API key required for transcription")

    const formData = new FormData()
    formData.append("file", new Blob([audioBuffer as any]), "audio.webm")
    formData.append("model", "whisper-large-v3-turbo")
    formData.append("language", language)
    formData.append(
      "prompt",
      "Technical interview: RAG (Retrieval-Augmented Generation), LLM, GPT, Python, PyTest, React, TypeScript, Backend, Frontend, SQL, Database."
    )
    formData.append("response_format", "json")

    const response = await fetch(`${this.groqUrl}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.groqApiKey}` },
      body: formData as any,
    })

    if (!response.ok) {
      const err = await response.text()
      if (response.status === 429) {
        throw new Error("Groq Rate Limit: Too many audio requests. Wait a moment and try again.")
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
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
}
