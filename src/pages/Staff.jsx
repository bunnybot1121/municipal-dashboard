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
            
            // Fetch tasks for analytics
            let tasksData = [];
            try {
                tasksData = await api.getTasks() || [];
            } catch (err) {
                console.error('Failed to fetch tasks for analytics', err);
            }

            const staffWithAnalytics = (data || []).map(staff => {
                const workerTasks = tasksData.filter(t => 
                    t.assigned_to === staff.id || 
                    t.assignedToId === staff.id ||
                    t.staffId === staff.id ||
                    t.staff_id === staff.id
                );
                const totalTasks = workerTasks.length;
                const completedTasks = workerTasks.filter(t => ['completed', 'resolved', 'closed'].includes(t.status?.toLowerCase())).length;
                const pendingTasks = workerTasks.filter(t => ['pending', 'in-progress', 'in_progress', 'scheduled'].includes(t.status?.toLowerCase())).length;
                const completionRate = totalTasks > 0 ? Math.round((completedTasks/totalTasks)*100) : 0;
                
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
                             onClick={() => { setEditingStaff({...staff}); setError(''); setShowPass({}); }}
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
                                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold shadow-sm border ${
                                            (staff.sector || '').toLowerCase() === 'water' ? 'border-blue-500/30 text-blue-200 bg-blue-500/20' :
                                            (staff.sector || '').toLowerCase() === 'waste' ? 'border-amber-500/30 text-amber-200 bg-amber-500/20' :
                                            'border-emerald-500/30 text-emerald-200 bg-emerald-500/20'
                                        }`}>
                                            {staff.sector ? staff.sector.charAt(0).toUpperCase() + staff.sector.slice(1) : 'General'} • {staff.assigned_zone || 'Unassigned'}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Analytics Mini-Dashboard */}
                                <div className="bg-white/5 rounded-xl p-3 border border-white/10 relative overflow-hidden group-hover:bg-white/10 transition-colors">
                                    {/* Progress background bar effect */}
                                    <div className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-emerald-500/5 to-transparent transition-all duration-1000" style={{ width: `${staff.completionRate}%` }} />
                                    
                                    <h4 className="text-[10px] uppercase tracking-wider font-bold text-white/50 mb-3 flex items-center gap-1 z-10 relative">
                                        <Assignment sx={{ fontSize: 14 }} /> Staff Activity Analytics
                                    </h4>
                                    
                                    <div className="grid grid-cols-3 gap-2 z-10 relative">
                                        <div className="text-center bg-black/20 rounded-lg p-2.5 flex flex-col justify-center items-center shadow-inner">
                                            <span className="text-xl font-black text-white drop-shadow-md leading-none mb-1">{staff.totalTasks || 0}</span>
                                            <span className="text-[9px] uppercase tracking-widest text-white/50 flex items-center gap-1"><Assignment sx={{fontSize:9}}/> Total</span>
                                        </div>
                                        <div className="text-center bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 flex flex-col justify-center items-center shadow-sm">
                                            <span className="text-xl font-black text-emerald-400 drop-shadow-md leading-none mb-1">{staff.completedTasks || 0}</span>
                                            <span className="text-[9px] uppercase tracking-widest text-emerald-400/80 flex items-center gap-1"><AssignmentTurnedIn sx={{fontSize:9}}/> Done</span>
                                        </div>
                                        <div className="text-center bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 flex flex-col justify-center items-center shadow-sm">
                                            <span className="text-xl font-black text-amber-400 drop-shadow-md leading-none mb-1">{staff.pendingTasks || 0}</span>
                                            <span className="text-[9px] uppercase tracking-widest text-amber-400/80 flex items-center gap-1"><PendingActions sx={{fontSize:9}}/> Pend</span>
                                        </div>
                                    </div>
                                    
                                    {/* Completion Line */}
                                    <div className="mt-3.5 flex items-center gap-2 z-10 relative">
                                        <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden shadow-inner">
                                            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-1000 ease-out" style={{ width: `${staff.completionRate}%` }} />
                                        </div>
                                        <span className="text-[10px] font-black tracking-wider text-white/80 w-8 text-right drop-shadow-sm">{staff.completionRate}%</span>
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
                    <div className="bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/20 w-full max-w-lg overflow-hidden animate-fade-in">
                        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="font-bold text-white drop-shadow-sm text-lg">Edit Field Supervisor</h3>
                            <button onClick={() => setEditingStaff(null)} className="text-white/50 hover:text-white bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors"><Close /></button>
                        </div>
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default Staff;
