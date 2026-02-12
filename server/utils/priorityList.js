/**
 * Comprehensive Priority Ruleset for Municipal Issues
 * Contains ~135 signals across 9 categories with specific risk scores.
 */

const PRIORITY_RULES = {
    // 1. DISASTER & EMERGENCY (High Life Safety)
    'fire': { priority: 'Critical', lifeSafety: 10, infrastructure: 10, category: 'Disaster' },
    'explosion': { priority: 'Critical', lifeSafety: 10, infrastructure: 10, category: 'Disaster' },
    'building collapse': { priority: 'Critical', lifeSafety: 10, infrastructure: 10, category: 'Disaster' },
    'structure failure': { priority: 'Critical', lifeSafety: 9, infrastructure: 10, category: 'Disaster' },
    'landslide': { priority: 'Critical', lifeSafety: 9, infrastructure: 9, category: 'Disaster' },
    'earthquake damage': { priority: 'Critical', lifeSafety: 9, infrastructure: 9, category: 'Disaster' },
    'gas leak': { priority: 'Critical', lifeSafety: 10, infrastructure: 9, category: 'Disaster' },
    'chemical spill': { priority: 'Critical', lifeSafety: 10, infrastructure: 8, category: 'Disaster' },
    'flood': { priority: 'Critical', lifeSafety: 9, infrastructure: 8, category: 'Disaster' },
    'flash': { priority: 'Critical', lifeSafety: 9, infrastructure: 8, category: 'Disaster' }, // flash flood
    'drowning': { priority: 'Critical', lifeSafety: 10, infrastructure: 0, category: 'Disaster' },
    'trapped': { priority: 'Critical', lifeSafety: 10, infrastructure: 5, category: 'Disaster' },

    // 2. POWER & ELECTRICAL (High Danger)
    'live wire': { priority: 'Critical', lifeSafety: 10, infrastructure: 8, category: 'Power' },
    'electric shock': { priority: 'Critical', lifeSafety: 10, infrastructure: 8, category: 'Power' },
    'sparking': { priority: 'High', lifeSafety: 8, infrastructure: 7, category: 'Power' },
    'short circuit': { priority: 'High', lifeSafety: 8, infrastructure: 7, category: 'Power' },
    'transformer blast': { priority: 'Critical', lifeSafety: 9, infrastructure: 9, category: 'Power' },
    'power outage': { priority: 'High', lifeSafety: 4, infrastructure: 6, category: 'Power' },
    'blackout': { priority: 'High', lifeSafety: 5, infrastructure: 6, category: 'Power' },
    'pole fell': { priority: 'Critical', lifeSafety: 8, infrastructure: 8, category: 'Power' },
    'leaning pole': { priority: 'High', lifeSafety: 7, infrastructure: 7, category: 'Power' },
    'meter burnt': { priority: 'High', lifeSafety: 6, infrastructure: 5, category: 'Power' },
    'voltage fluctuation': { priority: 'Medium', lifeSafety: 3, infrastructure: 5, category: 'Power' },
    'no power': { priority: 'High', lifeSafety: 4, infrastructure: 5, category: 'Power' },

    // 3. WATER SUPPLY (Critical Resource)
    'pipeline burst': { priority: 'Critical', lifeSafety: 6, infrastructure: 9, category: 'Water' },
    'major leak': { priority: 'High', lifeSafety: 4, infrastructure: 8, category: 'Water' },
    'contaminated water': { priority: 'High', lifeSafety: 8, infrastructure: 6, category: 'Water' },
    'dirty water': { priority: 'High', lifeSafety: 7, infrastructure: 6, category: 'Water' },
    'no water': { priority: 'High', lifeSafety: 7, infrastructure: 5, category: 'Water' },
    'water cut': { priority: 'High', lifeSafety: 6, infrastructure: 5, category: 'Water' },
    'low pressure': { priority: 'Medium', lifeSafety: 3, infrastructure: 4, category: 'Water' },
    'valve broken': { priority: 'Medium', lifeSafety: 3, infrastructure: 6, category: 'Water' },
    'wastage': { priority: 'Medium', lifeSafety: 2, infrastructure: 5, category: 'Water' },
    'tank overflow': { priority: 'Medium', lifeSafety: 2, infrastructure: 5, category: 'Water' },
    'illegal connection': { priority: 'Medium', lifeSafety: 2, infrastructure: 6, category: 'Water' },

    // 4. DRAINAGE & SEWERAGE (Health Risk)
    'open manhole': { priority: 'Critical', lifeSafety: 9, infrastructure: 5, category: 'Drainage' },
    'missing lid': { priority: 'Critical', lifeSafety: 9, infrastructure: 5, category: 'Drainage' },
    'broken manhole': { priority: 'High', lifeSafety: 8, infrastructure: 6, category: 'Drainage' },
    'sewerage overflow': { priority: 'High', lifeSafety: 7, infrastructure: 7, category: 'Drainage' },
    'blocked drain': { priority: 'High', lifeSafety: 6, infrastructure: 6, category: 'Drainage' },
    'water logging': { priority: 'High', lifeSafety: 6, infrastructure: 7, category: 'Drainage' },
    'clogged nala': { priority: 'High', lifeSafety: 6, infrastructure: 7, category: 'Drainage' },
    'septic tank': { priority: 'High', lifeSafety: 6, infrastructure: 6, category: 'Drainage' },
    ' gutter overflowing': { priority: 'High', lifeSafety: 7, infrastructure: 6, category: 'Drainage' },

    // 5. ROADS & TRAFFIC (Public Safety)
    'road cave-in': { priority: 'High', lifeSafety: 7, infrastructure: 8, category: 'Roads' },
    'sinkhole': { priority: 'High', lifeSafety: 8, infrastructure: 8, category: 'Roads' },
    'large pothole': { priority: 'High', lifeSafety: 6, infrastructure: 7, category: 'Roads' },
    'pothole': { priority: 'Medium', lifeSafety: 4, infrastructure: 6, category: 'Roads' },
    'broken footpath': { priority: 'Medium', lifeSafety: 3, infrastructure: 5, category: 'Roads' },
    'damaged divider': { priority: 'Medium', lifeSafety: 4, infrastructure: 5, category: 'Roads' },
    'traffic signal defunct': { priority: 'High', lifeSafety: 7, infrastructure: 6, category: 'Traffic' },
    'signal not working': { priority: 'High', lifeSafety: 7, infrastructure: 6, category: 'Traffic' },
    'major accident': { priority: 'Critical', lifeSafety: 9, infrastructure: 7, category: 'Traffic' },
    'gridlock': { priority: 'Medium', lifeSafety: 2, infrastructure: 4, category: 'Traffic' },
    'illegal parking': { priority: 'Low', lifeSafety: 2, infrastructure: 2, category: 'Traffic' },
    'abandoned vehicle': { priority: 'Low', lifeSafety: 2, infrastructure: 2, category: 'Traffic' },
    'faded marking': { priority: 'Low', lifeSafety: 1, infrastructure: 2, category: 'Roads' },

    // 6. HEALTH & SANITATION (Disease Risk)
    'garbage dump': { priority: 'High', lifeSafety: 6, infrastructure: 5, category: 'Waste' },
    'dead animal': { priority: 'High', lifeSafety: 6, infrastructure: 4, category: 'Waste' },
    'biomedical waste': { priority: 'High', lifeSafety: 8, infrastructure: 4, category: 'Waste' },
    'overflowing dustbin': { priority: 'Medium', lifeSafety: 4, infrastructure: 4, category: 'Waste' },
    'garbage not picked': { priority: 'Medium', lifeSafety: 3, infrastructure: 3, category: 'Waste' },
    'sweeping not done': { priority: 'Low', lifeSafety: 2, infrastructure: 2, category: 'Waste' },
    'mosquito breeding': { priority: 'Medium', lifeSafety: 5, infrastructure: 2, category: 'Health' },
    'stagnant water': { priority: 'Medium', lifeSafety: 5, infrastructure: 3, category: 'Health' },
    'rats': { priority: 'Low', lifeSafety: 3, infrastructure: 2, category: 'Health' },
    'pest': { priority: 'Low', lifeSafety: 2, infrastructure: 1, category: 'Health' },
    'public toilet dirty': { priority: 'Medium', lifeSafety: 4, infrastructure: 4, category: 'Health' },

    // 7. ENVIRONMENT & GARDEN
    'tree fell': { priority: 'High', lifeSafety: 6, infrastructure: 6, category: 'Garden' },
    'fallen tree': { priority: 'High', lifeSafety: 6, infrastructure: 6, category: 'Garden' },
    'branch falling': { priority: 'Medium', lifeSafety: 5, infrastructure: 4, category: 'Garden' },
    'tree trimming': { priority: 'Medium', lifeSafety: 3, infrastructure: 4, category: 'Garden' },
    'broken bench': { priority: 'Low', lifeSafety: 1, infrastructure: 2, category: 'Garden' },
    'noise pollution': { priority: 'Low', lifeSafety: 2, infrastructure: 1, category: 'Environment' },
    'air pollution': { priority: 'Medium', lifeSafety: 4, infrastructure: 2, category: 'Environment' },
    'bad smell': { priority: 'Low', lifeSafety: 2, infrastructure: 2, category: 'Environment' },
    'burning waste': { priority: 'High', lifeSafety: 5, infrastructure: 3, category: 'Environment' },

    // 8. LIGHTING & SAFETY
    'dark spot': { priority: 'High', lifeSafety: 6, infrastructure: 4, category: 'Lighting' },
    'street light not working': { priority: 'High', lifeSafety: 5, infrastructure: 4, category: 'Lighting' },
    'lights off': { priority: 'High', lifeSafety: 5, infrastructure: 4, category: 'Lighting' },
    'timer issue': { priority: 'Low', lifeSafety: 2, infrastructure: 3, category: 'Lighting' },
    'blinking light': { priority: 'Low', lifeSafety: 2, infrastructure: 3, category: 'Lighting' },

    // 9. GENERIC / OTHER
    'encroachment': { priority: 'Low', lifeSafety: 2, infrastructure: 4, category: 'Generic' },
    'hawkers': { priority: 'Low', lifeSafety: 1, infrastructure: 3, category: 'Generic' },
    'unauthorized construction': { priority: 'Medium', lifeSafety: 3, infrastructure: 6, category: 'Generic' },
    'hoarding': { priority: 'Low', lifeSafety: 1, infrastructure: 2, category: 'Generic' },
    'defacement': { priority: 'Low', lifeSafety: 0, infrastructure: 1, category: 'Generic' },
    'general inquiry': { priority: 'Low', lifeSafety: 0, infrastructure: 0, category: 'Generic' }
};

const generateExplanation = (priority, match, text) => {
    if (!match) return "Priority assigned based on general assessment of terms used.";

    let reason = `Flagged as ${priority} priority due to detection of '${match.keyword}'.`;

    if (match.lifeSafety >= 8) {
        reason += " This poses a severe threat to public safety.";
    } else if (match.lifeSafety >= 5) {
        reason += " This presents a potential safety hazard.";
    }

    if (match.infrastructure >= 8) {
        reason += " Critical infrastructure damage is likely.";
    }

    return reason;
};

const determinePriority = (text) => {
    if (!text) return { priority: 'Low', score: 0, details: null, explanation: "No details provided." };

    const lowerText = text.toLowerCase();
    let bestMatch = null;
    let highestScore = -1;

    // Multi-keyword matching logic could be added here for better precision
    for (const [keyword, data] of Object.entries(PRIORITY_RULES)) {
        if (lowerText.includes(keyword)) {
            // Weighted Score: Life Safety * 1.5 + Infrastructure
            const score = (data.lifeSafety * 1.5) + data.infrastructure;
            if (score > highestScore) {
                highestScore = score;
                bestMatch = { keyword, ...data };
            }
        }
    }

    if (bestMatch) {
        return {
            priority: bestMatch.priority,
            score: highestScore,
            details: bestMatch,
            confidence: 0.95,
            explanation: generateExplanation(bestMatch.priority, bestMatch, text)
        };
    }

    return {
        priority: 'Medium',
        score: 10,
        details: null,
        confidence: 0.5,
        explanation: "Assigned default priority. No specific keywords detected in the report."
    };
};

module.exports = { PRIORITY_RULES, determinePriority };
