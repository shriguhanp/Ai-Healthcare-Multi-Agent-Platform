import Groq from "groq-sdk";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

async function testGroq() {
    try {
        console.log("Testing Groq with model: llama-3.3-70b-versatile...");
        console.log("API Key found:", process.env.GROQ_API_KEY ? "Yes" : "No");

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a medical assistant." },
                { role: "user", content: "Hello, who are you?" }
            ],
            model: "llama-3.3-70b-versatile",
        });

        console.log("Success! Response from Groq:");
        console.log(completion.choices[0]?.message?.content);
    } catch (error) {
        console.error("Error testing Groq:", error.message);
    }
}

testGroq();
