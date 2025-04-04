"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.groq = void 0;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file
dotenv_1.default.config();
// Retrieve the API key from environment variables
const apiKey = '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';
// Ensure the API key is available
if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is missing.');
}
// Instantiate the Groq client
exports.groq = new groq_sdk_1.default({ apiKey });
