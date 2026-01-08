import "dotenv/config";
console.log("GROQ_API_KEY is:", process.env.GROQ_API_KEY ? "DEFINED" : "UNDEFINED");
if (process.env.GROQ_API_KEY) {
    console.log("Key length:", process.env.GROQ_API_KEY.length);
}
