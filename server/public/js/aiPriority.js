/**
 * Nagarsevak AI – 145-Signal Priority Engine (7D Framework v2.0)
 * Supports 11M+ unique priority combinations through dynamic evaluation
 * across 9 signal categories and 7 core dimensions.
 */

// ========================================
// CATEGORY 1: LIFE & SAFETY CRITICALITY (Max 50 pts)
// ========================================
const CAT_1_SAFETY = [
    { id: 1, name: 'Risk of human injury', points: 15, keywords: ['injury', 'hurt', 'wounded', 'bleeding'] },
    { id: 2, name: 'Risk of human death', points: 50, keywords: ['death', 'fatal', 'life-threatening', 'casualty'] },
    { id: 3, name: 'Children affected', points: 12, keywords: ['child', 'kids', 'student', 'school'] },
    { id: 4, name: 'Elderly affected', points: 10, keywords: ['elderly', 'senior', 'citizen', 'old'] },
    { id: 5, name: 'Hospital nearby', points: 15, keywords: ['hospital', 'clinic', 'medical'] }, // also loc
    { id: 6, name: 'School nearby', points: 20, keywords: ['school', 'college', 'university'] }, // also loc
    { id: 7, name: 'Fire hazard present', points: 45, keywords: ['fire', 'flames', 'smoke', 'burning'] },
    { id: 8, name: 'Electrical shock risk', points: 40, keywords: ['electric', 'shock', 'live wire', 'spark'] },
    { id: 9, name: 'Gas leakage risk', points: 45, keywords: ['gas', 'leakage', 'smell', 'fumes'] },
    { id: 10, name: 'Open manhole', points: 40, keywords: ['manhole', 'open drain', 'uncovered'] },
    { id: 11, name: 'Road collapse', points: 45, keywords: ['collapse', 'cave-in', 'sinkhole'] },
    { id: 12, name: 'Flooding residential', points: 35, keywords: ['flood', 'waterlogging', 'submerged'] },
    { id: 13, name: 'Structural instability', points: 40, keywords: ['unstable', 'cracking', 'tilting', 'unsafe'] },
    { id: 14, name: 'Emergency obstruction', points: 30, keywords: ['ambulance', 'blocked', 'fire truck'] },
    { id: 15, name: 'Pedestrian risk', points: 25, keywords: ['pedestrian', 'footpath', 'walking'] },
    { id: 16, name: 'Public panic', points: 20, keywords: ['panic', 'stampede', 'crowd', 'chaos'] },
    { id: 17, name: 'Toxic exposure', points: 45, keywords: ['toxic', 'chemical', 'poison', 'hazardous'] },
    { id: 18, name: 'Poor night visibility', points: 15, keywords: ['dark', 'no light', 'pitch black', 'blind'] },
    { id: 19, name: 'Accident-prone', points: 18, keywords: ['accident', 'crash', 'collision'] },
    { id: 20, name: 'Weather escalation', points: 12, keywords: ['storm', 'rain', 'wind', 'exposure'] }
];

// ========================================
// CATEGORY 2: SECTOR CRITICALITY (Max 40 pts)
// ========================================
const CAT_2_SECTOR = [
    { id: 21, name: 'Water disruption', points: 35, keywords: ['no water', 'supply stopped', 'dry tap'] },
    { id: 22, name: 'Pipeline damage', points: 35, keywords: ['pipeline', 'main line', 'burst pipe'] },
    { id: 23, name: 'Sewer overflow', points: 30, keywords: ['sewage', 'overflow', 'backflow'] },
    { id: 24, name: 'Drainage blockage', points: 25, keywords: ['blocked drain', 'clogged', 'stagnant'] },
    { id: 25, name: 'Power outage', points: 30, keywords: ['no power', 'blackout', 'electricity gone'] },
    { id: 26, name: 'Streetlight failure', points: 20, keywords: ['streetlight', 'dark street'] },
    { id: 27, name: 'Traffic signal fail', points: 35, keywords: ['traffic signal', 'signal broken'] },
    { id: 28, name: 'Road cave-in', points: 45, keywords: ['road caved', 'deep hole'] },
    { id: 29, name: 'Bridge damage', points: 50, keywords: ['bridge', 'flyover', 'pillar'] },
    { id: 30, name: 'Transport disruption', points: 25, keywords: ['bus stop', 'metro', 'transport'] },
    { id: 31, name: 'Garbage overflow', points: 20, keywords: ['garbage', 'trash', 'dustbin'] },
    { id: 32, name: 'Water contamination', points: 40, keywords: ['dirty water', 'muddy', 'smelly water'] },
    { id: 33, name: 'Pump failure', points: 35, keywords: ['pump', 'motor', 'station'] },
    { id: 34, name: 'Treatment plant', points: 40, keywords: ['treatment plant', 'stp', 'wtp'] },
    { id: 35, name: 'Underground infra', points: 35, keywords: ['underground', 'cable', 'fiber'] },
    { id: 36, name: 'Govt building', points: 25, keywords: ['office', 'court', 'building'] },
    { id: 37, name: 'Emergency infra', points: 40, keywords: ['fire station', 'police', 'hospital'] },
    { id: 38, name: 'Sensor failure', points: 15, keywords: ['sensor', 'iot', 'device'] },
    { id: 39, name: 'Telecom outage', points: 30, keywords: ['internet', 'network', 'phone'] },
    { id: 40, name: 'Multi-sector', points: 20, keywords: ['multiple', 'widespread'] }
];

// ========================================
// CATEGORY 3: TIME & SLA FACTORS (Max 25 pts)
// ========================================
const CAT_3_TIME = [
    { id: 41, name: 'Age > 2h', points: 5, check: (age) => age > 2 },
    { id: 42, name: 'Age > 6h', points: 10, check: (age) => age > 6 },
    { id: 43, name: 'Age > 24h', points: 15, check: (age) => age > 24 },
    { id: 44, name: 'SLA 50%', points: 8, keywords: ['urgent'] },
    { id: 45, name: 'SLA breached', points: 25, keywords: ['breached', 'overdue', 'late'] },
    { id: 46, name: 'Repeated delays', points: 12, keywords: ['delayed', 'ignoring'] },
    { id: 47, name: 'Overnight', points: 10, keywords: ['night', 'yesterday'] },
    { id: 48, name: 'Peak hour', points: 8, keywords: ['morning', 'evening', 'rush'] },
    { id: 49, name: 'Festival season', points: 15, keywords: ['festival', 'holiday', 'event'] },
    { id: 50, name: 'Monsoon season', points: 12, keywords: ['monsoon', 'rainy', 'wet'] },
    { id: 51, name: 'Night unresolved', points: 8, keywords: ['dark', 'night'] },
    { id: 52, name: 'Weekend backlog', points: 10, keywords: ['weekend', 'sunday', 'saturday'] },
    { id: 53, name: 'Emergency decl', points: 20, keywords: ['emergency declared'] },
    { id: 54, name: 'Escalation ignored', points: 18, keywords: ['ignored', 'no response'] },
    { id: 55, name: 'Temp fix failed', points: 15, keywords: ['temporary', 'recurred', 'again'] }
];

// ========================================
// CATEGORY 4: LOCATION & IMPACT (Max 20 pts)
// ========================================
const CAT_4_LOCATION = [
    { id: 56, name: 'High density', points: 15, keywords: ['crowded', 'dense', 'population'] },
    { id: 57, name: 'Commercial zone', points: 12, keywords: ['market', 'shop', 'business'] },
    { id: 58, name: 'Industrial zone', points: 10, keywords: ['factory', 'industry', 'midc'] },
    { id: 59, name: 'Residential', points: 10, keywords: ['colony', 'housing', 'society', 'apartment'] },
    { id: 60, name: 'Slum/Vulnerable', points: 18, keywords: ['slum', 'hutment', 'chawl'] },
    { id: 61, name: 'Market area', points: 14, keywords: ['bazaar', 'mandi'] },
    { id: 62, name: 'Tourist spot', points: 12, keywords: ['tourist', 'park', 'garden'] },
    { id: 63, name: 'Arterial road', points: 16, keywords: ['highway', 'main road', 'expressway'] },
    { id: 64, name: 'Major junction', points: 15, keywords: ['junction', 'chowk', 'crossing'] },
    { id: 65, name: 'Water body', points: 10, keywords: ['river', 'lake', 'canal'] },
    { id: 66, name: 'Metro zone', points: 14, keywords: ['metro', 'station'] },
    { id: 67, name: 'Construction', points: 8, keywords: ['construction', 'site'] },
    { id: 68, name: 'Accident spot', points: 16, keywords: ['blackspot'] },
    { id: 69, name: 'Political zone', points: 12, keywords: ['vip', 'bungalow'] },
    { id: 70, name: 'Heritage area', points: 14, keywords: ['heritage', 'fort'] },
    { id: 71, name: 'Smart city', points: 10, keywords: ['smart city', 'abd'] },
    { id: 72, name: 'Flood prone', points: 18, keywords: ['low lying', 'flood'] },
    { id: 73, name: 'Low income', points: 15, keywords: ['ews', 'poor'] },
    { id: 74, name: 'Evacuation', points: 20, keywords: ['route'] },
    { id: 75, name: 'Entry/Exit', points: 14, keywords: ['entry', 'checkpost'] }
];

// ========================================
// CATEGORY 5: CITIZEN SIGNALS (Max 20 pts)
// ========================================
const CAT_5_CITIZEN = [
    { id: 76, name: 'High complaints', points: 15, keywords: ['many', 'everyone'] },
    { id: 77, name: 'Rapid increase', points: 18, keywords: ['sudden', 'spike'] },
    { id: 78, name: 'Multiple locs', points: 12, keywords: ['everywhere', 'all over'] },
    { id: 79, name: 'Multiple reports', points: 12, keywords: ['repeated', 'again'] },
    { id: 80, name: 'Verified user', points: 10, keywords: ['verified'] },
    { id: 81, name: 'Image evidence', points: 8, check: (i) => i.imageUrl || i.photos?.length > 0 },
    { id: 82, name: 'Video evidence', points: 10, keywords: ['video'] },
    { id: 83, name: 'Trusted reporter', points: 12, keywords: ['trusted'] },
    { id: 84, name: 'Social media', points: 15, keywords: ['twitter', 'viral'] },
    { id: 85, name: 'Dissatisfaction', points: 10, keywords: ['angry', 'useless'] },
    { id: 86, name: 'Marked urgent', points: 12, keywords: ['urgent', 'emergency'] },
    { id: 87, name: 'Repeat escalation', points: 10, keywords: ['escalated'] },
    { id: 88, name: 'RWA/Society', points: 14, keywords: ['society', 'chairman'] },
    { id: 89, name: 'NGO report', points: 12, keywords: ['ngo', 'activist'] },
    { id: 90, name: 'Media coverage', points: 20, keywords: ['reporter', 'news', 'paper'] }
];

// ========================================
// CATEGORY 6: AI / SYSTEM SIGNALS (Max 15 pts)
// ========================================
const CAT_6_SYSTEM = [
    { id: 91, name: 'Pattern match', points: 12, keywords: ['pattern'] },
    { id: 92, name: 'Predictive fail', points: 15, keywords: ['predict', 'warning'] },
    { id: 93, name: 'Weather forecast', points: 10, keywords: ['forecast', 'alert'] },
    { id: 94, name: 'Load spike', points: 12, keywords: ['load', 'surge'] },
    { id: 95, name: 'Sensor anomaly', points: 14, keywords: ['sensor', 'threshold'] },
    { id: 96, name: 'Sensor+Citizen', points: 15, keywords: ['confirmed'] },
    { id: 97, name: 'Similar nearby', points: 10, keywords: ['nearby'] },
    { id: 98, name: 'Chain reaction', points: 18, keywords: ['cascade', 'risk'] },
    { id: 99, name: 'Resource low', points: 8, keywords: ['shortage'] },
    { id: 100, name: 'Maint overdue', points: 10, keywords: ['overdue', 'maintenance'] },
    { id: 101, name: 'Temp repair', points: 8, keywords: ['temporary'] },
    { id: 102, name: 'Asset age', points: 6, keywords: ['old'] },
    { id: 103, name: 'Poor history', points: 10, keywords: ['recurrence'] },
    { id: 104, name: 'High confidence', points: 5, keywords: ['90%', 'sure'] },
    { id: 105, name: 'Trend increasing', points: 12, keywords: ['worsening'] }
];

// ========================================
// CATEGORY 7: RESOURCE & OPS (-5 to +10)
// ========================================
const CAT_7_RESOURCE = [
    { id: 106, name: 'Team unavailable', points: 10, keywords: ['unavailable', 'busy'] },
    { id: 107, name: 'Special equip', points: 8, keywords: ['crane', 'excavator', 'jetting'] },
    { id: 108, name: 'Spare parts', points: 6, keywords: ['parts', 'material'] },
    { id: 109, name: 'Contractor', points: 5, keywords: ['contractor', 'agency'] },
    { id: 110, name: 'Long duration', points: 8, keywords: ['days', 'long time'] },
    { id: 111, name: 'High cost', points: 6, keywords: ['expensive', 'budget'] },
    { id: 112, name: 'Multiple teams', points: 10, keywords: ['teams', 'dept'] },
    { id: 113, name: 'Traffic divert', points: 8, keywords: ['diversion', 'traffic'] },
    { id: 114, name: 'Power shutdown', points: 6, keywords: ['shutdown'] },
    { id: 115, name: 'Water shutdown', points: 6, keywords: ['supply cut'] },
    { id: 116, name: 'Legal permit', points: 10, keywords: ['permission', 'noc'] },
    { id: 117, name: 'Inter-dept', points: 8, keywords: ['joint', 'coordination'] },
    { id: 118, name: 'Night work', points: 5, keywords: ['night'] },
    { id: 119, name: 'Safety clear', points: 8, keywords: ['safety', 'clearance'] },
    { id: 120, name: 'Workaround', points: -5, keywords: ['bypass', 'alternate'] }
];

// ========================================
// CATEGORY 8: DE-PRIORITIZATION (-40 to 0)
// ========================================
const CAT_8_DEPRIOR = [
    { id: 121, name: 'Cosmetic only', points: -15, keywords: ['paint', 'ugly', 'faded', 'look'] },
    { id: 122, name: 'No safety impact', points: -10, keywords: ['safe', 'slight'] },
    { id: 123, name: 'Low usage', points: -12, keywords: ['corner', 'unused'] },
    { id: 124, name: 'Temporary issue', points: -8, keywords: ['temporary'] },
    { id: 125, name: 'Scheduled', points: -20, keywords: ['scheduled', 'planned'] },
    { id: 126, name: 'Duplicate', points: -25, keywords: ['duplicate', 'copy'] },
    { id: 127, name: 'Non-critical', points: -10, keywords: ['minor'] },
    { id: 128, name: 'Private property', points: -30, keywords: ['private', 'inside'] },
    { id: 129, name: 'User error', points: -20, keywords: ['mistake'] },
    { id: 130, name: 'False alarm', points: -35, keywords: ['fake', 'false'] },
    { id: 131, name: 'Auto-resolved', points: -40, keywords: ['resolved', 'fixed'] },
    { id: 132, name: 'Withdrawn', points: -40, keywords: ['cancel'] },
    { id: 133, name: 'Low recurrence', points: -8, keywords: ['rare'] },
    { id: 134, name: 'Off-peak', points: -6, keywords: ['off'] },
    { id: 135, name: 'Minimal visibility', points: -10, keywords: ['hidden'] }
];

// ========================================
// CATEGORY 9: GOVERNANCE & LEGAL (+10 to +30)
// ========================================
const CAT_9_GOVERNANCE = [
    { id: 136, name: 'Legal risk', points: 25, keywords: ['legal', 'court'] },
    { id: 137, name: 'Court order', points: 30, keywords: ['order', 'judge', 'stay'] },
    { id: 138, name: 'Audit issue', points: 20, keywords: ['audit', 'cag'] },
    { id: 139, name: 'Budget cycle', points: 15, keywords: ['march', 'lapse'] },
    { id: 140, name: 'Election code', points: 10, keywords: ['election', 'code'] },
    { id: 141, name: 'RTI', points: 18, keywords: ['rti'] },
    { id: 142, name: 'Objection', points: 20, keywords: ['objection'] },
    { id: 143, name: 'Ministerial', points: 28, keywords: ['minister', 'mla', 'mp'] },
    { id: 144, name: 'Commissioner', points: 25, keywords: ['commissioner', 'order'] },
    { id: 145, name: 'Emergency proto', points: 30, keywords: ['disaster', 'act'] }
];

const SEVEN_DIMENSIONS = {
    // Defines weights for base sector priority
    SECTORS: {
        'water': 1.0, 'drainage': 0.9, 'bridges': 1.0, 'roads': 0.85,
        'street': 0.6, 'waste': 0.7, 'health': 1.0, 'education': 0.9
    },
    // Defines severity multipliers
    SEVERITY: {
        'life threatening': 2.0, 'critical': 1.8, 'high': 1.4,
        'medium': 1.0, 'low': 0.6
    }
};

/**
 * Main Priority Calculation Function
 * Integrates 145 signals into 7D framework
 */
const calculatePriorityScore = (issue, sensors = []) => {
    const text = (issue.description + ' ' + (issue.title || '') + ' ' + (issue.type || '') + ' ' + (issue.sector || '')).toLowerCase();
    const issueAge = issue.createdAt ? (Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60) : 1;

    // Breakdown accumulator
    let factors = [];
    let explanations = [];

    // --- STEP 1: SIGNAL DETECTION ---

    const countCategory = (category, maxPoints = 1000, mixPoints = -1000) => {
        let total = 0;
        category.forEach(signal => {
            let matched = false;
            if (signal.check) {
                if (signal.check(issueAge || issue)) matched = true;
            } else if (signal.keywords) {
                if (signal.keywords.some(k => text.includes(k))) matched = true;
            }

            if (matched) {
                total += signal.points;
                factors.push({ name: `[${signal.id}] ${signal.name}`, value: signal.points, type: 'signal' });
                // Add unique explanation
                if (!explanations.includes(signal.name)) explanations.push(signal.name);
            }
        });
        // Cap the points
        return Math.max(mixPoints, Math.min(total, maxPoints));
    };

    // Calculate Category Scores
    const catScores = {
        safety: countCategory(CAT_1_SAFETY, 50),
        sector: countCategory(CAT_2_SECTOR, 40),
        time: countCategory(CAT_3_TIME, 25),
        location: countCategory(CAT_4_LOCATION, 20),
        citizen: countCategory(CAT_5_CITIZEN, 20),
        system: countCategory(CAT_6_SYSTEM, 15),
        resource: countCategory(CAT_7_RESOURCE, 10, -5),
        deprior: countCategory(CAT_8_DEPRIOR, 0, -40),
        gov: countCategory(CAT_9_GOVERNANCE, 30, 0)
    };

    // --- STEP 2: RAW SCORE AGGREGATION ---
    // Start with Event Score base from 7D framework (simplified here to 20 base)
    let rawScore = 15;

    // Add all category scores
    Object.values(catScores).forEach(s => rawScore += s);

    // --- STEP 3: 7D FRAMEWORK MULTIPLIERS ---

    // Sector Weight
    let sectorWeight = 0.8;
    for (const [key, w] of Object.entries(SEVEN_DIMENSIONS.SECTORS)) {
        if (text.includes(key)) sectorWeight = w;
    }

    // Severity Multiplier
    let severityMult = SEVEN_DIMENSIONS.SEVERITY[issue.severity] || 1.0;
    // Auto-escalate if safety score is high
    if (catScores.safety > 20) severityMult = Math.max(severityMult, 1.8);

    // Confidence Multiplier (from signals and fraud check)
    let confidenceMult = 1.0;
    const fraudFlags = CAT_8_DEPRIOR.filter(s => s.id >= 129 && text.includes(s.keywords[0])); // Simple check
    if (fraudFlags.length > 0) confidenceMult = 0.5;

    // --- STEP 4: FINAL CALCULATION ---
    let finalScore = rawScore * sectorWeight * severityMult * confidenceMult;

    // Boundaries
    finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));

    // --- RISK LEVEL & ESCALATION ---
    let riskLevel = 'Operational';
    let color = '#10B981';
    let escalationTarget = 'Sector Officer';

    if (finalScore >= 85) {
        riskLevel = 'Crisis';
        color = '#EF4444';
        escalationTarget = 'Municipal Commissioner';
    } else if (finalScore >= 60) {
        riskLevel = 'Critical';
        color = '#F97316';
        escalationTarget = 'Zonal Head';
    } else if (finalScore >= 40) {
        riskLevel = 'Moderate';
        color = '#EAB308';
    }

    // Advanced Analysis Object
    const analysis = {
        riskLevel,
        explanation: explanations.slice(0, 3).join(', ') + '.',
        confidence: confidenceMult,
        escalation: escalationTarget,
        dimensions: {
            sector: catScores.sector > 20 ? "Critical" : "Standard",
            event: catScores.safety > 15 ? "High Risk" : "Routine",
            severity: issue.severity || "medium",
            impactScore: catScores.safety + catScores.system + catScores.citizen,
            timeBoost: catScores.time,
            locationBoost: catScores.location // Simplified mapping for UI compatibility
        },
        signals: catScores // Full breakdwon
    };

    return {
        score: finalScore,
        label: riskLevel,
        color,
        breakdown: factors,
        advancedAnalysis: analysis
    };
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculatePriorityScore, CAT_1_SAFETY, CAT_2_SECTOR };
}
