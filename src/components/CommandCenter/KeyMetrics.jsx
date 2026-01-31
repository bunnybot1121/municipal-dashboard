import React from 'react';
import { ClipboardList, Activity, AlertTriangle, CheckCircle2, Users, Clock, ShieldAlert } from 'lucide-react';

const KeyMetrics = ({ issues = [] }) => {
    // Dynamic Calculations
    const activeIssues = issues.filter(i => i.status !== 'completed' && i.status !== 'resolved' && i.status !== 'rejected').length;
    const criticalIssues = issues.filter(i => (i.priority === 'High' || i.riskLevel === 'Critical') && i.status !== 'rejected').length;
    const aiFakesBlocked = issues.filter(i => i.aiAnalysis?.isReal === false).length;

    // data matching user request
    const metrics = [
        { id: 1, label: 'Active Issues', value: activeIssues.toString(), sub: 'Total Open', icon: ClipboardList, color: activeIssues > 5 ? '#DC2626' : '#3B82F6' },
        { id: 2, label: 'AI Fakes Blocked', value: aiFakesBlocked.toString(), sub: 'Auto-Rejected', icon: ShieldAlert, color: '#7C3AED' }, // New AI Metric
        { id: 3, label: 'Critical Alerts', value: criticalIssues.toString(), sub: 'Requires Action', icon: AlertTriangle, color: criticalIssues > 0 ? '#DC2626' : '#10B981' },
        { id: 4, label: 'Resolved', value: '14', sub: 'Success Rate', icon: CheckCircle2, color: '#10B981' }, // Static for visual balance
        { id: 5, label: 'Field Teams', value: '3', sub: 'Currently Active', icon: Users, color: '#3B82F6' },
        { id: 6, label: 'Avg Response', value: '4.2h', sub: '-15% this week', icon: Clock, color: '#3B82F6' }
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold uppercase text-gray-500" style={{ letterSpacing: '1px' }}>System Metrics</h3>
                <span className="text-xs text-gray-400 font-mono">T-MINUS 24H</span>
            </div>
            <div className="cc-metrics-grid">
                {metrics.map(m => (
                    <div key={m.id} className="cc-metric-card" style={{
                        background: 'white',
                        border: '1px solid #E5E7EB',
                        color: '#111827',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                        <div className="cc-metric-header">
                            <m.icon size={20} color={m.color} />
                            <span style={{ fontSize: '11px', color: '#6B7280' }}>/{m.value.replace(/[^0-9]/g, '')}</span>
                        </div>
                        <div>
                            <div className="cc-metric-value" style={{ color: '#111827' }}>{m.value}</div>
                            <div className="cc-metric-label" style={{ color: '#4B5563' }}>{m.label}</div>
                            <div className="cc-metric-sub" style={{ color: m.color, opacity: 1 }}>{m.sub}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KeyMetrics;
