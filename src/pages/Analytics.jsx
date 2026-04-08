import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/apiClient';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
    TrendingUp,
    PieChart as PieIcon,
    BarChart as BarIcon,
    CalendarMonth as CalendarIcon,
    AssignmentTurnedIn,
    ReportProblem,
    Speed,
    CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Analytics = () => {
    const { isDepartment, isSeniorEngineer, isJuniorEngineer, department } = useAuth();
    const isDeptScoped = isDepartment || isSeniorEngineer || isJuniorEngineer;
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Default to current month
    const [filterMonth, setFilterMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [issuesData, tasksData] = await Promise.all([
                api.getIssues().catch(() => []),
                api.getTasks().catch(() => [])
            ]);

            const normalizedTasks = tasksData.map(t => ({
                id: `TSK-${t.id}`,
                sector: t.sector,
                status: t.status,
                createdAt: t.scheduled_start || t.created_at,
                type: 'task'
            }));

            let combined = [...(issuesData || []), ...normalizedTasks];
            
            if (isDeptScoped && department) {
                combined = combined.filter(i => (i.sector || '').toLowerCase() === department.toLowerCase());
            }

            setIssues(combined);
        } catch (error) {
            console.error("Failed to fetch analytics data", error);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        if (!issues.length) return null;

        // Apply Month Filter
        let filteredIssues = issues;
        if (filterMonth) {
            const [year, month] = filterMonth.split('-');
            filteredIssues = issues.filter(i => {
                const dateStr = i.createdAt || i.reportedAt;
                if (!dateStr) return false;
                const d = new Date(dateStr);
                return d.getFullYear() === parseInt(year) && (d.getMonth() + 1) === parseInt(month);
            });
        }

        // Stats Counters
        const total = filteredIssues.length;
        const resolved = filteredIssues.filter(i => ['resolved', 'completed', 'closed'].includes((i.status || '').toLowerCase())).length;
        const pending = total - resolved;
        const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

        // 1. Sector Distribution
        const sectorCounts = {};
        filteredIssues.forEach(i => {
            const s = (i.sector || 'other').toLowerCase();
            sectorCounts[s] = (sectorCounts[s] || 0) + 1;
        });
        const sectorData = Object.keys(sectorCounts).map(key => ({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: sectorCounts[key]
        })).sort((a, b) => b.value - a.value);

        // 2. Status Distribution
        const statusCounts = { pending: 0, 'in-progress': 0, resolved: 0, rejected: 0 };
        filteredIssues.forEach(i => {
            const s = (i.status || 'open').toLowerCase();
            if (statusCounts[s] !== undefined) statusCounts[s]++;
            else if (s === 'completed' || s === 'closed') statusCounts['resolved']++;
            else statusCounts['pending']++;
        });
        const statusData = [
            { name: 'Pending', value: statusCounts.pending, color: '#FCD34D', gradient: ['#F59E0B', '#FCD34D'] },
            { name: 'In Progress', value: statusCounts['in-progress'], color: '#60A5FA', gradient: ['#2563EB', '#60A5FA'] },
            { name: 'Resolved', value: statusCounts.resolved, color: '#34D399', gradient: ['#059669', '#34D399'] },
            { name: 'Rejected', value: statusCounts.rejected, color: '#F87171', gradient: ['#DC2626', '#F87171'] }
        ].filter(d => d.value > 0);

        // 3. Trend Over Time (Days in Selected Month)
        const daysInMonth = new Date(filterMonth.split('-')[0], filterMonth.split('-')[1], 0).getDate();
        const timeMap = {};
        for (let i = 1; i <= daysInMonth; i++) {
            timeMap[i] = 0;
        }

        filteredIssues.forEach(i => {
            const dateStr = i.createdAt || i.reportedAt;
            if (dateStr) {
                const day = new Date(dateStr).getDate();
                if (timeMap[day] !== undefined) timeMap[day]++;
            }
        });

        const timeData = Object.keys(timeMap).map(day => ({
            date: `Day ${day}`,
            count: timeMap[day]
        }));

        return { sectorData, statusData, timeData, total, resolved, pending, resolutionRate };
    }, [issues, filterMonth]);

    const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];

    if (loading) return <div className="flex h-[50vh] items-center justify-center p-10 text-white/50 space-x-2"><div className="w-4 h-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin"></div><span>Loading analytics...</span></div>;

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
                <div>
                    <h1 className="text-3xl font-extrabold text-white drop-shadow-md tracking-tight mb-1">Performance Analytics</h1>
                    <p className="text-sm text-blue-200/80 font-medium tracking-wide pb-1">Real-time municipality resolution metrics</p>
                </div>
                <div className="relative group">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center gap-3 bg-black/40 border border-white/10 px-4 py-2.5 rounded-2xl cursor-pointer hover:bg-black/60 transition-colors shadow-inner">
                        <CalendarIcon className="text-blue-400 drop-shadow-md" sx={{fontSize: 20}} />
                        <input 
                            type="month" 
                            value={filterMonth} 
                            onChange={e => setFilterMonth(e.target.value)} 
                            className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer placeholder-white/30" 
                        />
                    </div>
                </div>
            </div>

            {!stats ? (
                <div className="h-48 flex items-center justify-center bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
                    <p className="text-white/50 font-medium">No data available for the selected period.</p>
                </div>
            ) : (
                <>
                    {/* Summary Counters */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-indigo-500/20 to-blue-600/10 backdrop-blur-xl border border-blue-400/20 p-6 rounded-3xl shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform">
                            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity"><AssignmentTurnedIn sx={{fontSize: 100}}/></div>
                            <h4 className="text-blue-300/80 text-xs font-bold uppercase tracking-widest mb-1 relative z-10">Total Assessed</h4>
                            <div className="text-4xl font-black text-white drop-shadow-md relative z-10">{stats.total}</div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-500/20 to-green-600/10 backdrop-blur-xl border border-emerald-400/20 p-6 rounded-3xl shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform">
                            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity"><CheckCircle className="text-emerald-500" sx={{fontSize: 100}}/></div>
                            <h4 className="text-emerald-300/80 text-xs font-bold uppercase tracking-widest mb-1 relative z-10">Resolved Tasks</h4>
                            <div className="text-4xl font-black text-white drop-shadow-md relative z-10">{stats.resolved}</div>
                        </div>
                        <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/10 backdrop-blur-xl border border-amber-400/20 p-6 rounded-3xl shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform">
                            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity"><ReportProblem className="text-amber-500" sx={{fontSize: 100}}/></div>
                            <h4 className="text-amber-300/80 text-xs font-bold uppercase tracking-widest mb-1 relative z-10">Pending Queue</h4>
                            <div className="text-4xl font-black text-white drop-shadow-md relative z-10">{stats.pending}</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/10 backdrop-blur-xl border border-purple-400/20 p-6 rounded-3xl shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform">
                            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity"><Speed className="text-purple-500" sx={{fontSize: 100}}/></div>
                            <h4 className="text-purple-300/80 text-xs font-bold uppercase tracking-widest mb-1 relative z-10">Resolution Rate</h4>
                            <div className="text-4xl font-black text-white drop-shadow-md relative z-10">{stats.resolutionRate}%</div>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Status Distribution */}
                        <div className={`bg-gradient-to-br from-gray-900/40 to-black/40 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/10 ${isDeptScoped ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-bold text-white drop-shadow-sm flex items-center gap-2 text-lg">
                                    <BarIcon className="text-blue-400 filter drop-shadow-md" /> Resolution Pipeline
                                </h3>
                            </div>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.statusData} layout="vertical" margin={{ left: 20, right: 20 }}>
                                        <defs>
                                            {stats.statusData.map((d, i) => (
                                                <linearGradient key={`grad-${i}`} id={`grad-${i}`} x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor={d.gradient[0]} stopOpacity={0.8}/>
                                                    <stop offset="100%" stopColor={d.gradient[1]} stopOpacity={1}/>
                                                </linearGradient>
                                            ))}
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={90} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.8)', fontWeight: 600 }} />
                                        <Tooltip 
                                            cursor={{ fill: 'rgba(255,255,255,0.03)' }} 
                                            contentStyle={{ backgroundColor: 'rgba(10,10,20,0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }} 
                                            itemStyle={{ color: '#fff', fontWeight: 'bold' }} 
                                        />
                                        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={28}>
                                            {stats.statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={`url(#grad-${index})`} style={{ filter: `drop-shadow(0px 0px 8px ${entry.color}40)` }} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Sector Distribution (Only for Global Admins) */}
                        {!isDeptScoped && (
                            <div className="bg-gradient-to-br from-gray-900/40 to-black/40 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/10 flex flex-col">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="font-bold text-white drop-shadow-sm flex items-center gap-2 text-lg">
                                        <PieIcon className="text-purple-400 filter drop-shadow-md" /> Sector Workload
                                    </h3>
                                </div>
                                <div className="flex-1 min-h-[250px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats.sectorData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={65}
                                                outerRadius={90}
                                                paddingAngle={8}
                                                cornerRadius={6}
                                                dataKey="value"
                                                stroke="rgba(255,255,255,0.05)"
                                                strokeWidth={2}
                                            >
                                                {stats.sectorData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ filter: `drop-shadow(0px 0px 10px ${COLORS[index % COLORS.length]}40)` }} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: 'rgba(10,10,20,0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '16px' }} 
                                                itemStyle={{ color: '#fff', fontWeight: 'bold' }} 
                                            />
                                            <Legend 
                                                wrapperStyle={{ paddingTop: '20px', color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: 600 }} 
                                                iconType="circle"
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Donut Center Content */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-6">
                                        <div className="text-center">
                                            <div className="text-2xl font-black text-white">{stats.total}</div>
                                            <div className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Total</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Trend Over Time */}
                        <div className="bg-gradient-to-br from-gray-900/40 to-black/40 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/10 lg:col-span-3">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-bold text-white drop-shadow-sm flex items-center gap-2 text-lg">
                                    <TrendingUp className="text-emerald-400 filter drop-shadow-md" /> Reporting Trend ({new Date(filterMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
                                </h3>
                            </div>
                            <div className="h-[22rem] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.timeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#34D399" stopOpacity={0.5} />
                                                <stop offset="95%" stopColor="#34D399" stopOpacity={0.0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.06)" />
                                        <XAxis 
                                            dataKey="date" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)', fontWeight: 500 }} 
                                            dy={10} 
                                            interval="preserveStartEnd" 
                                            minTickGap={20}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)', fontWeight: 500 }} 
                                            dx={-10}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(10,10,20,0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                                            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="count" 
                                            stroke="#34D399" 
                                            fillOpacity={1} 
                                            fill="url(#colorCount)" 
                                            strokeWidth={3} 
                                            activeDot={{ r: 6, fill: '#34D399', stroke: '#fff', strokeWidth: 2, style: { filter: 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.8))' } }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                </>
            )}
        </div>
    );
};

export default Analytics;
