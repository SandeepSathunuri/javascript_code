import { AppState } from "./main"
import { LLMHelper } from "./LLMHelper"
import dotenv from "dotenv"
import path from "path"
dotenv.config({ path: path.join(__dirname, "..", ".env") })
// fallback for dev where __dirname might differ
if (!process.env.GROQ_API_KEY) dotenv.config()

export class ProcessingHelper {
  private appState: AppState
  private llmHelper: LLMHelper

  constructor(appState: AppState) {
    this.appState = appState

    const useGroq = process.env.USE_GROQ === "true"
    const groqApiKey = process.env.GROQ_API_KEY
    const groqModel = process.env.GROQ_MODEL
    const useOllama = process.env.USE_OLLAMA === "true"
    const ollamaModel = process.env.OLLAMA_MODEL
    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434"

    if (useGroq && groqApiKey) {
      this.llmHelper = new LLMHelper(undefined, false, undefined, undefined, true, groqApiKey, groqModel)
    } else if (useOllama) {
      this.llmHelper = new LLMHelper(undefined, true, ollamaModel, ollamaUrl)
    } else {
      const apiKey = process.env.GEMINI_API_KEY
      if (apiKey) {
        this.llmHelper = new LLMHelper(apiKey)
      } else {
        console.warn("No AI provider configured. The app will start but needs configuration.")
        this.llmHelper = new LLMHelper("dummy", false, undefined, undefined, true, "dummy")
      }
    }
  }

  getLLMHelper(): LLMHelper { return this.llmHelper }
}