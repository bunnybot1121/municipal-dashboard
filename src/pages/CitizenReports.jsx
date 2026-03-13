import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
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
    new: { label: 'New', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', Icon: NewReleases },
    in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', Icon: Schedule },
    accepted: { label: 'Accepted', color: 'bg-green-100 text-green-700', dot: 'bg-green-500', Icon: CheckCircle },
    resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', Icon: CheckCircle },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', dot: 'bg-red-400', Icon: Block },
    closed: { label: 'Closed', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400', Icon: Block },
};

const PRIORITY_META = {
    critical: 'bg-red-100 text-red-700 border border-red-200',
    high: 'bg-orange-100 text-orange-700 border border-orange-200',
    medium: 'bg-blue-100 text-blue-700 border border-blue-200',
    low: 'bg-gray-100 text-gray-600 border border-gray-200',
};

const fmt = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
};


/* ─── Stats Card ──────────────────────────────────── */
const StatCard = ({ label, value, color, Icon }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon sx={{ fontSize: 24 }} />
        </div>
        <div>
            <p className="text-3xl font-extrabold text-gray-800">{value}</p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-0.5">{label}</p>
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
    const scoreColor = aiResult?.score >= 85 ? '#EF4444' : aiResult?.score >= 60 ? '#F97316' : aiResult?.score >= 40 ? '#EAB308' : '#10B981';
    const scoreBg = aiResult?.score >= 85 ? 'bg-red-100 text-red-700' : aiResult?.score >= 60 ? 'bg-orange-100 text-orange-700' : aiResult?.score >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700';

    const signals = aiResult?.advancedAnalysis?.signals || {};
    const dims = aiResult?.advancedAnalysis?.dimensions || {};

    // const CAT_ROWS = [...]; // Removed 9-Category breakdown per user request

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 z-40 transition-opacity"
                onClick={onClose}
            />
            {/* Panel */}
            <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
                style={{ animation: 'slideInRight 0.25s ease-out' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div>
                        <h2 className="text-base font-extrabold text-gray-800">Issue Details</h2>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">#{String(issue.id).slice(0, 8).toUpperCase()}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
                    >
                        <Close sx={{ fontSize: 20 }} />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto">
                    {/* Photo */}
                    <div className="relative h-56 bg-gray-200">
                        {issue.photo_url ? (
                            <img
                                src={issue.photo_url}
                                alt="Issue"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                <ImageIcon sx={{ fontSize: 48 }} />
                                <p className="text-sm mt-2">No photo attached</p>
                            </div>
                        )}
                        {/* Priority badge overlay */}
                        <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase shadow ${pm}`}>
                            {issue.priority || 'Low'}
                        </span>
                    </div>

                    <div className="px-6 py-5 space-y-5">
                        {/* Issue type + description */}
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">
                                {issue.issue_type || 'General'}
                            </span>
                            <p className="text-sm text-gray-700 mt-3 leading-relaxed">{issue.description || 'No description provided.'}</p>
                        </div>

                        {/* Status update */}
                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Update Status</p>
                            <div className="flex items-center gap-3">
                                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${sm.dot}`} />
                                <select
                                    value={issue.status}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    disabled={savingStatus}
                                    className="flex-1 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60"
                                >
                                    {STATUS_OPTIONS.map(s => (
                                        <option key={s} value={s}>{STATUS_META[s]?.label || s}</option>
                                    ))}
                                </select>
                                {savingStatus && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />}
                            </div>
                        </div>

                        {/* Info rows */}
                        <div className="space-y-3">
                            <InfoRow icon={<Person sx={{ fontSize: 16 }} />} label="Citizen" value={issue.citizen_name || 'Anonymous'} />
                            <InfoRow icon={<Phone sx={{ fontSize: 16 }} />} label="Phone" value={issue.citizen_phone || '—'} />
                            <InfoRow icon={<LocationOn sx={{ fontSize: 16 }} />} label="Address" value={issue.location_address || '—'} />
                            {(issue.latitude && issue.longitude) && (
                                <InfoRow icon={<LocationOn sx={{ fontSize: 16 }} />} label="GPS" value={`${Number(issue.latitude).toFixed(5)}, ${Number(issue.longitude).toFixed(5)}`} />
                            )}
                            <InfoRow icon={<CalendarToday sx={{ fontSize: 16 }} />} label="Reported" value={fmt(issue.created_at)} />
                        </div>

                        {/* ── AI Analysis Section ── */}
                        <div className="border-t border-gray-100 pt-4 space-y-4">
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">
                                🤖 145-Signal AI Analysis
                            </p>

                            {aiResult && (
                                <>
                                    {/* Score bar */}
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-semibold text-gray-600">Priority Score</span>
                                            <span className={`text-xs font-extrabold px-2 py-0.5 rounded-lg ${scoreBg}`}>
                                                {aiResult.score}/100 · {aiResult.label}
                                            </span>
                                        </div>
                                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${aiResult.score}%`, backgroundColor: scoreColor }}
                                            />
                                        </div>
                                    </div>

                                    {/* Top signals */}
                                    {aiResult.advancedAnalysis?.explanation && (
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Top Signals Detected</p>
                                            <p className="text-sm text-indigo-800 font-medium">{aiResult.advancedAnalysis.explanation}</p>
                                        </div>
                                    )}

                                    {/* Category breakdown removed per user request */}

                                    {/* 7D Dimensions */}
                                    <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100">
                                        {[
                                            ['Sector Assessment', dims.sector],
                                            ['Event Risk', dims.event],
                                            ['Severity Level', dims.severity],
                                            ['Time Boost', dims.timeBoost != null ? `+${dims.timeBoost} pts` : null],
                                            ['Location Boost', dims.locationBoost != null ? `+${dims.locationBoost} pts` : null],
                                        ].filter(([, v]) => v != null).map(([k, v]) => (
                                            <div key={k} className="flex justify-between px-3 py-2 text-xs">
                                                <span className="text-gray-500 font-medium">{k}</span>
                                                <span className="font-bold text-gray-800">{v}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Escalation */}
                                    {aiResult.advancedAnalysis?.escalation && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Escalation Target</p>
                                            <p className="text-sm font-bold text-amber-900 mt-0.5">{aiResult.advancedAnalysis.escalation}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer CTA */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
                    {/* Accept / Reject quick actions */}
                    {(issue.status === 'new' || issue.status === 'in_progress') && (
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                disabled={savingStatus}
                                onClick={() => handleStatusChange('accepted')}
                                className="flex items-center justify-center gap-1.5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-colors shadow-md shadow-green-200"
                            >
                                <CheckIcon sx={{ fontSize: 16 }} /> Accept
                            </button>
                            <button
                                disabled={savingStatus}
                                onClick={() => {
                                    if (window.confirm('Reject this citizen issue?')) handleStatusChange('rejected');
                                }}
                                className="flex items-center justify-center gap-1.5 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-colors shadow-md shadow-red-200"
                            >
                                <RejectIcon sx={{ fontSize: 16 }} /> Reject
                            </button>
                        </div>
                    )}
                    <button
                        onClick={onViewFull}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                    >
                        Open Full Issue Page <Assignment sx={{ fontSize: 16 }} />
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
    <div className="flex items-start gap-3 py-2 border-t border-gray-100 first:border-0">
        <div className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="text-sm text-gray-800 font-medium mt-0.5 break-words">{value}</p>
        </div>
    </div>
);


/* ─── Main Page ───────────────────────────────────── */
const CitizenReports = () => {
    const navigate = useNavigate();
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
            setIssues(data || []);
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
                    <h1 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                        <Assignment sx={{ fontSize: 22 }} className="text-indigo-500" />
                        Citizen Reports
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">All submitted issues from citizens — live from Supabase</p>
                </div>
                <button
                    onClick={fetchIssues}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
                >
                    <Refresh sx={{ fontSize: 16 }} />
                    Refresh
                </button>
            </div>

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Reports" value={stats.total} color="bg-indigo-50 text-indigo-600" Icon={Assignment} />
                <StatCard label="New" value={stats.new} color="bg-blue-50 text-blue-600" Icon={NewReleases} />
                <StatCard label="In Progress" value={stats.in_progress} color="bg-amber-50 text-amber-600" Icon={Schedule} />
                <StatCard label="Resolved" value={stats.resolved} color="bg-green-50 text-green-600" Icon={CheckCircle} />
            </div>

            {/* ── Filters ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
                <FilterList sx={{ fontSize: 18 }} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-600">Filter by:</span>

                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                >
                    <option value="all">All Statuses</option>
                    {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{STATUS_META[s].label}</option>
                    ))}
                </select>

                <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                >
                    <option value="all">All Issue Types</option>
                    {issueTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>

                {(filterStatus !== 'all' || filterType !== 'all') && (
                    <button
                        onClick={() => { setFilterStatus('all'); setFilterType('all'); }}
                        className="text-xs text-indigo-600 font-semibold hover:underline"
                    >
                        Clear filters
                    </button>
                )}

                <span className="ml-auto text-xs text-gray-400 font-medium">
                    Showing {filtered.length} of {issues.length}
                </span>
            </div>

            {/* ── Professional Table ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-extrabold tracking-widest border-b border-gray-200">
                            <tr>
                                <th className="px-5 py-4">Issue ID</th>
                                <th className="px-5 py-4">Preview</th>
                                <th className="px-5 py-4">Type & Description</th>
                                <th className="px-5 py-4">Location</th>
                                <th className="px-5 py-4">Priority</th>
                                <th className="px-5 py-4">AI Verified</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-16 text-center">
                                        <Assignment sx={{ fontSize: 40 }} className="text-gray-200 mx-auto mb-2 block" />
                                        <p className="text-gray-400 font-semibold text-sm">No reports match your filters</p>
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
                                            className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                                        >
                                            {/* Issue ID */}
                                            <td className="px-5 py-4">
                                                <span className="text-[#5B52FF] font-bold text-xs group-hover:underline">
                                                    #{String(issue.id).slice(-6).toUpperCase()}
                                                </span>
                                            </td>

                                            {/* Photo Preview */}
                                            <td className="px-5 py-4">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-200 flex items-center justify-center shadow-sm">
                                                    {issue.photo_url ? (
                                                        <img src={issue.photo_url} alt="Preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="text-gray-400" sx={{ fontSize: 20 }} />
                                                    )}
                                                </div>
                                            </td>

                                            {/* Type & Description */}
                                            <td className="px-5 py-4 max-w-[280px]">
                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wide">
                                                    {issue.issue_type || 'General'}
                                                </span>
                                                <p className="text-sm text-gray-800 font-medium truncate mt-1 group-hover:text-indigo-700 transition-colors">
                                                    {issue.description || '—'}
                                                </p>
                                            </td>

                                            {/* Location */}
                                            <td className="px-5 py-4 max-w-[180px]">
                                                <div className="flex items-start gap-1 text-xs text-gray-500">
                                                    <LocationOn sx={{ fontSize: 13 }} className="text-gray-400 flex-shrink-0 mt-0.5" />
                                                    <span className="truncate">{issue.location_address || '—'}</span>
                                                </div>
                                            </td>

                                            {/* Priority */}
                                            <td className="px-5 py-4">
                                                <span className={`text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded border inline-block text-center min-w-[70px] ${pm}`}>
                                                    {issue.priority || 'Low'}
                                                </span>
                                            </td>

                                            {/* AI Verified */}
                                            <td className="px-5 py-4">
                                                {(() => {
                                                    if (!pv) return (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-400">
                                                            ⏳ Pending
                                                        </span>
                                                    );
                                                    return pv.isValid ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700" title={pv.reason}>
                                                            ✅ Verified
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700" title={pv.reason}>
                                                            ⚠️ Suspicious
                                                        </span>
                                                    );
                                                })()}
                                                {confidence && (
                                                    <div className="w-20 mt-1.5">
                                                        <div className="flex justify-between text-[9px] font-bold text-gray-500 mb-0.5">
                                                            <span>{(confidence * 100).toFixed(0)}%</span>
                                                        </div>
                                                        <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${(confidence * 100) > 80 ? 'bg-green-500' : (confidence * 100) > 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                                                style={{ width: `${confidence * 100}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sm.dot}`} />
                                                    <select
                                                        value={issue.status || 'new'}
                                                        onChange={e => handleStatusChange(issue.id, e.target.value)}
                                                        className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer w-full max-w-[120px]"
                                                    >
                                                        {STATUS_OPTIONS.map(s => (
                                                            <option key={s} value={s}>{STATUS_META[s].label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                                                {(issue.status === 'new' || issue.status === 'in_progress') ? (
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            onClick={() => handleStatusChange(issue.id, 'accepted')}
                                                            title="Accept Issue"
                                                            className="p-1.5 rounded-full bg-green-50 border border-green-200 text-green-600 hover:bg-green-100 transition-colors shadow-sm"
                                                        >
                                                            <CheckIcon sx={{ fontSize: 15 }} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('Reject this issue?')) handleStatusChange(issue.id, 'rejected');
                                                            }}
                                                            title="Reject Issue"
                                                            className="p-1.5 rounded-full bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-colors shadow-sm"
                                                        >
                                                            <RejectIcon sx={{ fontSize: 15 }} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${sm.color}`}>
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
