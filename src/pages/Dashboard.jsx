import React, { useMemo } from 'react';
import { getStats, getSensorStats, SECTORS, ISSUES, SENSORS } from '../services/mockData';
import { AlertCircle, CheckCircle2, Clock, Activity, Droplets, Zap, Truck, Waves } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>{title}</p>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}>{value}</h3>
            </div>
            <div style={{ padding: '0.5rem', borderRadius: '0.5rem', background: `${color}15`, color: color }}>
                <Icon size={24} />
            </div>
        </div>
        <div style={{ fontSize: '0.75rem', color: trend > 0 ? 'var(--color-emerald-500)' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {trend && <span>+{trend}% from last week</span>}
        </div>
    </div>
);

const Dashboard = () => {
    const stats = useMemo(() => getStats(), []);

    // Get recent 3 issues
    const recentIssues = ISSUES.slice(0, 3);

    const getSectorIcon = (id) => {
        switch (id) {
            case 'water': return <Waves size={16} />;
            case 'drainage': return <Droplets size={16} />;
            case 'lighting': return <Zap size={16} />;
            case 'roads': return <Truck size={16} />;
            default: return <Activity size={16} />;
        }
    };

    const sensorStats = useMemo(() => getSensorStats(), []);
    const criticalSensors = useMemo(() => SENSORS.filter(s => s.status !== 'normal'), []);

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Dashboard Overview</h1>
                <p style={{ color: 'var(--color-text-muted)' }}>Welcome back, Authority. Here is what's happening in your city.</p>
            </header>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <StatCard title="Total Issues" value={stats.total} icon={AlertCircle} color="var(--color-blue-500)" trend={12} />
                <StatCard title="Pending" value={stats.pending} icon={Clock} color="var(--color-amber-600)" />
                <StatCard title="Active Sensors" value={sensorStats.total} icon={Activity} color="var(--color-slate-500)" />
                <StatCard title="Critical Alerts" value={sensorStats.critical} icon={AlertCircle} color="var(--color-red-500)" />
            </div>

            {/* Infrastructure Health Sensor Section */}
            <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--color-red-500)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={20} /> Infrastructure Health
                    </h3>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Live Monitoring</span>
                </div>

                {criticalSensors.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                        {criticalSensors.map(sensor => (
                            <div key={sensor.id} style={{
                                padding: '1rem',
                                background: sensor.status === 'critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                border: `1px solid ${sensor.status === 'critical' ? 'var(--color-red-500)' : 'var(--color-amber-500)'}`,
                                borderRadius: 'var(--radius-md)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{sensor.label}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        {sensor.type.toUpperCase()} • {sensor.location.address}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        fontWeight: 700, fontSize: '1.25rem',
                                        color: sensor.status === 'critical' ? 'var(--color-red-500)' : 'var(--color-amber-600)'
                                    }}>
                                        {sensor.value} <span style={{ fontSize: '0.8rem' }}>{sensor.unit}</span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                                        {sensor.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: '1rem', background: 'var(--color-bg-body)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--color-emerald-500)' }}>
                        All systems nominal. No critical sensor readings.
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                {/* Recent Activity */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>Recent Reports</h3>
                        <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>View All</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {recentIssues.map(issue => (
                            <div key={issue.id} style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'var(--color-bg-body)', borderRadius: 'var(--radius-md)', alignItems: 'center' }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: '50%',
                                    background: SECTORS.find(s => s.id === issue.sector).color + '20',
                                    color: SECTORS.find(s => s.id === issue.sector).color,
                                    display: 'grid', placeItems: 'center'
                                }}>
                                    {getSectorIcon(issue.sector)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{issue.title}</h4>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{issue.location.address} • {new Date(issue.reportedAt).toLocaleDateString()}</span>
                                </div>
                                <span className={`badge badge-${issue.status}`}>{issue.status.replace('-', ' ')}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sector Breakdown */}
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>Sector Breakdown</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {SECTORS.map(sector => {
                            const count = ISSUES.filter(i => i.sector === sector.id).length;
                            const percentage = (count / ISSUES.length) * 100;
                            return (
                                <div key={sector.id}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: 500 }}>{sector.label}</span>
                                        <span>{count}</span>
                                    </div>
                                    <div style={{ height: 6, width: '100%', background: 'var(--color-bg-body)', borderRadius: 99 }}>
                                        <div style={{ height: '100%', width: `${percentage}%`, background: sector.color, borderRadius: 99 }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
