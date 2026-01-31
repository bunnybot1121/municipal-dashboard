import React from 'react';
import { Activity, Zap, Droplets, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

// Tiny SVG Area Chart
const MiniChart = ({ color }) => (
    <div style={{ height: '40px', marginTop: '12px', position: 'relative', overflow: 'hidden' }}>
        <svg viewBox="0 0 100 40" width="100%" height="100%" preserveAspectRatio="none">
            <defs>
                <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d="M0,35 Q10,25 20,30 T40,20 T60,25 T80,10 L100,15 L100,40 L0,40 Z" fill={`url(#grad-${color})`} />
            <path d="M0,35 Q10,25 20,30 T40,20 T60,25 T80,10 L100,15" fill="none" stroke={color} strokeWidth="2" />
        </svg>
    </div>
);

import { getSystemHealth } from '../../utils/sensorData';

const InfraHealth = () => {
    // Fetch sensor data
    const sensorsRaw = getSystemHealth();

    // Map to display format
    const sensors = sensorsRaw.map(s => ({
        ...s,
        sub: `${s.type.toUpperCase()} • ${s.id}`,
        color: s.status === 'critical' ? '#ef4444' : s.status === 'warning' ? '#f59e0b' : '#10b981'
    }));

    return (
        <div className="cc-infra-section" style={{
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            color: '#111827',
            marginTop: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
            <div className="cc-infra-header" style={{
                color: '#92400E', // Brown-800
                borderBottom: '1px solid #FEF3C7',
                paddingBottom: '12px',
                marginBottom: '15px'
            }}>
                <Zap size={18} /> Infrastructure Health - Live Monitoring
            </div>

            <div className="cc-infra-scroll">
                {sensors.map(s => (
                    <div key={s.id} className="cc-sensor-card" style={{
                        background: '#FAFAFA',
                        border: `1px solid ${s.color}40`, // Use color with transparency
                        borderLeft: `4px solid ${s.color}`,
                        minWidth: '260px',
                        color: '#111827'
                    }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>{s.label}</div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>{s.sub}</div>

                        <div className="flex items-end gap-2 mt-4">
                            <span style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1, color: s.color }}>{s.value}</span>
                            <span style={{ fontSize: '12px', fontWeight: 500, color: '#4B5563', marginBottom: '4px' }}>{s.unit}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: s.color, marginTop: '8px', textTransform: 'uppercase' }}>
                            {s.status === 'critical' ? <ArrowDownRight size={14} /> : s.status === 'warning' ? <ArrowUpRight size={14} /> : <Minus size={14} />}
                            {s.status}
                        </div>

                        <MiniChart color={s.color} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InfraHealth;
