import { Ollama } from "@langchain/ollama";
import { OllamaEmbeddings } from "@langchain/ollama";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURATION ---
const DATASETS_DIR = path.join(__dirname, "../datasets"); // Adjust path if needed
const MODEL_NAME = "llama3"; // Ensure this model is pulled in Ollama
const EMBEDDING_MODEL = "all-minilm"; // Or "llama3" if dedicated embedding model not available. all-minilm is better/faster if pulled.
// If user doesn't have all-minilm, we fallback to llama3 or nomic-embed-text
// NOTE: Ideally user should run `ollama pull all-minilm` or `nomic-embed-text`
const EMBEDDING_MODEL_NAME = "nomic-embed-text";

// --- STATE ---
let diagnosticStore = null;
let mascStore = null;
let isReady = false;

const REFUSAL_MESSAGE = "Sorry, I can only answer questions strictly based on the provided medical dataset.";

// --- INITIALIZATION ---
export const initRAG = async () => {
    if (isReady) return;
    console.log("🚀 Initializing RAG Engine (Loading Datasets)...");

    try {
        // 1. Initialize Embeddings
        const embeddings = new OllamaEmbeddings({
            model: "llama3", // Fallback to main model if specific embedding model isn't guaranteed
        });

        // 2. Load Diagnostic Data (PDF)
        const diagnosticPath = path.join(DATASETS_DIR, "DIAGNOSTIC.pdf");
        if (fs.existsSync(diagnosticPath)) {
            console.log("   - Loading Diagnostic PDF...");
            const loader = new PDFLoader(diagnosticPath);
            const docs = await loader.load();

            const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
            const splitDocs = await splitter.splitDocuments(docs);

            console.log(`   - Embedding ${splitDocs.length} Diagnostic chunks...`);
            diagnosticStore = await HNSWLib.fromDocuments(splitDocs, embeddings);
        } else {
            console.warn("⚠️ DIAGNOSTIC.pdf not found!");
            diagnosticStore = await HNSWLib.fromDocuments([], embeddings); // Empty store
        }

        // 3. Load MASC Data (CSV)
        const mascPath = path.join(DATASETS_DIR, "MASC.csv");
        if (fs.existsSync(mascPath)) {
            console.log("   - Loading MASC CSV...");
            const loader = new CSVLoader(mascPath);
            const docs = await loader.load();

            // CSV rows are usually small enough, but let's split if description is huge
            const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
            const splitDocs = await splitter.splitDocuments(docs);

            console.log(`   - Embedding ${splitDocs.length} MASC chunks...`);
            mascStore = await HNSWLib.fromDocuments(splitDocs, embeddings);
        } else {
            console.warn("⚠️ MASC.csv not found!");
            mascStore = await HNSWLib.fromDocuments([], embeddings);
        }

        isReady = true;
        console.log("✅ RAG Engine Ready!");

    } catch (error) {
        console.error("❌ RAG Initialization Failed:", error);
    }
};

// --- QUERY FUNCTION ---
export const queryAgent = async (agentType, question) => {
    if (!isReady) {
        await initRAG(); // Try processing if not ready logic might need to block or fail
        if (!isReady) return "System is initializing or failed to load datasets. Please try again later.";
    }

    const store = agentType === "diagnostic" ? diagnosticStore : mascStore;
    const systemPromptText = agentType === "diagnostic"
        ? DIAGNOSTIC_SYSTEM_PROMPT
        : MASC_SYSTEM_PROMPT;

    // 1. Retrieve
    const retriever = store.asRetriever(4);
    const contextDocs = await retriever.invoke(question);

    // Strict Refusal if no context
    if (!contextDocs || contextDocs.length === 0) {
        return REFUSAL_MESSAGE;
    }

    const context = contextDocs.map(d => d.pageContent).join("\n\n");

    // 2. Generate
    const llm = new Ollama({
        model: MODEL_NAME,
        temperature: 0,
    });

    const prompt = PromptTemplate.fromTemplate(`{system_prompt}

Context:
{context}

Question:
{question}

Answer (if the context is empty or irrelevant, return EXACTLY "{refusal_message}"):
`);

    const chain = RunnableSequence.from([
        prompt,
        llm,
        new StringOutputParser(),
    ]);

    const response = await chain.invoke({
        system_prompt: systemPromptText,
        context: context,
        question: question,
        refusal_message: REFUSAL_MESSAGE
    });

    // Post-processing check (optional, but good for guardrails)
    if (!response || response.trim().length === 0) return REFUSAL_MESSAGE;

    return response;
};


// --- PROMPTS ---
const DIAGNOSTIC_SYSTEM_PROMPT = `
You are a specialized Diagnostic AI Agent. 
Your goal is to assist with symptoms, diseases, medical reports, and diagnostic explanations strictly using the provided medical context.

STRICT RULES:
1. Answer ONLY based on the retrieved context. Do NOT use outside knowledge.
2. If the answer is not in the context, return EXACTLY: "${REFUSAL_MESSAGE}"
3. DO NOT prescribe medicines or suggest dosages.
4. DO NOT provide a final medical diagnosis.
5. Always recommend consulting a medical professional if any risk is detected or implied.
6. If the question is about medication adherence or side effects, refuse to answer.
`;

const MASC_SYSTEM_PROMPT = `
You are the MASC (Medication & Side-Effects Coach) AI Agent.
Your goal is to assist with medication adherence, side effects, precautions, and lifestyle guidance strictly using the provided medical context.

STRICT RULES:
1. Answer ONLY based on the retrieved context. Do NOT use outside knowledge.
2. If the answer is not in the context, return EXACTLY: "${REFUSAL_MESSAGE}"
3. DO NOT prescribe or change medications.
4. DO NOT suggest dosages.
5. If serious side effects are mentioned or detected, advise immediate medical consultation.
6. If the question is about diagnosing a new condition, refuse to answer.
`;
