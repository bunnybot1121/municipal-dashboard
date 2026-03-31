import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { calculatePriorityScore } from '../utils/aiPriority';
import {
    Close,
    LocationOn,
    Person,
    Phone,
    CalendarToday,
    Image as ImageIcon,
    Circle,
    CheckCircle,
    Schedule,
    NewReleases,
    Block,
    FilterList,
    Refresh,
    Assignment,
    Check as CheckIcon,
    ThumbDown as RejectIcon,
} from '@mui/icons-material';

/* ─── helpers ─────────────────────────────────────── */
const STATUS_OPTIONS = ['new', 'in_progress', 'accepted', 'resolved', 'rejected', 'closed'];

const STATUS_META = {
    new: { label: 'New', color: 'bg-blue-500/20 text-blue-200 border border-blue-400/30', dot: 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]', Icon: NewReleases },
    in_progress: { label: 'In Progress', color: 'bg-amber-500/20 text-amber-200 border border-amber-400/30', dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]', Icon: Schedule },
    accepted: { label: 'Accepted', color: 'bg-green-500/20 text-green-200 border border-green-400/30', dot: 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]', Icon: CheckCircle },
    resolved: { label: 'Resolved', color: 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30', dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]', Icon: CheckCircle },
    rejected: { label: 'Rejected', color: 'bg-red-500/20 text-red-200 border border-red-400/30', dot: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]', Icon: Block },
    closed: { label: 'Closed', color: 'bg-gray-500/20 text-gray-200 border border-gray-400/30', dot: 'bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.8)]', Icon: Block },
};

const PRIORITY_META = {
    critical: 'bg-red-500/20 text-red-200 border border-red-400/30 shadow-[0_0_10px_rgba(248,113,113,0.2)]',
    high: 'bg-orange-500/20 text-orange-200 border border-orange-400/30 shadow-[0_0_10px_rgba(251,146,60,0.2)]',
    medium: 'bg-blue-500/20 text-blue-200 border border-blue-400/30 shadow-[0_0_10px_rgba(96,165,250,0.2)]',
    low: 'bg-white/10 text-white/80 border border-white/20 shadow-sm',
};

const fmt = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
};


/* ─── Stats Card ──────────────────────────────────── */
const StatCard = ({ label, value, color, Icon }) => (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-5 flex items-center gap-4 group hover:bg-white/20 transition-all">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-inner ${color}`}>
            <Icon sx={{ fontSize: 26 }} className="group-hover:scale-110 transition-transform" />
        </div>
        <div>
            <p className="text-3xl font-extrabold text-white drop-shadow-md">{value}</p>
            <p className="text-xs font-bold text-white/70 uppercase tracking-wider mt-0.5">{label}</p>
        </div>
    </div>
);


/* ─── Side Panel ──────────────────────────────────── */
const DetailPanel = ({ issue, onClose, onStatusChange, onViewFull }) => {
    const [savingStatus, setSavingStatus] = useState(false);
    const [aiResult, setAiResult] = useState(null);

    // Auto-run AI analysis when panel opens
    useEffect(() => {
        const mapped = {
            description: issue.description || '',
            title: issue.issue_type || '',
            type: issue.issue_type || '',
            sector: issue.sector || '',
            severity: (issue.priority || 'medium').toLowerCase(),
            createdAt: issue.created_at,
            imageUrl: issue.photo_url || null,
        };
        const result = calculatePriorityScore(mapped);
        setAiResult(result);
    }, [issue]);

    const handleStatusChange = async (newStatus) => {
        setSavingStatus(true);
        try {
            const { error } = await supabase
                .from('issues')
                .update({ status: newStatus })
                .eq('id', issue.id);
            if (error) throw error;
            onStatusChange(issue.id, newStatus);
        } catch (err) {
            console.error('Status update failed:', err);
            alert('Failed to update status: ' + err.message);
        } finally {
            setSavingStatus(false);
        }
    };

    const sm = STATUS_META[issue.status] || STATUS_META.new;
    const pm = PRIORITY_META[(issue.priority || '').toLowerCase()] || PRIORITY_META.low;

    // AI score styling
    const scoreColor = aiResult?.score >= 85 ? '#F87171' : aiResult?.score >= 60 ? '#FB923C' : aiResult?.score >= 40 ? '#FBBF24' : '#4ADE80';
    const scoreBg = aiResult?.score >= 85 ? 'bg-red-500/20 text-red-200 border-red-400/30' : aiResult?.score >= 60 ? 'bg-orange-500/20 text-orange-200 border-orange-400/30' : aiResult?.score >= 40 ? 'bg-yellow-500/20 text-yellow-200 border-yellow-400/30' : 'bg-green-500/20 text-green-200 border-green-400/30';

    const signals = aiResult?.advancedAnalysis?.signals || {};
    const dims = aiResult?.advancedAnalysis?.dimensions || {};

    // const CAT_ROWS = [...]; // Removed 9-Category breakdown per user request

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
                onClick={onClose}
            />
            {/* Panel */}
            <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white/10 backdrop-blur-2xl border-l border-white/20 shadow-2xl z-50 flex flex-col overflow-hidden text-white"
                style={{ animation: 'slideInRight 0.25s ease-out' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-black/20">
                    <div>
                        <h2 className="text-xl font-extrabold text-white drop-shadow-md">Issue Details</h2>
                        <p className="text-xs text-blue-300 font-mono mt-1 font-bold">#{String(issue.id).slice(0, 8).toUpperCase()}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/20 text-white/70 hover:text-white transition-all border border-white/10 shadow-sm"
                    >
                        <Close sx={{ fontSize: 22 }} />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto">
                    {/* Photo */}
                    <div className="relative h-64 bg-black/40 border-b border-white/10">
                        {issue.photo_url ? (
                            <img
                                src={issue.photo_url}
                                alt="Issue"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white/30">
                                <ImageIcon sx={{ fontSize: 48 }} className="mb-3 opacity-50" />
                                <p className="text-sm font-bold tracking-wide">NO PHOTO ATTACHED</p>
                            </div>
                        )}
                        {/* Priority badge overlay */}
                        <span className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase shadow-lg border backdrop-blur-md ${pm}`}>
                            {issue.priority || 'Low'}
                        </span>
                    </div>

                    <div className="px-6 py-6 space-y-6">
                        {/* Issue type + description */}
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200 bg-blue-500/20 border border-blue-400/30 px-3 py-1.5 rounded-lg shadow-sm inline-block mb-3">
                                {issue.issue_type || 'General'}
                            </span>
                            <p className="text-base text-white/90 leading-relaxed font-medium drop-shadow-sm">{issue.description || 'No description provided.'}</p>
                        </div>

                        {/* Status update */}
                        <div className="bg-white/5 rounded-2xl border border-white/20 p-5 shadow-inner">
                            <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Update Status</p>
                            <div className="flex items-center gap-3">
                                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${sm.dot}`} />
                                <select
                                    value={issue.status}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    disabled={savingStatus}
                                    className="flex-1 text-sm font-bold text-white border border-white/20 rounded-xl px-4 py-3 bg-black/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 disabled:opacity-60 cursor-pointer appearance-none shadow-sm"
                                >
                                    {STATUS_OPTIONS.map(s => (
                                        <option key={s} value={s} className="bg-slate-900 text-white">{STATUS_META[s]?.label || s}</option>
                                    ))}
                                </select>
                                {savingStatus && <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin flex-shrink-0" />}
                            </div>
                        </div>

                        {/* Info rows */}
                        <div className="space-y-3 bg-white/5 rounded-2xl border border-white/10 p-5 shadow-inner">
                            <InfoRow icon={<Person sx={{ fontSize: 18 }} />} label="Citizen" value={issue.citizen_name || 'Anonymous'} />
                            <InfoRow icon={<Phone sx={{ fontSize: 18 }} />} label="Phone" value={issue.citizen_phone || '—'} />
                            <InfoRow icon={<LocationOn sx={{ fontSize: 18 }} />} label="Address" value={issue.location_address || '—'} />
                            {(issue.latitude && issue.longitude) && (
                                <InfoRow icon={<LocationOn sx={{ fontSize: 18 }} />} label="GPS" value={`${Number(issue.latitude).toFixed(5)}, ${Number(issue.longitude).toFixed(5)}`} />
                            )}
                            <InfoRow icon={<CalendarToday sx={{ fontSize: 18 }} />} label="Reported" value={fmt(issue.created_at)} />
                        </div>

                        {/* ── AI Analysis Section ── */}
                        <div className="border-t border-white/10 pt-6 space-y-5">
                            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                                <span className="text-xl">🤖</span> 145-Signal AI Analysis
                            </p>

                            {aiResult && (
                                <>
                                    {/* Score bar */}
                                    <div className="bg-white/5 rounded-2xl p-5 border border-white/10 shadow-inner">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Priority Score</span>
                                            <span className={`text-xs font-extrabold px-3 py-1.5 rounded-lg shadow-sm border ${scoreBg.replace('bg-', 'bg-').replace('text-', 'text-')}`}>
                                                {aiResult.score}/100 · {aiResult.label}
                                            </span>
                                        </div>
                                        <div className="h-4 bg-black/40 rounded-full overflow-hidden shadow-inner border border-white/5">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${aiResult.score}%`, backgroundColor: scoreColor, boxShadow: `0 0 10px ${scoreColor}` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Top signals */}
                                    {aiResult.advancedAnalysis?.explanation && (
                                        <div className="bg-blue-500/10 border border-blue-400/20 rounded-2xl p-4 shadow-sm">
                                            <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-2">Top Signals Detected</p>
                                            <p className="text-sm text-blue-100 font-medium leading-relaxed">{aiResult.advancedAnalysis.explanation}</p>
                                        </div>
                                    )}

                                    {/* 7D Dimensions */}
                                    <div className="bg-white/5 rounded-2xl border border-white/10 divide-y divide-white/5 shadow-inner">
                                        {[
                                            ['Sector Assessment', dims.sector],
                                            ['Event Risk', dims.event],
                                            ['Severity Level', dims.severity],
                                            ['Time Boost', dims.timeBoost != null ? `+${dims.timeBoost} pts` : null],
                                            ['Location Boost', dims.locationBoost != null ? `+${dims.locationBoost} pts` : null],
                                        ].filter(([, v]) => v != null).map(([k, v]) => (
                                            <div key={k} className="flex justify-between px-4 py-3 text-sm">
                                                <span className="text-white/60 font-medium">{k}</span>
                                                <span className="font-bold text-white drop-shadow-sm">{v}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Escalation */}
                                    {aiResult.advancedAnalysis?.escalation && (
                                        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 shadow-sm">
                                            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Escalation Target</p>
                                            <p className="text-sm font-bold text-red-200 mt-0.5">{aiResult.advancedAnalysis.escalation}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer CTA */}
                <div className="p-5 border-t border-white/10 bg-black/20 space-y-3">
                    {/* Accept / Reject quick actions */}
                    {(issue.status === 'new' || issue.status === 'in_progress') && (
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                disabled={savingStatus}
                                onClick={() => handleStatusChange('accepted')}
                                className="flex items-center justify-center gap-2 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 disabled:opacity-60 text-green-100 rounded-xl font-bold text-sm transition-all shadow-lg shadow-green-500/10 hover:-translate-y-0.5"
                            >
                                <CheckIcon sx={{ fontSize: 18 }} /> Accept
                            </button>
                            <button
                                disabled={savingStatus}
                                onClick={() => {
                                    if (window.confirm('Reject this citizen issue?')) handleStatusChange('rejected');
                                }}
                                className="flex items-center justify-center gap-2 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 disabled:opacity-60 text-red-100 rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-500/10 hover:-translate-y-0.5"
                            >
                                <RejectIcon sx={{ fontSize: 18 }} /> Reject
                            </button>
                        </div>
                    )}
                    <button
                        onClick={onViewFull}
                        className="w-full py-3.5 liquid-btn liquid-btn-blue rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2"
                    >
                        Open Full Issue Page <Assignment sx={{ fontSize: 18 }} />
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to   { transform: translateX(0);   opacity: 1; }
                }
            `}</style>
        </>
    );
};

const InfoRow = ({ icon, label, value }) => (
    <div className="flex items-start gap-4 py-2 border-t border-white/5 first:border-0">
        <div className="text-white/40 mt-1 flex-shrink-0 bg-white/5 p-1.5 rounded-lg border border-white/10 shadow-inner">{icon}</div>
        <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{label}</p>
            <p className="text-sm text-white font-semibold mt-0.5 break-words drop-shadow-sm">{value}</p>
        </div>
    </div>
);


/* ─── Main Page ───────────────────────────────────── */
const CitizenReports = () => {
    const navigate = useNavigate();
    const { isDepartment, isSeniorEngineer, isJuniorEngineer, department } = useAuth();
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [selectedIssue, setSelectedIssue] = useState(null);

    /* ── fetch ── */
    const fetchIssues = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: err } = await supabase
                .from('issues')
                .select('*')
                .order('created_at', { ascending: false });

            if (err) throw err;

            // Filter in Javascript — match on sector field OR issue_type string prefix
            // This handles both cases: data stored as sector:'roads' and issue_type:'Roads - Severe'
            const isDeptScoped = isDepartment || isSeniorEngineer || isJuniorEngineer;
            const filteredData = (isDeptScoped && department)
                ? (data || []).filter(i => {
                    const dept = department.toLowerCase();
                    const sectorMatch = (i.sector || '').toLowerCase() === dept;
                    const typeMatch = (i.issue_type || '').toLowerCase().startsWith(dept);
                    return sectorMatch || typeMatch;
                  })
                : (data || []);

            setIssues(filteredData);
        } catch (e) {
            console.error('Failed to fetch issues:', e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchIssues(); }, [fetchIssues]);

    /* ── inline status update ── */
    const handleStatusChange = useCallback(async (id, newStatus) => {
        // Optimistic update
        setIssues(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
        // Also update panel if open
        setSelectedIssue(prev => prev?.id === id ? { ...prev, status: newStatus } : prev);

        try {
            const { error: err } = await supabase
                .from('issues')
                .update({ status: newStatus })
                .eq('id', id);
            if (err) throw err;
        } catch (e) {
            console.error('Status update error:', e);
            alert('Update failed: ' + e.message);
            fetchIssues(); // revert by refetching
        }
    }, [fetchIssues]);

    /* ── derived stats ── */
    const stats = useMemo(() => ({
        total: issues.length,
        new: issues.filter(i => i.status === 'new').length,
        in_progress: issues.filter(i => i.status === 'in_progress').length,
        resolved: issues.filter(i => i.status === 'resolved').length,
    }), [issues]);

    /* ── unique issue types for filter ── */
    const issueTypes = useMemo(() => {
        const types = [...new Set(issues.map(i => i.issue_type).filter(Boolean))];
        return types.sort();
    }, [issues]);

    /* ── filtered list ── */
    const filtered = useMemo(() => {
        return issues.filter(i => {
            const statusOk = filterStatus === 'all' || i.status === filterStatus;
            const typeOk = filterType === 'all' || i.issue_type === filterType;
            return statusOk && typeOk;
        });
    }, [issues, filterStatus, filterType]);

    /* ─── render ─── */
    if (loading) {
        return (
            <div className="flex items-center justify-center h-80">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Loading citizen reports…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-80">
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
                    <p className="text-red-600 font-bold mb-3">Failed to load reports</p>
                    <p className="text-red-500 text-sm mb-4">{error}</p>
                    <button
                        onClick={fetchIssues}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-white drop-shadow-md flex items-center gap-3">
                        <Assignment sx={{ fontSize: 28 }} className="text-blue-400" />
                        Citizen Reports
                    </h1>
                    <p className="text-sm text-white/70 mt-1 font-medium">All submitted issues from citizens — live from Supabase</p>
                </div>
                <button
                    onClick={fetchIssues}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm font-bold text-white hover:bg-white/20 shadow-lg transition-all"
                >
                    <Refresh sx={{ fontSize: 18 }} className={loading ? 'animate-spin' : ''} />
                    Refresh Data
                </button>
            </div>

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Reports" value={stats.total} color="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30" Icon={Assignment} />
                <StatCard label="New" value={stats.new} color="bg-blue-500/20 text-blue-300 border border-blue-400/30" Icon={NewReleases} />
                <StatCard label="In Progress" value={stats.in_progress} color="bg-amber-500/20 text-amber-300 border border-amber-400/30" Icon={Schedule} />
                <StatCard label="Resolved" value={stats.resolved} color="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30" Icon={CheckCircle} />
            </div>

            {/* ── Filters ── */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg p-4 flex flex-wrap gap-3 items-center">
                <FilterList sx={{ fontSize: 20 }} className="text-white/60" />
                <span className="text-sm font-bold text-white/80">Filter by:</span>

                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="text-sm font-medium border border-white/20 rounded-xl px-4 py-2.5 bg-black/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 cursor-pointer appearance-none"
                >
                    <option value="all" className="bg-slate-900 text-white">All Statuses</option>
                    {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s} className="bg-slate-900 text-white">{STATUS_META[s].label}</option>
                    ))}
                </select>

                <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className="text-sm font-medium border border-white/20 rounded-xl px-4 py-2.5 bg-black/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 cursor-pointer appearance-none"
                >
                    <option value="all" className="bg-slate-900 text-white">All Issue Types</option>
                    {issueTypes.map(t => (
                        <option key={t} value={t} className="bg-slate-900 text-white">{t}</option>
                    ))}
                </select>

                {(filterStatus !== 'all' || filterType !== 'all') && (
                    <button
                        onClick={() => { setFilterStatus('all'); setFilterType('all'); }}
                        className="text-xs text-blue-300 font-bold hover:text-white hover:underline transition-colors"
                    >
                        Clear filters
                    </button>
                )}

                <span className="ml-auto text-xs text-white/50 font-bold bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 shadow-inner">
                    Showing {filtered.length} of {issues.length}
                </span>
            </div>

            {/* ── Professional Table ── */}
            <div className="bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/20 shadow-xl overflow-hidden mt-6">
                <div className="overflow-auto custom-scrollbar max-h-[65vh] min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#1a2235]/80 backdrop-blur-xl text-white/70 uppercase text-[10px] font-extrabold tracking-widest border-b border-white/10 sticky top-0 z-20 shadow-md">
                            <tr>
                                <th className="px-5 py-5">Issue ID</th>
                                <th className="px-5 py-5">Preview</th>
                                <th className="px-5 py-5">Type & Description</th>
                                <th className="px-5 py-5">Location</th>
                                <th className="px-5 py-5">Priority</th>
                                <th className="px-5 py-5">AI Verified</th>
                                <th className="px-5 py-5">Status</th>
                                <th className="px-5 py-5 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-20 text-center">
                                        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 shadow-inner">
                                            <Assignment sx={{ fontSize: 32 }} className="text-white/30 block" />
                                        </div>
                                        <p className="text-white font-bold text-lg drop-shadow-sm">No reports match your filters</p>
                                        <p className="text-white/50 mt-1 text-sm">Try adjusting your search criteria.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(issue => {
                                    const sm = STATUS_META[issue.status] || STATUS_META.new;
                                    const pm = PRIORITY_META[(issue.priority || '').toLowerCase()] || PRIORITY_META.low;

                                    // Determine AI verification from ai_analysis field
                                    const aiAnalysis = issue.ai_analysis || {};
                                    const pv = aiAnalysis.photoVerification;
                                    const confidence = aiAnalysis.confidence || pv?.confidence || null;

                                    return (
                                        <tr
                                            key={issue.id}
                                            onClick={() => navigate(`/issues/${issue.id}`)}
                                            className="hover:bg-white/5 transition-colors cursor-pointer group"
                                        >
                                            {/* Issue ID */}
                                            <td className="px-5 py-4">
                                                <span className="text-emerald-400 font-bold text-xs group-hover:text-emerald-300 group-hover:underline drop-shadow-sm transition-colors">
                                                    #{String(issue.id).slice(-6).toUpperCase()}
                                                </span>
                                            </td>

                                            {/* Photo Preview */}
                                            <td className="px-5 py-4">
                                                <div className="w-12 h-12 rounded-xl bg-white/10 overflow-hidden border border-white/20 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/20 transition-all">
                                                    {issue.photo_url ? (
                                                        <img src={issue.photo_url} alt="Preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    ) : (
                                                        <ImageIcon className="text-white/30" sx={{ fontSize: 24 }} />
                                                    )}
                                                </div>
                                            </td>

                                            {/* Type & Description */}
                                            <td className="px-5 py-4 max-w-[280px]">
                                                <span className="text-[10px] font-bold text-blue-200 bg-blue-500/20 border border-blue-400/30 px-2 py-1 rounded uppercase tracking-wide shadow-sm">
                                                    {issue.issue_type || 'General'}
                                                </span>
                                                <p className="text-sm text-white font-medium truncate mt-2 group-hover:text-blue-100 transition-colors drop-shadow-sm">
                                                    {issue.description || '—'}
                                                </p>
                                            </td>

                                            {/* Location */}
                                            <td className="px-5 py-4 max-w-[180px]">
                                                <div className="flex items-start gap-1.5 text-xs text-white/70">
                                                    <LocationOn sx={{ fontSize: 14 }} className="text-white/40 flex-shrink-0 mt-0.5" />
                                                    <span className="truncate group-hover:text-white/90 transition-colors">{issue.location_address || '—'}</span>
                                                </div>
                                            </td>

                                            {/* Priority */}
                                            <td className="px-5 py-4">
                                                <span className={`text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg border shadow-sm inline-block text-center min-w-[70px] ${pm}`}>
                                                    {issue.priority || 'Low'}
                                                </span>
                                            </td>

                                            {/* AI Verified */}
                                            <td className="px-5 py-4">
                                                {(() => {
                                                    if (!pv) return (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-white/10 border border-white/20 text-white/80 shadow-sm">
                                                            ⏳ Pending
                                                        </span>
                                                    );
                                                    return pv.isValid ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-green-500/20 border border-green-400/30 text-green-300 shadow-[0_0_10px_rgba(74,222,128,0.2)]" title={pv.reason}>
                                                            ✅ Verified
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-red-500/20 border border-red-400/30 text-red-300 shadow-[0_0_10px_rgba(248,113,113,0.2)]" title={pv.reason}>
                                                            ⚠️ Suspicious
                                                        </span>
                                                    );
                                                })()}
                                                {confidence && (
                                                    <div className="w-20 mt-2">
                                                        <div className="flex justify-between text-[9px] font-bold text-white/60 mb-1">
                                                            <span>{(confidence * 100).toFixed(0)}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden shadow-inner">
                                                            <div
                                                                className={`h-full rounded-full ${(confidence * 100) > 80 ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : (confidence * 100) > 50 ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'}`}
                                                                style={{ width: `${confidence * 100}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sm.dot}`} />
                                                    <select
                                                        value={issue.status || 'new'}
                                                        onChange={e => handleStatusChange(issue.id, e.target.value)}
                                                        className="text-xs font-bold border border-white/20 rounded-lg px-2.5 py-1.5 bg-black/40 text-white min-w-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 cursor-pointer appearance-none shadow-sm"
                                                    >
                                                        {STATUS_OPTIONS.map(s => (
                                                            <option key={s} value={s} className="bg-slate-900 text-white">{STATUS_META[s].label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                                                {(issue.status === 'new' || issue.status === 'in_progress') ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleStatusChange(issue.id, 'accepted')}
                                                            title="Accept Issue"
                                                            className="p-1.5 rounded-xl bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30 transition-colors shadow-lg hover:-translate-y-0.5"
                                                        >
                                                            <CheckIcon sx={{ fontSize: 16 }} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('Reject this issue?')) handleStatusChange(issue.id, 'rejected');
                                                            }}
                                                            title="Reject Issue"
                                                            className="p-1.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-colors shadow-lg hover:-translate-y-0.5"
                                                        >
                                                            <RejectIcon sx={{ fontSize: 16 }} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className={`text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg border inline-block text-center shadow-sm w-full ${sm.color}`}>
                                                        {sm.label}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-400 font-medium">
                    {filtered.length} report{filtered.length !== 1 ? 's' : ''} displayed
                    {filterStatus !== 'all' || filterType !== 'all' ? ` (filtered from ${issues.length} total)` : ''}
                </div>
            </div>

            {/* ── Side Panel ── */}
            {selectedIssue && (
                <DetailPanel
                    issue={selectedIssue}
                    onClose={() => setSelectedIssue(null)}
                    onStatusChange={handleStatusChange}
                    onViewFull={() => {
                        console.log("Navigating to issue:", selectedIssue.id);
                        navigate(`/issues/${selectedIssue.id}`);
                    }}
                />
            )}
        </div>
    );
};

export default CitizenReports;
