import React, { useState } from 'react';
import { Users, Camera, ShieldCheck, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CitizenReportFeed = ({ issues = [], onVerify, onReject }) => {
    const navigate = useNavigate();

    // Helper to handle navigation without triggering buttons
    const handleNavigate = (id) => {
        navigate(`/issues/${id}`);
    };

    // Filter for pending citizen issues
    // In a real app, 'pending' status + 'citizen' source
    const pendingReports = issues.filter(i =>
        i.source === 'citizen' &&
        (i.status === 'pending' || i.status === 'in-progress') &&
        !i.aiAnalysis // Show items that haven't been fully processed/verified yet, or just all pending
    ).slice(0, 5);

    // If we want to verify strictly "New" items, we might check for no aiAnalysis
    // But for demo, let's just show top pending ones that aren't rejected.

    return (
        <div style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #E5E7EB',
            padding: '1.5rem',
            height: '100%',
            color: '#111827',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #F3F4F6', paddingBottom: '12px' }}>
                <Users className="text-blue-600" size={24} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Citizen Reports
                </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {pendingReports.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#6B7280', padding: '2rem' }}>
                        No pending reports to verify.
                    </div>
                ) : (
                    pendingReports.map(report => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            onVerify={() => onVerify(report.id)}
                            onReject={() => onReject(report.id)}
                            onClick={() => handleNavigate(report.id || report._id)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

const ReportCard = ({ report, onVerify, onReject, onClick }) => {
    const [isVerifying, setIsVerifying] = useState(false);

    const handleVerify = async (e) => {
        e.stopPropagation();
        setIsVerifying(true);
        // Simulate AI Delay
        setTimeout(() => {
            onVerify();
            setIsVerifying(false);
        }, 1500);
    };

    const handleReject = (e) => {
        e.stopPropagation();
        onReject();
    };

    return (
        <div style={{
            display: 'flex',
            gap: '1rem',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: '#F9FAFB', // Light Gray Card
            border: '1px solid #E5E7EB',
            transition: 'transform 0.2s',
            cursor: 'pointer'
        }}
            onClick={onClick}
        >
            {/* Image Thumbnail Placeholder / Analysis View */}
            <div style={{
                width: '80px',
                height: '80px',
                flexShrink: 0,
                background: '#E5E7EB',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#6B7280'
            }}>
                {report.imageUrl ? (
                    <img src={report.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                ) : (
                    <>
                        <Camera size={20} />
                        <span style={{ fontSize: '10px', marginTop: '4px' }}>Image</span>
                    </>
                )}
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', margin: 0 }}>
                        {report.title}
                    </h4>
                    <span style={{
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        background: '#EFF6FF', // Blue-50
                        color: '#2563EB', // Blue-600
                        borderRadius: '4px',
                        fontWeight: 600,
                        border: '1px solid #DBEAFE'
                    }}>
                        NEW
                    </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: '#4B5563', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                    {(report.description || 'No description available').substring(0, 60)}...
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={handleVerify}
                        disabled={isVerifying}
                        style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            borderRadius: '4px',
                            background: '#2563EB',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        {isVerifying ? (
                            <><span>Scanning...</span></>
                        ) : (
                            <><ShieldCheck size={14} /> Verify</>
                        )}
                    </button>

                    <button
                        onClick={handleReject}
                        style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            borderRadius: '6px',
                            background: 'white',
                            border: '1px solid #FCA5A5',
                            color: '#DC2626',
                            cursor: 'pointer'
                        }}
                    >
                        Reject
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CitizenReportFeed;
