/**
 * Mock Data Service for Municipal Maintenance Dashboard
 * Simulates backend response
 */

export const USERS = [
    { id: 'u1', name: 'Admin Authority', role: 'admin', avatar: 'https://ui-avatars.com/api/?name=Admin+Authority&background=0D8ABC&color=fff' },
    { id: 'u2', name: 'Rajesh Kumar', role: 'staff', department: 'water', avatar: 'https://ui-avatars.com/api/?name=Rajesh+Kumar&background=random' },
    { id: 'u3', name: 'Priya Singh', role: 'staff', department: 'roads', avatar: 'https://ui-avatars.com/api/?name=Priya+Singh&background=random' },
    { id: 'u4', name: 'Amit Patel', role: 'staff', department: 'waste', avatar: 'https://ui-avatars.com/api/?name=Amit+Patel&background=random' },
    { id: 'u5', name: 'Suresh Reddi', role: 'staff', department: 'power', avatar: 'https://ui-avatars.com/api/?name=Suresh+Reddi&background=random' },
];

export const SECTORS = [
    { id: 'water', label: 'Water Supply', color: 'var(--color-blue-500)' },
    { id: 'roads', label: 'Roads & Transport', color: 'var(--color-slate-500)' },
    { id: 'drainage', label: 'Drainage & Gutters', color: 'var(--color-amber-600)' },
    { id: 'lighting', label: 'Street Lighting', color: 'var(--color-yellow-500)' },
    { id: 'waste', label: 'Waste Management', color: 'var(--color-green-600)' },
    { id: 'power', label: 'Power Grid', color: 'var(--color-orange-500)' },
];

const now = Date.now();
const hour = 3600000;
const day = 24 * hour;

export const ISSUES = [
    // --- CRITICAL / EMERGENCY ALERTS (Top Priority) ---
    {
        id: 'ISS-001',
        sector: 'water',
        source: 'iot',
        location: { lat: 19.0760, lng: 72.8777, address: '12th Main Rd, Block C' },
        status: 'pending',
        priority: 'High',
        riskLevel: 'Crisis',
        title: 'Major Pipe Burst',
        description: 'Main water supply line burst flooding the street. Immediate attention required.',
        reportedAt: new Date(now - 15 * 60000).toISOString(), // 15 mins ago
        image: 'https://images.unsplash.com/photo-1585976251273-0a786da3734a',
        aiAnalysis: { isReal: true, confidence: 0.98, impacts: ['8,000 residents affected', 'Flooding risk'] },
        severity: 'high'
    },
    {
        id: 'ISS-002',
        sector: 'power',
        source: 'citizen',
        location: { lat: 19.0820, lng: 72.8900, address: 'Sector 4 Substation' },
        status: 'pending',
        priority: 'High',
        riskLevel: 'Critical',
        title: 'Live Wire Exposed',
        description: 'Storm damaged pole, live wire hanging near school entrance.',
        reportedAt: new Date(now - 45 * 60000).toISOString(),
        image: 'https://images.unsplash.com/photo-1495573258723-29cc7098c8c5?auto=format&fit=crop&q=80',
        aiAnalysis: { isReal: true, confidence: 0.95, impacts: ['Safety Hazard', 'School Zone'] },
        severity: 'high'
    },
    {
        id: 'ISS-003',
        sector: 'roads',
        source: 'citizen', // Validated by field staff
        location: { lat: 19.0850, lng: 72.8650, address: 'Highway Exit 5' },
        status: 'in-progress',
        priority: 'High',
        riskLevel: 'Critical',
        title: 'Bridge Wall Collapse',
        description: 'Retaining wall section collapsed blocking left lane.',
        reportedAt: new Date(now - 1 * hour).toISOString(),
        assignedTo: 'u3',
        image: 'https://images.unsplash.com/photo-1518709414768-a88981a45e5d?auto=format&fit=crop&q=80',
        aiAnalysis: { isReal: true, confidence: 0.99, impacts: ['Traffic blocked', 'Structural integrity'] },
        severity: 'high'
    },

    // --- RECENT CITIZEN REPORTS (Standard) ---
    {
        id: 'ISS-004',
        sector: 'waste',
        source: 'citizen',
        location: { lat: 19.0650, lng: 72.8600, address: 'Residential Zone A' },
        status: 'pending',
        priority: 'Medium',
        riskLevel: 'Moderate',
        title: 'Missed Garbage Collection',
        description: 'Bin overflowing, truck did not arrive today.',
        reportedAt: new Date(now - 3 * hour).toISOString(),
        image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80',
        aiAnalysis: { isReal: true, confidence: 0.88 },
        severity: 'medium'
    },
    {
        id: 'ISS-007',
        sector: 'roads',
        source: 'citizen',
        location: { lat: 19.0880, lng: 72.8700, address: 'Link Road' },
        status: 'pending',
        priority: 'Medium',
        riskLevel: 'Moderate',
        title: 'Deep Pothole',
        description: 'Large pothole in middle of junction causing slow traffic.',
        reportedAt: new Date(now - 5 * hour).toISOString(),
        image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80',
        aiAnalysis: { isReal: true, confidence: 0.94 },
        severity: 'medium'
    },
    {
        id: 'ISS-020',
        sector: 'lighting',
        source: 'citizen',
        location: { lat: 19.0910, lng: 72.8550, address: 'Gandhi Market' },
        status: 'pending',
        priority: 'Low',
        riskLevel: 'Low',
        title: 'Streetlight Flickering',
        description: 'Light flickering constantly, annoying residents.',
        reportedAt: new Date(now - 6 * hour).toISOString(),
        image: null,
        severity: 'low'
    },

    // --- AI DETECTED FAKES / SPAM ---
    {
        id: 'ISS-FAKE-01',
        sector: 'waste',
        source: 'citizen',
        location: { lat: 19.0700, lng: 72.8800, address: 'Market Road' },
        status: 'rejected',
        priority: 'Low',
        riskLevel: 'Low',
        title: 'Garbage Dump Overflow',
        description: 'Reported massive dump, AI verification failed.',
        reportedAt: new Date(now - 2 * hour).toISOString(),
        image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80', // Placeholder
        aiAnalysis: { isReal: false, confidence: 0.99, details: 'Generative artifacts detected.' },
        severity: 'low'
    },
    {
        id: 'ISS-FAKE-02',
        sector: 'roads',
        source: 'citizen',
        location: { lat: 19.0900, lng: 72.8500, address: 'North Avenue' },
        status: 'rejected',
        priority: 'Medium',
        riskLevel: 'Low',
        title: 'Sinkhole',
        description: 'Claim of massive sinkhole.',
        reportedAt: new Date(now - 4 * hour).toISOString(),
        image: 'https://images.unsplash.com/photo-1621503837267-36e355c42345?auto=format&fit=crop&q=80',
        aiAnalysis: { isReal: false, confidence: 0.96, details: 'Inconsistent lighting shadows.' },
        severity: 'medium'
    },

    // --- IOT ALERTS (System Generated) ---
    {
        id: 'ISS-005',
        sector: 'lighting',
        source: 'iot',
        location: { lat: 19.0780, lng: 72.8820, address: 'Central Park' },
        status: 'in-progress',
        priority: 'Medium',
        riskLevel: 'Moderate',
        title: 'Streetlight Cluster Failure',
        description: 'Automated alert: 5 lights offline in sector.',
        reportedAt: new Date(now - 8 * hour).toISOString(),
        assignedTo: 'u5',
        severity: 'medium'
    },
    {
        id: 'ISS-008',
        sector: 'drainage',
        source: 'iot',
        location: { lat: 19.0740, lng: 72.8680, address: 'Low Lying Area 2' },
        status: 'normal',
        priority: 'Low',
        riskLevel: 'Low',
        title: 'Water Level Check',
        description: 'Routine check pass. Level at 45%.',
        reportedAt: new Date(now - 30 * 60000).toISOString(),
        severity: 'low'
    },

    // --- RESOLVED / HISTORY ---
    {
        id: 'ISS-006',
        sector: 'water',
        source: 'citizen',
        location: { lat: 19.0710, lng: 72.8750, address: '5th Cross Road' },
        status: 'resolved',
        priority: 'Low',
        riskLevel: 'Low',
        title: 'Minor Leakage',
        description: 'Water dripping from valve.',
        reportedAt: new Date(now - 2 * day).toISOString(),
        image: 'https://images.unsplash.com/photo-1610555356070-d0efb6505f81?auto=format&fit=crop&q=80',
        aiAnalysis: { isReal: true, confidence: 0.92 },
        severity: 'low'
    },
    {
        id: 'ISS-012',
        sector: 'roads',
        source: 'citizen',
        location: { lat: 19.0860, lng: 72.8950, address: 'Eastern Express Hwy' },
        status: 'completed',
        priority: 'Low',
        riskLevel: 'Low',
        title: 'Signage Damaged',
        description: 'Direction board leaning dangerously.',
        reportedAt: new Date(now - 3 * day).toISOString(),
        severity: 'low'
    },

    // --- SCHEDULED MAINTENANCE (Calendar) ---
    {
        id: 'SCH-001',
        sector: 'water',
        source: 'system',
        location: { address: 'Sector 7 Reservoir' },
        status: 'pending',
        priority: 'Medium',
        title: 'Quarterly Reservoir Cleaning',
        description: 'Routine cleaning and water quality testing.',
        scheduledStart: new Date(now).toISOString(), // Today
        scheduledEnd: new Date(now + 4 * hour).toISOString(),
        assignedTo: 'u2',
        severity: 'medium'
    },
    {
        id: 'SCH-002',
        sector: 'power',
        source: 'system',
        location: { address: 'Main Grid Station' },
        status: 'pending',
        priority: 'High',
        title: 'Transformer Maintenance',
        description: 'Oil replacement and contact cleaning.',
        scheduledStart: new Date(now + 1 * day).toISOString(), // Tomorrow
        scheduledEnd: new Date(now + 1 * day + 4 * hour).toISOString(),
        assignedTo: 'u5',
        severity: 'high'
    },
    {
        id: 'SCH-003',
        sector: 'roads',
        source: 'system',
        location: { address: 'Highway Overpass' },
        status: 'in-progress',
        priority: 'Medium',
        title: 'Structural Inspection',
        description: 'Annual structural integrity check.',
        scheduledStart: new Date(now - 1 * day).toISOString(), // Yesterday
        scheduledEnd: new Date(now - 1 * day + 5 * hour).toISOString(),
        assignedTo: 'u3',
        severity: 'medium'
    },
    {
        id: 'SCH-004',
        sector: 'waste',
        source: 'system',
        location: { address: 'Zone B Collection Point' },
        status: 'pending',
        priority: 'Low',
        title: 'Bin Replacement Drive',
        description: 'Replacing damaged community bins in Zone B.',
        scheduledStart: new Date(now + 3 * day).toISOString(), // +3 Days
        scheduledEnd: new Date(now + 3 * day + 8 * hour).toISOString(),
        assignedTo: 'u4',
        severity: 'low'
    },
    {
        id: 'SCH-005',
        sector: 'lighting',
        source: 'system',
        location: { address: 'Central Park Perimeter' },
        status: 'completed',
        priority: 'Low',
        title: 'LED Upgrade Phase 2',
        description: 'Replacing old sodium vapor lamps with LEDs.',
        scheduledStart: new Date(now - 2 * day).toISOString(), // -2 Days
        scheduledEnd: new Date(now - 2 * day + 6 * hour).toISOString(),
        assignedTo: 'u5',
        severity: 'low'
    },

    // --- NEW: ADVANCED RISK SCENARIOS (Categories 10-20) ---
    {
        id: 'ISS-ENV-01',
        sector: 'drainage',
        source: 'citizen',
        location: { lat: 19.0680, lng: 72.8650, address: 'Industrial Zone Creek' },
        status: 'pending',
        priority: 'High',
        riskLevel: 'Crisis',
        title: 'Chemical Spill in Creek',
        description: 'Green toxic liquid seen entering the stormwater drain. Terrible smell, fish dying.',
        reportedAt: new Date(now - 1 * hour).toISOString(),
        image: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&q=80',
        aiAnalysis: { isReal: true, confidence: 0.96 },
        severity: 'high'
    },
    {
        id: 'ISS-SOC-01',
        sector: 'water',
        source: 'citizen',
        location: { lat: 19.0550, lng: 72.8500, address: 'Dharavi Sector 5' },
        status: 'pending',
        priority: 'High',
        riskLevel: 'Crisis',
        title: 'No Water in Slum Colony',
        description: '300+ families without drinking water for 24 hours. Vulnerable elderly affected.',
        reportedAt: new Date(now - 2 * hour).toISOString(),
        image: 'https://images.unsplash.com/photo-1594488518004-948f2197486a?auto=format&fit=crop&q=80',
        aiAnalysis: { isReal: true, confidence: 0.92 },
        severity: 'high'
    },
    {
        id: 'ISS-FIN-01',
        sector: 'roads',
        source: 'citizen',
        location: { lat: 19.0950, lng: 72.8400, address: 'Main Market Junction' },
        status: 'in-progress',
        priority: 'High',
        riskLevel: 'Critical',
        title: 'Market Access Blocked',
        description: 'Road cave-in blocking entry to wholesale market. Heavy financial loss expected for traders.',
        reportedAt: new Date(now - 4 * hour).toISOString(),
        image: 'https://images.unsplash.com/photo-1584467142646-3b320df6af8a?auto=format&fit=crop&q=80',
        aiAnalysis: { isReal: true, confidence: 0.95 },
        severity: 'high'
    },
    {
        id: 'ISS-SYS-01',
        sector: 'power',
        source: 'iot',
        location: { lat: 19.0800, lng: 72.8900, address: 'Central Control Grid' },
        status: 'pending',
        priority: 'High',
        riskLevel: 'Crisis',
        title: 'Substation Fire Risk',
        description: 'Transformer overheating significantly. Risk of cascading failure to Metro line power.',
        reportedAt: new Date(now - 10 * 60000).toISOString(),
        aiAnalysis: { isReal: true, confidence: 0.99 },
        severity: 'high'
    },
    {
        id: 'ISS-REP-01',
        sector: 'waste',
        source: 'citizen',
        location: { lat: 19.0700, lng: 72.8300, address: 'Tourist Promenade' },
        status: 'pending',
        priority: 'Medium',
        riskLevel: 'Critical',
        title: 'Garbage Pile on Beach',
        description: 'Huge pile of rotting waste on tourist beach. Trending on Twitter.',
        reportedAt: new Date(now - 3 * hour).toISOString(),
        image: 'https://images.unsplash.com/photo-1605218427360-1288aa0b5559?auto=format&fit=crop&q=80',
        aiAnalysis: { isReal: true, confidence: 0.94 },
        severity: 'medium'
    },
    {
        id: 'ISS-INF-01',
        sector: 'roads',
        source: 'citizen',
        location: { lat: 19.0600, lng: 72.8500, address: 'City General Hospital' },
        status: 'pending',
        priority: 'High',
        riskLevel: 'Critical',
        title: 'Ambulance Route Potholes',
        description: 'Deep potholes at hospital entrance slowing down emergency vehicles.',
        reportedAt: new Date(now - 5 * hour).toISOString(),
        image: 'https://images.unsplash.com/photo-1541457523724-95f00f7c9b0e?auto=format&fit=crop&q=80',
        aiAnalysis: { isReal: true, confidence: 0.91 },
        severity: 'medium'
    },
    {
        id: 'ISS-JUR-01',
        sector: 'drainage',
        source: 'citizen',
        location: { lat: 19.0850, lng: 72.8450, address: 'Railway Crossing 4' },
        status: 'pending',
        priority: 'Medium',
        riskLevel: 'High',
        title: 'Track Flooding Imminent',
        description: 'Drain clogging near railway tracks. Needs coordination with Railway Authority.',
        reportedAt: new Date(now - 45 * 60000).toISOString(),
        aiAnalysis: { isReal: true, confidence: 0.89 },
        severity: 'medium'
    },
    {
        id: 'ISS-VIG-01',
        sector: 'roads',
        source: 'citizen',
        location: { lat: 19.0750, lng: 72.8850, address: 'Sector 3' },
        status: 'rejected',
        priority: 'Low',
        riskLevel: 'Low',
        title: 'Monster Pothole',
        description: 'There is a dinosaur in the pothole.',
        reportedAt: new Date(now - 1 * hour).toISOString(),
        image: 'https://images.unsplash.com/photo-1534237710431-e2fc698436d0?auto=format&fit=crop&q=80',
        aiAnalysis: { isReal: false, confidence: 0.99, details: 'Clearly modified image.' },
        severity: 'low'
    },
    {
        id: 'ISS-TEMP-01',
        sector: 'lighting',
        source: 'citizen',
        location: { lat: 19.0900, lng: 72.8600, address: 'Women Safety Zone' },
        status: 'pending',
        priority: 'High',
        riskLevel: 'Critical',
        title: 'Dark Spot in Safety Zone',
        description: 'Streetlights off in designated women safety corridor. Urgent fix needed.',
        reportedAt: new Date(now - 6 * hour).toISOString(),
        severity: 'high'
    },
    {
        id: 'ISS-REC-01',
        sector: 'water',
        source: 'citizen',
        location: { lat: 19.0620, lng: 72.8700, address: 'B-Wing Housing' },
        status: 'pending',
        priority: 'Medium',
        riskLevel: 'Moderate',
        title: 'Recurring Contamination',
        description: 'Water smells like sewage again properly. Third complaint in a month.',
        reportedAt: new Date(now - 2 * hour).toISOString(),
        aiAnalysis: { isReal: true, confidence: 0.88 },
        severity: 'medium'
    },
];


export const SENSORS = [
    // Water Supply Sensors (Near Issue 1)
    {
        id: 'SEN-W-001',
        type: 'pressure',
        sector: 'water',
        label: 'Main Line Pressure Monitor',
        value: 12.5, // Low pressure due to burst
        unit: 'bar',
        range: { min: 15, max: 25 },
        status: 'critical',
        trend: 'falling',
        lastUpdated: 'Just now',
        location: { lat: 19.0760, lng: 72.8777, address: '12th Main Rd, Block C' }
    },
    {
        id: 'SEN-W-002',
        type: 'flow',
        sector: 'water',
        label: 'Distribution Flow Rate',
        value: 2400, // High flow indicating leak
        unit: 'L/min',
        range: { min: 800, max: 1500 },
        status: 'warning',
        trend: 'rising',
        lastUpdated: '5 mins ago',
        location: { lat: 19.0765, lng: 72.8780, address: '12th Main Rd, Junction' }
    },
    // Drainage Sensors (General)
    {
        id: 'SEN-D-001',
        type: 'level',
        sector: 'drainage',
        label: 'Sewer Level S-4',
        value: 45,
        unit: '%',
        range: { min: 0, max: 75 },
        status: 'normal',
        trend: 'stable',
        lastUpdated: '10 mins ago',
        location: { lat: 19.0750, lng: 72.8750, address: 'Market Road' }
    },
    // Lighting Sensors (Near Issue 2)
    {
        id: 'SEN-L-001',
        type: 'voltage',
        sector: 'lighting',
        label: 'Pole 45 Controller',
        value: 180, // Low voltage
        unit: 'V',
        range: { min: 210, max: 240 },
        status: 'warning',
        trend: 'unstable',
        lastUpdated: '1 hour ago',
        location: { lat: 19.0800, lng: 72.8800, address: 'Sector 4 Park' }
    },
    // Power Sensors
    {
        id: 'SEN-P-001',
        type: 'load',
        sector: 'power',
        label: 'Substation Load Monitor',
        value: 92,
        unit: '%',
        range: { min: 0, max: 90 },
        status: 'warning',
        trend: 'rising',
        lastUpdated: '15 mins ago',
        location: { lat: 19.0820, lng: 72.8900, address: 'Sector 4 Substation' }
    },
    // Roads Sensors
    {
        id: 'SEN-R-001',
        type: 'vibration',
        sector: 'roads',
        label: 'Bridge 4 Structural Monitor',
        value: 0.1,
        unit: 'g',
        range: { min: 0, max: 0.5 },
        status: 'normal',
        trend: 'stable',
        lastUpdated: '2 mins ago',
        location: { lat: 19.0850, lng: 72.8900, address: 'City Bridge' }
    },
    // Environmental
    {
        id: 'SEN-E-001',
        type: 'flood_risk',
        sector: 'drainage', // Linked to drainage
        label: 'Low-lying Area Flood Sensor',
        value: 'Low',
        unit: 'Risk',
        status: 'normal',
        trend: 'stable',
        lastUpdated: '30 mins ago',
        location: { lat: 19.0700, lng: 72.8600, address: 'Coastal Road' }
    }
];

export const getStats = () => {
    return {
        total: ISSUES.length,
        pending: ISSUES.filter(i => i.status === 'pending').length,
        inProgress: ISSUES.filter(i => i.status === 'in-progress').length,
        completed: ISSUES.filter(i => i.status === 'completed' || i.status === 'resolved').length,
    };
};

export const getSensorStats = () => {
    return {
        total: SENSORS.length,
        critical: SENSORS.filter(s => s.status === 'critical').length,
        warning: SENSORS.filter(s => s.status === 'warning').length,
        normal: SENSORS.filter(s => s.status === 'normal').length
    };
};

// Find sensors near a location (simple radius check logic simulation)
export const getNearbySensors = (lat, lng, sector) => {
    // In a real app, we'd do geospatial query. Here we just return specific matched sensors for demo.
    // Or return all sensors of that sector for simplicity if no exact match
    return SENSORS.filter(s =>
        (s.sector === sector) ||
        (Math.abs(s.location.lat - lat) < 0.005 && Math.abs(s.location.lng - lng) < 0.005)
    );
};
