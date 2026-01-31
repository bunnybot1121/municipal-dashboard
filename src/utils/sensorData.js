// Mock utility to generate consistent sensor data
// In a real app, this would fetch from an IoT / Sensor API

export const getSystemHealth = () => {
    // Return a list of critical infrastructure nodes
    return [
        {
            id: 'S-101',
            label: 'Main Water Pressure',
            type: 'pressure',
            value: 85,
            unit: 'PSI',
            status: 'normal',
            trend: 'stable'
        },
        {
            id: 'S-102',
            label: 'Grid Load (Sector 4)',
            type: 'power',
            value: 92,
            unit: '%',
            status: 'warning',
            trend: 'rising'
        },
        {
            id: 'S-103',
            label: 'Air Quality Index',
            type: 'env',
            value: 154,
            unit: 'AQI',
            status: 'warning',
            trend: 'rising'
        },
        {
            id: 'S-104',
            label: 'River Level',
            type: 'water',
            value: 3.2,
            unit: 'm',
            status: 'normal',
            trend: 'stable'
        },
        {
            id: 'S-105',
            label: 'Traffic Flow (Hwy 5)',
            type: 'traffic',
            value: 12,
            unit: 'km/h',
            status: 'critical',
            trend: 'falling'
        }
    ];
};
