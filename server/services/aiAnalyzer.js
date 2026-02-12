/**
 * AI Verification Logic (Stage B)
 * This runs SERVER-SIDE to analyze submitted evidence.
 */

const { determinePriority } = require('../utils/priorityList');
const { getSeasonalPriority } = require('../utils/seasonalLogic');

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

const analyzeEvidence = (issueData) => {
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

    // 4. PRIORITY & CATEGORY ANALYSIS (New)
    // Combine text from title and description for analysis
    const textToAnalyze = `${title || ''} ${description || ''} ${sector || ''}`;
    const priorityResult = determinePriority(textToAnalyze);

    if (priorityResult.details) {
        analysis.priority = priorityResult.priority;
        analysis.riskFactors.lifeSafety = priorityResult.details.lifeSafety;
        analysis.riskFactors.infrastructure = priorityResult.details.infrastructure;
        analysis.explanation = priorityResult.explanation; // Include detailed reason
        // Boost confidence if we found a matching keyword
        if (priorityResult.confidence > 0.8) {
            analysis.confidenceScore += 5;
        }
    } else {
        analysis.explanation = priorityResult.explanation || "Standard priority assessment.";
    }

    // 5. SEASONAL LOGIC INTEGRATION
    const seasonal = getSeasonalPriority(sector || 'other');
    analysis.seasonalFactor = seasonal.factor;

    // Adjust priority score based on season
    // If seasonal factor is high (>1.2), we might bump the priority
    if (seasonal.factor >= 1.5 && analysis.priority !== 'Critical') {
        if (analysis.priority === 'High') analysis.priority = 'Critical';
        else if (analysis.priority === 'Medium') analysis.priority = 'High';
        else if (analysis.priority === 'Low') analysis.priority = 'Medium';

        const escalationMsg = `Escalated to ${analysis.priority} due to critical ${seasonal.season} factors.`;
        analysis.flags.push(`SEASONAL_ESCALATION: ${seasonal.season}`);
        analysis.explanation += ` ${escalationMsg}`;
    }

    // 6. Clamp score
    analysis.confidenceScore = Math.max(0, Math.min(100, analysis.confidenceScore));

    // 7. Final Fake Verdict
    if (analysis.confidenceScore < 40) {
        analysis.isFake = true;
    }

    return analysis;
};

module.exports = { analyzeEvidence };
