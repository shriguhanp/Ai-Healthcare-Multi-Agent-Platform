import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.GROQ_API_KEY) {
    console.warn("WARNING: GROQ_API_KEY is not defined in .env file");
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export default groq;
