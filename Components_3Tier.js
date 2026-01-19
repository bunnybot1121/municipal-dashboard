const EmergencyAlerts = ({ issues }) => {
    const emergencies = issues.filter(i => i.type === 'emergency' || i.severity === 'high');
    if (emergencies.length === 0) return null;

    return (
        <div className="card" style={{ background: '#fef2f2', border: '1px solid #fecaca', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
                <AlertTriangle size={24} /> Emergency Response Required
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {emergencies.map(issue => (
                    <div key={issue.id} style={{ background: 'white', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #dc2626', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: 700, color: '#1f2937' }}>{issue.title}</div>
                            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{issue.location.address} • {issue.sector.toUpperCase()}</div>
                        </div>
                        <button className="btn" style={{ background: '#dc2626', color: 'white' }}>Dispatch</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CitizenReportQueue = ({ issues }) => {
    const reports = issues.filter(i => i.type === 'citizen');

    return (
        <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} /> Citizen Reports (Pending Verification)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reports.map(issue => (
                    <div key={issue.id} style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                        <div style={{ width: '80px', height: '80px', background: '#f1f5f9', borderRadius: '8px', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                            {/* Mock Image Placeholder */}
                            <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>
                                📷 <br /> Photo
                            </div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <div style={{ fontWeight: 600 }}>{issue.title}</div>
                                <span style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#3b82f6', padding: '2px 6px', borderRadius: '4px' }}>New</span>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, marginBottom: '0.5rem' }}>{issue.description}</p>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}>Verify</button>
                                <button style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #dc2626', background: 'white', color: '#dc2626', cursor: 'pointer' }}>Reject</button>
                            </div>
                        </div>
                    </div>
                ))}
                {reports.length === 0 && <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>No pending citizen reports.</div>}
            </div>
        </div>
    );
};
