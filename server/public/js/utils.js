// AI Logic Engine for NagarSevak AI
// Extracted from prototype

const AI_Engine = {
    // DYNAMIC FRAMEWORK DEFINITIONS
    FRAMEWORK: {
        SECTORS: [
            { id: 'S1', label: 'Water Supply', weight: 15, keywords: ['water', 'pipe', 'leak', 'supply', 'drinking', 'aqueduct', 'valve'] },
            { id: 'S2', label: 'Sewerage', weight: 13, keywords: ['sewer', 'sewage', 'clog', 'sanitation', 'manhole', 'sludge'] },
            { id: 'S3', label: 'Drainage', weight: 13, keywords: ['drain', 'gutter', 'nallah', 'stormwater', 'runoff'] },
            { id: 'S4', label: 'Roads', weight: 11, keywords: ['road', 'pothole', 'street', 'highway', 'pavement', 'tarmac', 'asphalt'] },
            { id: 'S5', label: 'Bridges', weight: 15, keywords: ['bridge', 'flyover', 'overpass', 'viaduct'] },
            { id: 'S6', label: 'Street Lighting', weight: 8, keywords: ['light', 'lamp', 'pole', 'dark', 'led', 'street light'] },
            { id: 'S7', label: 'Electricity', weight: 13, keywords: ['electric', 'power', 'voltage', 'current', 'wire', 'cable', 'transformer'] },
            { id: 'S8', label: 'Gas Lines', weight: 15, keywords: ['gas', 'pipeline', 'fume', 'leak', 'png', 'lpg'] },
            { id: 'S9', label: 'Solid Waste', weight: 8, keywords: ['garbage', 'trash', 'waste', 'dump', 'bin', 'refuse', 'rubbish'] },
            { id: 'S10', label: 'Public Toilets', weight: 8, keywords: ['toilet', 'urinal', 'restroom', 'latrine', 'wc'] },
            { id: 'S11', label: 'Traffic Signals', weight: 11, keywords: ['signal', 'traffic light', 'stop light'] },
            { id: 'S12', label: 'Public Transport', weight: 11, keywords: ['bus', 'metro', 'stop', 'station', 'transit'] },
            { id: 'S13', label: 'Storm Water', weight: 13, keywords: ['storm', 'flood', 'waterlogging'] },
            { id: 'S14', label: 'Parks & Gardens', weight: 5, keywords: ['park', 'garden', 'tree', 'greenery', 'playground'] },
            { id: 'S15', label: 'Government Buildings', weight: 11, keywords: ['government', 'office', 'court', 'municipal', 'ward office'] },
            { id: 'S16', label: 'Hospitals', weight: 13, keywords: ['hospital', 'clinic', 'medical', 'dispensary'] },
            { id: 'S17', label: 'Schools', weight: 13, keywords: ['school', 'college', 'university', 'student'] },
            { id: 'S18', label: 'Markets', weight: 11, keywords: ['market', 'bazaar', 'shop', 'vendor'] },
            { id: 'S19', label: 'Smart City Sensors', weight: 5, keywords: ['sensor', 'iot', 'smart', 'device', 'camera'] },
            { id: 'S20', label: 'Emergency Infrastructure', weight: 15, keywords: ['fire station', 'police', 'ambulance', 'bunker', 'shelter'] }
        ],
        EVENT_TYPES: [
            { id: 'E1', label: 'Complete failure', weight: 15, keywords: ['failure', 'stopped', 'not working', 'broken', 'dead', 'outage'] },
            { id: 'E2', label: 'Partial failure', weight: 7, keywords: ['partial', 'slow', 'dim', 'low pressure', 'intermittent'] },
            { id: 'E3', label: 'Leakage', weight: 10, keywords: ['leak', 'dripping', 'seeping', 'burst'] },
            { id: 'E4', label: 'Overflow', weight: 12, keywords: ['overflow', 'spilling', 'full', 'gushing'] },
            { id: 'E5', label: 'Blockage', weight: 10, keywords: ['blocked', 'clogged', 'jammed', 'choke', 'obstructed'] },
            { id: 'E6', label: 'Structural crack', weight: 9, keywords: ['crack', 'fissure', 'broken', 'damage', 'chip'] },
            { id: 'E7', label: 'Collapse', weight: 15, keywords: ['collapse', 'fall', 'caved', 'crumbled'] },
            { id: 'E8', label: 'Short circuit', weight: 11, keywords: ['short circuit', 'spark', 'electric fault', 'blaze'] },
            { id: 'E9', label: 'Fire incident', weight: 15, keywords: ['fire', 'burn', 'flame', 'smoke', 'ignite'] },
            { id: 'E10', label: 'Explosion risk', weight: 15, keywords: ['explosion', 'blast', 'bomb'] },
            { id: 'E11', label: 'Contamination', weight: 14, keywords: ['contamination', 'dirty', 'polluted', 'toxic', 'poison'] },
            { id: 'E12', label: 'Sensor anomaly', weight: 3, keywords: ['anomaly', 'reading', 'abnormal', 'glitch'] },
            { id: 'E13', label: 'Unauthorized access', weight: 5, keywords: ['unauthorized', 'trespass', 'break-in', 'intruder'] },
            { id: 'E14', label: 'Wear and tear', weight: 4, keywords: ['wear', 'tear', 'old', 'rusted', 'faded'] },
            { id: 'E15', label: 'Overload', weight: 6, keywords: ['overload', 'capacity', 'strain'] },
            { id: 'E16', label: 'Pressure drop', weight: 6, keywords: ['pressure', 'low flow'] },
            { id: 'E17', label: 'Voltage fluctuation', weight: 6, keywords: ['voltage', 'fluctuation', 'surge'] },
            { id: 'E18', label: 'Communication loss', weight: 5, keywords: ['offline', 'disconnect', 'no signal'] },
            { id: 'E19', label: 'Mechanical jam', weight: 6, keywords: ['jam', 'stuck', 'frozen'] },
            { id: 'E20', label: 'Corrosion', weight: 5, keywords: ['corrosion', 'rust', 'decay'] },
            { id: 'E21', label: 'Aging asset', weight: 4, keywords: ['aging', 'expired', 'obsolete'] },
            { id: 'E22', label: 'Vandalism', weight: 6, keywords: ['vandalism', 'stolen', 'theft', 'graffiti', 'broken glass'] },
            { id: 'E23', label: 'Weather damage', weight: 11, keywords: ['weather', 'rain', 'storm', 'wind', 'hail'] },
            { id: 'E24', label: 'Construction damage', weight: 8, keywords: ['construction', 'digging', 'excavation'] },
            { id: 'E25', label: 'Unknown anomaly', weight: 3, keywords: ['unknown', 'strange', 'weird', 'unidentified'] }
        ],
        SEVERITY_LEVELS: [
            { id: 'V1', label: 'Informational', weight: 1 },
            { id: 'V2', label: 'Very Low', weight: 2 },
            { id: 'V3', label: 'Low', weight: 3 },
            { id: 'V4', label: 'Moderate', weight: 5 },
            { id: 'V5', label: 'Medium', weight: 7 },
            { id: 'V6', label: 'Medium-High', weight: 9 },
            { id: 'V7', label: 'High', weight: 11 },
            { id: 'V8', label: 'Very High', weight: 13 },
            { id: 'V9', label: 'Critical', weight: 14 },
            { id: 'V10', label: 'Life Threatening', weight: 15 }
        ],
        LOCATIONS: [
            { id: 'L1', label: 'High population residential', weight: 9, keywords: ['residential', 'apartment', 'housing', 'colony', 'tower'] },
            { id: 'L2', label: 'Low population residential', weight: 3, keywords: ['suburb', 'remote', 'village'] },
            { id: 'L3', label: 'Slum / vulnerable area', weight: 10, keywords: ['slum', 'chawl', 'basti', 'shanty'] },
            { id: 'L4', label: 'Commercial district', weight: 6, keywords: ['commercial', 'office', 'business', 'corporate'] },
            { id: 'L5', label: 'Industrial zone', weight: 7, keywords: ['industrial', 'factory', 'midc', 'plant'] },
            { id: 'L6', label: 'Market area', weight: 8, keywords: ['market', 'bazaar', 'shopping', 'store'] },
            { id: 'L7', label: 'Tourist zone', weight: 5, keywords: ['tourist', 'hotel', 'resort', 'monument'] },
            { id: 'L8', label: 'School zone', weight: 9, keywords: ['school', 'college', 'campus'] },
            { id: 'L9', label: 'Hospital zone', weight: 10, keywords: ['hospital', 'medical', 'clinic'] },
            { id: 'L10', label: 'Government complex', weight: 8, keywords: ['government', 'court', 'secretariat'] },
            { id: 'L11', label: 'Metro / underground', weight: 9, keywords: ['metro', 'subway', 'tunnel'] },
            { id: 'L12', label: 'Highway / arterial road', weight: 8, keywords: ['highway', 'expressway', 'main road'] },
            { id: 'L13', label: 'Junction / crossing', weight: 8, keywords: ['junction', 'crossing', 'chowk', 'intersection'] },
            { id: 'L14', label: 'Flood-prone area', weight: 9, keywords: ['flood', 'low lying', 'river bank'] },
            { id: 'L15', label: 'Accident-prone zone', weight: 9, keywords: ['accident', 'danger', 'blind spot'] },
            { id: 'L16', label: 'Heritage site', weight: 6, keywords: ['heritage', 'history', 'ruins'] },
            { id: 'L17', label: 'Coastal zone', weight: 6, keywords: ['coastal', 'beach', 'sea', 'front'] },
            { id: 'L18', label: 'Hill / slope area', weight: 7, keywords: ['hill', 'slope', 'mountain'] },
            { id: 'L19', label: 'Smart city pilot area', weight: 4, keywords: ['smart city', 'pilot'] },
            { id: 'L20', label: 'Restricted security zone', weight: 10, keywords: ['restricted', 'military', 'security', 'cantonment'] }
        ],
        TIME_FACTORS: [
            { id: 'T1', label: '< 1 hour old', weight: 1, check: (h) => h < 1 },
            { id: 'T2', label: '1–3 hours old', weight: 2, check: (h) => h >= 1 && h < 3 },
            { id: 'T3', label: '3–6 hours old', weight: 4, check: (h) => h >= 3 && h < 6 },
            { id: 'T4', label: '6–12 hours old', weight: 6, check: (h) => h >= 6 && h < 12 },
            { id: 'T5', label: '12–24 hours old', weight: 8, check: (h) => h >= 12 && h < 24 },
            { id: 'T6', label: '> 24 hours old', weight: 9, check: (h) => h >= 24 },
            { id: 'T11', label: 'Peak hours', weight: 2, keywords: ['peak', 'rush hour'] },
            { id: 'T12', label: 'Night hours', weight: 1, keywords: ['night', 'dark'] },
            { id: 'T13', label: 'Weekend', weight: 1, keywords: ['weekend', 'saturday', 'sunday'] },
            { id: 'T14', label: 'Festival / event', weight: 2, keywords: ['festival', 'diwali', 'ganesh', 'eid', 'christmas', 'event', 'parade'] },
            { id: 'T15', label: 'Monsoon season', weight: 2, keywords: ['monsoon', 'rain', 'wet'] }
        ],
        IMPACTS: [
            { id: 'I1', label: 'Human life risk', weight: 15, keywords: ['death', 'life', 'kill', 'fatal', 'mortal'] },
            { id: 'I2', label: 'Injury risk', weight: 12, keywords: ['injury', 'hurt', 'wound', 'bruise'] },
            { id: 'I3', label: 'Public panic', weight: 8, keywords: ['panic', 'scare', 'fear', 'mob'] },
            { id: 'I4', label: 'Traffic disruption', weight: 8, keywords: ['traffic', 'jam', 'congestion', 'gridlock'] },
            { id: 'I5', label: 'Economic loss', weight: 6, keywords: ['economic', 'loss', 'money', 'financial'] },
            { id: 'I6', label: 'Environmental damage', weight: 7, keywords: ['environment', 'pollution', 'tree', 'green'] },
            { id: 'I7', label: 'Health hazard', weight: 12, keywords: ['health', 'disease', 'sick', 'mosquito', 'dengue'] },
            { id: 'I8', label: 'Service disruption', weight: 9, keywords: ['disruption', 'no service', 'cut'] },
            { id: 'I9', label: 'Emergency service impact', weight: 11, keywords: ['ambulance', 'fire truck', 'police', 'block'] },
            { id: 'I10', label: 'Long-term damage', weight: 6, keywords: ['long term', 'permanent', 'irreversible'] },
            { id: 'I11', label: 'Legal / compliance risk', weight: 6, keywords: ['legal', 'court', 'law', 'compliance'] },
            { id: 'I12', label: 'Political sensitivity', weight: 5, keywords: ['political', 'minister', 'vip'] },
            { id: 'I13', label: 'Media attention risk', weight: 5, keywords: ['media', 'news', 'viral', 'reporter'] },
            { id: 'I14', label: 'Reputational damage', weight: 4, keywords: ['reputation', 'image', 'brand'] },
            { id: 'I15', label: 'Citizen dissatisfaction', weight: 4, keywords: ['angry', 'upset', 'complaint', 'protest'] }
        ],
        CONFIDENCE: [
            { id: 'C1', label: 'Single citizen report', weight: 1 },
            { id: 'C2', label: 'Multiple citizen reports', weight: 3 },
            { id: 'C3', label: 'Verified image evidence', weight: 5, keywords: ['image', 'photo', 'picture', 'jpg', 'png'] },
            { id: 'C4', label: 'Verified video evidence', weight: 6, keywords: ['video', 'mp4', 'clip'] },
            { id: 'C5', label: 'Sensor confirmed', weight: 6 },
            { id: 'C6', label: 'Sensor + citizen match', weight: 8 },
            { id: 'C7', label: 'Historical pattern match', weight: 3 },
            { id: 'C8', label: 'AI predicted failure', weight: 7 },
            { id: 'C9', label: 'Authority escalation', weight: 9, keywords: ['authority', 'admin', 'commissioner', 'mayor'] },
            { id: 'C10', label: 'Emergency declared', weight: 10, keywords: ['declared', 'emergency'] }
        ]
    },

    detectSignals: (issue) => {
        const F = AI_Engine.FRAMEWORK;
        let signals = [];
        const rawText = (issue.title + ' ' + (issue.description || '') + ' ' + (issue.location?.address || '')).toLowerCase();

        // Helper for text matching
        const scan = (list, categoryName) => {
            list.forEach(item => {
                if (item.keywords && item.keywords.some(keyword => rawText.includes(keyword))) {
                    if (!signals.some(s => s.id === item.id)) {
                        signals.push({ ...item, category: categoryName });
                    }
                }
            });
        };

        // 1. Sector Scan
        if (issue.sector) {
            const direct = F.SECTORS.find(s => s.keywords?.includes(issue.sector) || s.label.toLowerCase() === issue.sector.toLowerCase());
            if (direct) signals.push({ ...direct, category: 'SECTOR' });
            else scan(F.SECTORS, 'SECTOR');
        } else {
            scan(F.SECTORS, 'SECTOR');
        }

        // 2. Event Type
        scan(F.EVENT_TYPES, 'EVENT TYPE');

        // 3. Location
        scan(F.LOCATIONS, 'LOCATION');

        // 4. Impact
        scan(F.IMPACTS, 'IMPACT');

        // 5. Time Analysis
        const reportDate = new Date(issue.reportedAt || Date.now());
        const hoursOld = (Date.now() - reportDate.getTime()) / (1000 * 60 * 60);
        F.TIME_FACTORS.forEach(t => {
            if (t.check && t.check(hoursOld)) {
                signals.push({ ...t, category: 'TIME' });
            }
            if (t.keywords && t.keywords.some(k => rawText.includes(k))) {
                if (!signals.some(s => s.id === t.id)) signals.push({ ...t, category: 'TIME' });
            }
        });

        // 6. Confidence - Infer from data structure
        if (issue.type === 'citizen') signals.push({ ...F.CONFIDENCE.find(c => c.id === 'C1'), category: 'CONFIDENCE' });
        if (issue.imageUrl) signals.push({ ...F.CONFIDENCE.find(c => c.id === 'C3'), category: 'CONFIDENCE' });

        return signals;
    },

    calculatePriority: (issue) => {
        const signals = AI_Engine.detectSignals(issue);

        const scores = {};

        // Sum weights per category
        signals.forEach(s => {
            scores[s.category] = (scores[s.category] || 0) + s.weight;
        });

        // Apply Caps (Simplified)
        let totalBaseScore = 0;
        Object.keys(scores).forEach(cat => {
            totalBaseScore += scores[cat];
        });

        let finalScore = Math.max(0, Math.min(100, Math.round(totalBaseScore)));

        return {
            score: finalScore,
            signals
        };
    }
};

window.AI_Engine = AI_Engine;
