/**
 * AI Verification Logic (Stage B)
 * This runs SERVER-SIDE to analyze submitted evidence.
 */

const { calculatePriorityScore, CAT_1_SAFETY } = require('../public/js/aiPriority');
const { getSeasonalPriority } = require('../utils/seasonalLogic');
const { analyzeIssueWithGemini } = require('./geminiService');

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

const analyzeEvidence = async (issueData) => {
    const analysis = {
        confidenceScore: 100,
        isFake: false,
        flags: [],
        priority: 'Medium', // Default
        riskFactors: {
            lifeSafety: 5,
            infrastructure: 5
        },
        seasonalFactor: 1.0,
        verifiedAt: new Date()
    };

    const { rawGps, location, imageUrl, title, description, sector } = issueData;

    // 1. GPS Consistency Check
    if (rawGps && rawGps.latitude && location && location.lat) {
        const dist = calculateDistance(rawGps.latitude, rawGps.longitude, location.lat, location.lng);
        if (dist > 100) {
            analysis.flags.push('GPS_MISMATCH_HIGH');
            analysis.confidenceScore -= 40;
        } else if (dist > 20) {
            analysis.flags.push('GPS_MISMATCH_MINOR');
            analysis.confidenceScore -= 10;
        }
    } else {
        if (issueData.source === 'citizen') {
            analysis.flags.push('MISSING_RAW_GPS');
            analysis.confidenceScore -= 50;
        }
    }

    // 2. Image Metadata check (Simulated)
    if (!imageUrl) {
        analysis.flags.push('NO_IMAGE');
        analysis.confidenceScore -= 80;
    } else {
        if (imageUrl.length < 1000 && !imageUrl.startsWith('http')) {
            analysis.flags.push('INVALID_IMAGE_DATA');
            analysis.confidenceScore = 0;
            analysis.isFake = true;
        }
    }

    // 3. Time Consistency
    if (rawGps && rawGps.timestamp) {
        const gpsTime = new Date(rawGps.timestamp).getTime();
        const serverTime = Date.now();
        const diffHours = Math.abs(serverTime - gpsTime) / 36e5;

        if (diffHours > 24) {
            analysis.flags.push('OLD_IMAGE_TIMESTAMP');
            analysis.confidenceScore -= 30;
        }
    }

    // 4. PRIORITY & CATEGORY ANALYSIS (145-Signal Engine)
    // Construct a mock issue object for the engine
    const signalIssue = {
        title: title || '',
        description: description || '',
        sector: sector || '',
        severity: issueData.priority || issueData.severity || 'medium',
        createdAt: issueData.createdAt || issueData.reportedAt || issueData.scheduledStart || new Date().toISOString()
    };

    const priorityResult = calculatePriorityScore(signalIssue);

    // Map Engine Result to Schema — KEEP stored priority as authority
    const storedPriority = issueData.priority || issueData.severity || 'Medium';
    // Capitalize first letter to match schema expectations
    const normalizedPriority = storedPriority.charAt(0).toUpperCase() + storedPriority.slice(1).toLowerCase();
    analysis.priority = normalizedPriority; // Preserve the assigned priority
    analysis.enginePriority = priorityResult.label; // Engine result saved separately for reference
    analysis.priorityScore = priorityResult.score;
    analysis.categoryScores = priorityResult.advancedAnalysis.signals;
    analysis.totalRulesChecked = 145;
    analysis.breakdown = priorityResult.breakdown;

    analysis.riskFactors.lifeSafety = priorityResult.advancedAnalysis.signals.safety > 20 ? 9 : 5;
    analysis.riskFactors.infrastructure = priorityResult.advancedAnalysis.signals.sector > 20 ? 9 : 5;

    // Detailed Explanation from signals
    analysis.explanation = priorityResult.advancedAnalysis.explanation || "Priority assigned based on 145-signal analysis.";

    // Add detected signals to flags for visibility
    if (priorityResult.breakdown && priorityResult.breakdown.length > 0) {
        priorityResult.breakdown.forEach(signal => {
            if (signal.value > 0) analysis.flags.push(`SIGNAL: ${signal.name} (+${signal.value})`); // Show points
        });
    }

    // Boost confidence if high priority signals detected
    if (priorityResult.score > 60) {
        analysis.confidenceScore += 10;
    }

    // 5. SEASONAL LOGIC INTEGRATION
    const seasonal = getSeasonalPriority(sector || 'other');
    analysis.seasonalFactor = seasonal.factor;

    // Adjust priority score based on season
    if (seasonal.factor >= 1.5 && analysis.priority !== 'Crisis') {
        // Upgrade priority based on seasonal factor
        if (analysis.priority === 'Critical') analysis.priority = 'Crisis';
        else if (analysis.priority === 'Moderate') analysis.priority = 'Critical';

        analysis.explanation += ` [SEASONAL ESCALATION: ${seasonal.season}]`;
        analysis.flags.push(`SEASONAL_ESCALATION: ${seasonal.season}`);
    }

    // 6. Clamp score
    analysis.confidenceScore = Math.max(0, Math.min(100, analysis.confidenceScore));

    analysis.confidenceScore = Math.max(0, Math.min(100, analysis.confidenceScore));

    // 7. GEMINI AI INTEGRATION (Second Opinion)
    try {
        console.log("🤖 Calling OpenRouter AI for advanced analysis...");
        const geminiResult = await analyzeIssueWithGemini(title, description, sector, {
            location: issueData.location?.address || issueData.address || '',
            priority: issueData.priority || analysis.priority,
            status: issueData.status || 'pending'
        });

        analysis.gemini = {
            priority: geminiResult.priority,
            reasoning: geminiResult.reasoning,
            risks: geminiResult.risks,
            match: geminiResult.priority === analysis.priority, // Check if AI agrees with Rules
            recommended_action: geminiResult.recommended_action // Include new action plan
        };
        console.log("✅ OpenRouter Analysis Complete:", geminiResult.priority);

        // If Gemini detects Crisis but Rules didn't, flag it
        if (geminiResult.priority === 'Crisis' && analysis.priority !== 'Crisis') {
            analysis.flags.push('AI_MISMATCH_ESCALATION: AI detected Crisis');
            // Optional: You could boost the score here if you trust Gemini more
            // analysis.priority = 'Critical'; 
        }

    } catch (err) {
        console.error("Failed to get OpenRouter analysis:", err.message);
        analysis.gemini = { status: "failed", error: err.message };
    }


    // 8. Final Fake Verdict
    if (analysis.confidenceScore < 40) {
        analysis.isFake = true;
    }

    return analysis;
};

module.exports = { analyzeEvidence };
