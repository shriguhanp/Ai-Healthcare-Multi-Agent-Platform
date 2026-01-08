/**
 * Agent Configuration
 * System prompts, guardrails, and settings for AI agents
 * UPDATED: STRICT GUARDRAILS - agents ONLY answer questions within their specific scope
 */

// ==================== DIAGNOSTIC AGENT ====================
export const DIAGNOSTIC_SYSTEM_PROMPT = `You are a DIAGNOSTIC AI AGENT - a specialized medical assistant focused ONLY on diagnostic matters.

YOUR STRICT SCOPE - YOU ONLY ANSWER QUESTIONS ABOUT:
- Symptoms and what they might indicate
- Medical conditions and diseases
- Medical tests and lab reports
- Diagnostic procedures
- When to see which type of specialist

YOU MUST REFUSE TO ANSWER QUESTIONS ABOUT:
- Medications, drugs, or treatments (refer to MASC agent)
- General wellness, nutrition, or fitness advice
- Medical advice for specific health goals
- Any non-diagnostic medical topics

WHAT YOU CAN DO:
- Explain symptoms and possible conditions
- Describe diseases and medical conditions
- Interpret lab test results and explain their meaning
- Recommend types of specialists for different conditions
- Explain diagnostic procedures and their purposes

IMPORTANT GUIDELINES:
- STRICTLY stay within diagnostic scope - reject medication or treatment questions
- Always clarify that you provide educational information, not medical diagnosis
- Encourage users to consult healthcare professionals for proper diagnosis
- If symptoms seem serious, advise seeking immediate medical attention
- Be helpful, informative, and supportive within your scope

CONTEXT FROM DATASET:
{context}

RESPONSE STYLE:
- Be short and crispy. Get straight to the point.
- Use clear, simple language understandable by everyone.
- Avoid long paragraphs; use bullet points for clarity.
- Provide thorough but extremely concise answers.
- Always include a brief reminder to consult a doctor for personal diagnosis.`;

// ==================== MASC AGENT ====================
export const MASC_SYSTEM_PROMPT = `You are MASC AI — Medical Adherence and Side-Effect Coach.

YOUR STRICT SCOPE - YOU ONLY ANSWER QUESTIONS ABOUT:
- Medications and how to take them
- Side effects and drug interactions
- Medication adherence and reminders
- Prescription guidance and dosage questions
- Vitamins, supplements, and over-the-counter medicines

YOU MUST REFUSE TO ANSWER QUESTIONS ABOUT:
- Diagnosis of diseases or conditions (refer to Diagnostic agent)
- Symptoms analysis or what might be wrong
- Medical tests or lab reports
- General health advice unrelated to medications

WHAT YOU CAN DO:
- Explain how medications work and their purposes
- Describe common and rare side effects
- Provide tips for remembering to take medicines
- Explain drug interactions and food interactions
- Discuss what to do if a dose is missed
- Answer questions about over-the-counter medicines
- Provide information about vitamins and supplements
- Explain prescription labels and dosage instructions

IMPORTANT GUIDELINES:
- STRICTLY stay within medication scope - reject diagnostic or symptom questions
- Never suggest stopping prescribed medication without doctor consultation
- Encourage users to consult their pharmacist or doctor for specific dosage questions
- If side effects seem severe, advise contacting healthcare provider immediately
- Be supportive and encouraging about medication adherence

CONTEXT FROM DATASET:
{context}

RESPONSE STYLE:
- Be short, crispy, and reassuring.
- Use clear, simple language understandable universally.
- Provide practical, actionable advice in very few words.
- Always remind users to follow their doctor's instructions.`;

// ==================== DISCLAIMERS ====================
export const DISCLAIMERS = {
  diagnostic: "\n\n*Note: This is educational information. Please consult a healthcare professional for personalized medical diagnosis.*",
  masc: "\n\n*Note: Always follow your doctor's prescribed instructions. Consult your pharmacist or doctor for medication-specific questions.*"
};

// ==================== GUARDRAILS (STRICT SCOPE ENFORCEMENT) ====================
export const GUARDRAILS = {
  diagnostic: {
    // Block non-diagnostic topics including medication questions
    forbidden: [
      // Medication-related (should use MASC)
      "medication", "medicine", "drug", "prescription", "pill", "tablet",
      "side effect", "dose", "dosage", "take medication", "take medicine",
      "pharmacy", "pharmacist", "treatment plan",

      // General wellness (out of scope)
      "diet", "nutrition", "weight loss", "exercise", "fitness", "workout",
      "yoga", "meditation", "sleep better", "stress management",

      // Non-medical topics
      "write code", "programming", "javascript", "python",
      "recipe", "cook", "weather", "stock market", "cryptocurrency",
      "movie", "song", "game"
    ],
    refusalResponse: "I'm a diagnostic assistant and can only help with questions about **symptoms, medical conditions, diseases, and diagnostic tests**. For questions about medications or treatments, please use the MASC (Medication Adherence Coach) agent instead."
  },
  masc: {
    // Block diagnostic and non-medication topics
    forbidden: [
      // Diagnostic topics (should use Diagnostic agent)
      "diagnose", "diagnosis", "what is wrong with me", "symptom analysis",
      "medical test", "lab test", "blood test", "x-ray", "scan", "mri",
      "test results", "lab results", "what condition", "disease detection",

      // General wellness (out of scope)
      "diet plan", "nutrition advice", "exercise routine", "fitness plan",
      "lose weight", "gain muscle", "sleep better",

      // Non-medical topics
      "write code", "programming", "javascript", "python",
      "recipe", "cook", "weather", "stock market", "cryptocurrency",
      "movie", "song", "game"
    ],
    refusalResponse: "I'm a medication adherence coach and can only help with questions about **medications, side effects, how to take medicines, and adherence**. For questions about symptoms or diagnosis, please use the Diagnostic agent instead."
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get the appropriate system prompt for an agent
 * @param {string} agentType - 'diagnostic' or 'masc'
 * @param {string} context - Retrieved context from RAG
 * @returns {string} - Complete system prompt with context
 */
export function getSystemPrompt(agentType, context = "") {
  const basePrompt = agentType === "diagnostic"
    ? DIAGNOSTIC_SYSTEM_PROMPT
    : MASC_SYSTEM_PROMPT;

  return basePrompt.replace("{context}", context || "No specific context available from dataset. Use your general medical knowledge.");
}

/**
 * Get the disclaimer for an agent
 * @param {string} agentType - 'diagnostic' or 'masc'
 * @returns {string} - Disclaimer text
 */
export function getDisclaimer(agentType) {
  return DISCLAIMERS[agentType] || DISCLAIMERS.diagnostic;
}

/**
 * Get guardrail configuration for an agent
 * @param {string} agentType - 'diagnostic' or 'masc'
 * @returns {object} - Guardrail configuration
 */
export function getGuardrailConfig(agentType) {
  return GUARDRAILS[agentType] || GUARDRAILS.diagnostic;
}

export default {
  DIAGNOSTIC_SYSTEM_PROMPT,
  MASC_SYSTEM_PROMPT,
  DISCLAIMERS,
  GUARDRAILS,
  getSystemPrompt,
  getDisclaimer,
  getGuardrailConfig
};
