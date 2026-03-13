/**
 * AI Validation Agent — Citizen Report Verification
 * Uses Gemini 2.0 Flash (Vision) via OpenRouter to verify:
 *   1. Photo shows a real municipal/infrastructure issue
 *   2. Description matches what's visible in the photo
 *   3. Not spam, selfie, blank, or unrelated content
 */

const axios = require('axios');
require('dotenv').config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const VISION_MODEL = "google/gemini-2.0-flash-001";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Validates a citizen-submitted report using AI vision analysis.
 * @param {Object} params
 * @param {string} params.photo - Base64 data URL of the captured photo
 * @param {string} params.description - Citizen's description of the issue
 * @param {string} params.sector - Selected sector (Roads, Water, etc.)
 * @param {string} params.severity - Selected severity level
 * @returns {Object} { isValid, confidence, reason, detectedIssueType, suggestions }
 */
async function validateReport({ photo, description, sector, severity }) {
    // Fallback if no API key configured
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.includes('YOUR_KEY_HERE')) {
        console.warn("⚠️ No OpenRouter API key — skipping AI validation");
        return {
            isValid: true,
            confidence: 50,
            reason: "AI validation unavailable — report accepted without verification.",
            detectedIssueType: sector || 'unknown',
            suggestions: []
        };
    }

    try {
        console.log("🔍 AI Validation Agent: Analyzing submitted report...");

        // Build the vision prompt
        const systemPrompt = `You are NagarSevak AI Validator, a strict quality gate for citizen-submitted municipal complaints in Indian cities.

Your job is to analyze the PHOTO and DESCRIPTION submitted by a citizen and determine if this is a LEGITIMATE municipal infrastructure issue.

ACCEPT reports that show:
- Road damage (potholes, cracks, cave-ins)
- Water issues (leaks, contamination, flooding, broken pipes)
- Drainage problems (blocked drains, sewage overflow, stagnant water)
- Lighting issues (broken streetlights, dark areas)
- Waste/garbage problems (overflowing bins, illegal dumping)
- Building/structural damage
- Any genuine public infrastructure problem

REJECT reports that show:
- Selfies, faces, or personal photos
- Food, animals (unless related to waste), or unrelated objects
- Blank/black/blurry images with no visible issue
- Screenshots of apps, memes, or text
- Indoor personal spaces (bedroom, kitchen) unless showing infrastructure damage
- Advertising or promotional content

Be FAIR but STRICT. When in doubt about an edge case, ACCEPT with a note.`;

        const userPrompt = `Analyze this citizen complaint:

SELECTED SECTOR: ${sector || 'Not specified'}
SELECTED SEVERITY: ${severity || 'Not specified'}
CITIZEN DESCRIPTION: "${description || 'No description provided'}"

Look at the attached photo and respond with ONLY this JSON:
{
    "isValid": true/false,
    "confidence": 0-100,
    "reason": "One clear sentence explaining your decision",
    "detectedIssueType": "What the photo actually shows (e.g. 'pothole on road', 'overflowing garbage bin')",
    "sectorMatch": true/false,
    "descriptionMatch": true/false,
    "suggestions": ["Optional helpful suggestion for the citizen"]
}`;

        // Prepare the image content — handle both base64 and URLs
        let imageContent;
        if (photo.startsWith('data:')) {
            // Already a base64 data URL
            imageContent = { type: "image_url", image_url: { url: photo } };
        } else if (photo.startsWith('http://') || photo.startsWith('https://')) {
            // Remote URL — pass directly (Gemini supports URLs)
            imageContent = { type: "image_url", image_url: { url: photo } };
        } else {
            // Raw base64 string — wrap it
            imageContent = { type: "image_url", image_url: { url: `data:image/jpeg;base64,${photo}` } };
        }

        const response = await axios.post(
            API_URL,
            {
                model: VISION_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: userPrompt },
                            imageContent
                        ]
                    }
                ],
                max_tokens: 400,
                temperature: 0.2,
                response_format: { type: "json_object" }
            },
            {
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:5173",
                    "X-Title": "NagarSevak AI Validator"
                },
                timeout: 20000 // 20s timeout for vision analysis
            }
        );

        const content = response.data.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error("Empty response from AI");
        }

        // Parse JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No JSON in AI response");
        }

        const result = JSON.parse(jsonMatch[0]);
        console.log(`✅ AI Validation Result: ${result.isValid ? 'VALID' : 'REJECTED'} (${result.confidence}% confidence)`);
        console.log(`   Reason: ${result.reason}`);

        return {
            isValid: !!result.isValid,
            confidence: Math.min(100, Math.max(0, result.confidence || 70)),
            reason: result.reason || (result.isValid ? 'Report appears legitimate.' : 'Report does not appear to be a valid municipal issue.'),
            detectedIssueType: result.detectedIssueType || 'unknown',
            sectorMatch: result.sectorMatch !== false,
            descriptionMatch: result.descriptionMatch !== false,
            suggestions: result.suggestions || []
        };

    } catch (error) {
        console.error("❌ AI Validation Error:", error.response?.data || error.message);

        // On error, ACCEPT the report but flag for manual review
        // Don't block citizens due to AI service failures
        return {
            isValid: true,
            confidence: 0,
            reason: "AI validation could not analyze this photo — report accepted, manual review required.",
            detectedIssueType: 'unverified',
            suggestions: [],
            error: error.message,
            needsManualReview: true
        };
    }
}

module.exports = { validateReport };
