/**
 * Guardrails Middleware
 * Safety checks for AI agent queries
 * UPDATED: STRICT SCOPE VALIDATION - agents only answer questions within their domain
 */

import { getGuardrailConfig } from "../config/agentConfig.js";

/**
 * Check if a message violates guardrails for a specific agent
 * Blocks off-topic queries using forbidden keywords
 * @param {string} message - User message to check
 * @param {string} agentType - 'diagnostic' or 'masc'
 * @returns {object} - { allowed: boolean, response?: string }
 */
export function checkGuardrails(message, agentType) {
    const config = getGuardrailConfig(agentType);
    const lowerMessage = message.toLowerCase();

    // Check each forbidden keyword/phrase
    for (const forbidden of config.forbidden) {
        if (lowerMessage.includes(forbidden.toLowerCase())) {
            console.log(`[Guardrail] Blocked off-topic query for ${agentType}: "${message.substring(0, 50)}..."`);
            return {
                allowed: false,
                response: config.refusalResponse,
                blockedKeyword: forbidden
            };
        }
    }

    return { allowed: true };
}

/**
 * Check for emergency situations - provides immediate guidance
 * @param {string} message - User message to check
 * @returns {object} - { isEmergency: boolean, response?: string }
 */
export function checkEmergency(message) {
    const emergencyKeywords = [
        "heart attack", "stroke", "can't breathe", "cannot breathe",
        "severe bleeding", "unconscious", "poisoning", "overdose",
        "suicidal", "suicide", "anaphylaxis", "choking"
    ];

    const lowerMessage = message.toLowerCase();

    for (const keyword of emergencyKeywords) {
        if (lowerMessage.includes(keyword)) {
            return {
                isEmergency: true,
                response: `🚨 **This sounds like it could be a medical emergency.**

**Please take immediate action:**
1. **Call emergency services** (911 in US, 112 in EU, 999 in UK, 108 in India)
2. **Do not wait** - seek immediate medical attention
3. If someone is with you, ask them to help

I'm an AI assistant and cannot provide emergency medical care. Your safety is the top priority.

---

If this is NOT an emergency and you'd like to continue our conversation, please let me know and I'll be happy to help with your question.`
            };
        }
    }

    return { isEmergency: false };
}

/**
 * STRICT SCOPE VALIDATION - Check if query matches agent's domain
 * Uses positive keyword matching to validate scope appropriateness
 * @param {string} message - User message
 * @param {string} agentType - 'diagnostic' or 'masc'
 * @returns {object} - { appropriate: boolean, guidance?: string }
 */
export function validateAgentScope(message, agentType) {
    const lowerMessage = message.toLowerCase();

    if (agentType === "diagnostic") {
        // Diagnostic agent keywords - symptoms, conditions, tests, diagnosis
        const diagnosticKeywords = [
            "symptom", "pain", "ache", "hurt", "sore", "fever", "headache", "cough",
            "tired", "fatigue", "dizzy", "nausea", "vomit", "diarrhea", "rash",
            "condition", "disease", "disorder", "syndrome", "illness", "infection",
            "test", "blood test", "lab", "scan", "x-ray", "mri", "ct scan", "result",
            "diagnose", "diagnosis", "check", "exam", "doctor", "specialist",
            "what is wrong", "what could", "could it be", "might be", "perhaps",
            "cancer", "diabetes", "hypertension", "asthma", "flu", "cold",
            "heart", "lung", "kidney", "liver", "stomach", "brain"
        ];

        // Check if query contains diagnostic keywords
        const matches = diagnosticKeywords.some(keyword => lowerMessage.includes(keyword));

        if (!matches) {
            return {
                appropriate: false,
                guidance: "I'm a diagnostic assistant specialized in analyzing symptoms, understanding medical conditions, and explaining diagnostic tests. I notice your question might not be related to diagnosis. Could you please ask about symptoms, conditions, or diagnostic tests?"
            };
        }

        return { appropriate: true };
    }
    else if (agentType === "masc") {
        // MASC agent keywords - medications, drugs, side effects, adherence
        const mascKeywords = [
            "medication", "medicine", "drug", "pill", "tablet", "capsule",
            "prescription", "dose", "dosage", "take", "taking",
            "side effect", "reaction", "adverse", "interaction",
            "pharmacy", "pharmacist", "refill",
            "remember", "forgot", "miss", "missed dose", "skip",
            "adherence", "compliance", "schedule", "timing",
            "antibiotic", "painkiller", "insulin", "statin", "aspirin",
            "supplement", "vitamin", "over the counter", "otc",
            "how to take", "when to take", "with food", "before meal"
        ];

        // Check if query contains medication keywords
        const matches = mascKeywords.some(keyword => lowerMessage.includes(keyword));

        if (!matches) {
            return {
                appropriate: false,
                guidance: "I'm a medication adherence coach specialized in helping with medicines, side effects, and how to take medications properly. I notice your question might not be related to medications. Could you please ask about medicines, dosages, or side effects?"
            };
        }

        return { appropriate: true };
    }

    return { appropriate: true };
}

export default {
    checkGuardrails,
    checkEmergency,
    validateAgentScope
};
