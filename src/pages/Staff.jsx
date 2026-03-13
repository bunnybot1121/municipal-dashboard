import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Search, Add as Plus, Close, CheckCircle, Delete,
    Person as UserIcon, Badge, Work as RoleIcon,
    Domain as SectorIcon, Key, Visibility, VisibilityOff
} from '@mui/icons-material';

const DOMAIN = 'nagarsevak.com';

const Staff = () => {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [adding, setAdding] = useState(false);
    const [showPass, setShowPass] = useState({});
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [newStaff, setNewStaff] = useState({
        name: '', username: '', password: '', role: 'worker', sector: 'other', status: 'available'
    });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .in('role', ['admin', 'staff', 'worker'])
                .order('created_at', { ascending: false });

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
                role: newStaff.role,
                sector: newStaff.sector,
                status: newStaff.status,
            });

            if (insertError) throw insertError;

            setSuccessMsg(`✅ ${newStaff.name} added! Login: ${username} / ${newStaff.password}`);
            setIsModalOpen(false);
            setNewStaff({ name: '', username: '', password: '', role: 'worker', sector: 'other', status: 'available' });
            loadData();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (err) {
            setError(err.message || 'Failed to add staff.');
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
        (s.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.sector || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sectorColor = (sector) => ({
        water: 'bg-blue-100 text-blue-700',
        roads: 'bg-slate-100 text-slate-700',
        lighting: 'bg-yellow-100 text-yellow-700',
        drainage: 'bg-cyan-100 text-cyan-700',
        waste: 'bg-green-100 text-green-700',
        power: 'bg-orange-100 text-orange-700',
        other: 'bg-gray-100 text-gray-700',
    }[(sector || 'other').toLowerCase()] || 'bg-gray-100 text-gray-700');

    const statusDot = (s) => ({
        available: 'bg-green-500',
        busy: 'bg-amber-500',
    }[(s || 'offline').toLowerCase()] || 'bg-gray-400');

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Staff Management</h1>
                    <p className="text-sm text-gray-500">Manage field workers and their login credentials</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search sx={{ fontSize: 18 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text" placeholder="Search staff..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                        />
                    </div>
                    <button
                        onClick={() => { setIsModalOpen(true); setError(''); }}
                        className="px-4 py-2 bg-[#5B52FF] hover:bg-[#4338CA] text-white rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2"
                    >
                        <Plus sx={{ fontSize: 18 }} />
                        <span className="hidden sm:inline">Add Staff</span>
                    </button>
                </div>
            </div>

            {/* Success banner */}
            {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
                    <CheckCircle sx={{ fontSize: 18 }} className="text-green-600" />
                    {successMsg}
                </div>
            )}

            {/* Worker Login URL notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 flex items-center gap-2">
                <Key sx={{ fontSize: 18 }} className="text-blue-500 flex-shrink-0" />
                <span>Workers log in at <strong className="font-mono">/worker</strong> using their <strong>username</strong> and <strong>password</strong> set below.</span>
            </div>

            {/* Staff Grid */}
            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading staff...</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-200">
                    {searchTerm ? 'No staff match your search.' : 'No staff members yet. Click "Add Staff" to create one.'}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map(staff => (
                        <div key={staff.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow group">
                            {/* Top row */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-lg font-bold text-indigo-600 border border-indigo-100 group-hover:scale-105 transition-transform">
                                            {(staff.full_name || staff.username || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${statusDot(staff.status)}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{staff.full_name || staff.username}</h3>
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-wide font-semibold">
                                            {staff.role}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(staff)}
                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Remove staff"
                                >
                                    <Delete sx={{ fontSize: 18 }} />
                                </button>
                            </div>

                            {/* Details */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Badge sx={{ fontSize: 16 }} className="text-gray-400" />
                                    <span className="font-mono font-semibold">@{staff.username || '—'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <SectorIcon sx={{ fontSize: 16 }} className="text-gray-400" />
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${sectorColor(staff.sector)}`}>
                                        {staff.sector || 'Unassigned'}
                                    </span>
                                </div>
                            </div>

                            {/* Credential card */}
                            {staff.username && (
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mt-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
                                        <Key sx={{ fontSize: 12 }} /> Login Credentials
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <p className="text-gray-400 text-[10px] mb-0.5">Username</p>
                                            <p className="font-mono font-bold text-gray-700">{staff.username}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-[10px] mb-0.5">Portal</p>
                                            <p className="font-mono font-bold text-indigo-600">/worker</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-3 mt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                                <span>Joined: {staff.created_at ? new Date(staff.created_at).toLocaleDateString() : '—'}</span>
                                <span className={staff.status === 'available' ? 'text-green-600 font-semibold' : ''}>
                                    {staff.status || 'Offline'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Staff Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden animate-fade-in">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800 text-lg">Add New Staff / Worker</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><Close /></button>
                        </div>
                        <form onSubmit={handleAddStaff} className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                                <input required type="text" placeholder="e.g. Ravi Kumar"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400"
                                    value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                                    <input required type="text" placeholder="e.g. ravi123"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400 font-mono"
                                        value={newStaff.username} onChange={e => setNewStaff({ ...newStaff, username: e.target.value.toLowerCase().replace(/\s/g, '') })} />
                                    {newStaff.username && (
                                        <p className="text-[10px] text-gray-400 mt-0.5">Login email: {newStaff.username}@{DOMAIN}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                                    <div className="relative">
                                        <input required type={showPass.new ? 'text' : 'password'} placeholder="Min 6 chars"
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400 pr-9"
                                            value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} />
                                        <button type="button" className="absolute right-2.5 top-2.5 text-gray-400"
                                            onClick={() => setShowPass(p => ({ ...p, new: !p.new }))}>
                                            {showPass.new ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                                    <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400"
                                        value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}>
                                        <option value="worker">Worker</option>
                                        <option value="staff">Staff</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sector</label>
                                    <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400"
                                        value={newStaff.sector} onChange={e => setNewStaff({ ...newStaff, sector: e.target.value })}>
                                        {['roads', 'water', 'lighting', 'drainage', 'waste', 'power', 'other'].map(s =>
                                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                                    <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400"
                                        value={newStaff.status} onChange={e => setNewStaff({ ...newStaff, status: e.target.value })}>
                                        <option value="available">Available</option>
                                        <option value="busy">Busy</option>
                                        <option value="offline">Offline</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" disabled={adding}
                                    className="px-5 py-2 bg-[#5B52FF] hover:bg-[#4338CA] text-white rounded-lg text-sm font-bold shadow-md disabled:opacity-60 flex items-center gap-2">
                                    {adding ? 'Adding…' : '+ Add Staff'}
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
