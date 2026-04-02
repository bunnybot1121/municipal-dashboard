import React, { useState } from 'react';
import { api } from '../../services/apiClient';
import { 
    Close, 
    Search,
    ErrorOutline,
    CheckCircle,
    AccessTime,
    Assignment,
    Block
} from '@mui/icons-material';

const STATUS_MAP = {
    'open': { label: 'Received', color: 'bg-blue-500/20 text-blue-300 border-blue-400/30', icon: AccessTime },
    'pending': { label: 'Received', color: 'bg-blue-500/20 text-blue-300 border-blue-400/30', icon: AccessTime },
    'accepted': { label: 'Assigned', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30', icon: Assignment },
    'in_progress': { label: 'In Progress', color: 'bg-amber-500/20 text-amber-300 border-amber-400/30', icon: AccessTime },
    'resolved': { label: 'Resolved', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30', icon: CheckCircle },
    'done': { label: 'Resolved', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30', icon: CheckCircle },
    'closed': { label: 'Resolved', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30', icon: CheckCircle },
    'rejected': { label: 'Rejected', color: 'bg-red-500/20 text-red-300 border-red-400/30', icon: Block }
};

export default function TrackIssueModal({ isOpen, onClose }) {
    const [trackingNumber, setTrackingNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [issueData, setIssueData] = useState(null);
    const [error, setError] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!trackingNumber.trim()) return;
        
        // Remove CTZ- prefix if user typed it
        let searchId = trackingNumber.toUpperCase().replace('CTZ-', '').trim();
        
        if (searchId.length < 6) {
            setError('Invalid tracking number');
            return;
        }

        setLoading(true);
        setError(null);
        setIssueData(null);

        try {
            // First fetch all issues since we don't know the full UUID
            // If tracking number is full UUID, we can just fetch it, but usually it's the first 6-8 chars.
            const allIssues = await api.getIssues({});
            const matchedIssue = allIssues.find(i => String(i.id).toUpperCase().startsWith(searchId));

            if (matchedIssue) {
                setIssueData(matchedIssue);
            } else {
                setError('No issue found with this tracking number.');
            }
        } catch (err) {
            console.error('Track error:', err);
            setError('Unable to fetch issue status. Connect to network and try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none p-0 sm:p-4 animate-fade-in">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full sm:w-[480px] bg-slate-900 border border-white/10 rounded-t-[2rem] sm:rounded-3xl shadow-2xl pointer-events-auto flex flex-col max-h-[90vh] text-white overflow-hidden"
                 style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">Track Issue</h2>
                        <p className="text-xs text-white/50 mt-0.5">Enter your tracking number to check status</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all shadow-inner"
                    >
                        <Close fontSize="small" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="mb-6">
                        <div className="relative">
                            <input 
                                type="text"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="e.g. CTZ-1A2B3C"
                                className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-4 pl-12 text-white font-mono uppercase focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all shadow-inner"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                            <button 
                                type="submit" 
                                disabled={loading || !trackingNumber.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-colors"
                            >
                                {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Track'}
                            </button>
                        </div>
                        {error && (
                            <p className="mt-3 text-sm text-red-400 flex items-center gap-1 font-medium bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                <ErrorOutline fontSize="small" /> {error}
                            </p>
                        )}
                    </form>

                    {/* Results / Status */}
                    {issueData && (
                        <div className="animate-fade-in border-t border-white/10 pt-6">
                            <div className="flex justify-between items-start mb-6 drop-shadow-sm">
                                <div>
                                    <p className="text-xs text-blue-300 font-bold mb-1 uppercase tracking-widest">Tracking Number</p>
                                    <p className="text-lg font-mono font-bold bg-white/10 py-1 px-3 rounded-lg border border-white/5 inline-block">
                                        CTZ-{String(issueData.id).substring(0,8).toUpperCase()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-white/50 font-bold mb-1 uppercase tracking-widest">Date Reported</p>
                                    <p className="text-sm font-semibold text-white/90">
                                        {new Date(issueData.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-bold text-white mb-2">{issueData.issue_type || issueData.title || 'Reported Issue'}</h3>
                                <p className="text-sm text-white/70 line-clamp-2">{issueData.description || 'No additional description provided.'}</p>
                            </div>

                            {/* Status Timeline Card */}
                            <div className="bg-gradient-to-b from-blue-900/20 to-black/40 border border-white/10 rounded-2xl p-5 shadow-inner">
                                <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Current Status</p>
                                
                                {(() => {
                                    const StatusIcon = STATUS_MAP[issueData.status]?.icon || AccessTime;
                                    const statusLabel = STATUS_MAP[issueData.status]?.label || issueData.status;
                                    const statusColor = STATUS_MAP[issueData.status]?.color || 'bg-gray-500/20 text-gray-300 border-gray-400/30';
                                    
                                    return (
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl border flex-shrink-0 animate-pulse-slow shadow-lg ${statusColor}`}>
                                                <StatusIcon fontSize="large" />
                                            </div>
                                            <div>
                                                <p className="text-xl font-extrabold text-white drop-shadow-md mb-1 capitalize">
                                                    {statusLabel}
                                                </p>
                                                {issueData.status === 'resolved' || issueData.status === 'done' || issueData.status === 'closed' ? (
                                                    <p className="text-sm text-emerald-400 font-medium">This issue has been fixed by the field team.</p>
                                                ) : issueData.status === 'in_progress' ? (
                                                    <p className="text-sm text-amber-400 font-medium">Field staff is currently working on this.</p>
                                                ) : issueData.status === 'accepted' ? (
                                                    <p className="text-sm text-indigo-300 font-medium">Assigned to a response team.</p>
                                                ) : issueData.status === 'rejected' ? (
                                                    <p className="text-sm text-red-400 font-medium">This request was rejected after review.</p>
                                                ) : (
                                                    <p className="text-sm text-blue-300 font-medium">Received and awaiting team assignment.</p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })()}
                                
                                {/* Photo Proof Section */}
                                {(issueData.before_photo_url || issueData.after_photo_url) && (
                                    <div className="mt-5 pt-5 border-t border-white/10">
                                        <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">Verification Photos</p>
                                        <div className="flex bg-black/40 rounded-xl overflow-hidden border border-white/10 h-32 divide-x divide-white/10">
                                            <div className="w-1/2 relative group">
                                                <div className="absolute top-1 left-1 z-10 bg-black/60 backdrop-blur-sm text-white/90 text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/10">
                                                    BEFORE
                                                </div>
                                                {issueData.before_photo_url ? (
                                                    <img src={issueData.before_photo_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Before" loading="lazy" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px] font-bold">N/A</div>
                                                )}
                                            </div>
                                            <div className="w-1/2 relative group">
                                                <div className="absolute top-1 right-1 z-10 bg-black/60 backdrop-blur-sm text-white/90 text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/10">
                                                    AFTER
                                                </div>
                                                {issueData.after_photo_url ? (
                                                    <img src={issueData.after_photo_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="After" loading="lazy" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px] font-bold">N/A</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="mt-5 pt-4 border-t border-white/10 text-xs font-medium text-white/50 flex justify-between">
                                    <span>Sector: {issueData.sector || 'General'}</span>
                                    <span>Priority: <span className="uppercase">{issueData.priority || 'Standard'}</span></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
            @keyframes slideUp {
                from { transform: translateY(100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .animate-pulse-slow {
                animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            `}</style>
        </div>
    );
}
