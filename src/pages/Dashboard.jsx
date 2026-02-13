import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/apiClient';
import LeafletMap from '../components/CommandCenter/LeafletMap';
import InfraHealth from '../components/CommandCenter/InfraHealth';
import {
    Assessment as BarChart3,
    AccessTime as Clock,
    CheckCircle,
    Timer
} from '@mui/icons-material';

// --- MOCK DATA FOR FALLBACK ---
const MOCK_ISSUES = [
    { id: 'ISS-1001', title: 'Major Pothole on MG Road', sector: 'roads', priority: 'critical', status: 'open', location: { lat: 19.0760, lng: 72.8777 }, riskLevel: 'Critical', aiAnalysis: { isReal: true, confidence: 0.98 } },
    { id: 'ISS-1002', title: 'Garbage Pileup near Market', sector: 'waste', priority: 'high', status: 'open', location: { lat: 19.0750, lng: 72.8760 }, riskLevel: 'High', aiAnalysis: { isReal: true, confidence: 0.95 } },
    { id: 'ISS-1003', title: 'Street Light Malfunction', sector: 'lighting', priority: 'medium', status: 'in-progress', location: { lat: 19.0740, lng: 72.8750 }, riskLevel: 'Medium', aiAnalysis: { isReal: true, confidence: 0.92 } },
    { id: 'ISS-1004', title: 'Water Pipe Burst', sector: 'water', priority: 'critical', status: 'open', location: { lat: 19.0730, lng: 72.8740 }, riskLevel: 'Critical', aiAnalysis: { isReal: true, confidence: 0.99 } },
    { id: 'ISS-1005', title: 'Illegal Banner Removal', sector: 'admin', priority: 'low', status: 'resolved', location: { lat: 19.0720, lng: 72.8730 }, riskLevel: 'Low', aiAnalysis: { isReal: true, confidence: 0.88 } },
    { id: 'ISS-1006', title: 'Drainage Clogging', sector: 'drainage', priority: 'high', status: 'open', location: { lat: 19.0710, lng: 72.8720 }, riskLevel: 'High', aiAnalysis: { isReal: true, confidence: 0.94 } },
    { id: 'ISS-1007', title: 'Broken Footpath Tiles', sector: 'roads', priority: 'medium', status: 'open', location: { lat: 19.0700, lng: 72.8710 }, riskLevel: 'Medium', aiAnalysis: { isReal: true, confidence: 0.90 } },
    { id: 'ISS-1008', title: 'Dead Animal Removal', sector: 'waste', priority: 'high', status: 'resolved', location: { lat: 19.0690, lng: 72.8700 }, riskLevel: 'High', aiAnalysis: { isReal: true, confidence: 0.97 } },
    { id: 'ISS-1009', title: 'No Water Supply (Sector 4)', sector: 'water', priority: 'critical', status: 'in-progress', location: { lat: 19.0680, lng: 72.8690 }, riskLevel: 'Critical', aiAnalysis: { isReal: true, confidence: 0.96 } },
    { id: 'ISS-1010', title: 'Tree Branch Falling Risk', sector: 'admin', priority: 'medium', status: 'open', location: { lat: 19.0670, lng: 72.8680 }, riskLevel: 'Medium', aiAnalysis: { isReal: true, confidence: 0.89 } },
    { id: 'ISS-1011', title: 'Open Manhole', sector: 'drainage', priority: 'critical', status: 'open', location: { lat: 19.0660, lng: 72.8670 }, riskLevel: 'Critical', aiAnalysis: { isReal: true, confidence: 0.99 } },
    { id: 'ISS-1012', title: 'Street Light Flickering', sector: 'lighting', priority: 'low', status: 'open', location: { lat: 19.0650, lng: 72.8660 }, riskLevel: 'Low', aiAnalysis: { isReal: true, confidence: 0.85 } },
    { id: 'ISS-1013', title: 'Garbage Bin Overflow', sector: 'waste', priority: 'medium', status: 'in-progress', location: { lat: 19.0640, lng: 72.8650 }, riskLevel: 'Medium', aiAnalysis: { isReal: true, confidence: 0.93 } },
    { id: 'ISS-1014', title: 'Pothole on Linking Road', sector: 'roads', priority: 'high', status: 'open', location: { lat: 19.0630, lng: 72.8640 }, riskLevel: 'High', aiAnalysis: { isReal: true, confidence: 0.95 } },
    { id: 'ISS-1015', title: 'Fire Hydrant Leak', sector: 'water', priority: 'high', status: 'resolved', location: { lat: 19.0620, lng: 72.8630 }, riskLevel: 'High', aiAnalysis: { isReal: true, confidence: 0.91 } }
];

const Dashboard = () => {
    const navigate = useNavigate();
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        resolved: 0,
        avgResponse: '4.2h'
    });
    const [sectorCounts, setSectorCounts] = useState({});
    const [priorityCounts, setPriorityCounts] = useState({
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Try fetching real data first
            // const data = await api.getIssues();
            // Force mock data for now to ensure robust testing without backend
            const data = MOCK_ISSUES;

            if (data && Array.isArray(data)) {
                const normalizedData = data.map(issue => ({
                    ...issue,
                    id: issue._id || issue.id,
                    priority: (issue.priority || issue.severity || 'low').toLowerCase(),
                    status: (issue.status || 'open').toLowerCase(),
                    sector: (issue.sector || 'other').toLowerCase()
                }));

                setIssues(normalizedData);
                calculateStats(normalizedData);
            }
        } catch (error) {
            console.log("Backend error, using mock data:", error);
            // Fallback is also Mock Data
            const normalizedData = MOCK_ISSUES.map(issue => ({
                ...issue,
                id: issue._id || issue.id,
                priority: (issue.priority || issue.severity || 'low').toLowerCase(),
                status: (issue.status || 'open').toLowerCase(),
                sector: (issue.sector || 'other').toLowerCase()
            }));
            setIssues(normalizedData);
            calculateStats(normalizedData);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const total = data.length;
        const pending = data.filter(i => i.status !== 'resolved' && i.status !== 'closed').length;
        const resolved = data.filter(i => i.status === 'resolved' || i.status === 'closed').length;

        // Sector Counts
        const sectors = {};
        // Priority Counts
        const priorities = { critical: 0, high: 0, medium: 0, low: 0 };

        data.forEach(i => {
            // Sector
            sectors[i.sector] = (sectors[i.sector] || 0) + 1;
            // Priority
            if (priorities[i.priority] !== undefined) {
                priorities[i.priority]++;
            }
        });

        setStats(prev => ({ ...prev, total, pending, resolved }));
        setSectorCounts(sectors);
        setPriorityCounts(priorities);
    };

    const getPriorityStyle = (p) => {
        const map = {
            'critical': 'bg-rose-50 text-rose-600',
            'high': 'bg-amber-50 text-amber-600',
            'medium': 'bg-blue-50 text-blue-600',
            'low': 'bg-slate-100 text-slate-600'
        };
        return map[(p || 'low').toLowerCase()] || map['low'];
    };

    const getStatusStyle = (s) => {
        const map = {
            'open': 'bg-slate-300',
            'in-progress': 'bg-amber-400',
            'resolved': 'bg-emerald-500',
            'closed': 'bg-emerald-500'
        };
        return map[(s || 'open').toLowerCase()] || 'bg-slate-300';
    };

    const getSectorIcon = (s) => {
        const map = {
            'water': 'water_drop',
            'roads': 'edit_road',
            'lighting': 'lightbulb',
            'waste': 'delete_sweep',
            'drainage': 'waves',
            'power': 'bolt',
            'admin': 'admin_panel_settings'
        };
        return map[(s || '').toLowerCase()] || 'category';
    };

    const recentIssues = issues.slice(0, 8); // Show more issues

    if (loading) {
        return <div className="p-10 text-center text-slate-500">Loading Dashboard...</div>;
    }

    return (
        <div className="p-6 space-y-8 animate-fade-in">
            {/* Metric Cards - 4 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Issues"
                    value={stats.total}
                    trend="Total"
                    icon={<BarChart3 />}
                    color="blue"
                />
                <MetricCard
                    title="Pending"
                    value={stats.pending}
                    trend="Active"
                    icon={<Clock />}
                    color="yellow"
                />
                <MetricCard
                    title="Resolved"
                    value={stats.resolved}
                    trend="Completed"
                    icon={<CheckCircle />}
                    color="green"
                />
                <MetricCard
                    title="Avg Response"
                    value={stats.avgResponse}
                    trend="Est."
                    icon={<Timer />}
                    color="purple"
                />
            </div>

            {/* SENSOR MONITORING SECTION */}
            <InfraHealth />

            {/* Map + Chart - 2:1 ratio */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden h-96">
                        <LeafletMap issues={issues} />
                    </div>
                </div>
                <div>
                    <PriorityChart counts={priorityCounts} pendingCount={stats.pending} />
                </div>
            </div>

            {/* Sector Cards - 5 columns */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <SectorCard icon="🛣️" label="ROADS" value={sectorCounts['roads'] || 0} />
                <SectorCard icon="💧" label="WATER" value={sectorCounts['water'] || 0} />
                <SectorCard icon="〰️" label="DRAINAGE" value={sectorCounts['drainage'] || 0} />
                <SectorCard icon="💡" label="LIGHTING" value={sectorCounts['lighting'] || 0} />
                <SectorCard icon="🗑️" label="WASTE" value={sectorCounts['waste'] || 0} />
            </div>

            {/* Table */}
            <div>
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-bold text-slate-800">Recent Issues</h3>
                        <div className="flex gap-2">
                            <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 text-slate-600 transition-colors">Export CSV</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold tracking-widest border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Issue ID</th>
                                    <th className="px-6 py-4">Title</th>
                                    <th className="px-6 py-4">Sector</th>
                                    <th className="px-6 py-4">Priority</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentIssues.length > 0 ? recentIssues.map((issue) => (
                                    <tr key={issue.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-500">
                                            #{issue.id && issue.id.length > 6 ? issue.id.substring(issue.id.length - 6).toUpperCase() : issue.id}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-sm text-slate-900">{issue.title}</td>
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                                <span className="material-symbols-outlined text-base">{getSectorIcon(issue.sector)}</span> {issue.sector}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`${getPriorityStyle(issue.priority)} px-2 py-1 rounded text-[10px] font-bold uppercase`}>{issue.priority || 'Low'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-2 text-sm font-medium">
                                                <span className={`w-2 h-2 rounded-full ${getStatusStyle(issue.status)}`}></span>
                                                <span className="capitalize text-slate-700">{issue.status}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-[#3c3cf6] hover:text-blue-700 font-bold text-sm" onClick={() => navigate(`/issues/${issue.id}`)}>Review</button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No issues found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

function MetricCard({ title, value, trend, icon, color = 'blue' }) {
    const colorClasses = {
        blue: 'border-blue-500 bg-blue-50',
        yellow: 'border-amber-500 bg-amber-50',
        green: 'border-emerald-500 bg-emerald-50',
        purple: 'border-purple-500 bg-purple-50'
    };

    const trendColor = trend.includes('+') ? 'text-emerald-600' : 'text-slate-500';

    return (
        <div className={`bg-white rounded-lg border-l-4 ${colorClasses[color]} p-6 shadow-sm border-t border-r border-b border-slate-200`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900 mb-2">{value}</div>
                    {trend && (
                        <div className={`text-sm font-bold flex items-center gap-1 ${trendColor}`}>
                            {trend}
                        </div>
                    )}
                </div>
                <div className="text-slate-400 bg-white p-2 rounded-lg shadow-sm">
                    {React.cloneElement(icon, { sx: { fontSize: 24 } })}
                </div>
            </div>
        </div>
    );
}

function PriorityChart({ counts, pendingCount }) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 h-96 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-slate-800">Priority Distribution</h3>
            </div>
            <div className="flex-1 flex items-center justify-center relative">
                <div className="w-48 h-48 rounded-full border-[1.5rem] border-slate-100 relative flex items-center justify-center">
                    {/* Simplified visual representation */}
                    <div className="absolute inset-0 border-[1.5rem] border-transparent border-t-rose-500 rounded-full rotate-45 opacity-80"></div>
                    <div className="absolute inset-0 border-[1.5rem] border-transparent border-r-amber-400 rounded-full rotate-12 opacity-80"></div>
                    <div className="absolute inset-0 border-[1.5rem] border-transparent border-l-blue-500 rounded-full -rotate-45 opacity-80"></div>
                    <div className="text-center z-10">
                        <div className="text-4xl font-extrabold text-slate-900">{pendingCount}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pending</div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-rose-500 rounded-full"></span>
                    <span className="text-xs font-medium text-slate-600">Critical ({counts.critical})</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                    <span className="text-xs font-medium text-slate-600">High ({counts.high})</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    <span className="text-xs font-medium text-slate-600">Medium ({counts.medium})</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-slate-200 rounded-full"></span>
                    <span className="text-xs font-medium text-slate-600">Low ({counts.low})</span>
                </div>
            </div>
        </div>
    );
}

function SectorCard({ icon, label, value }) {
    return (
        <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{icon}</span>
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</div>
            <div className="text-2xl font-extrabold text-slate-900">{value}</div>
        </div>
    );
}

export default Dashboard;
