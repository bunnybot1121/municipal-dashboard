import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Search, Add as Plus, Close, CheckCircle, Delete,
    Person as UserIcon, Badge, Work as RoleIcon,
    Domain as SectorIcon, Key, Visibility, VisibilityOff
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const DOMAIN = 'nagarsevak.com';

const Staff = () => {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
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
            setStaffList(data || []);
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

    const filtered = staffList.filter(s =>
        (s.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.assigned_zone || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/10 backdrop-blur-xl p-6 rounded-[2rem] shadow-lg border border-white/20">
                <div>
                    <h1 className="text-xl font-bold text-white drop-shadow-sm">Field Supervisors</h1>
                    <p className="text-sm text-white/70">Manage field supervisors and their login credentials</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search sx={{ fontSize: 18 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                        <input
                            type="text" placeholder="Search field supervisors..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white/10 rounded-xl border border-white/20 text-white placeholder-white/50 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
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

                            {/* Details */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-white/70">
                                    <Badge sx={{ fontSize: 16 }} className="text-white/50" />
                                    <span className="font-mono font-semibold">@{staff.username || '—'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <SectorIcon sx={{ fontSize: 16 }} className="text-white/50" />
                                    <span className="px-2 py-0.5 rounded-md text-xs font-bold shadow-sm border border-emerald-500/30 text-emerald-200 bg-emerald-500/20">
                                        {staff.assigned_zone || 'Unassigned'} Zone
                                    </span>
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
                                    value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-white/70 uppercase mb-1 drop-shadow-sm">Username</label>
                                    <input required type="text" placeholder="e.g. ravi123"
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 font-mono"
                                        value={newStaff.username} onChange={e => setNewStaff({ ...newStaff, username: e.target.value.toLowerCase().replace(/\s/g, '') })} />
                                    {newStaff.username && (
                                        <p className="text-[10px] text-white/50 mt-0.5">Login email: {newStaff.username}@{DOMAIN}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/70 uppercase mb-1 drop-shadow-sm">Password</label>
                                    <div className="relative">
                                        <input required type={showPass.new ? 'text' : 'password'} placeholder="Min 6 chars"
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 pr-9"
                                            value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} />
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
                                    value={editingStaff.full_name || ''} onChange={e => setEditingStaff({ ...editingStaff, full_name: e.target.value })} />
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
                                            value={editingStaff.password || ''} onChange={e => setEditingStaff({ ...editingStaff, password: e.target.value })} />
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
