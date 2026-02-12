import React from 'react';
import { AlertTriangle, ArrowRight, Activity, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmergencyAlerts = ({ issues = [] }) => {
    const navigate = useNavigate();
    // Filter for critical/high priority items
    const criticalIssues = issues.filter(i =>
        i.riskLevel === 'Crisis' ||
        i.riskLevel === 'Critical' ||
        i.priority === 'High'
    );

    // Sort by severity (Crisis first) then date
    const alerts = criticalIssues.sort((a, b) => {
        if (a.riskLevel === 'Crisis' && b.riskLevel !== 'Crisis') return -1;
        if (b.riskLevel === 'Crisis' && a.riskLevel !== 'Crisis') return 1;
        return new Date(b.reportedAt) - new Date(a.reportedAt);
    }).map(issue => {
        // Calculate Time Ago
        const diff = Math.floor((new Date() - new Date(issue.reportedAt)) / 60000);
        let timeLabel = diff < 60 ? `T+${diff}m` : `T+${Math.floor(diff / 60)}h`;

        return {
            id: issue.id,
            title: issue.title.toUpperCase(),
            location: issue.location?.address || 'UNKNOWN SECTOR',
            sector: issue.sector?.toUpperCase() || 'GENERAL',
            time: timeLabel,
            status: issue.riskLevel === 'Crisis' ? 'CRITICAL' : 'WARNING',
            // Mock impacts if not present in AI data
            impacts: issue.aiAnalysis?.impacts || [
                `NON-COMPLIANCE DETECTED: ${issue.sector}`,
                'IMMEDIATE INTERVENTION REQUIRED'
            ],
            team: issue.assignedTo ? 'UNIT DEPLOYED' : 'AWAITING DISPATCH'
        };
    });

    return (
        <div className="cc-emergency-section" style={{
            background: '#FEF2F2', // Light Red Background
            border: '1px solid #FECACA',
            borderRadius: '8px',
            color: '#991B1B',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
            <div className="cc-emergency-header" style={{
                borderBottom: '1px solid #7f1d1d',
                paddingBottom: '12px',
                marginBottom: '15px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <AlertTriangle size={20} className="animate-pulse" />
                    <span>Critical Incidents ({alerts.length})</span>
                </div>
                <div style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'monospace' }}>
                    STATUS: URGENT ACTION REQUIRED
                </div>
            </div>

            <div className="cc-emergency-list">
                {alerts.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#4b5563', fontFamily: 'monospace' }}>
                        <div>ALL SECTORS STABLE</div>
                        <div style={{ fontSize: '10px', marginTop: '5px' }}>NO CRITICAL ALERTS</div>
                    </div>
                ) : (
                    alerts.map(alert => (
                        <div key={alert.id} className="cc-alert-card" style={{
                            background: '#1f2937',
                            border: '1px solid #374151',
                            borderLeft: `4px solid ${alert.status === 'CRITICAL' ? '#ef4444' : '#f59e0b'}`,
                            marginBottom: '10px',
                            marginBottom: '10px',
                            boxShadow: 'none',
                            cursor: 'pointer'
                        }}
                            onClick={() => navigate(`/issues/${alert.id || alert._id}`)}
                        >
                            <div className="cc-alert-header" style={{ marginBottom: '8px' }}>
                                <div className="flex items-center gap-2">
                                    <span style={{
                                        color: alert.status === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                                        fontWeight: 800,
                                        fontSize: '11px',
                                        letterSpacing: '0.5px'
                                    }}>
                                        [{alert.status}]
                                    </span>
                                    <span style={{ fontWeight: 700, fontSize: '13px', color: 'white' }}>{alert.title}</span>
                                </div>
                                <span style={{
                                    fontFamily: 'monospace',
                                    background: '#374151',
                                    color: '#d1d5db',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '10px'
                                }}>{alert.time}</span>
                            </div>

                            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '10px', fontFamily: 'monospace' }}>
                                📍 {alert.location}
                            </div>

                            <div className="cc-alert-details" style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px' }}>
                                <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase' }}>Strategy Protocol:</div>
                                <ul style={{ paddingLeft: '0', listStyle: 'none', margin: 0 }}>
                                    {alert.impacts.map((imp, i) => (
                                        <li key={i} style={{
                                            marginBottom: '2px',
                                            fontSize: '11px',
                                            color: '#e5e7eb',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            <ArrowRight size={10} color="#6b7280" /> {imp}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Activity size={12} color={alert.team === 'UNIT DEPLOYED' ? '#10b981' : '#f59e0b'} />
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: alert.team === 'UNIT DEPLOYED' ? '#10b981' : '#f59e0b' }}>
                                        {alert.team}
                                    </span>
                                </div>
                                {alert.status === 'CRITICAL' && (
                                    <button style={{
                                        background: '#7f1d1d',
                                        color: '#fca5a5',
                                        border: '1px solid #ef4444',
                                        padding: '4px 10px',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        borderRadius: '4px',
                                        textTransform: 'uppercase',
                                        cursor: 'pointer'
                                    }}>
                                        Authorize Action
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default EmergencyAlerts;
