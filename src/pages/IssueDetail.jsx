import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ISSUES, getNearbySensors, SECTORS } from '../services/mockData';
import { ArrowLeft, MapPin, Calendar, User, Activity, AlertTriangle, CheckCircle, Smartphone } from 'lucide-react';

const IssueDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const issue = useMemo(() => ISSUES.find(i => i.id === id), [id]);

    if (!issue) {
        return <div style={{ padding: '2rem' }}>Issue not found</div>;
    }

    const nearbySensors = useMemo(() =>
        getNearbySensors(issue.location.lat, issue.location.lng, issue.sector),
        [issue]);

    const criticalSensors = nearbySensors.filter(s => s.status === 'critical' || s.status === 'warning');

    // AI Explanation Logic
    const aiExplanation = useMemo(() => {
        if (criticalSensors.length > 0) {
            const sensor = criticalSensors[0];
            return `Priority escalated due to abnormal ${sensor.label} readings (${sensor.value} ${sensor.unit}). Immediate intervention recommended to prevent infrastructure failure.`;
        }
        return "No sensor anomalies detected in immediate vicinity. Priority is based on reported user severity and standard assessment protocols.";
    }, [criticalSensors]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'var(--color-amber-600)';
            case 'in-progress': return 'var(--color-blue-500)';
            case 'completed': return 'var(--color-emerald-500)';
            default: return 'var(--color-text-muted)';
        }
    };

    return (
        <div className="animate-fade-in">
            <button
                onClick={() => navigate(-1)}
                className="btn btn-ghost"
                style={{ marginBottom: '1rem', paddingLeft: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
                <ArrowLeft size={16} /> Back to Issues
            </button>

            <header style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span className="badge" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
                                {issue.id}
                            </span>
                            <span className={`badge badge-${issue.status}`}>
                                {issue.status.replace('-', ' ')}
                            </span>
                        </div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{issue.title}</h1>
                        <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={16} /> {issue.location.address}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Calendar size={16} /> Reported: {new Date(issue.reportedAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    {issue.severity && (
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Severity</div>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
                                background: issue.severity === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                color: issue.severity === 'high' ? 'var(--color-red-500)' : 'var(--color-amber-600)',
                                fontWeight: 600
                            }}>
                                <AlertTriangle size={18} /> {issue.severity.toUpperCase()}
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

                {/* Main Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* AI Analysis Panel */}
                    <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>
                            <Smartphone size={20} /> AI Decision Support
                        </h3>
                        <p style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                            {aiExplanation}
                        </p>
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                            {criticalSensors.length > 0 && (
                                <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-red-500)', border: 'none' }}>
                                    Confirmed by Sensors
                                </span>
                            )}
                            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-emerald-500)', border: 'none' }}>
                                Confidence Score: {criticalSensors.length > 0 ? '98%' : '75%'}
                            </span>
                        </div>
                    </div>

                    {/* Issue Description */}
                    <div className="card">
                        <h3 style={{ marginBottom: '1rem' }}>Description</h3>
                        <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                            {issue.description}
                        </p>
                        {issue.image && (
                            <div style={{ marginTop: '1.5rem' }}>
                                <img src={issue.image} alt="Issue" style={{ borderRadius: 'var(--radius-md)', maxWidth: '100%', maxHeight: '400px', objectFit: 'cover' }} />
                            </div>
                        )}
                    </div>

                    {/* Live Sensor Data */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3>Real-time Sensor Readings</h3>
                            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                Vicinity: 500m
                            </span>
                        </div>

                        {nearbySensors.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                {nearbySensors.map(sensor => (
                                    <div key={sensor.id} style={{
                                        padding: '1rem',
                                        background: 'var(--color-bg-body)',
                                        borderRadius: 'var(--radius-md)',
                                        border: sensor.status === 'normal' ? '1px solid transparent' :
                                            `1px solid ${sensor.status === 'critical' ? 'var(--color-red-500)' : 'var(--color-amber-500)'}`
                                    }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                            {sensor.label}
                                        </div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span>
                                                {sensor.value} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>{sensor.unit}</span>
                                            </span>
                                            {sensor.trend && (
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--color-text-muted)',
                                                    background: 'var(--color-border)',
                                                    padding: '2px 6px',
                                                    borderRadius: 4,
                                                    fontWeight: 600
                                                }}>
                                                    {sensor.trend === 'rising' ? '↑' : sensor.trend === 'falling' ? '↓' : '→'} {sensor.trend.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                                            <div style={{
                                                width: 8, height: 8, borderRadius: '50%',
                                                background: sensor.status === 'normal' ? 'var(--color-emerald-500)' :
                                                    (sensor.status === 'warning' ? 'var(--color-amber-500)' : 'var(--color-red-500)')
                                            }}></div>
                                            <span style={{ textTransform: 'capitalize' }}>{sensor.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', background: 'var(--color-bg-body)', borderRadius: 'var(--radius-md)' }}>
                                No IoT sensors detected in this sector/location.
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card">
                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Timeline</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {issue.timeline.map((item, index) => (
                                <div key={index} style={{ display: 'flex', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-primary)', marginTop: 4 }}></div>
                                        {index !== issue.timeline.length - 1 && (
                                            <div style={{ width: 2, flex: 1, background: 'var(--color-border)', marginTop: 4 }}></div>
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.note}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            {new Date(item.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Assigned Team</h3>
                        {issue.assignedTo ? (
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}></div>
                                <div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Field Staff {issue.assignedTo}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Deployed</div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                No team assigned yet.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default IssueDetail;
