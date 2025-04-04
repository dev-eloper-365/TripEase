import Groq from 'groq-sdk';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Retrieve the API key from environment variables
const apiKey = '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';

// Ensure the API key is available
if (!apiKey) {
  throw new Error('GROQ_API_KEY environment variable is missing.');
}

// Instantiate the Groq client
export const groq = new Groq({ apiKey });
