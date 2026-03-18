import React, { useState, useEffect } from 'react'; // v2.1 Hybrid Dashboard
import { useNavigate } from 'react-router-dom';
import { fetchTasksFromSupabase } from '../services/taskService';
import { calculatePriorityScore } from '../utils/aiPriority';
import { useIssues } from '../hooks/useIssues';
import { AlertCircle, Loader, RefreshCw, BarChart2, Clock, CheckCircle, List, Activity, Map as MapIcon, Wifi, Filter, ChevronDown, ChevronRight, X, Brain, TrendingUp, Shield, MapPin, Users, Zap, Wrench, Scale, MinusCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import EnhancedMap from '../components/EnhancedMap';
import { fetchSensorReadings, subscribeSensorUpdates } from '../services/sensorService';

/* ── Citizen Analysis Side Panel ──────────────────────── */
function CitizenAnalysisPanel({ issue, onClose, onViewFull }) {
    const a = issue.calculatedPriority;
    const signals = a?.advancedAnalysis?.signals || {};
    const dims = a?.advancedAnalysis?.dimensions || {};

    // const CAT_ROWS = [...]; // Removed duplicate breakdown per user request

    const scoreColor = a?.score >= 85 ? '#EF4444' : a?.score >= 60 ? '#F97316' : a?.score >= 40 ? '#EAB308' : '#10B981';
    const scoreBg = a?.score >= 85 ? 'bg-red-100 text-red-700' : a?.score >= 60 ? 'bg-orange-100 text-orange-700' : a?.score >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700';

    return (
        <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
            <div
                className="fixed top-0 right-0 h-full w-full max-w-[420px] bg-white/10 backdrop-blur-2xl border-l border-white/20 shadow-2xl z-50 flex flex-col text-white"
                style={{ animation: 'slideInRight 0.22s ease-out' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/5">
                    <div>
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest drop-shadow-sm">145-Signal AI Analysis</p>
                        <h2 className="font-bold text-white text-lg mt-0.5 line-clamp-1 drop-shadow-sm">{issue.title}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Photo + score overlay */}
                    <div className="relative h-48 bg-black/20 border-b border-white/10">
                        {issue.photo_url
                            ? <img src={issue.photo_url} alt={issue.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">No Photo Available</div>
                        }
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/50 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between">
                            <div>
                                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">AI Priority Score</p>
                                <p className="text-white text-5xl font-black drop-shadow-lg">{a?.score ?? '—'}<span className="text-xl font-medium text-white/50 ml-1">/100</span></p>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${scoreBg.replace('bg-', 'bg-').replace('text-', 'text-').replace('-100', '-500/20').replace('-700', '-300').replace('-800', '-300').concat(' border-current/30')}`}>
                                {a?.label ?? 'Calculating'}
                            </span>
                        </div>
                    </div>

                    <div className="px-6 py-5 space-y-6">
                        {/* Score bar */}
                        <div>
                            <div className="flex justify-between text-xs text-white/60 mb-2 uppercase tracking-wider">
                                <span className="font-semibold">Overall Priority</span>
                                <span className="font-bold text-white">{a?.score ?? 0}/100</span>
                            </div>
                            <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{ width: `${a?.score ?? 0}%`, backgroundColor: scoreColor }}
                                />
                            </div>
                        </div>

                        {/* Top signals explanation */}
                        {a?.advancedAnalysis?.explanation && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <Brain size={12} /> Top Signals Detected
                                </p>
                                <p className="text-sm text-emerald-100/90 font-medium leading-relaxed">{a.advancedAnalysis.explanation}</p>
                            </div>
                        )}

                        {/* 7D Dimensions */}
                        <div>
                            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3">7D Framework Output</p>
                            <div className="bg-white/5 rounded-2xl border border-white/10 divide-y divide-white/5 overflow-hidden">
                                {[
                                    ['Department Assessment', dims.sector],
                                    ['Event Risk', dims.event],
                                    ['Severity Level', dims.severity],
                                    ['Time Boost', dims.timeBoost != null ? `+${dims.timeBoost} pts` : null],
                                    ['Location Boost', dims.locationBoost != null ? `+${dims.locationBoost} pts` : null],
                                    ['Impact Score', dims.impactScore != null ? `${dims.impactScore} pts` : null],
                                ].map(([k, v]) => v != null && (
                                    <div key={k} className="flex justify-between px-4 py-3 text-xs hover:bg-white/5 transition-colors">
                                        <span className="text-white/60 font-medium">{k}</span>
                                        <span className="font-bold text-white/90">{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Escalation */}
                        {a?.advancedAnalysis?.escalation && (
                            <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-start gap-3">
                                <TrendingUp size={16} className="text-orange-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold text-orange-400/80 uppercase tracking-widest mb-1">Escalation Target</p>
                                    <p className="text-sm font-bold text-orange-200 mt-0.5">{a.advancedAnalysis.escalation}</p>
                                </div>
                            </div>
                        )}

                        {/* Meta info */}
                        <div className="bg-white/5 rounded-2xl border border-white/10 divide-y divide-white/5 overflow-hidden mt-6">
                            {[
                                ['Department', issue.sector],
                                ['Status', issue.status],
                                ['Reported', new Date(issue.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
                                ['Address', issue.address || issue.location?.address || '—'],
                            ].map(([k, v]) => (
                                <div key={k} className="flex justify-between px-4 py-3 text-xs hover:bg-white/5 transition-colors">
                                    <span className="text-white/60 font-medium">{k}</span>
                                    <span className="font-bold text-white/90 text-right max-w-[65%] truncate">{v || '—'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer CTA */}
                <div className="px-6 py-5 border-t border-white/10 bg-white/5 shrink-0">
                    <button
                        onClick={onViewFull}
                        className="w-full py-3.5 liquid-btn liquid-btn-emerald rounded-xl font-bold text-sm"
                    >
                        Open Full Detail Page →
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
            `}</style>
        </>
    );
}

export default function Dashboard() {
    const [tasks, setTasks] = useState([]);
    const [citizenIssues, setCitizenIssues] = useState([]); // This will hold the processed issues
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [sensors, setSensors] = useState([]);
    const [sensorsLoading, setSensorsLoading] = useState(true);
    const [sensorsError, setSensorsError] = useState(null);
    const [error, setError] = useState('');
    const { city, isAdmin, isDepartment, department } = useAuth();
    const navigate = useNavigate();

    // Custom Hook for Real-time Issues
    const { issues: realTimeIssues, loading: issuesLoading } = useIssues();

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [citizenPanelOpen, setCitizenPanelOpen] = useState(false); // collapsed by default
    const [selectedCitizenIssue, setSelectedCitizenIssue] = useState(null); // for analysis panel

    // 1. Fetch Tasks (One-time or on City change)
    useEffect(() => {
        loadTasks();
    }, [city]);

    // 1b. Fetch Real Sensor Data + Subscribe to real-time updates
    useEffect(() => {
        setSensorsLoading(true);
        setSensorsError(null);
        fetchSensorReadings()
            .then(data => {
                const relevant = isDepartment ? data.filter(s => s.sector === department || (s.type === 'ultrasonic' && department === 'waste') || (s.type === 'gas' && department === 'safety')) : data;
                setSensors(relevant);
                setSensorsLoading(false);
            })
            .catch(err => {
                console.error('❌ Sensor load error:', err);
                setSensorsError('Could not reach sensor hardware.');
                setSensorsLoading(false);
            });

        const unsubscribe = subscribeSensorUpdates((newReading) => {
            setSensors(prev => {
                const idx = prev.findIndex(s => s.id === newReading.id);
                if (idx >= 0) {
                    const updated = [...prev];
                    updated[idx] = newReading;
                    return updated;
                }
                return [newReading, ...prev];
            });
        });
        return () => unsubscribe();
    }, []);

    async function loadTasks() {
        setLoadingTasks(true);
        setError('');
        const currentCityId = city || 'Khargar';
        try {
            const realTasks = await fetchTasksFromSupabase(currentCityId);
            const filteredTasks = isDepartment ? realTasks.filter(t => (t.sector || '').toLowerCase() === (department || '').toLowerCase()) : realTasks;
            setTasks(filteredTasks || []);
        } catch (err) {
            setError(`Failed to load tasks: ${err.message}`);
            console.error('âŒ DASHBOARD TASK LOAD ERROR:', err);
        } finally {
            setLoadingTasks(false);
        }
    }

    // 2. Process Real-time Issues when they change
    useEffect(() => {
        if (realTimeIssues.length > 0) {
            const relevantIssues = isDepartment 
                ? realTimeIssues.filter(i => (i.sector || '').toLowerCase() === (department || '').toLowerCase())
                : realTimeIssues;

            // Apply 145-Signal Priority Analysis
            const analyzedIssues = relevantIssues.map(issue => {
                // If backend already has score, use it, otherwise calculate frontend fallback
                // The hook already maps `calculatedPriority` but let's ensure consistency
                const priorityAnalysis = issue.calculatedPriority || calculatePriorityScore({
                    title: issue.title,
                    description: issue.description,
                    sector: issue.sector,
                    severity: issue.priority, // map priority to severity for calc
                    createdAt: issue.created_at
                });

                return { ...issue, calculatedPriority: priorityAnalysis };
            });

            // SORTING: AI Priority Score (Desc), then Created At (Desc)
            const sortedIssues = analyzedIssues.sort((a, b) => {
                const scoreA = a.calculatedPriority?.score || 0;
                const scoreB = b.calculatedPriority?.score || 0;
                if (scoreB !== scoreA) return scoreB - scoreA;
                return new Date(b.created_at) - new Date(a.created_at);
            });

            setCitizenIssues(sortedIssues);
        } else {
            setCitizenIssues([]);
        }
    }, [realTimeIssues]);

    // FILTERING
    const filteredIssues = citizenIssues.filter(issue => {
        if (statusFilter === 'all') return true;
        return issue.status === statusFilter;
    });

    // Helper to check if a task matches the SELECTED date
    const isSelectedDate = (dateString) => {
        if (!dateString) return false;
        const taskDate = new Date(dateString).toISOString().split('T')[0];
        return taskDate === selectedDate;
    };

    const todaysTasks = tasks.filter(t => isSelectedDate(t.scheduled_start));

    // Map markers from Real Issues + Real Tasks
    const KHARGAR_CENTER = { lat: 19.0298, lng: 73.0588 }; // Khargar Coords

    // Default locations for task sectors to distribute them on map
    const SECTOR_LOCATIONS = {
        water: { lat: 19.035, lng: 73.065 },
        waste: { lat: 19.025, lng: 73.070 },
        lighting: { lat: 19.040, lng: 73.050 },
        drainage: { lat: 19.020, lng: 73.055 },
        roads: { lat: 19.030, lng: 73.045 },
        sanitation: { lat: 19.015, lng: 73.060 },
        parks: { lat: 19.038, lng: 73.075 },
        power: { lat: 19.042, lng: 73.062 },
        buildings: { lat: 19.028, lng: 73.080 }
    };

    const mapMarkers = [
        ...filteredIssues.map((i) => ({
            id: i.id,
            lat: i.location?.lat || KHARGAR_CENTER.lat,
            lng: i.location?.lng || KHARGAR_CENTER.lng,
            title: i.title,
            priority: i.priority,
            type: 'Issue'
        })),
        ...todaysTasks.map((t, idx) => {
            const sectorBase = SECTOR_LOCATIONS[t.sector?.toLowerCase()] || KHARGAR_CENTER;
            // Add a small jitter so multiple tasks in same sector don't overlap perfectly
            const jitterLat = (Math.random() - 0.5) * 0.008;
            const jitterLng = (Math.random() - 0.5) * 0.008;

            return {
                id: t.id || `task-${idx}`,
                lat: t.lat || (sectorBase.lat + jitterLat),
                lng: t.lng || (sectorBase.lng + jitterLng),
                title: `Task: ${t.title}`,
                priority: t.priority || 'medium',
                type: 'Schedule',
                sector: t.sector
            };
        }),
        ...sensors.map((s) => ({
            id: s.id,
            lat: s.location?.lat || KHARGAR_CENTER.lat,
            lng: s.location?.lng || KHARGAR_CENTER.lng,
            title: s.label,
            priority: s.status === 'critical' ? 'critical' : 'low',
            type: 'Sensor'
        }))
    ];

    const overallLoading = loadingTasks || (issuesLoading && citizenIssues.length === 0);

    if (overallLoading && citizenIssues.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-700 font-medium">Loading real-time data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <p className="text-red-900 font-semibold text-center mb-4">{error}</p>
                    <button
                        onClick={loadTasks}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen p-6 animate-fade-in text-white">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold flex items-center gap-2 drop-shadow-md">
                                    Dashboard
                                    <span className="flex items-center gap-1.5 text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full border border-emerald-500/30">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        v2.3 Live
                                    </span>
                                </h1>
                                <p className="text-white/70 mt-1 drop-shadow-sm">{city || 'Khargar'}</p>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Status Filter */}
                                <div className="bg-white/5 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 shadow-lg flex items-center gap-2">
                                    <Filter size={16} className="text-white/70" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="outline-none text-white font-medium bg-transparent text-sm appearance-none [&>option]:text-gray-900"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="new">New</option>
                                        <option value="assigned">Assigned</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>

                                {/* Date Picker Control */}
                                <div className="bg-white/5 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 shadow-lg flex items-center gap-2">
                                    <span className="text-sm text-white/70 font-medium">View Date:</span>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="outline-none text-white font-bold bg-transparent [color-scheme:dark]"
                                        style={{ maxWidth: '130px' }}
                                    />
                                </div>

                                <button
                                    onClick={loadTasks}
                                    className="flex items-center gap-2 px-4 py-2 liquid-btn liquid-btn-white rounded-xl font-medium"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Refresh
                                </button>
                            </div>
                        </div>

                        {/* Connection Status: Compact & Integrated */}
                    </div>

                    <div className="mb-6">
                        {/* Collapsible Header */}
                        <button
                            onClick={() => setCitizenPanelOpen(o => !o)}
                            className="w-full flex items-center justify-between liquid-btn liquid-btn-white rounded-[2rem] px-6 py-4"
                        >
                            <span className="flex items-center gap-2 font-semibold text-white">
                                <AlertCircle size={18} className="text-red-400" />
                                Citizen Reports
                                <span className="ml-1 bg-red-500/20 text-red-200 border border-red-500/30 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {filteredIssues.length}
                                </span>
                                {issuesLoading && <Loader className="w-4 h-4 animate-spin text-white/50" />}
                            </span>
                            <span className="text-white/60">
                                {citizenPanelOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </span>
                        </button>

                        {/* Expandable compact list */}
                        {citizenPanelOpen && (
                            <div className="mt-3 bg-white/5 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-lg overflow-hidden">
                                {filteredIssues.length === 0 ? (
                                    <div className="p-6 text-center text-white/80 text-sm">
                                        No issues found matching current filters.
                                    </div>
                                ) : (
                                    <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
                                        <table className="w-full text-sm">
                                            <thead className="bg-white/5 sticky top-0 border-b border-white/10">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-white/90 uppercase">Priority</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-white/90 uppercase">Title</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-white/90 uppercase hidden md:table-cell">Department</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-white/90 uppercase hidden md:table-cell">Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-white/90 uppercase hidden lg:table-cell">Date</th>
                                                    <th className="px-6 py-3"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/10">
                                                {filteredIssues.map((issue) => (
                                                    <tr
                                                        key={issue.id}
                                                        onClick={() => setSelectedCitizenIssue(issue)}
                                                        className="hover:bg-white/5 transition-colors cursor-pointer"
                                                    >
                                                        <td className="px-6 py-3">
                                                            <span className={`px-2 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${issue.calculatedPriority.label === 'Crisis' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                                                                issue.calculatedPriority.label === 'Critical' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                                                                    issue.calculatedPriority.label === 'Moderate' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                                                                        'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                                                }`}>
                                                                {issue.calculatedPriority.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3 font-medium text-white max-w-[200px] truncate">
                                                            {issue.status === 'new' && (
                                                                <span className="mr-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full">NEW</span>
                                                            )}
                                                            {issue.title}
                                                        </td>
                                                        <td className="px-6 py-3 text-white/90 capitalize hidden md:table-cell">{issue.sector}</td>
                                                        <td className="px-6 py-3 hidden md:table-cell">
                                                            <span className={`text-[10px] font-semibold px-2 py-1 rounded-full uppercase border ${issue.status === 'resolved' ? 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10' :
                                                                issue.status === 'in_progress' ? 'border-blue-500/30 text-blue-300 bg-blue-500/10' :
                                                                    issue.status === 'rejected' ? 'border-red-500/30 text-red-300 bg-red-500/10' :
                                                                        'border-white/30 text-white/90 bg-white/10'
                                                                }`}>
                                                                {issue.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3 text-white/80 text-xs hidden lg:table-cell">
                                                            {new Date(issue.created_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-3" onClick={e => e.stopPropagation()}>
                                                            <button
                                                                onClick={() => setSelectedCitizenIssue(issue)}
                                                                className="text-emerald-400 text-xs font-semibold hover:text-emerald-300 transition-colors whitespace-nowrap"
                                                            >
                                                                Analyse &rarr;
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* LIVE MONITORING SECTION */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 drop-shadow-md">
                            <Activity className="text-emerald-400" />
                            Live Operational View
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Map */}
                            <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/20 p-5 rounded-[2rem] shadow-lg h-[500px]">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-white/90 flex items-center gap-2">
                                        <MapIcon size={18} /> Geospatial Overview
                                    </h3>
                                    <div className="flex gap-2">
                                        <span className="text-xs px-2 py-1 bg-red-500/20 border border-red-500/30 text-red-300 rounded-full">Critical</span>
                                        <span className="text-xs px-2 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-full">Normal</span>
                                    </div>
                                </div>
                                <div className="rounded-xl overflow-hidden border border-white/10">
                                    <EnhancedMap markers={mapMarkers} height="400px" center={KHARGAR_CENTER} />
                                </div>
                            </div>

                            {/* Sensor Panel */}
                            <div className="space-y-4">
                                <div className="bg-white/5 backdrop-blur-xl border border-white/20 p-5 rounded-[2rem] shadow-lg h-[500px] flex flex-col">
                                    <h3 className="font-semibold text-white/90 mb-4 flex items-center gap-2 shrink-0">
                                        <Wifi size={18} /> IoT Sensor Status
                                    </h3>
                                    <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                        {sensorsLoading ? (
                                            <div className="p-4 flex flex-col items-center gap-2 text-white/50 text-sm">
                                                <Loader className="w-5 h-5 animate-spin" />
                                                <span>Connecting to sensors…</span>
                                            </div>
                                        ) : sensorsError ? (
                                            <div className="p-4 text-center">
                                                <p className="text-red-400 text-xs font-medium mb-2">{sensorsError}</p>
                                                <button
                                                    onClick={() => {
                                                        setSensorsLoading(true);
                                                        setSensorsError(null);
                                                        fetchSensorReadings().then(d => { setSensors(d); setSensorsLoading(false); }).catch(e => { setSensorsError('Could not reach sensor hardware.'); setSensorsLoading(false); });
                                                    }}
                                                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                                                >Retry</button>
                                            </div>
                                        ) : sensors.length === 0 ? (
                                            <div className="p-4 text-center text-white/50 text-sm">No sensor data available.</div>
                                        ) : null}
                                        {sensors.map(sensor => (
                                            <div key={sensor.id} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/10 transition-colors">
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-xs font-bold text-white/50 uppercase tracking-widest">{sensor.type}</span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sensor.status === 'critical' ? 'bg-red-500/20 border-red-500/30 text-red-300' :
                                                        sensor.status === 'warning' ? 'bg-orange-500/20 border-orange-500/30 text-orange-300' :
                                                            'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                                                        }`}>{sensor.status}</span>
                                                </div>
                                                <p className="font-medium text-white text-sm">{sensor.label}</p>
                                                <div className="flex justify-between items-end mt-2">
                                                    <span className="text-2xl font-bold text-white/90">{sensor.value}<span className="text-sm font-normal text-white/50 ml-1">{sensor.unit}</span></span>
                                                    <span className="text-xs text-white/40">{sensor.lastUpdated}</span>
                                                </div>
                                                {/* Fill level bar for ultrasonic sensors */}
                                                {sensor.type === 'ultrasonic' && sensor.fillPercent !== undefined && (
                                                    <div className="mt-3">
                                                        <div className="flex justify-between text-[10px] text-white/50 mb-1">
                                                            <span>Fill Level</span>
                                                            <span className="font-bold text-white/80">{sensor.fillPercent}%</span>
                                                        </div>
                                                        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${sensor.fillPercent >= 90 ? 'bg-red-500' : sensor.fillPercent >= 75 ? 'bg-orange-400' : 'bg-emerald-500'}`}
                                                                style={{ width: `${sensor.fillPercent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* CARD 1: Total Reports */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-[2rem] p-6 shadow-lg">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-white/60 font-medium mb-1 uppercase tracking-wider">Total Reports</p>
                                    <p className="text-4xl font-bold text-white drop-shadow-sm">{citizenIssues.length}</p>
                                </div>
                                <div className="p-3 bg-white/10 rounded-2xl text-white">
                                    <BarChart2 size={24} />
                                </div>
                            </div>
                        </div>

                        {/* CARD 2: Open Issues */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-[2rem] p-6 shadow-lg">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-yellow-200/60 font-medium mb-1 uppercase tracking-wider">Open Issues</p>
                                    <p className="text-4xl font-bold text-yellow-300 drop-shadow-sm">
                                        {citizenIssues.filter(i => i.status === 'new' || i.status === 'in_progress').length}
                                    </p>
                                </div>
                                <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-2xl text-yellow-300">
                                    <Clock size={24} />
                                </div>
                            </div>
                        </div>

                        {/* CARD 3: Resolved */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-[2rem] p-6 shadow-lg">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-emerald-200/60 font-medium mb-1 uppercase tracking-wider">Resolved</p>
                                    <p className="text-4xl font-bold text-emerald-400 drop-shadow-sm">
                                        {citizenIssues.filter(i => i.status === 'resolved').length}
                                    </p>
                                </div>
                                <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-400">
                                    <CheckCircle size={24} />
                                </div>
                            </div>
                        </div>

                        {/* CARD 4: Critical Priority */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-[2rem] p-6 shadow-lg">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-red-200/60 font-medium mb-1 uppercase tracking-wider">Critical / Crisis</p>
                                    <p className="text-4xl font-bold text-red-400 drop-shadow-sm">
                                        {citizenIssues.filter(i => (i.calculatedPriority?.label || '').includes('Critic') || (i.calculatedPriority?.label || '').includes('Crisis')).length}
                                    </p>
                                </div>
                                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-400">
                                    <AlertCircle size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tasks Table */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-[2rem] overflow-hidden shadow-lg">
                        <div className="px-6 py-5 border-b border-white/10 bg-white/5 flex items-center gap-2">
                            <List className="text-white/70" size={20} />
                            <h2 className="text-xl font-semibold text-white drop-shadow-sm">Scheduled Tasks ({new Date(selectedDate).toDateString()})</h2>
                        </div>

                        {todaysTasks.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="bg-white/5 p-6 rounded-2xl inline-block text-left max-w-md w-full border border-dashed border-white/20">
                                    <p className="text-white/80 text-sm">No tasks scheduled for {new Date(selectedDate).toDateString()}.</p>
                                    <button
                                        onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                                        className="mt-3 px-4 py-2 liquid-btn liquid-btn-emerald rounded-lg text-sm font-semibold"
                                    >
                                        Go to Today
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-auto custom-scrollbar max-h-[500px]">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-[#1a2235]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-10 shadow-md">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider">Title</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider">Department</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider">Priority</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {todaysTasks.slice(0, 100).map((task, idx) => ( // limit to 100 for perf in this view
                                            <tr
                                                key={task.id || idx}
                                                className="hover:bg-white/5 transition-colors cursor-pointer"
                                                onClick={() => navigate(`/issues/TSK-${task.id}`)}
                                            >
                                                <td className="px-6 py-4 text-sm text-white font-medium">{task.title}</td>
                                                <td className="px-6 py-4 text-sm text-white/90 capitalize">{task.sector}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${(task.priority || '').toLowerCase().includes('critic') || (task.priority || '').toLowerCase().includes('p1') ? 'bg-red-500/20 border-red-500/30 text-red-300' :
                                                        (task.priority || '').toLowerCase().includes('high') || (task.priority || '').toLowerCase().includes('p2') ? 'bg-orange-500/20 border-orange-500/30 text-orange-300' :
                                                            (task.priority || '').toLowerCase().includes('medium') || (task.priority || '').toLowerCase().includes('p3') ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' :
                                                                'bg-white/10 border-white/20 text-white'
                                                        }`}>
                                                        {task.priority || 'Low'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-white/90 font-mono">
                                                    {new Date(task.scheduled_start).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 border rounded-full text-[10px] font-semibold uppercase ${task.status === 'completed' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' :
                                                        task.status === 'in_progress' ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' :
                                                            'bg-yellow-500/20 border-yellow-500/30 text-yellow-300'
                                                        }`}>
                                                        {task.status || 'Pending'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {todaysTasks.length > 100 && (
                                    <div className="p-4 text-center text-white/80 text-sm border-t border-white/10 bg-white/5">
                                        Showing first 100 of {todaysTasks.length} tasks
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Citizen Analysis Side Panel */}
            {selectedCitizenIssue && (
                <CitizenAnalysisPanel
                    issue={selectedCitizenIssue}
                    onClose={() => setSelectedCitizenIssue(null)}
                    onViewFull={() => {
                        navigate(`/issues/${selectedCitizenIssue.id}`);
                        setSelectedCitizenIssue(null);
                    }}
                />
            )}
        </>
    );
}

