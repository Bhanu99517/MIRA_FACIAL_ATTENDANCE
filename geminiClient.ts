import { GoogleGenAI } from "@google/genai";

interface AiClientState {
  client: GoogleGenAI | null;
  isInitialized: boolean;
  initializationError: string | null;
}

const initializeClient = (): AiClientState => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("AI Service API key is not configured. Please set the API_KEY environment variable for the deployment.");
    }
    const client = new GoogleGenAI({ apiKey });
    return {
      client,
      isInitialized: true,
      initializationError: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred during AI client initialization.";
    console.error("Failed to initialize AI client:", message);
    return {
      client: null,
      isInitialized: false,
      initializationError: message,
    };
  }
};

export const aiClientState = initializeClient();