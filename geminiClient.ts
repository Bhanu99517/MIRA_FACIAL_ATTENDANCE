import { GoogleGenAI } from "@google/genai";

// This file initializes the Google GenAI client for the CogniCraft AI service.

interface AiClientState {
  client: GoogleGenAI | null;
  isInitialized: boolean;
  initializationError: string | null;
}

const initializeClient = (): AiClientState => {
  // Per the coding guidelines, the API_KEY environment variable is a hard requirement
  // and is assumed to be pre-configured, valid, and accessible.
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    const errorMessage = "CogniCraft AI client failed to initialize. API key is missing. Please ensure the API_KEY environment variable is set for the application. AI features will be unavailable.";
    console.error(errorMessage);
    return {
      client: null,
      isInitialized: false,
      initializationError: errorMessage,
    };
  }
  
  // We include a try-catch block for robustness in case of unexpected errors during initialization.
  try {
    const client = new GoogleGenAI({ apiKey });
    console.log("CogniCraft AI client initialized successfully.");
    return {
      client,
      isInitialized: true,
      initializationError: null,
    };
  } catch (error) {
    const errorMessage = `CogniCraft AI client failed to initialize. ${error instanceof Error ? error.message : 'An unknown error occurred'}. AI features will be unavailable.`;
    console.error(errorMessage);
    return {
      client: null,
      isInitialized: false,
      initializationError: errorMessage,
    };
  }
};

export const aiClientState = initializeClient();