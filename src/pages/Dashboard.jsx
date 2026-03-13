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
            <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
            <div
                className="fixed top-0 right-0 h-full w-full max-w-[420px] bg-white shadow-2xl z-50 flex flex-col"
                style={{ animation: 'slideInRight 0.22s ease-out' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
                    <div>
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">145-Signal AI Analysis</p>
                        <h2 className="font-extrabold text-gray-800 text-sm mt-0.5 line-clamp-1">{issue.title}</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500">
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto">
                    {/* Photo + score overlay */}
                    <div className="relative h-44 bg-gray-200">
                        {issue.photo_url
                            ? <img src={issue.photo_url} alt={issue.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No Photo</div>
                        }
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                            <div>
                                <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">AI Priority Score</p>
                                <p className="text-white text-4xl font-black">{a?.score ?? '—'}<span className="text-lg font-medium">/100</span></p>
                            </div>
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase ${scoreBg}`}>
                                {a?.label ?? 'Calculating'}
                            </span>
                        </div>
                    </div>

                    <div className="px-5 py-4 space-y-5">
                        {/* Score bar */}
                        <div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span className="font-semibold">Overall Priority Score</span>
                                <span className="font-bold" style={{ color: scoreColor }}>{a?.score ?? 0}/100</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{ width: `${a?.score ?? 0}%`, backgroundColor: scoreColor }}
                                />
                            </div>
                        </div>

                        {/* Top signals explanation */}
                        {a?.advancedAnalysis?.explanation && (
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">🤖 Top Signals Detected</p>
                                <p className="text-sm text-indigo-800 font-medium">{a.advancedAnalysis.explanation}</p>
                            </div>
                        )}

                        {/* Category breakdown */}
                        {/* 9-Category Breakdown Removed per user request */}

                        {/* 7D Dimensions */}
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">7D Framework Output</p>
                            <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100">
                                {[
                                    ['Sector Assessment', dims.sector],
                                    ['Event Risk', dims.event],
                                    ['Severity Level', dims.severity],
                                    ['Time Boost', dims.timeBoost != null ? `+${dims.timeBoost} pts` : null],
                                    ['Location Boost', dims.locationBoost != null ? `+${dims.locationBoost} pts` : null],
                                    ['Impact Score', dims.impactScore != null ? `${dims.impactScore} pts` : null],
                                ].map(([k, v]) => v != null && (
                                    <div key={k} className="flex justify-between px-3 py-2 text-xs">
                                        <span className="text-gray-500 font-medium">{k}</span>
                                        <span className="font-bold text-gray-800">{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Escalation */}
                        {a?.advancedAnalysis?.escalation && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
                                <TrendingUp size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Escalation Target</p>
                                    <p className="text-sm font-bold text-amber-900 mt-0.5">{a.advancedAnalysis.escalation}</p>
                                </div>
                            </div>
                        )}

                        {/* Meta info */}
                        <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100">
                            {[
                                ['Sector', issue.sector],
                                ['Status', issue.status],
                                ['Reported', new Date(issue.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
                                ['Address', issue.address || issue.location?.address || '—'],
                            ].map(([k, v]) => (
                                <div key={k} className="flex justify-between px-3 py-2 text-xs">
                                    <span className="text-gray-500 font-medium">{k}</span>
                                    <span className="font-bold text-gray-800 text-right max-w-[60%] truncate">{v || '—'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer CTA */}
                <div className="px-5 py-4 border-t bg-white">
                    <button
                        onClick={onViewFull}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors"
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
    const { city } = useAuth();
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
                setSensors(data);
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
            setTasks(realTasks || []);
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
            // Apply 145-Signal Priority Analysis
            const analyzedIssues = realTimeIssues.map(issue => {
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
            <div className="min-h-screen bg-gray-50 p-6 animate-fade-in">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                                    Dashboard
                                    <span className="flex items-center gap-1.5 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full border border-blue-200">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                        </span>
                                        v2.3 Live
                                    </span>
                                </h1>
                                <p className="text-gray-600 mt-1">{city || 'Khargar'}</p>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Status Filter */}
                                <div className="bg-white border rounded-lg px-3 py-2 shadow-sm flex items-center gap-2">
                                    <Filter size={16} className="text-gray-500" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="outline-none text-gray-700 font-medium bg-transparent text-sm"
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
                                <div className="bg-white border rounded-lg px-3 py-2 shadow-sm flex items-center gap-2">
                                    <span className="text-sm text-gray-500 font-medium">View Date:</span>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="outline-none text-gray-800 font-bold"
                                        style={{ maxWidth: '130px' }}
                                    />
                                </div>

                                <button
                                    onClick={loadTasks}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 shadow-sm transition-colors text-blue-600 font-medium"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Refresh
                                </button>
                            </div>
                        </div>

                        {/* Connection Status: Compact & Integrated */}
                    </div>

                    {/* CITIZEN REPORTS SECTION â€” compact collapsible */}
                    <div className="mb-6">
                        {/* Collapsible Header */}
                        <button
                            onClick={() => setCitizenPanelOpen(o => !o)}
                            className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-3 shadow-sm hover:bg-gray-50 transition-colors"
                        >
                            <span className="flex items-center gap-2 font-semibold text-gray-800">
                                <AlertCircle size={18} className="text-red-500" />
                                Citizen Reports
                                <span className="ml-1 bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {filteredIssues.length}
                                </span>
                                {issuesLoading && <Loader className="w-4 h-4 animate-spin text-gray-400" />}
                            </span>
                            <span className="text-gray-400">
                                {citizenPanelOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </span>
                        </button>

                        {/* Expandable compact list */}
                        {citizenPanelOpen && (
                            <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                                {filteredIssues.length === 0 ? (
                                    <div className="p-6 text-center text-gray-400 text-sm">
                                        No issues found matching current filters.
                                    </div>
                                ) : (
                                    <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 sticky top-0 border-b">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Priority</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Sector</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Status</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Date</th>
                                                    <th className="px-4 py-2"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredIssues.map((issue) => (
                                                    <tr
                                                        key={issue.id}
                                                        onClick={() => setSelectedCitizenIssue(issue)}
                                                        className="hover:bg-indigo-50/40 transition-colors cursor-pointer"
                                                    >
                                                        <td className="px-4 py-2">
                                                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${issue.calculatedPriority.label === 'Crisis' ? 'bg-red-600 text-white' :
                                                                issue.calculatedPriority.label === 'Critical' ? 'bg-orange-500 text-white' :
                                                                    issue.calculatedPriority.label === 'Moderate' ? 'bg-yellow-400 text-gray-900' :
                                                                        'bg-blue-100 text-blue-800'
                                                                }`}>
                                                                {issue.calculatedPriority.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2 font-medium text-gray-900 max-w-[200px] truncate">
                                                            {issue.status === 'new' && (
                                                                <span className="mr-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">NEW</span>
                                                            )}
                                                            {issue.title}
                                                        </td>
                                                        <td className="px-4 py-2 text-gray-500 capitalize hidden md:table-cell">{issue.sector}</td>
                                                        <td className="px-4 py-2 hidden md:table-cell">
                                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase border ${issue.status === 'resolved' ? 'border-green-200 text-green-700 bg-green-50' :
                                                                issue.status === 'in_progress' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                                                                    issue.status === 'rejected' ? 'border-red-200 text-red-700 bg-red-50' :
                                                                        'border-gray-200 text-gray-600 bg-gray-50'
                                                                }`}>
                                                                {issue.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2 text-gray-400 text-xs hidden lg:table-cell">
                                                            {new Date(issue.created_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
                                                            <button
                                                                onClick={() => setSelectedCitizenIssue(issue)}
                                                                className="text-indigo-600 text-xs font-semibold hover:underline whitespace-nowrap"
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

                    {/* LIVE MONITORING SECTION (RESTORED) */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Activity className="text-blue-600" />
                            Live Operational View
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Map */}
                            <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-[500px]">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                        <MapIcon size={18} /> Geospatial Overview
                                    </h3>
                                    <div className="flex gap-2">
                                        <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">Critical</span>
                                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">Normal</span>
                                    </div>
                                </div>
                                <EnhancedMap markers={mapMarkers} height="420px" center={KHARGAR_CENTER} />
                            </div>

                            {/* Sensor Panel */}
                            <div className="space-y-4">
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                        <Wifi size={18} /> IoT Sensor Status
                                    </h3>
                                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                                        {sensorsLoading ? (
                                            <div className="p-4 flex flex-col items-center gap-2 text-gray-400 text-sm">
                                                <Loader className="w-5 h-5 animate-spin" />
                                                <span>Connecting to sensors…</span>
                                            </div>
                                        ) : sensorsError ? (
                                            <div className="p-4 text-center">
                                                <p className="text-red-500 text-xs font-medium mb-2">{sensorsError}</p>
                                                <button
                                                    onClick={() => {
                                                        setSensorsLoading(true);
                                                        setSensorsError(null);
                                                        fetchSensorReadings().then(d => { setSensors(d); setSensorsLoading(false); }).catch(e => { setSensorsError('Could not reach sensor hardware.'); setSensorsLoading(false); });
                                                    }}
                                                    className="text-xs text-blue-600 hover:underline font-semibold"
                                                >Retry</button>
                                            </div>
                                        ) : sensors.length === 0 ? (
                                            <div className="p-4 text-center text-gray-400 text-sm">No sensor data available.</div>
                                        ) : null}
                                        {sensors.map(sensor => (
                                            <div key={sensor.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-xs font-bold text-gray-500 uppercase">{sensor.type}</span>
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${sensor.status === 'critical' ? 'bg-red-100 text-red-700' :
                                                        sensor.status === 'warning' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-green-100 text-green-700'
                                                        }`}>{sensor.status}</span>
                                                </div>
                                                <p className="font-medium text-gray-900 text-sm">{sensor.label}</p>
                                                <div className="flex justify-between items-end mt-2">
                                                    <span className="text-2xl font-bold text-gray-800">{sensor.value}<span className="text-sm font-normal text-gray-500 ml-1">{sensor.unit}</span></span>
                                                    <span className="text-xs text-gray-400">{sensor.lastUpdated}</span>
                                                </div>
                                                {/* Fill level bar for ultrasonic sensors */}
                                                {sensor.type === 'ultrasonic' && sensor.fillPercent !== undefined && (
                                                    <div className="mt-2">
                                                        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                                            <span>Fill Level</span>
                                                            <span className="font-bold">{sensor.fillPercent}%</span>
                                                        </div>
                                                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${sensor.fillPercent >= 90 ? 'bg-red-500' : sensor.fillPercent >= 75 ? 'bg-orange-400' : 'bg-green-500'}`}
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
                        <div className="bg-white rounded-lg border p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-gray-600 font-medium mb-1">Total Reports</p>
                                    <p className="text-4xl font-bold text-gray-900">{citizenIssues.length}</p>
                                </div>
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <BarChart2 size={24} />
                                </div>
                            </div>
                        </div>

                        {/* CARD 2: Open Issues */}
                        <div className="bg-white rounded-lg border p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-gray-600 font-medium mb-1">Open Issues</p>
                                    <p className="text-4xl font-bold text-yellow-600">
                                        {citizenIssues.filter(i => i.status === 'new' || i.status === 'in_progress').length}
                                    </p>
                                </div>
                                <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                                    <Clock size={24} />
                                </div>
                            </div>
                        </div>

                        {/* CARD 3: Resolved */}
                        <div className="bg-white rounded-lg border p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-gray-600 font-medium mb-1">Resolved</p>
                                    <p className="text-4xl font-bold text-green-600">
                                        {citizenIssues.filter(i => i.status === 'resolved').length}
                                    </p>
                                </div>
                                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                    <CheckCircle size={24} />
                                </div>
                            </div>
                        </div>

                        {/* CARD 4: Critical Priority */}
                        <div className="bg-white rounded-lg border p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-gray-600 font-medium mb-1">Critical / Crisis</p>
                                    <p className="text-4xl font-bold text-red-600">
                                        {citizenIssues.filter(i => (i.calculatedPriority?.label || '').includes('Critic') || (i.calculatedPriority?.label || '').includes('Crisis')).length}
                                    </p>
                                </div>
                                <div className="p-2 bg-red-50 rounded-lg text-red-600">
                                    <AlertCircle size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tasks Table */}
                    <div className="bg-white rounded-lg border overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-2">
                            <List className="text-gray-500" size={20} />
                            <h2 className="text-xl font-semibold text-gray-900">Scheduled Tasks ({new Date(selectedDate).toDateString()})</h2>
                        </div>

                        {todaysTasks.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="bg-gray-50 p-6 rounded-lg inline-block text-left max-w-md w-full border border-dashed border-gray-300">
                                    <p className="text-gray-500 text-sm">No tasks scheduled for {new Date(selectedDate).toDateString()}.</p>
                                    <button
                                        onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                                        className="mt-2 text-blue-600 text-sm font-semibold hover:underline"
                                    >
                                        Go to Today
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Title</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Sector</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Priority</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {todaysTasks.slice(0, 100).map((task, idx) => ( // limit to 100 for perf in this view
                                            <tr
                                                key={task.id || idx}
                                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                                onClick={() => navigate(`/issues/TSK-${task.id}`)}
                                            >
                                                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{task.title}</td>
                                                <td className="px-6 py-4 text-sm text-gray-700 capitalize">{task.sector}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${(task.priority || '').toLowerCase().includes('critic') || (task.priority || '').toLowerCase().includes('p1') ? 'bg-red-100 text-red-800' :
                                                        (task.priority || '').toLowerCase().includes('high') || (task.priority || '').toLowerCase().includes('p2') ? 'bg-orange-100 text-orange-800' :
                                                            (task.priority || '').toLowerCase().includes('medium') || (task.priority || '').toLowerCase().includes('p3') ? 'bg-blue-100 text-blue-800' :
                                                                'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {task.priority || 'Low'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                                                    {new Date(task.scheduled_start).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {task.status || 'Pending'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {todaysTasks.length > 100 && (
                                    <div className="p-4 text-center text-gray-500 text-sm border-t bg-gray-50">
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

