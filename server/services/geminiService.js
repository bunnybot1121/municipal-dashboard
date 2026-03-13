const axios = require('axios');
require('dotenv').config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "google/gemini-2.0-flash-001"; // Can be swapped for other models via OpenRouter
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

if (!OPENROUTER_API_KEY) {
    console.error("❌ No OPENROUTER_API_KEY found in environment!");
} else {
    console.log("✅ OpenRouter API Key Loaded");
}

/**
 * Analyzes a citizen issue using OpenRouter (Gemini, Llama, etc.) to determine priority.
 */
async function analyzeIssueWithGemini(title, description, sector, extraContext = {}) {
    if (!OPENROUTER_API_KEY) {
        return {
            priority: "Moderate",
            reasoning: "AI Service Not Configured (Missing Key)",
            risks: ["Configuration Error"]
        };
    }

    try {
        const locationInfo = extraContext.location || extraContext.address || 'Unknown';
        const currentPriority = extraContext.priority || 'Unknown';
        const status = extraContext.status || 'pending';

        const systemPrompt = `You are NagarSevak AI, an expert municipal infrastructure analyst for Indian cities. You assess citizen complaints and maintenance tasks with HIGH ACCURACY. Never dismiss issues as minor without strong evidence. Consider cascading infrastructure risks, public safety, and seasonal factors (monsoon, heat waves). Be specific in your analysis — reference the actual issue details, not generic statements.`;

        const userPrompt = `Analyze this municipal issue thoroughly:

TITLE: "${title}"
DESCRIPTION: "${description}"
SECTOR: ${sector || 'General'}
LOCATION: ${locationInfo}
CURRENT PRIORITY: ${currentPriority}
STATUS: ${status}

Provide your expert assessment as JSON:
{
    "priority": "Crisis|Critical|Moderate|Low",
    "reasoning": "2-3 specific sentences about THIS issue's severity, public impact, and infrastructure risk. Reference the actual title and description.",
    "risks": ["Specific Risk 1", "Specific Risk 2", "Specific Risk 3"],
    "recommended_action": "3 concrete steps to resolve THIS specific issue."
}`;

        console.log(`🤖 Sending request to OpenRouter (${MODEL})...`);

        const response = await axios.post(
            API_URL,
            {
                model: MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                max_tokens: 600,
                temperature: 0.3,
                response_format: { type: "json_object" }
            },
            {
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:5000",
                    "X-Title": "NagarSevak AI"
                },
                timeout: 15000
            }
        );

        const content = response.data.choices[0].message.content;

        // Parse JSON from content
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);
                console.log("✅ OpenRouter Analysis Success:", analysis.priority);
                return analysis;
            } else {
                throw new Error("No JSON found in response");
            }
        } catch (parseError) {
            console.warn("⚠️ Failed to parse OpenRouter response:", content);
            return {
                priority: "Moderate",
                reasoning: "AI analysis return invalid format.",
                risks: ["Parsing Error"]
            };
        }

    } catch (error) {
        console.error("❌ OpenRouter API Error:", error.response?.data || error.message);
        return {
            priority: "Moderate",
            reasoning: "AI Service Unavailable (Network/API Error)",
            risks: []
        };
    }
}

module.exports = { analyzeIssueWithGemini };
