import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '../services/apiClient'; // Import API
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
    ChevronLeft
} from '@mui/icons-material';

const IssueList = () => {
    const navigate = useNavigate();
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
            const data = await api.getIssues();
            if (data && Array.isArray(data)) {
                // Normalize data to match table expectations
                const normalizedData = data.map(issue => ({
                    ...issue,
                    id: issue._id || issue.id,
                    priority: (issue.priority || issue.severity || 'low').toLowerCase(),
                    status: (issue.status || 'open').toLowerCase(),
                    sector: (issue.sector || 'other').toLowerCase(),
                    location: {
                        address: issue.location?.address || 'Unknown Location',
                        lat: issue.location?.lat,
                        lng: issue.location?.lng
                    },
                    createdAt: issue.createdAt || issue.reportedAt, // Ensure we have a date field
                    aiAnalysis: issue.aiAnalysis || { confidence: 0.88 } // Default if missing
                }));
                setIssues(normalizedData);
            }
        } catch (error) {
            console.error("Failed to fetch issues", error);
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
            'water': 'bg-blue-100 text-blue-600',
            'roads': 'bg-slate-100 text-slate-600',
            'lighting': 'bg-yellow-100 text-yellow-600',
            'waste': 'bg-green-100 text-green-600',
            'drainage': 'bg-cyan-100 text-cyan-600',
            'power': 'bg-orange-100 text-orange-600'
        };
        return map[(s || '').toLowerCase()] || 'bg-gray-100 text-gray-600';
    };

    const getPriorityStyle = (p) => {
        const map = {
            'critical': 'bg-red-100 text-red-700 border border-red-200',
            'high': 'bg-orange-100 text-orange-700 border border-orange-200',
            'medium': 'bg-blue-100 text-blue-700 border border-blue-200',
            'low': 'bg-gray-100 text-gray-700 border border-gray-200'
        };
        return map[(p || '').toLowerCase()] || map['low'];
    };

    if (loading) {
        return <div className="p-10 text-center text-gray-500">Loading issues...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Issue Management</h1>
                    <p className="text-sm text-gray-500 font-medium">Track, verify, and resolve civic complaints</p>
                </div>
                <button
                    className="px-5 py-2.5 bg-[#5B52FF] hover:bg-[#4338CA] text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                    onClick={() => navigate('/issues/new')}
                >
                    <PlusCircle sx={{ fontSize: 18 }} />
                    <span>Log Manual Issue</span>
                </button>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                    <input
                        type="text"
                        placeholder="Search by ID, Title, or Location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-[#5B52FF]/20 focus:border-[#5B52FF] outline-none transition-all"
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="appearance-none w-full md:w-40 px-4 py-2.5 pr-8 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[#5B52FF]/20 focus:border-[#5B52FF] outline-none cursor-pointer"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="resolved">Resolved</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" sx={{ fontSize: 18 }} />
                    </div>
                    <div className="relative">
                        <select
                            value={filterSector}
                            onChange={(e) => setFilterSector(e.target.value)}
                            className="appearance-none w-full md:w-40 px-4 py-2.5 pr-8 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[#5B52FF]/20 focus:border-[#5B52FF] outline-none cursor-pointer"
                        >
                            <option value="all">All Sectors</option>
                            {SECTORS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" sx={{ fontSize: 18 }} />
                    </div>
                </div>
            </div>

            {/* Enhanced Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-extrabold tracking-widest border-b border-gray-200">
                            <tr>
                                {[
                                    { key: 'id', label: 'Issue ID', width: 'w-28' },
                                    { key: 'image', label: 'Preview', width: 'w-20' },
                                    { key: 'title', label: 'Title & Desc', width: 'w-auto' },
                                    { key: 'sector', label: 'Sector', width: 'w-32' },
                                    { key: 'priority', label: 'Priority', width: 'w-28' },
                                    { key: 'status', label: 'Status', width: 'w-32' },
                                    { key: 'location', label: 'Location', width: 'w-40' },
                                    { key: 'confidence', label: 'Evidence Score', width: 'w-32' },
                                    { key: 'action', label: '', width: 'w-16' }
                                ].map((col) => (
                                    <th
                                        key={col.key}
                                        className={`px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group ${col.width}`}
                                        onClick={() => col.key !== 'image' && col.key !== 'action' && handleSort(col.key)}
                                    >
                                        <div className="flex items-center gap-1">
                                            {col.label}
                                            {col.key !== 'image' && col.key !== 'action' && <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredIssues.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-12 text-center">
                                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                                            <SearchX sx={{ fontSize: 32 }} className="text-gray-300" />
                                        </div>
                                        <p className="text-gray-800 font-bold">No issues found</p>
                                        <p className="text-xs text-gray-500 mt-1">Try adjusting your filters.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredIssues.map((issue) => (
                                    <tr
                                        key={issue.id}
                                        onClick={() => navigate(`/issues/${issue.id}`)}
                                        className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="text-[#5B52FF] font-bold text-xs group-hover:underline">
                                                #{issue.id && issue.id.length > 6 ? issue.id.substring(issue.id.length - 6).toUpperCase() : issue.id}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-200 flex items-center justify-center shadow-sm">
                                                {issue.imageUrl ? (
                                                    <img src={issue.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="text-gray-400" sx={{ fontSize: 20 }} />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-[240px]">
                                            <div className="font-bold text-sm text-gray-800 truncate mb-0.5">{issue.title}</div>
                                            <div className="text-xs text-gray-500 truncate">{issue.description || 'No description provided.'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getSectorColor(issue.sector)}`}>
                                                {getSectorIcon(issue.sector)}
                                                {issue.sector}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`${getPriorityStyle(issue.priority)} px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide border inline-block text-center min-w-[80px]`}>
                                                {issue.priority || 'Low'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${(issue.status === 'resolved' || issue.status === 'completed') ? 'bg-green-500' :
                                                        issue.status === 'in-progress' ? 'bg-blue-500' :
                                                            issue.status === 'rejected' ? 'bg-gray-400' :
                                                                'bg-amber-500' // Default / Open
                                                    }`}></span>
                                                <span className="text-sm font-medium text-gray-700 capitalize">
                                                    {(issue.status || 'Open').replace('-', ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500 max-w-[200px]">
                                            <div className="flex items-center gap-1.5" title={issue.location?.address}>
                                                <MapPin sx={{ fontSize: 14 }} className="text-gray-400" />
                                                <span className="truncate">{issue.location?.address || 'Unknown Location'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-24">
                                                <div className="flex justify-between text-[10px] font-bold text-gray-600 mb-1">
                                                    <span>{(issue.aiAnalysis?.confidence * 100 || 88).toFixed(0)}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${(issue.aiAnalysis?.confidence * 100 || 88) > 90 ? 'bg-green-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${(issue.aiAnalysis?.confidence * 100 || 88)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                                                <MoreVertical sx={{ fontSize: 16 }} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination (Visual Only for now) */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 font-medium">
                    <span>Showing {filteredIssues.length} issues</span>
                    <div className="flex gap-2">
                        <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors" disabled>
                            <ChevronLeft sx={{ fontSize: 16 }} />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded border border-transparent bg-[#5B52FF] text-white font-bold shadow-sm">1</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 bg-white hover:bg-gray-50 transition-colors">
                            <ChevronRight sx={{ fontSize: 16 }} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IssueList;
