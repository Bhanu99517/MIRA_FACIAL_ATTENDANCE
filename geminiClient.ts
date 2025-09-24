import { GoogleGenAI } from "@google/genai";

// Polyfill for browser environments that don't have `process.env` but may provide
// secrets via a framed environment (common in web IDEs). This prevents the app
// from crashing and allows the AI services to initialize correctly after deployment.
try {
  if (typeof process === 'undefined') {
    (window as any).process = { env: {} };
  }
  const frameEnv = (window as any).frame?.env;
  if (frameEnv && typeof frameEnv.API_KEY === 'string') {
    (window as any).process.env.API_KEY = frameEnv.API_KEY;
  }
} catch (e) {
  console.error("Failed to polyfill process.env:", e);
}

interface AiClientState {
  client: GoogleGenAI | null;
  isInitialized: boolean;
  initializationError: string | null;
}

const initializeClient = (): AiClientState => {
  try {
    // This now safely reads from the polyfilled process.env object in the browser
    const apiKey = (window as any).process?.env?.API_KEY;

    if (!apiKey) {
      throw new Error("AI Service API key is not configured. Please set the API_KEY in your deployment environment's secrets.");
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