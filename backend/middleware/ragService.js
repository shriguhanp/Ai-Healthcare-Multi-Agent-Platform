/**
 * RAG Service
 * Retrieval-Augmented Generation for AI agents
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dataset cache
let datasetCache = {
    diagnostic: null,
    masc: null
};

/**
 * Load dataset for an agent type
 * @param {string} agentType - 'diagnostic' or 'masc'
 * @returns {object} - Loaded dataset
 */
export function loadDataset(agentType) {
    // Return from cache if available
    if (datasetCache[agentType]) {
        return datasetCache[agentType];
    }

    const datasetsPath = path.join(__dirname, "..", "datasets", agentType);
    const dataset = {};

    try {
        // Check if directory exists
        if (!fs.existsSync(datasetsPath)) {
            console.warn(`[RAG] Dataset directory not found for ${agentType}: ${datasetsPath}`);
            return {};
        }

        // Read all JSON files in the directory
        const files = fs.readdirSync(datasetsPath).filter(f => f.endsWith(".json"));

        for (const file of files) {
            const filePath = path.join(datasetsPath, file);
            const content = fs.readFileSync(filePath, "utf-8");
            const fileName = path.basename(file, ".json");
            dataset[fileName] = JSON.parse(content);
        }

        console.log(`[RAG] Loaded ${files.length} dataset files for ${agentType}`);

        // Cache the dataset
        datasetCache[agentType] = dataset;

        return dataset;
    } catch (error) {
        console.error(`[RAG] Error loading dataset for ${agentType}:`, error.message);
        return {};
    }
}

/**
 * Clear the dataset cache (useful for reloading)
 */
export function clearCache() {
    datasetCache = { diagnostic: null, masc: null };
}

/**
 * Search for relevant context in the dataset based on user query
 * @param {string} query - User's question
 * @param {string} agentType - 'diagnostic' or 'masc'
 * @returns {string} - Relevant context as a string
 */
export function retrieveContext(query, agentType) {
    const dataset = loadDataset(agentType);
    const results = [];
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

    if (agentType === "diagnostic") {
        // Search symptoms and conditions
        if (dataset.symptoms_conditions?.conditions) {
            for (const condition of dataset.symptoms_conditions.conditions) {
                // Check if any symptom matches the query
                const matchingSymptoms = condition.symptoms.filter(sym =>
                    queryWords.some(word => sym.toLowerCase().includes(word))
                );

                if (matchingSymptoms.length > 0 ||
                    queryLower.includes(condition.name.toLowerCase())) {
                    results.push({
                        type: "condition",
                        name: condition.name,
                        symptoms: condition.symptoms.join(", "),
                        description: condition.description,
                        specialist: condition.recommended_specialist,
                        tests: condition.suggested_tests.join(", "),
                        relevance: matchingSymptoms.length
                    });
                }
            }
        }

        // Search medical tests
        if (dataset.medical_tests?.tests) {
            for (const test of dataset.medical_tests.tests) {
                if (queryLower.includes(test.name.toLowerCase()) ||
                    queryWords.some(word => test.name.toLowerCase().includes(word)) ||
                    queryWords.some(word => test.purpose.toLowerCase().includes(word))) {
                    results.push({
                        type: "test",
                        name: test.name,
                        purpose: test.purpose,
                        normalRanges: JSON.stringify(test.normal_ranges),
                        abnormalIndications: JSON.stringify(test.abnormal_indications)
                    });
                }
            }
        }
    }
    else if (agentType === "masc") {
        // Search medications
        if (dataset.medications?.medications) {
            for (const med of dataset.medications.medications) {
                if (queryLower.includes(med.name.toLowerCase()) ||
                    queryWords.some(word => med.name.toLowerCase().includes(word)) ||
                    queryWords.some(word => med.category.toLowerCase().includes(word))) {
                    results.push({
                        type: "medication",
                        name: med.name,
                        category: med.category,
                        uses: med.common_uses.join(", "),
                        howToTake: med.how_to_take,
                        timing: med.timing,
                        precautions: med.precautions.join("; "),
                        commonSideEffects: med.common_side_effects.join(", "),
                        severeSideEffects: med.severe_side_effects.join(", "),
                        adherenceTips: med.adherence_tips.join("; ")
                    });
                }
            }
        }

        // Search side effects guide
        if (dataset.side_effects) {
            // Add general adherence tips if asking about taking medication
            if (queryLower.includes("take") || queryLower.includes("remember") ||
                queryLower.includes("miss") || queryLower.includes("forgot")) {
                results.push({
                    type: "adherence_guide",
                    tips: dataset.side_effects.general_adherence_tips.join("; "),
                    missedDose: JSON.stringify(dataset.side_effects.missed_dose_guidance)
                });
            }

            // Add emergency info if asking about severe side effects
            if (queryLower.includes("severe") || queryLower.includes("emergency") ||
                queryLower.includes("dangerous") || queryLower.includes("serious")) {
                results.push({
                    type: "safety",
                    whenToContact: dataset.side_effects.when_to_contact_doctor.join("; "),
                    emergency: JSON.stringify(dataset.side_effects.emergency_symptoms)
                });
            }
        }
    }

    // Sort by relevance and format results
    results.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));

    // Take top 5 most relevant results
    const topResults = results.slice(0, 5);

    if (topResults.length === 0) {
        return "No specific information found in the dataset for this query.";
    }

    // Format context for the prompt
    return formatContext(topResults, agentType);
}

/**
 * Format retrieved results into a readable context string
 * @param {Array} results - Retrieved results
 * @param {string} agentType - 'diagnostic' or 'masc'
 * @returns {string} - Formatted context
 */
function formatContext(results, agentType) {
    let context = "";

    for (const result of results) {
        if (result.type === "condition") {
            context += `
CONDITION: ${result.name}
- Description: ${result.description}
- Common Symptoms: ${result.symptoms}
- Recommended Specialist: ${result.specialist}
- Suggested Tests: ${result.tests}
`;
        }
        else if (result.type === "test") {
            context += `
MEDICAL TEST: ${result.name}
- Purpose: ${result.purpose}
- Normal Ranges: ${result.normalRanges}
- Abnormal Indications: ${result.abnormalIndications}
`;
        }
        else if (result.type === "medication") {
            context += `
MEDICATION: ${result.name}
- Category: ${result.category}
- Common Uses: ${result.uses}
- How to Take: ${result.howToTake}
- Timing: ${result.timing}
- Precautions: ${result.precautions}
- Common Side Effects: ${result.commonSideEffects}
- Severe Side Effects: ${result.severeSideEffects}
- Adherence Tips: ${result.adherenceTips}
`;
        }
        else if (result.type === "adherence_guide") {
            context += `
ADHERENCE GUIDANCE:
- General Tips: ${result.tips}
- Missed Dose: ${result.missedDose}
`;
        }
        else if (result.type === "safety") {
            context += `
SAFETY INFORMATION:
- When to Contact Doctor: ${result.whenToContact}
- Emergency Info: ${result.emergency}
`;
        }
    }

    return context.trim();
}

/**
 * Build the complete RAG prompt with system prompt and context
 * @param {string} systemPrompt - Base system prompt
 * @param {string} context - Retrieved context
 * @param {string} userQuery - User's question
 * @returns {string} - Complete prompt
 */
export function buildRAGPrompt(systemPrompt, context, userQuery) {
    // Replace the context placeholder in the system prompt
    const promptWithContext = systemPrompt.replace("{context}", context);

    return promptWithContext;
}

export default {
    loadDataset,
    retrieveContext,
    buildRAGPrompt,
    clearCache
};
