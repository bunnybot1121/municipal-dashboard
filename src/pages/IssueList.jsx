import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/apiClient';
import { SECTORS } from '../services/mockData';
import {
    Search,
    ChevronRight,
    SwapVert as ArrowUpDown,
    FilterList as Filter,
    AddCircle as PlusCircle,
    ExpandMore as ChevronDown,
    LocationOn as MapPin,
    MoreVert as MoreVertical,
    Image as ImageIcon,
    WaterDrop as Droplets,
    EditRoad as PenTool,
    Lightbulb,
    DeleteSweep as Trash2,
    Waves,
    Bolt as Zap,
    Category as Box,
    SearchOff as SearchX,
    ChevronLeft,
    Check as CheckIcon,
    Close as CloseIcon
} from '@mui/icons-material';

const IssueList = () => {
    const navigate = useNavigate();
    const { isDepartment, department } = useAuth();
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterSector, setFilterSector] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' }); // Default sort by createdAt

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Fetch scheduled tasks (NOT citizen reports)
            const tasksData = await api.getTasks();

            let combinedData = [];

            if (tasksData && Array.isArray(tasksData)) {
                const relevantTasks = isDepartment ? tasksData.filter(t => (t.sector || '').toLowerCase() === (department || '').toLowerCase()) : tasksData;

                combinedData = relevantTasks.map(task => ({
                    ...task,
                    uniqueId: `tsk-${task.id}`,
                    type: 'task',
                    id: task.id,
                    title: task.title || 'Untitled Task',
                    description: task.description || '',
                    priority: (task.priority || 'low').toLowerCase(),
                    status: (task.status || 'pending').toLowerCase(),
                    sector: (task.sector || 'other').toLowerCase(),
                    location: {
                        lat: null,
                        lng: null,
                        address: task.location_address || 'Scheduled Location',
                        accuracy: null
                    },
                    createdAt: task.created_at || task.scheduledStart || new Date().toISOString(),
                    aiAnalysis: null,
                    imageUrl: null
                }));
            }

            setIssues(combinedData);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredIssues = useMemo(() => {
        let result = [...issues];
        if (filterStatus !== 'all') result = result.filter(i => i.status === filterStatus);
        if (filterSector !== 'all') result = result.filter(i => i.sector === filterSector);
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(i =>
                (i.title && i.title.toLowerCase().includes(lower)) ||
                (i.id && i.id.toString().toLowerCase().includes(lower)) ||
                (i.location.address && i.location.address.toLowerCase().includes(lower))
            );
        }
        result.sort((a, b) => {
            const valA = a[sortConfig.key] || '';
            const valB = b[sortConfig.key] || '';

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return result;
    }, [issues, filterStatus, filterSector, searchTerm, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleStatusUpdate = async (e, taskId, newStatus) => {
        e.stopPropagation(); // Prevent row click navigation
        try {
            await api.updateTask(taskId, { status: newStatus });
            setIssues(prevIssues =>
                prevIssues.map(issue =>
                    issue.id === taskId ? { ...issue, status: newStatus } : issue
                )
            );
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status");
        }
    };

    const getSectorIcon = (s) => {
        const sector = (s || '').toLowerCase();
        switch (sector) {
            case 'water': return <Droplets sx={{ fontSize: 16 }} />;
            case 'roads': return <PenTool sx={{ fontSize: 16 }} />;
            case 'lighting': return <Lightbulb sx={{ fontSize: 16 }} />;
            case 'waste': return <Trash2 sx={{ fontSize: 16 }} />;
            case 'drainage': return <Waves sx={{ fontSize: 16 }} />;
            case 'power': return <Zap sx={{ fontSize: 16 }} />;
            default: return <Box sx={{ fontSize: 16 }} />;
        }
    };

    const getSectorColor = (s) => {
        const map = {
            'water': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
            'roads': 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
            'lighting': 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
            'waste': 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
            'drainage': 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
            'power': 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
        };
        return map[(s || '').toLowerCase()] || 'bg-white/10 text-white border border-white/20';
    };

    const getPriorityStyle = (p) => {
        const map = {
            'critical': 'bg-red-500/20 text-red-300 border border-red-500/30',
            'high': 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
            'medium': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
            'low': 'bg-white/10 text-white/80 border border-white/20'
        };
        return map[(p || '').toLowerCase()] || map['low'];
    };

    if (loading) {
        return <div className="p-10 text-center text-white/50">Loading issues...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in text-white">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white drop-shadow-sm">Scheduled Tasks</h1>
                    <p className="text-sm text-white/70 font-medium">Manage scheduled maintenance tasks and work orders</p>
                </div>
                <button
                    className="px-5 py-2.5 liquid-btn liquid-btn-emerald rounded-xl text-sm font-bold flex items-center gap-2"
                    onClick={() => navigate('/scheduler')}
                >
                    <PlusCircle sx={{ fontSize: 18 }} />
                    <span>New Task</span>
                </button>
            </div>

            {/* Filters & Search */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 p-5 rounded-2xl shadow-lg flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" sx={{ fontSize: 18 }} />
                    <input
                        type="text"
                        placeholder="Search by ID, Title, or Location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/10 bg-black/20 text-white placeholder-white/40 text-sm focus:bg-black/40 focus:ring-1 focus:ring-white/30 focus:border-white/30 outline-none transition-all"
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="appearance-none w-full md:w-40 px-4 py-3 pr-10 rounded-xl border border-white/10 bg-black/20 text-sm font-medium text-white focus:bg-black/40 focus:ring-1 focus:ring-white/30 focus:border-white/30 outline-none cursor-pointer"
                        >
                            <option value="all" className="bg-slate-900">All Statuses</option>
                            <option value="pending" className="bg-slate-900">Pending</option>
                            <option value="in-progress" className="bg-slate-900">In Progress</option>
                            <option value="completed" className="bg-slate-900">Completed</option>
                            <option value="resolved" className="bg-slate-900">Resolved</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" sx={{ fontSize: 18 }} />
                    </div>
                    <div className="relative">
                        <select
                            value={filterSector}
                            onChange={(e) => setFilterSector(e.target.value)}
                            className="appearance-none w-full md:w-40 px-4 py-3 pr-10 rounded-xl border border-white/10 bg-black/20 text-sm font-medium text-white focus:bg-black/40 focus:ring-1 focus:ring-white/30 focus:border-white/30 outline-none cursor-pointer"
                        >
                            <option value="all" className="bg-slate-900">All Departments</option>
                            {SECTORS.map(s => <option key={s.id} value={s.id} className="bg-slate-900">{s.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" sx={{ fontSize: 18 }} />
                    </div>
                </div>
            </div>

            {/* Enhanced Table */}
            <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-lg overflow-hidden">
                <div className="overflow-auto custom-scrollbar max-h-[65vh] min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#1a2235]/80 backdrop-blur-xl text-white/80 uppercase text-[10px] font-bold tracking-widest border-b border-white/10 sticky top-0 z-20 shadow-md">
                            <tr>
                                {[
                                    { key: 'id', label: 'Task ID', width: 'w-28' },
                                    { key: 'title', label: 'Title & Desc', width: 'w-auto' },
                                    { key: 'sector', label: 'Department', width: 'w-32' },
                                    { key: 'priority', label: 'Priority', width: 'w-28' },
                                    { key: 'status', label: 'Status', width: 'w-32' },
                                    { key: 'createdAt', label: 'Scheduled', width: 'w-40' },
                                    { key: 'action', label: '', width: 'w-16' }
                                ].map((col) => (
                                    <th
                                        key={col.key}
                                        className={`px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group ${col.width}`}
                                        onClick={() => col.key !== 'image' && col.key !== 'action' && handleSort(col.key)}
                                    >
                                        <div className="flex items-center gap-1">
                                            {col.label}
                                            {col.key !== 'action' && <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 text-white/30 transition-opacity" />}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredIssues.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                                            <SearchX sx={{ fontSize: 32 }} className="text-white/30" />
                                        </div>
                                        <p className="text-white font-bold drop-shadow-sm">No issues found</p>
                                        <p className="text-xs text-white/70 mt-1">Try adjusting your filters.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredIssues.map((issue) => (
                                    <tr
                                        key={issue.uniqueId || issue.id}
                                        onClick={() => navigate(`/issues/TSK-${issue.id}`)}
                                        className="hover:bg-white/5 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="text-emerald-400 font-bold text-xs group-hover:underline drop-shadow-sm">
                                                TSK-{issue.id && issue.id.length > 6 ? issue.id.substring(issue.id.length - 6).toUpperCase() : issue.id}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 max-w-[300px]">
                                            <div className="font-bold text-sm text-white truncate mb-0.5 drop-shadow-sm">{issue.title}</div>
                                            <div className="text-xs text-white/80 truncate">{issue.description || 'No description provided.'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getSectorColor(issue.sector)}`}>
                                                {getSectorIcon(issue.sector)}
                                                {issue.sector}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`${getPriorityStyle(issue.priority)} px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide inline-block text-center min-w-[80px]`}>
                                                {issue.priority || 'Low'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${(issue.status === 'resolved' || issue.status === 'completed') ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' :
                                                    issue.status === 'in-progress' || issue.status === 'assigned' ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]' :
                                                        issue.status === 'rejected' ? 'bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.4)]' :
                                                            'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]'
                                                    }`}></span>
                                                <span className="text-sm font-medium text-white/90 capitalize">
                                                    {(issue.status || 'Pending').replace(/[-_]/g, ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-white/90">
                                            {issue.scheduledStart ? new Date(issue.scheduledStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {(issue.status === 'pending' || issue.status === 'assigned') && (
                                                    <>
                                                        <button
                                                            onClick={(e) => handleStatusUpdate(e, issue.id, 'completed')}
                                                            className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300 transition-colors border border-emerald-500/20"
                                                            title="Mark Completed"
                                                        >
                                                            <CheckIcon sx={{ fontSize: 16 }} />
                                                        </button>
                                                    </>
                                                )}
                                                <button className="text-white/40 hover:text-white/90 p-1.5 rounded-xl hover:bg-white/10 transition-colors">
                                                    <MoreVertical sx={{ fontSize: 16 }} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination (Visual Only for now) */}
                <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex items-center justify-between text-xs text-white/80 font-medium">
                    <span>Showing {filteredIssues.length} tasks</span>
                    <div className="flex gap-2 text-white">
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg liquid-btn liquid-btn-white" disabled>
                            <ChevronLeft sx={{ fontSize: 16 }} />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/20 bg-white/20 font-bold shadow-sm">1</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg liquid-btn liquid-btn-white">
                            <ChevronRight sx={{ fontSize: 16 }} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IssueList;
