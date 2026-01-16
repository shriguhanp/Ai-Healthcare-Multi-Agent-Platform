import { GoogleGenerativeAI } from "@google/generative-ai";
import groq from "../config/groq.js";
import { getSystemPrompt, getDisclaimer } from "../config/agentConfig.js";
import { checkGuardrails, checkEmergency, validateAgentScope } from "../middleware/guardrails.js";
import { retrieveContext, buildRAGPrompt } from "../middleware/ragService.js";

/* -------------------- HELPERS -------------------- */

const extractJSON = (text) => {
  if (!text || typeof text !== "string") return null;
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  try {
    return JSON.parse(text.slice(first, last + 1));
  } catch {
    return null;
  }
};

const safeStringify = (obj) => {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
};

/* -------------------- GEMINI CALL -------------------- */

const callModelWithRetries = async (prompt, options = {}) => {
  if (!process.env.GEMINI_API_KEY) return null;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  });

  for (let i = 0; i < 3; i++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = extractJSON(text);
      if (parsed) return parsed;

      prompt = `RETURN ONLY VALID JSON:\n${safeStringify(options.schema)}\n\n${prompt}`;
    } catch (err) {
      console.error("Gemini error:", err.message);
    }
  }
  return null;
};

/* -------------------- AI COACH -------------------- */

const getAICoach = async (medicines, symptoms = "") => {
  const schema = {
    dailySchedule: "string",
    adherenceScore: "number",
    sideEffects: "string",
    missedDoseGuidance: "string",
  };

  const prompt = `
Return ONLY JSON matching schema:
${safeStringify(schema)}

Medicines:
${JSON.stringify(medicines)}

Symptoms:
${symptoms || "None"}
`;

  const result = await callModelWithRetries(prompt, { schema });

  if (result) return result;

  return {
    dailySchedule: "Take medicines as prescribed",
    adherenceScore: 70,
    sideEffects: "Mild nausea or headache possible",
    missedDoseGuidance: "Take when remembered unless near next dose",
  };
};

/* -------------------- ANALYZE PRESCRIPTION -------------------- */

export const analyzePrescription = async (req, res) => {
  try {
    const { medicine } = req.body;

    if (!medicine && !req.file) {
      return res.status(400).json({ error: "Medicine or file required" });
    }

    const schema = {
      dosage: "string",
      sideEffects: "string",
      adherenceTips: "string",
      warnings: "string",
    };

    const prompt = `
Return ONLY JSON:
${safeStringify(schema)}

Input:
${medicine || req.file.originalname}
`;

    const parsed = await callModelWithRetries(prompt, { schema });

    if (parsed) return res.json(parsed);

    return res.json({
      dosage: "Follow doctor instructions",
      sideEffects: "Nausea, dizziness",
      adherenceTips: "Set reminders",
      warnings: "Consult doctor if symptoms worsen",
    });
  } catch (error) {
    console.error("Analyze Error:", error);
    res.status(500).json({ error: "AI failed" });
  }
};

/* -------------------- MEDICAL ADHERENCE COACH -------------------- */

export const getMedicalAdherenceCoach = async (req, res) => {
  try {
    const { medicines = [], symptoms = "" } = req.body;

    if (!medicines.length) {
      return res.json({ success: false, message: "No medicines provided" });
    }

    const coaching = await getAICoach(medicines, symptoms);
    res.json({ success: true, coaching });
  } catch (error) {
    console.error("Coach Error:", error);
    res.status(500).json({ success: false });
  }
};

/* -------------------- BASIC FALLBACK -------------------- */

const provideBasicFallbackResponse = (message, agentType) => {
  if (agentType === "diagnostic") {
    return "I apologize, but I'm currently unable to process your request. For medical concerns, please consult a healthcare professional. If you're experiencing an emergency, please call emergency services immediately.";
  }
  return "I apologize, but I'm currently unable to process your request. Please consult your doctor or pharmacist for medication-related questions.";
};

/* -------------------- GEMINI CHAT WITH RAG -------------------- */

const callGeminiChat = async (systemPrompt, userMessage) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("[Gemini] No API key configured");
      return null;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    });

    console.log(`[Gemini] Sending request with system prompt length: ${systemPrompt.length}`);

    const result = await model.generateContent(
      `${systemPrompt}\n\nUser Question: ${userMessage}\n\nAssistant Response:`
    );

    return result.response.text();
  } catch (err) {
    console.error("Gemini chat error:", err.message);
    return null;
  }
};

/* -------------------- GROQ CHAT (AGENT-SPECIFIC MODELS) -------------------- */

const callGroqChat = async (systemPrompt, userMessage, agent) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.warn("[Groq] No API key configured");
      return null;
    }

    // Agent-specific model selection for optimal performance
    // Using current available models as of 2026
    let model, temperature;

    if (agent === "diagnostic") {
      // llama-3.3-70b-versatile: Recommended for general use, best for complex medical reasoning
      model = "llama-3.3-70b-versatile";
      temperature = 0.3; // Lower temperature for more accurate, focused diagnostic responses
    } else if (agent === "masc") {
      // llama-3.1-8b-instant: Faster results, excellent for conversational coaching
      model = "llama-3.1-8b-instant";
      temperature = 0.5; // Moderate temperature for empathetic, supportive coaching responses
    } else {
      // Fallback to versatile model
      model = "llama-3.3-70b-versatile";
      temperature = 0.4;
    }

    console.log(`[Groq] Using ${model} (temp: ${temperature}) for ${agent} agent`);
    console.log(`[Groq] Sending request with system prompt length: ${systemPrompt.length}`);

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      model: model,
      temperature: temperature,
      max_tokens: 200,
    });

    return completion.choices[0]?.message?.content || null;
  } catch (err) {
    console.error("Groq chat error:", err.message);
    return null;
  }
};

/* -------------------- CHAT CONTROLLER WITH RAG & GUARDRAILS -------------------- */

export const chatWithAgent = async (req, res) => {
  try {
    const { message, agent } = req.body;

    // Validate input
    if (!message || !agent) {
      return res.status(400).json({
        success: false,
        error: "Message and agent type are required"
      });
    }

    // Validate agent type
    if (!["diagnostic", "masc"].includes(agent)) {
      return res.status(400).json({
        success: false,
        error: "Invalid agent type. Use 'diagnostic' or 'masc'"
      });
    }

    console.log(`[Agent: ${agent}] Processing message: "${message.substring(0, 50)}..."`);

    // Step 1: Check for emergency situations
    const emergencyCheck = checkEmergency(message);
    if (emergencyCheck.isEmergency) {
      console.log(`[Agent: ${agent}] Emergency detected`);
      return res.json({
        success: true,
        reply: emergencyCheck.response,
        agent,
        isEmergency: true
      });
    }

    // Step 2: Apply guardrails - check for forbidden queries
    const guardrailResult = checkGuardrails(message, agent);
    if (!guardrailResult.allowed) {
      console.log(`[Agent: ${agent}] Guardrail blocked: ${guardrailResult.blockedKeyword}`);
      return res.json({
        success: true,
        reply: guardrailResult.response,
        agent,
        blocked: true
      });
    }

    // Step 3: Validate agent scope (strict check - block if not appropriate)
    const scopeCheck = validateAgentScope(message, agent);
    if (!scopeCheck.appropriate) {
      console.log(`[Agent: ${agent}] Scope validation failed - question not appropriate for this agent`);
      return res.json({
        success: true,
        reply: scopeCheck.guidance,
        agent,
        scopeBlocked: true
      });
    }

    // Step 4: Retrieve relevant context from dataset (RAG)
    console.log(`[Agent: ${agent}] Retrieving context from dataset...`);
    const context = retrieveContext(message, agent);
    console.log(`[Agent: ${agent}] Context retrieved: ${context.substring(0, 100)}...`);

    // Step 5: Build the complete prompt with system prompt and context
    const systemPrompt = getSystemPrompt(agent, context);

    // Step 6: Call the LLM (Using Groq as primary, Gemini as fallback)
    let reply = await callGroqChat(systemPrompt, message, agent);

    if (!reply) {
      console.warn(`[Agent: ${agent}] Groq failed, trying Gemini...`);
      reply = await callGeminiChat(systemPrompt, message);
    }

    // Step 7: Handle fallback if LLM fails
    if (!reply) {
      console.warn(`[Agent: ${agent}] All LLMs failed, using basic fallback`);
      reply = provideBasicFallbackResponse(message, agent);
    }

    // Step 8: Add disclaimer
    const disclaimer = getDisclaimer(agent);

    // Step 9: Combine response with disclaimer
    const finalReply = reply.trim() + disclaimer;

    console.log(`[Agent: ${agent}] Response generated successfully`);

    return res.json({
      success: true,
      reply: finalReply,
      agent,
      contextUsed: context !== "No specific information found in the dataset for this query."
    });

  } catch (error) {
    console.error("Chat Agent Error:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while processing your request. Please try again."
    });
  }
};
