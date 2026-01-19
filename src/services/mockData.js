/**
 * Mock Data Service for Municipal Maintenance Dashboard
 * Simulates backend response
 */

export const USERS = [
    { id: 'u1', name: 'Admin Authority', role: 'admin', avatar: 'https://ui-avatars.com/api/?name=Admin+Authority&background=0D8ABC&color=fff' },
    { id: 'u2', name: 'Field Staff 1', role: 'staff', department: 'water', avatar: 'https://ui-avatars.com/api/?name=Field+Staff&background=random' },
    { id: 'u3', name: 'Field Staff 2', role: 'staff', department: 'roads', avatar: 'https://ui-avatars.com/api/?name=Field+Staff&background=random' },
];

export const SECTORS = [
    { id: 'water', label: 'Water Supply', color: 'var(--color-blue-500)' },
    { id: 'roads', label: 'Roads & Transport', color: 'var(--color-slate-500)' },
    { id: 'drainage', label: 'Drainage & Gutters', color: 'var(--color-amber-600)' },
    { id: 'lighting', label: 'Street Lighting', color: 'var(--color-yellow-500)' },
];

export const ISSUES = [
    {
        id: 'ISS-001',
        sector: 'water',
        location: { lat: 19.0760, lng: 72.8777, address: '12th Main Rd, Block C' },
        status: 'pending', // pending, in-progress, completed
        severity: 'high', // low, medium, high
        title: 'Major Pipe Burst',
        description: 'Main water supply line burst flooding the street. Immediate attention required.',
        reportedAt: '2025-10-24T08:30:00Z',
        scheduledStart: '2025-10-25T09:00:00',
        scheduledEnd: '2025-10-25T13:00:00',
        image: 'https://images.unsplash.com/photo-1585976251273-0a786da3734a?q=80&w=600&auto=format&fit=crop', // Placeholder
        assignedTo: null,
        timeline: [
            { status: 'pending', timestamp: '2025-10-24T08:30:00Z', note: 'Issue Reported' }
        ]
    },
    {
        id: 'ISS-002',
        sector: 'lighting',
        location: { lat: 19.0800, lng: 72.8800, address: 'Sector 4 Park' },
        status: 'in-progress',
        severity: 'medium',
        title: 'Street Lights Malfunction',
        description: 'Whole row of street lights flickering and turning off at night.',
        reportedAt: '2025-10-23T18:45:00Z',
        scheduledStart: '2025-10-24T10:00:00',
        scheduledEnd: '2025-10-24T12:00:00',
        image: null,
        assignedTo: 'u3',
        timeline: [
            { status: 'pending', timestamp: '2025-10-23T18:45:00Z', note: 'Issue Reported' },
            { status: 'in-progress', timestamp: '2025-10-24T10:00:00Z', note: 'Staff assigned' }
        ]
    },
    {
        id: 'ISS-003',
        sector: 'roads',
        location: { lat: 19.0820, lng: 72.8900, address: 'Highway Exit 5' },
        status: 'completed',
        severity: 'low',
        title: 'Pothole Repair',
        description: 'Small pothole causing traffic slowdown.',
        reportedAt: '2025-10-20T09:00:00Z',
        scheduledStart: '2025-10-22T14:00:00',
        scheduledEnd: '2025-10-22T16:00:00',
        image: null,
        assignedTo: 'u3',
        timeline: [
            { status: 'pending', timestamp: '2025-10-20T09:00:00Z', note: 'Issue Reported' },
            { status: 'completed', timestamp: '2025-10-22T14:00:00Z', note: 'Repaired' }
        ]
    }
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
        completed: ISSUES.filter(i => i.status === 'completed').length,
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
