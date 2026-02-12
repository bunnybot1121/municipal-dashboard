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
    ShowChart as LineIcon
} from '@mui/icons-material';

const Analytics = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await api.getIssues();
            if (data && Array.isArray(data)) {
                setIssues(data);
            }
        } catch (error) {
            console.error("Failed to fetch analytics data", error);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        if (!issues.length) return null;

        // 1. Sector Distribution
        const sectorCounts = {};
        issues.forEach(i => {
            const s = (i.sector || 'other').toLowerCase();
            sectorCounts[s] = (sectorCounts[s] || 0) + 1;
        });
        const sectorData = Object.keys(sectorCounts).map(key => ({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: sectorCounts[key]
        })).sort((a, b) => b.value - a.value);

        // 2. Status Distribution
        const statusCounts = { pending: 0, 'in-progress': 0, resolved: 0, rejected: 0 };
        issues.forEach(i => {
            const s = (i.status || 'open').toLowerCase();
            if (statusCounts[s] !== undefined) statusCounts[s]++;
            else if (s === 'completed' || s === 'closed') statusCounts['resolved']++;
            else statusCounts['pending']++; // Default bucket
        });
        const statusData = [
            { name: 'Pending', value: statusCounts.pending, color: '#F59E0B' },
            { name: 'In Progress', value: statusCounts['in-progress'], color: '#3B82F6' },
            { name: 'Resolved', value: statusCounts.resolved, color: '#10B981' },
            { name: 'Rejected', value: statusCounts.rejected, color: '#EF4444' }
        ].filter(d => d.value > 0);

        // 3. Issues Over Time (Last 7 Days)
        const last7Days = {};
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            last7Days[d.toISOString().split('T')[0]] = 0;
        }

        issues.forEach(i => {
            const date = (i.createdAt || i.reportedAt || '').split('T')[0];
            if (last7Days[date] !== undefined) {
                last7Days[date]++;
            }
        });

        const timeData = Object.keys(last7Days).map(date => ({
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            count: last7Days[date]
        }));

        return { sectorData, statusData, timeData };
    }, [issues]);

    const COLORS = ['#5B52FF', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];

    if (loading) return <div className="p-10 text-center text-gray-500">Loading analytics...</div>;
    if (!stats) return <div className="p-10 text-center text-gray-500">No data available for analytics.</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-800">Analytics Dashboard</h1>
                <p className="text-sm text-gray-500 font-medium">Insights and performance metrics</p>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Sector Distribution */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <PieIcon className="text-[#5B52FF]" /> Issues by Sector
                        </h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.sectorData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.sectorData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <BarIcon className="text-[#5B52FF]" /> Resolution Status
                        </h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.statusData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                    {stats.statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Trend Over Time */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 md:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <TrendingUp className="text-[#5B52FF]" /> Issue Reporting Trend (Last 7 Days)
                        </h3>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.timeData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#5B52FF" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#5B52FF" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#5B52FF" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Analytics;
