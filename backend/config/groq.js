import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.GROQ_API_KEY) {
    console.warn("WARNING: GROQ_API_KEY is not defined in .env file");
}

const groq = process.env.GROQ_API_KEY
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : { chat: { completions: { create: async () => { throw new Error("GROQ_API_KEY is missing"); } } } };

export default groq;
