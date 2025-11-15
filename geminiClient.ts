// src/geminiClient.ts
// This file is responsible for initializing the Google Generative AI (Gemini) client.
// It centralizes the client setup and provides a shared state for the rest of the application.

// Import the official GoogleGenAI class from the @google/genai SDK.
import { GoogleGenAI } from "@google/genai";

// Define the structure of the state that this module will export.
// This provides type safety and clarity on what the module exposes.
interface AiClientState {
  client: GoogleGenAI | null; // The Gemini client instance, or null if initialization fails.
  isInitialized: boolean;     // A boolean flag to easily check if the client is ready.
  initializationError: string | null; // A string to hold any error message if initialization fails.
}

// A function that attempts to initialize the Gemini client.
const initializeClient = (): AiClientState => {
  // --- API KEY REQUIREMENT ---
  // Per the coding guidelines, the API key MUST be obtained from the environment variable `process.env.API_KEY`.
  // This variable is assumed to be pre-configured and available in the execution environment.
  const apiKey = process.env.API_KEY;

  // Check if the API key is missing. This is the most common configuration error.
  if (!apiKey) {
    const errorMessage = "CogniCraft AI client failed to initialize. API key is missing. Please ensure the API_KEY environment variable is set for the application. AI features will be unavailable.";
    // Log the error to the developer console for debugging.
    console.error(errorMessage);
    // Return a state object indicating failure.
    return {
      client: null,
      isInitialized: false,
      initializationError: errorMessage,
    };
  }
  
  // Use a try-catch block for robustness in case of unexpected errors during the SDK's initialization process.
  try {
    // Create a new instance of the GoogleGenAI client, passing the API key in the required object format.
    const client = new GoogleGenAI({ apiKey });
    // Log a success message to the console for confirmation.
    console.log("CogniCraft AI client initialized successfully.");
    // Return a state object indicating success.
    return {
      client,
      isInitialized: true,
      initializationError: null,
    };
  } catch (error) {
    // If an error occurs during `new GoogleGenAI()`, catch it here.
    const errorMessage = `CogniCraft AI client failed to initialize. ${error instanceof Error ? error.message : 'An unknown error occurred'}. AI features will be unavailable.`;
    console.error(errorMessage);
    // Return a state object indicating failure.
    return {
      client: null,
      isInitialized: false,
      initializationError: errorMessage,
    };
  }
};

// --- EXPORTED STATE ---
// Call the initialization function immediately when the module is loaded.
// The result (the AiClientState object) is exported so other parts of the application can import and use it.
export const aiClientState = initializeClient();
