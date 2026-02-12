/**
 * Nagarsevak AI – AI Priority Calculation Engine
 * Port of advanced decision engine from React version
 */

// --- ADVANCED RISK & IMPACT LAYER (Categories 10-20) ---
const ADVANCED_RISK_RULES = [
    // CATEGORY 10: ENVIRONMENTAL & ECOLOGICAL IMPACT
    {
        id: 'CAT_10',
        name: 'Environmental & Ecological Impact',
        keywords: [
            'groundwater', 'contamination', 'river', 'lake', 'pollution', 'soil', 'wildlife', 'tree', 'air pollution',
            'chemical', 'spill', 'oil', 'fuel', 'fish death', 'sewage', 'wetland', 'ecological', 'protected zone',
            'ecosystem', 'climate'
        ],
        score: 30,
        escalation: 'Pollution Control Board',
        impact: 'Ecological Crisis'
    },

    // CATEGORY 11: FINANCIAL & ECONOMIC IMPACT
    {
        id: 'CAT_11',
        name: 'Financial & Economic Impact',
        keywords: [
            'lakh', 'loss', 'shutdown', 'market', 'supply chain', 'tourism', 'industrial', 'insurance', 'liability',
            'compensation', 'litigation', 'budget', 'overrun', 'write-off', 'penalty', 'investor', 'corruption', 'fund'
        ],
        score: 25,
        escalation: 'Finance Dept',
        impact: 'Economic Risk'
    },

    // CATEGORY 12: REPUTATION & PUBLIC TRUST
    {
        id: 'CAT_12',
        name: 'Reputation & Public Trust',
        keywords: [
            'viral', 'influencer', 'opposition', 'political', 'trust', 'failure', 'apology', 'protest',
            'media', 'press', 'sentiment', 'kpi', 'scandal', 'trending'
        ],
        score: 20,
        escalation: 'Public Relations / Commissioner',
        impact: 'Reputational Risk'
    },

    // CATEGORY 13: FRAUD, MISUSE & DATA INTEGRITY
    {
        id: 'CAT_13',
        name: 'Fraud & Data Integrity',
        keywords: [
            'fake image', 'duplicate', 'bot', 'spam', 'insider', 'manipulation', 'conflict of interest',
            'spoof', 'timestamp', 'inconsistent', 'motive', 'suspicious'
        ],
        score: 0,
        action: 'downgrade_confidence',
        impact: 'Data Integrity Flag'
    },

    // CATEGORY 14: CASCADING FAILURE & SYSTEMIC RISK
    {
        id: 'CAT_14',
        name: 'Cascading Failure & Systemic Risk',
        keywords: [
            'chain reaction', 'multi-department', 'transport', 'power', 'water', 'healthcare', 'hospital',
            'fire', 'interlock', 'drain', 'road collapse', 'flood', 'mixing', 'smart city', 'network', 'destabilization', 'disaster'
        ],
        score: 35,
        escalation: 'Disaster Management Cell',
        impact: 'Systemic Failure Risk'
    },

    // CATEGORY 15: TEMPORAL SEVERITY DYNAMICS
    {
        id: 'CAT_15',
        name: 'Temporal Severity Dynamics',
        keywords: [
            'growth rate', 'doubling', 'irreversible', 'window closing', 'exponential', 'safety margin',
            'buffer exhausted', 'deadline', 'urgent', 'spreading'
        ],
        score: 20,
        escalation: 'Rapid Response Team',
        impact: 'Time-Critical'
    },

    // CATEGORY 16: SOCIAL EQUITY & HUMAN IMPACT
    {
        id: 'CAT_16',
        name: 'Social Equity & Human Impact',
        keywords: [
            'marginalized', 'disability', 'access', 'women', 'child', 'daily wage', 'shelter', 'homeless',
            'food', 'vulnerable', 'slum', 'low-income'
        ],
        score: 25,
        escalation: 'Social Welfare Dept',
        impact: 'Human Rights/Equity'
    },

    // CATEGORY 17: INFRASTRUCTURE CRITICALITY
    {
        id: 'CAT_17',
        name: 'Infrastructure Criticality',
        keywords: [
            'tier-1', 'redundancy', 'maintenance', 'failure probability', 'capacity', 'construction',
            'vendor', 'blacklisted', 'collapse history', 'critical asset', 'main line'
        ],
        score: 25,
        escalation: 'Chief Engineer',
        impact: 'Critical Infrastructure'
    },

    // CATEGORY 18: AI CONFIDENCE MODIFIERS
    {
        id: 'CAT_18',
        name: 'AI Confidence Factors',
        keywords: ['conflicting', 'clarity', 'unclear', 'noise', 'uncertainty', 'override', 'manual verification'],
        score: 0,
        action: 'flag_uncertainty',
        impact: 'Low Confidence'
    },

    // CATEGORY 19: CROSS-JURISDICTION DEPENDENCIES
    {
        id: 'CAT_19',
        name: 'Cross-Jurisdiction Dependencies',
        keywords: [
            'state agency', 'central', 'railway', 'airport', 'defense', 'army', 'navy', 'national highway', 'nhai'
        ],
        score: 15,
        escalation: 'External Liaison Officer',
        impact: 'Jurisdictional Issue'
    },

    // CATEGORY 20: POST-RESOLUTION RISK
    {
        id: 'CAT_20',
        name: 'Post-Resolution Risk',
        keywords: ['recurrence', 'unresolved', 'root cause', 'patch', 'temporary', 'follow-up', 'audit'],
        score: 10,
        escalation: 'Audit & Vigilance',
        impact: 'Chronic/Recurrent'
    }
];

// --- CORE PRIORITY LOGIC ---
const calculatePriorityScore = (issue, sensors = []) => {
    let score = 0;
    const factors = [];
    let explanations = [];
    let escalationTarget = null;
    let confidenceModifier = 0;

    // 1. BASE SEVERITY (Categories 1-4 Simplified)
    const severityMap = { 'high': 30, 'medium': 20, 'low': 10, 'critical': 40 };
    let baseScore = severityMap[issue.severity?.toLowerCase()] || 10;

    // Auto-detect Category 1 (Life Safety) keywords to boost base
    const lifeSafetyKeywords = ['death', 'injury', 'blood', 'electrocution', 'fire', 'explosion', 'collapse', 'drowning'];
    const text = (issue.description + ' ' + (issue.title || '') + ' ' + (issue.type || '')).toLowerCase();

    if (lifeSafetyKeywords.some(k => text.includes(k))) {
        baseScore = 50; // Immediate Crisis
        explanations.push("Detected immediate risk to life/safety.");
        escalationTarget = 'Disaster Management';
    }

    score += baseScore;
    factors.push({ name: 'Base Severity', value: baseScore, type: 'base' });

    // 2. ADVANCED RISK LAYER (Categories 10-20)
    ADVANCED_RISK_RULES.forEach(rule => {
        if (rule.keywords.some(k => text.includes(k))) {

            // SPECIAL ACTIONS
            if (rule.action === 'downgrade_confidence') {
                confidenceModifier -= 0.4;
                factors.push({ name: rule.name, value: -99, type: 'warning' }); // Visual flag only
                explanations.push(`Possible ${rule.name.toLowerCase()} suspected.`);
            }
            else if (rule.action === 'flag_uncertainty') {
                confidenceModifier -= 0.2;
                explanations.push(`Data uncertainty detected (${rule.name}).`);
            }
            else {
                // NORMAL SCORING RULES
                score += rule.score;
                factors.push({ name: rule.name, value: rule.score, type: 'risk' });
                explanations.push(`${rule.impact} detected.`);

                // Escalation updates
                if (rule.escalation) {
                    if (!escalationTarget || rule.score > 20) {
                        escalationTarget = rule.escalation;
                    }
                }
            }
        }
    });

    // 3. IOT SENSOR CONFIRMATION (Category 6)
    const nearbyCriticalSensors = sensors.filter(s => s.status === 'critical' || s.status === 'warning');
    if (nearbyCriticalSensors.length > 0) {
        const sensorScore = 20;
        score += sensorScore;
        factors.push({ name: 'IoT Sensor Confirmation', value: sensorScore, type: 'sensor' });
        explanations.push("Verified by nearby critical sensor alerts.");
    }

    // 4. AI CONFIDENCE & FRAUD HANDLING
    let aiConfidence = issue.aiAnalysis?.confidence || 0.8;

    // Apply Modifiers from Cat 13/18
    aiConfidence = Math.max(0, Math.min(1, aiConfidence + confidenceModifier));

    // Handle Fake/Fraud Logic
    if ((issue.aiAnalysis && !issue.aiAnalysis.isReal) || aiConfidence < 0.4) {
        score = 0;
        explanations = ["Flagged as AI-generated, Fake, or Low Confidence. Priority dropped to zero."];
        factors.push({ name: 'Fraud/Confidence Failure', value: -100, type: 'penalty' });
        escalationTarget = 'Vigilance Cell';
    } else if (aiConfidence > 0.9) {
        score += 5;
        factors.push({ name: 'High Confidence Bonus', value: 5, type: 'ai' });
    }

    // 5. NORMALIZE & OUTPUT
    score = Math.max(0, Math.min(100, score));

    // Determine Risk Level
    let riskLevel = 'Operational';
    let color = '#10B981'; // Green
    if (score >= 85) {
        riskLevel = 'Crisis';
        color = '#EF4444'; // Red
        if (!escalationTarget) escalationTarget = 'Municipal Commissioner';
    } else if (score >= 60) {
        riskLevel = 'Critical';
        color = '#F97316'; // Orange
        if (!escalationTarget) escalationTarget = 'Zonal Head';
    } else if (score >= 40) {
        riskLevel = 'Moderate';
        color = '#EAB308'; // Amber
    }

    // Final Explanation Construction
    let finalExplanation = "Standard maintenance request.";
    if (explanations.length > 0) {
        const uniqueExpl = [...new Set(explanations)];
        if (score >= 60) {
            finalExplanation = `Priority escalated: ${uniqueExpl.slice(0, 2).join(' + ')}.`;
        } else {
            finalExplanation = uniqueExpl.join(' ');
        }
    }

    return {
        score,
        label: riskLevel,
        color,
        breakdown: factors,
        advancedAnalysis: {
            riskLevel,
            explanation: finalExplanation,
            confidence: parseFloat(aiConfidence.toFixed(2)),
            escalation: escalationTarget || 'Sector Officer'
        }
    };
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculatePriorityScore };
}
