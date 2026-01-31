import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNearbySensors, SECTORS, ISSUES } from '../services/mockData';
import { calculatePriorityScore } from '../services/aiPriority';
import { ArrowLeft, MapPin, Calendar, User, Activity, AlertTriangle, CheckCircle, Smartphone, ShieldAlert } from 'lucide-react';

const IssueDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [issue, setIssue] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');

    useEffect(() => {
        // SIMULATED FETCH FROM MOCK DATA
        const fetchData = async () => {
            try {
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 300));

                // Find Issue in Mock Data
                const foundIssue = ISSUES.find(i => i.id === id);

                if (foundIssue) {
                    setIssue(foundIssue);
                } else {
                    console.error("Issue not found in mock data:", id);
                }

                // Mock Logs (if needed, or leave empty)
                setLogs([]);

            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const nearbySensors = useMemo(() => {
        if (!issue) return [];
        return getNearbySensors(issue.location.lat, issue.location.lng, issue.sector);
    }, [issue]);



    // AI Priority Scoring Logic
    const priorityData = useMemo(() => {
        if (!issue) return null;
        return calculatePriorityScore(issue, nearbySensors);
    }, [issue, nearbySensors]);

    if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;

    if (!issue) {
        return <div style={{ padding: '2rem' }}>Issue not found</div>;
    }

    // Construct Timeline from Logs
    const timeline = logs.length > 0 ? logs.map(l => ({
        note: l.note || `Status changed to ${l.newStatus}`,
        timestamp: l.timestamp
    })) : (issue.timeline || []);
    // Fallback to issue.timeline if exists, or nothing.


    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'var(--color-amber-600)';
            case 'in-progress': return 'var(--color-blue-500)';
            case 'completed': return 'var(--color-emerald-500)';
            default: return 'var(--color-text-muted)';
        }
    };

    // --- BUTTON HANDLERS ---
    const handleAccept = () => {
        const newLog = {
            note: `AI Priority Accepted. Status updated to In Progress.`,
            timestamp: new Date().toISOString(),
            user: 'Admin',
            newStatus: 'in-progress'
        };
        setLogs(prev => [newLog, ...prev]);
        setIssue(prev => ({ ...prev, status: 'in-progress' }));
    };

    const handleOverride = () => {
        // Simple mock override interaction
        const newPriority = prompt("Enter new priority (Low/Medium/High):", "Medium");
        if (newPriority) {
            const newLog = {
                note: `Priority overridden to ${newPriority} by Admin.`,
                timestamp: new Date().toISOString(),
                user: 'Admin'
            };
            setLogs(prev => [newLog, ...prev]);
            // Force re-render with new data (mock)
            setIssue(prev => ({ ...prev, priority: newPriority }));
        }
    };

    const handlePostComment = () => {
        if (!commentText.trim()) return;
        const newLog = {
            note: commentText,
            timestamp: new Date().toISOString(),
            user: 'Admin',
            type: 'comment'
        };
        setLogs(prev => [newLog, ...prev]);
        setCommentText('');
    };

    const handleAttach = () => {
        const newLog = {
            note: 'Attached file: site_photo_v2.jpg',
            timestamp: new Date().toISOString(),
            user: 'Admin',
            type: 'system'
        };
        setLogs(prev => [newLog, ...prev]);
    };

    return (
        <div className="animate-fade-in">
            <button
                onClick={() => navigate('/issues')}
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

                    {/* AI Decision Support Panel (Restored Layout) */}
                    {priorityData && (
                        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--color-border)' }}>

                            {/* Header */}
                            <div style={{ padding: '1rem 1.5rem', background: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ color: 'var(--color-primary)' }}><Activity size={20} /></div>
                                <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--color-text-primary)' }}>AI DECISION SUPPORT</h3>
                            </div>

                            <div style={{ padding: '1.5rem' }}>

                                {/* Top Row: Score Ring & Label */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>

                                    {/* Score Ring (CSS Conic Gradient) */}
                                    <div style={{
                                        width: 80, height: 80, borderRadius: '50%',
                                        background: `conic-gradient(${priorityData.color} ${priorityData.score}%, #E5E7EB 0)`,
                                        display: 'grid', placeItems: 'center',
                                        position: 'relative'
                                    }}>
                                        <div style={{
                                            width: 68, height: 68, borderRadius: '50%',
                                            background: 'white', display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <span style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, color: priorityData.color }}>{Math.round(priorityData.score)}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>PRIORITY LEVEL</div>
                                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: priorityData.color }}>
                                            {priorityData.advancedAnalysis.riskLevel || priorityData.label}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ width: '100%', height: 1, background: '#E5E7EB', marginBottom: '1.5rem' }}></div>

                                {/* Why This Score? */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>WHY THIS SCORE?</div>

                                    <ul style={{ margin: 0, paddingLeft: '1rem', listStyle: 'disc', color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                        {/* Main AI Explanation */}
                                        <li style={{ marginBottom: '0.5rem' }}>
                                            <strong>Analysis:</strong> {priorityData.advancedAnalysis.explanation}
                                        </li>

                                        {/* Breakdown Factors */}
                                        {priorityData.breakdown.filter(f => Math.abs(f.value) > 0).map((factor, i) => (
                                            <li key={i}>
                                                <span style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600 }}>{factor.name}:</span>
                                                <span style={{ marginLeft: '0.5rem', fontFamily: 'monospace', fontWeight: 700, color: factor.value > 0 ? (factor.type === 'risk' ? '#DC2626' : '#059669') : '#059669' }}>
                                                    {factor.value > 0 ? '+' : ''}{factor.value} pts
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Suggested Action */}
                                <div style={{ background: '#F9FAFB', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>SUGGESTED ACTION</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <div>
                                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Team:</div>
                                            <div style={{ fontWeight: 600 }}>{priorityData.advancedAnalysis.escalation}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Est. Time:</div>
                                            <div style={{ fontWeight: 600 }}>
                                                {priorityData.score > 80 ? '24 Hours' : priorityData.score > 50 ? '72 Hours' : '7 Days'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        onClick={handleAccept}
                                        className="btn"
                                        style={{ flex: 1, background: 'var(--color-emerald-500)', color: 'white', border: 'none' }}
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={handleOverride}
                                        className="btn"
                                        style={{ flex: 1, background: 'white', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                                    >
                                        Override
                                    </button>
                                </div>

                            </div>
                        </div>
                    )}

                    {/* Evidence Consistency Panel (New Stage B Visualization) */}
                    {issue.evidenceCheck && (
                        <div className="card" style={{ borderLeft: `4px solid ${issue.evidenceCheck.isInconsistent ? 'var(--color-red-500)' : 'var(--color-emerald-500)'}` }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: issue.evidenceCheck.isInconsistent ? 'var(--color-red-500)' : 'var(--color-emerald-500)' }}>
                                {issue.evidenceCheck.isInconsistent ? <ShieldAlert size={20} /> : <CheckCircle size={20} />}
                                Evidence Consistency Check
                            </h3>

                            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Consistency Score</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: issue.evidenceCheck.consistencyScore < 50 ? 'var(--color-red-500)' : 'var(--color-emerald-500)' }}>
                                        {issue.evidenceCheck.consistencyScore}%
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Validation Status</div>
                                    <div style={{ fontWeight: 500 }}>
                                        {issue.evidenceCheck.isInconsistent ? 'Inconsistent Data Detected' : 'Evidence Verified Consistent'}
                                    </div>
                                </div>
                            </div>

                            {issue.evidenceCheck.flags && issue.evidenceCheck.flags.length > 0 && (
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Flagged Inconsistencies:</div>
                                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--color-red-400)' }}>
                                        {issue.evidenceCheck.flags.map((flag, idx) => (
                                            <li key={idx}>{flag}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                Validated at: {new Date(issue.evidenceCheck.validatedAt).toLocaleString()}
                            </div>
                        </div>
                    )}

                    {/* Issue Description */}
                    <div className="card">
                        <h3 style={{ marginBottom: '1rem' }}>Description</h3>
                        <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                            {issue.description}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>SECTOR</div>
                                <div style={{ fontWeight: 600 }}>{SECTORS.find(s => s.id === issue.sector)?.label || issue.sector}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>SEVERITY</div>
                                <div style={{ fontWeight: 600 }}>{issue.severity}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>ASSIGNED TO</div>
                                <div style={{ fontWeight: 600 }}>{issue.assignedTo ? `Staff ${issue.assignedTo}` : 'Unassigned'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Activity & Comments (Restoring Messaging Feature) */}
                    <div className="card">
                        <h3 style={{ marginBottom: '1.5rem' }}>Activity & Comments</h3>

                        {/* Timeline / Chat History */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                            {/* Mock System Message */}
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F3F4F6', display: 'grid', placeItems: 'center', fontSize: '12px' }}>
                                    🤖
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>System</span>
                                        <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>{new Date(issue.reportedAt).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', background: '#F9FAFB', padding: '0.75rem', borderRadius: '0 8px 8px 8px' }}>
                                        Issue reported via Citizen App.
                                    </div>
                                </div>
                            </div>

                            {/* Timeline Items as Messages */}
                            {timeline.map((item, index) => (
                                <div key={index} style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: item.user === 'Admin' ? 'var(--color-primary)' : '#10B981', display: 'grid', placeItems: 'center', color: 'white', fontSize: '12px' }}>
                                        {item.user === 'Admin' ? <User size={16} /> : <Activity size={16} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{item.user === 'Admin' ? 'Admin' : 'Activity Log'}</span>
                                            <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>{new Date(item.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', background: item.user === 'Admin' ? '#F0F9FF' : '#F9FAFB', padding: '0.75rem', borderRadius: '0 8px 8px 8px' }}>
                                            {item.note}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1e293b', color: 'white', display: 'grid', placeItems: 'center' }}>
                                <User size={16} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <textarea
                                    className="input-std"
                                    placeholder="Add an internal note or update..."
                                    style={{ width: '100%', minHeight: '80px', marginBottom: '0.75rem', resize: 'vertical' }}
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={handleAttach} className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>Attach File</button>
                                        <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', color: 'var(--color-primary)' }}>✨ AI Draft</button>
                                    </div>
                                    <button onClick={handlePostComment} className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }}>Post Comment</button>
                                </div>
                            </div>
                        </div>
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
                            {timeline.map((item, index) => (
                                <div key={index} style={{ display: 'flex', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-primary)', marginTop: 4 }}></div>
                                        {index !== timeline.length - 1 && (
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
