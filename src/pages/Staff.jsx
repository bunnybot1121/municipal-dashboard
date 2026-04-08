import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../services/apiClient';
import {
    Search, Add as Plus, Close, CheckCircle, Delete,
    Person as UserIcon, Badge, Work as RoleIcon,
    Domain as SectorIcon, Key, Visibility, VisibilityOff,
    FilterList, Assignment, AssignmentTurnedIn, PendingActions
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import {
    BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { DateRange, InsertChart, Edit as EditIcon, Assessment } from '@mui/icons-material';

const DOMAIN = 'nagarsevak.com';

const Staff = () => {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sectorFilter, setSectorFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [adding, setAdding] = useState(false);
    const [showPass, setShowPass] = useState({});
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Analytics states
    const [allTasks, setAllTasks] = useState([]);
    const [allIssues, setAllIssues] = useState([]);
    const [activeModalTab, setActiveModalTab] = useState('edit');
    const [analysisMonth, setAnalysisMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [analysisSource, setAnalysisSource] = useState('citizen');

    const [newStaff, setNewStaff] = useState({
        name: '', username: '', password: '', assigned_zone: 'North'
    });

    const { isAdmin, department, isSeniorEngineer, isJuniorEngineer, isDepartment } = useAuth();

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            let query = supabase
                .from('profiles')
                .select('*')
                .neq('role', 'citizen')
                .order('created_at', { ascending: false });

            // If not a system admin, only show staff in the user's sector
            if (!isAdmin && department) {
                query = query.eq('sector', department);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Fetch both tasks and issues for analytics and charting
            let tasksData = [];
            let issuesData = [];
            try {
                const [tasksRes, issuesRes] = await Promise.all([
                    api.getTasks().catch(() => []),
                    api.getIssues().catch(() => [])
                ]);
                tasksData = tasksRes || [];
                issuesData = issuesRes || [];
                setAllTasks(tasksData);
                setAllIssues(issuesData);
            } catch (err) {
                console.error('Failed to fetch tasks/issues for analytics', err);
            }

            const staffWithAnalytics = (data || []).map(staff => {
                const workerTasks = tasksData.filter(t => {
                    return (
                        t.assigned_to === staff.id ||
                        t.assignedToId === staff.id ||
                        t.staffId === staff.id ||
                        t.staff_id === staff.id
                    );
                });
                const totalTasks = workerTasks.length;
                const completedTasks = workerTasks.filter(t => ['completed', 'resolved', 'closed'].includes(t.status?.toLowerCase())).length;
                const pendingTasks = workerTasks.filter(t => ['pending', 'in-progress', 'in_progress', 'scheduled'].includes(t.status?.toLowerCase())).length;
                const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                return {
                    ...staff,
                    totalTasks,
                    completedTasks,
                    pendingTasks,
                    completionRate
                };
            });

            setStaffList(staffWithAnalytics);
        } catch (e) {
            console.error('Failed to fetch staff', e);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddStaff(e) {
        e.preventDefault();
        setError('');
        setAdding(true);

        // Validation constraints
        if (!/^[A-Za-z\s]+$/.test(newStaff.name.trim())) {
            setError('Name should only contain alphabetic characters.');
            setAdding(false);
            return;
        }
        if (newStaff.password.length < 6) {
            setError('Password must be at least 6 characters.');
            setAdding(false);
            return;
        }

        const username = newStaff.username.trim().toLowerCase().replace(/\s/g, '');

        // Helper to generate a UUID if crypto.randomUUID is unavailable
        const generateUUID = () => {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                return crypto.randomUUID();
            }
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };

        try {
            // Check if username already exists
            const { data: existing } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', username)
                .single();

            if (existing) throw new Error(`Username "${username}" is already taken.`);

            // Insert directly into profiles — no Supabase Auth needed
            const { error: insertError } = await supabase.from('profiles').insert({
                id: generateUUID(),
                full_name: newStaff.name.trim(),
                username: username,
                password: newStaff.password, // stored for internal login
                role: 'worker',
                sector: department || 'other',
                assigned_zone: newStaff.assigned_zone,
                status: 'available',
            });

            if (insertError) throw insertError;

            setSuccessMsg(`✅ ${newStaff.name} added! Login: ${username} / ${newStaff.password}`);
            setIsModalOpen(false);
            setNewStaff({ name: '', username: '', password: '', assigned_zone: 'North' });
            loadData();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (err) {
            setError(err.message || 'Failed to add staff.');
        } finally {
            setAdding(false);
        }
    }

    async function handleEditStaff(e) {
        e.preventDefault();
        setError('');
        setAdding(true);

        // Validation constraints
        if (!/^[A-Za-z\s]+$/.test(editingStaff.full_name.trim())) {
            setError('Name should only contain alphabetic characters.');
            setAdding(false);
            return;
        }
        if (editingStaff.password && editingStaff.password.length < 6) {
            setError('Password must be at least 6 characters.');
            setAdding(false);
            return;
        }

        try {
            const { error: updateError } = await supabase.from('profiles').update({
                full_name: editingStaff.full_name.trim(),
                password: editingStaff.password,
                assigned_zone: editingStaff.assigned_zone
            }).eq('id', editingStaff.id);

            if (updateError) throw updateError;

            setSuccessMsg(`✅ ${editingStaff.full_name || editingStaff.username} updated!`);
            setEditingStaff(null);
            loadData();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (err) {
            setError(err.message || 'Failed to update supervisor.');
        } finally {
            setAdding(false);
        }
    }

    async function handleDelete(staffMember) {
        if (!window.confirm(`Remove ${staffMember.full_name || staffMember.username}?`)) return;
        try {
            await supabase.from('profiles').update({ role: 'archived' }).eq('id', staffMember.id);
            setStaffList(prev => prev.filter(s => s.id !== staffMember.id));
        } catch (e) {
            alert('Failed to remove: ' + e.message);
        }
    }

    const isMatched = (t, profile) => {
        const explicit = (
            t.assigned_to === profile.id ||
            t.assignedToId === profile.id ||
            t.staffId === profile.id ||
            t.staff_id === profile.id
        );

        // If it's a scheduled task, ONLY show it if explicitly assigned to this staff member
        if (t.type === 'task') {
            return explicit;
        }

        const tSector = (t.sector || '').toLowerCase();
        const sSector = (profile.sector || '').toLowerCase();
        const tZone = t.assigned_zone;
        const sZone = profile.assigned_zone;
        const isUnassigned = !t.assigned_to && !t.staff_id && !t.assignedToId && !t.user_id;

        let implicit = false;
        if (isUnassigned || t.type === 'issue' || t.aiAnalysis) {
            if (sZone && sSector && sSector !== 'other') {
                implicit = (tSector === sSector && tZone === sZone);
            } else if (sSector && sSector !== 'other') {
                implicit = (tSector === sSector);
            } else if (sZone) {
                implicit = (tZone === sZone);
            }
        }
        return explicit || implicit;
    };

    const filtered = staffList.filter(s => {
        const matchesSearch = (s.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.assigned_zone || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSector = sectorFilter === 'all' || (s.sector || 'other').toLowerCase() === sectorFilter.toLowerCase();
        return matchesSearch && matchesSector;
    });

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/10 backdrop-blur-xl p-6 rounded-[2rem] shadow-lg border border-white/20">
                <div>
                    <h1 className="text-xl font-bold text-white drop-shadow-sm">Field Supervisors</h1>
                    <p className="text-sm text-white/70">Manage field supervisors and their login credentials</p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                    {/* Sector Filter */}
                    {(isAdmin || !department) && (
                        <div className="relative w-full md:w-auto">
                            <select
                                value={sectorFilter}
                                onChange={(e) => setSectorFilter(e.target.value)}
                                className="w-full pl-10 pr-8 py-2 md:py-2.5 bg-white/10 rounded-xl border border-white/20 text-white text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none appearance-none [&>option]:text-gray-900 md:min-w-[160px] cursor-pointer hover:bg-white/20 transition-colors"
                            >
                                <option value="all">All Departments</option>
                                <option value="water">Water</option>
                                <option value="waste">Solid Waste</option>
                                <option value="roads">Roads</option>
                                <option value="electrical">Electrical</option>
                                <option value="parks">Parks</option>
                                <option value="health">Public Health</option>
                                <option value="other">Other</option>
                            </select>
                            <FilterList className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" sx={{ fontSize: 18 }} />
                        </div>
                    )}

                    <div className="relative w-full md:w-64">
                        <Search sx={{ fontSize: 18 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                        <input
                            type="text" placeholder="Search field supervisors..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 md:py-2.5 bg-white/10 rounded-xl border border-white/20 text-white placeholder-white/50 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none hover:bg-white/20 transition-colors"
                        />
                    </div>
                    <button
                        onClick={() => { setIsModalOpen(true); setError(''); }}
                        className="px-5 py-2.5 liquid-btn liquid-btn-blue rounded-xl text-sm font-semibold flex items-center gap-2"
                    >
                        <Plus sx={{ fontSize: 18 }} />
                        <span className="hidden sm:inline">Add Field Staff</span>
                    </button>
                </div>
            </div>

            {/* Success banner */}
            {successMsg && (
                <div className="bg-green-500/20 border border-green-500/30 text-green-200 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 backdrop-blur-sm shadow-sm">
                    <CheckCircle sx={{ fontSize: 18 }} className="text-green-400" />
                    {successMsg}
                </div>
            )}

            {/* Worker Login URL notice */}
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl px-4 py-3 text-sm text-blue-200 flex items-center gap-2 backdrop-blur-sm shadow-sm">
                <Key sx={{ fontSize: 18 }} className="text-blue-400 flex-shrink-0" />
                <span>Workers log in at <strong className="font-mono bg-white/10 px-1 rounded border border-white/10">/worker</strong> using their <strong>username</strong> and <strong>password</strong> set below.</span>
            </div>

            {/* Staff Grid */}
            {loading ? (
                <div className="text-center py-10 text-white/50">Loading staff...</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-10 text-white/50 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                    {searchTerm ? 'No staff match your search.' : 'No staff members yet. Click "Add Staff" to create one.'}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map(staff => (
                        <div key={staff.id}
                            onClick={() => { setEditingStaff({ ...staff }); setError(''); setShowPass({}); setActiveModalTab('edit'); setAnalysisSource('citizen'); }}
                            className="bg-white/10 backdrop-blur-md p-5 rounded-[2rem] shadow-lg border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all group cursor-pointer relative">
                            {/* Top row */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-lg font-bold text-blue-200 border border-blue-400/30 group-hover:scale-105 transition-transform backdrop-blur-sm">
                                            {(staff.full_name || staff.username || '?').charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white drop-shadow-sm">{staff.full_name || staff.username}</h3>
                                        <span className="text-xs text-blue-200 bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded-full uppercase tracking-wide font-semibold backdrop-blur-sm">
                                            Field Staff
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(staff); }}
                                    className="p-1.5 z-10 text-white/40 hover:text-red-400 hover:bg-red-500/20 rounded-xl transition-colors relative"
                                    title="Remove staff"
                                >
                                    <Delete sx={{ fontSize: 18 }} />
                                </button>
                            </div>

                            {/* Details & Analytics */}
                            <div className="space-y-4 mb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-white/70">
                                        <Badge sx={{ fontSize: 16 }} className="text-white/50" />
                                        <span className="font-mono font-semibold">@{staff.username || '—'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm z-10 relative">
                                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold shadow-sm border ${(staff.sector || '').toLowerCase() === 'water' ? 'border-blue-500/30 text-blue-200 bg-blue-500/20' :
                                                (staff.sector || '').toLowerCase() === 'waste' ? 'border-amber-500/30 text-amber-200 bg-amber-500/20' :
                                                    'border-emerald-500/30 text-emerald-200 bg-emerald-500/20'
                                            }`}>
                                            {staff.sector ? staff.sector.charAt(0).toUpperCase() + staff.sector.slice(1) : 'General'} • {staff.assigned_zone || 'Unassigned'}
                                        </span>
                                    </div>
                                </div>

                                {/* Dashboard Prompt */}
                                <div className="bg-white/5 rounded-xl p-3 border border-white/10 mt-4 relative overflow-hidden group-hover:bg-white/10 transition-colors">
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-white/50 group-hover:text-white/80 transition-colors">
                                        <span>Click to Manage</span>
                                        <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded border border-white/10"><Assessment sx={{ fontSize: 12 }} /> Dashboard Options</span>
                                    </div>
                                </div>
                            </div>

                            {/* Credential card */}
                            {staff.username && (
                                <div className="bg-black/20 border border-white/10 rounded-xl p-3 mt-3 backdrop-blur-sm">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5 flex items-center gap-1">
                                        <Key sx={{ fontSize: 12 }} /> Login Credentials
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <p className="text-white/50 text-[10px] mb-0.5">Username</p>
                                            <p className="font-mono font-bold text-white/90">{staff.username}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/50 text-[10px] mb-0.5">Portal</p>
                                            <p className="font-mono font-bold text-blue-300">/worker</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-3 mt-3 border-t border-white/10 flex justify-between items-center text-xs text-white/50">
                                <span>Joined: {staff.created_at ? new Date(staff.created_at).toLocaleDateString() : '—'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Staff Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <div className="bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/20 w-full max-w-lg overflow-hidden animate-fade-in">
                        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="font-bold text-white drop-shadow-sm text-lg">Add New Field Supervisor</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors"><Close /></button>
                        </div>
                        <form onSubmit={handleAddStaff} className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-500/20 border border-red-500/30 text-red-200 rounded-lg px-4 py-2 text-sm">{error}</div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-white/70 uppercase mb-1 drop-shadow-sm">Full Name</label>
                                <input required type="text" placeholder="e.g. Ravi Kumar"
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                                    pattern="^[A-Za-z\s]+$" title="Name should only contain letters and spaces" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-white/70 uppercase mb-1 drop-shadow-sm">Username</label>
                                    <input required type="text" placeholder="e.g. ravi123"
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 font-mono"
                                        value={newStaff.username} onChange={e => setNewStaff({ ...newStaff, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                                        pattern="^[a-z0-9_]+$" title="Username should only contain lowercase letters, numbers, and underscores" />
                                    {newStaff.username && (
                                        <p className="text-[10px] text-white/50 mt-0.5">Login email: {newStaff.username}@{DOMAIN}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/70 uppercase mb-1 drop-shadow-sm">Password</label>
                                    <div className="relative">
                                        <input required type={showPass.new ? 'text' : 'password'} placeholder="Min 6 chars"
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 pr-9"
                                            value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                                            minLength={6} />
                                        <button type="button" className="absolute right-2.5 top-2.5 text-white/50 hover:text-white"
                                            onClick={() => setShowPass(p => ({ ...p, new: !p.new }))}>
                                            {showPass.new ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-white/70 uppercase mb-1 drop-shadow-sm">Assigned Zone</label>
                                    <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/50 [&>option]:text-gray-900"
                                        value={newStaff.assigned_zone} onChange={e => setNewStaff({ ...newStaff, assigned_zone: e.target.value })}>
                                        {['North', 'South', 'East', 'West', 'Central'].map(z =>
                                            <option key={z} value={z}>{z} Zone</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 rounded-xl transition-colors">Cancel</button>
                                <button type="submit" disabled={adding}
                                    className="px-5 py-2 liquid-btn liquid-btn-blue text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-60 flex items-center gap-2">
                                    {adding ? 'Adding…' : '+ Add Staff'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Staff Modal */}
            {editingStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <div className="bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/20 w-full max-w-lg overflow-hidden animate-fade-in relative">
                        {/* Tab Headers */}
                        <div className="p-3 border-b border-white/10 bg-white/5 flex items-center gap-2 pr-12">
                            <button type="button" onClick={() => setActiveModalTab('edit')} className={`flex-1 py-2 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${activeModalTab === 'edit' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}>
                                <EditIcon sx={{ fontSize: 16 }} /> Edit Profile
                            </button>
                            <button type="button" onClick={() => setActiveModalTab('analytics')} className={`flex-1 py-2 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${activeModalTab === 'analytics' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}>
                                <Assessment sx={{ fontSize: 16 }} /> Data Analysis
                            </button>
                            <button type="button" onClick={() => setEditingStaff(null)} className="absolute top-4 right-4 text-white/50 hover:text-white bg-black/20 p-2 rounded-full hover:bg-white/10 transition-colors z-10"><Close /></button>
                        </div>
                        {activeModalTab === 'edit' ? (
                            <form onSubmit={handleEditStaff} className="p-6 space-y-4">
                                {error && (
                                    <div className="bg-red-500/20 border border-red-500/30 text-red-200 rounded-lg px-4 py-2 text-sm">{error}</div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-white/70 uppercase mb-1 drop-shadow-sm">Full Name</label>
                                    <input required type="text" placeholder="e.g. Ravi Kumar"
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                                        value={editingStaff.full_name || ''} onChange={e => setEditingStaff({ ...editingStaff, full_name: e.target.value })}
                                        pattern="^[A-Za-z\s]+$" title="Name should only contain letters and spaces" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-white/70 uppercase mb-1 drop-shadow-sm flex items-center gap-1">Login ID <span className="text-[9px] text-white/30 font-normal normal-case tracking-normal">(Read Only)</span></label>
                                        <input readOnly type="text"
                                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-blue-300 font-bold text-lg outline-none font-mono tracking-wide"
                                            value={editingStaff.username} />
                                        <p className="text-[10px] text-white/60 mt-1.5">Use this exact ID to log in at <strong className="text-white">/worker</strong></p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-white/70 uppercase mb-1 drop-shadow-sm">Password</label>
                                        <div className="relative">
                                            <input required type={showPass.edit ? 'text' : 'password'}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 pr-9 font-mono"
                                                value={editingStaff.password || ''} onChange={e => setEditingStaff({ ...editingStaff, password: e.target.value })}
                                                minLength={6} />
                                            <button type="button" className="absolute right-2.5 top-2.5 text-white/50 hover:text-white"
                                                onClick={() => setShowPass(p => ({ ...p, edit: !p.edit }))}>
                                                {showPass.edit ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-white/70 uppercase mb-1 drop-shadow-sm">Assigned Zone</label>
                                        <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/50 [&>option]:text-gray-900"
                                            value={editingStaff.assigned_zone || 'North'} onChange={e => setEditingStaff({ ...editingStaff, assigned_zone: e.target.value })}>
                                            {['North', 'South', 'East', 'West', 'Central'].map(z =>
                                                <option key={z} value={z}>{z} Zone</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <button type="button" onClick={() => setEditingStaff(null)}
                                        className="px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 rounded-xl transition-colors">Cancel</button>
                                    <button type="submit" disabled={adding}
                                        className="px-5 py-2 liquid-btn liquid-btn-blue text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-60 flex items-center gap-2">
                                        {adding ? 'Saving…' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="p-6 space-y-6 animate-fade-in text-white h-[65vh] overflow-y-auto">
                                <div className="flex justify-between items-center bg-black/20 p-2 rounded-xl backdrop-blur-sm border border-white/10">
                                    <div className="flex gap-2">
                                        <button onClick={() => setAnalysisSource('citizen')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${analysisSource === 'citizen' ? 'bg-blue-500/30 text-blue-200 border-blue-500/50' : 'bg-transparent text-white/50 hover:bg-white/5 border-transparent'} border`}>Citizen</button>
                                        <button onClick={() => setAnalysisSource('schedule')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${analysisSource === 'schedule' ? 'bg-emerald-500/30 text-emerald-200 border-emerald-500/50' : 'bg-transparent text-white/50 hover:bg-white/5 border-transparent'} border`}>Schedule</button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DateRange sx={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }} />
                                        <input type="month" value={analysisMonth} onChange={e => setAnalysisMonth(e.target.value)} className="bg-black/40 border border-white/20 rounded-lg px-2 py-1.5 text-sm text-white font-mono outline-none" />
                                    </div>
                                </div>
                                {(() => {
                                    const sourceData = analysisSource === 'citizen' ? allIssues : allTasks;
                                    const matchedData = sourceData.map(d => ({ ...d, type: analysisSource === 'citizen' ? 'issue' : 'task' })).filter(d => isMatched(d, editingStaff));

                                    // filter by month
                                    const [y, m] = analysisMonth.split('-');
                                    const filteredByMonth = matchedData.filter(d => {
                                        let dtStr;
                                        if (d.type === 'task') {
                                            dtStr = d.scheduled_start || d.scheduledStart || d.created_at || d.createdAt;
                                        } else {
                                            dtStr = d.created_at || d.createdAt;
                                        }
                                        if (!dtStr) return false;
                                        const date = new Date(dtStr);
                                        return date.getFullYear() === parseInt(y) && (date.getMonth() + 1) === parseInt(m);
                                    });

                                    if (filteredByMonth.length === 0) {
                                        return <div className="flex items-center justify-center h-48 text-white/50 flex-col gap-2">
                                            <InsertChart sx={{ fontSize: 40, opacity: 0.5 }} />
                                            <span>No {analysisSource === 'citizen' ? 'Citizen Reports' : 'Scheduled Tasks'} found for {analysisMonth}</span>
                                        </div>;
                                    }

                                    // Aggregate by day
                                    const dayMap = {};
                                    let completedCount = 0;
                                    let pendingCount = 0;

                                    filteredByMonth.forEach(d => {
                                        let dtStr;
                                        if (d.type === 'task') {
                                            dtStr = d.scheduled_start || d.scheduledStart || d.created_at || d.createdAt;
                                        } else {
                                            dtStr = d.created_at || d.createdAt;
                                        }
                                        const day = new Date(dtStr).getDate();
                                        if (!dayMap[day]) dayMap[day] = { day: `${day}`, created: 0, completed: 0 };
                                        dayMap[day].created += 1;

                                        const isCompleted = ['completed', 'resolved', 'closed', 'resolved - verified'].includes((d.status || '').toLowerCase());
                                        if (isCompleted) {
                                            dayMap[day].completed += 1;
                                            completedCount++;
                                        } else {
                                            pendingCount++;
                                        }
                                    });

                                    const chartData = Object.values(dayMap).sort((a, b) => parseInt(a.day) - parseInt(b.day));
                                    const pieData = [
                                        { name: 'Completed', value: completedCount, color: '#10b981' },
                                        { name: 'Pending', value: pendingCount, color: '#f59e0b' }
                                    ];

                                    return (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-black/20 border border-white/10 p-4 rounded-xl text-center shadow-inner">
                                                    <div className="text-3xl font-black text-white">{filteredByMonth.length}</div>
                                                    <div className="text-[10px] uppercase tracking-widest text-white/50 mt-1">Total Assigned</div>
                                                </div>
                                                <div className="bg-black/20 border border-white/10 p-4 rounded-xl flex justify-around shadow-inner">
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-emerald-400">{completedCount}</div>
                                                        <div className="text-[9px] uppercase tracking-widest text-white/40">Done</div>
                                                    </div>
                                                    <div className="w-[1px] bg-white/10 h-full mx-2"></div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-amber-400">{pendingCount}</div>
                                                        <div className="text-[9px] uppercase tracking-widest text-white/40">Pend</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-4">Daily Task Volume</h4>
                                                <div className="h-48 w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                                            <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                                                            <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                                                            <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                                                            <Bar dataKey="created" name="Assigned" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
                                                            <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-4">Status Breakdown</h4>
                                                <div className="h-40 w-full flex items-center justify-center relative">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                                                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                                            </Pie>
                                                            <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', padding: '4px 8px' }} itemStyle={{ color: '#fff', fontSize: '12px' }} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                        <span className="text-xl font-bold text-white leading-none">{filteredByMonth.length ? Math.round((completedCount / filteredByMonth.length) * 100) : 0}%</span>
                                                        <span className="text-[8px] text-white/50 uppercase tracking-widest">Rate</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Staff;
