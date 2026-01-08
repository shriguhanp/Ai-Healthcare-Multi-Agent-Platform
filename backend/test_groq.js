import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

async function testGroq() {
    try {
        console.log("Testing Groq with model: llama-3.3-70b-versatile...");
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
