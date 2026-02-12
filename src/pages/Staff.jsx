import React, { useState, useEffect } from 'react';
import { api } from '../services/apiClient';
import {
    Search,
    Add as Plus,
    FilterList as Filter,
    MoreHoriz as MoreHorizontal,
    Person as UserIcon,
    Badge,
    Work as RoleIcon,
    Domain as SectorIcon,
    Close,
    CheckCircle,
    Cancel
} from '@mui/icons-material';

const Staff = () => {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // New Staff Form State
    const [newStaff, setNewStaff] = useState({
        name: '',
        username: '',
        password: '',
        role: 'staff',
        sector: 'other',
        status: 'available'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/users');
            const data = await res.json();
            if (Array.isArray(data)) {
                setStaffList(data);
            }
        } catch (error) {
            console.error("Failed to fetch staff", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStaff = async (e) => {
        e.preventDefault();
        try {
            await api.register(newStaff);
            setIsModalOpen(false);
            loadData(); // Reload list
            setNewStaff({
                name: '',
                username: '',
                password: '',
                role: 'staff',
                sector: 'other',
                status: 'available'
            });
            alert("Staff member added successfully!");
        } catch (error) {
            console.error("Failed to add staff", error);
            alert("Failed to add staff. Username might be taken.");
        }
    };

    const filteredStaff = staffList.filter(staff =>
        (staff.name && staff.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (staff.username && staff.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (staff.role && staff.role.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getSectorColor = (sector) => {
        const colors = {
            water: 'bg-blue-100 text-blue-700',
            roads: 'bg-slate-100 text-slate-700',
            lighting: 'bg-yellow-100 text-yellow-700',
            drainage: 'bg-cyan-100 text-cyan-700',
            waste: 'bg-green-100 text-green-700',
            power: 'bg-orange-100 text-orange-700',
            other: 'bg-gray-100 text-gray-700'
        };
        return colors[(sector || 'other').toLowerCase()] || colors['other'];
    };

    const getStatusColor = (status) => {
        switch ((status || 'offline').toLowerCase()) {
            case 'available': return 'bg-green-500';
            case 'busy': return 'bg-amber-500';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Staff Management</h1>
                    <p className="text-sm text-gray-500 font-medium">Manage team members and roles</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search sx={{ fontSize: 18 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search staff..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#5B52FF]/20 outline-none"
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-[#5B52FF] hover:bg-[#4338CA] text-white rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2"
                    >
                        <Plus sx={{ fontSize: 18 }} />
                        <span className="hidden sm:inline">Add Staff</span>
                    </button>
                </div>
            </div>

            {/* Staff Grid */}
            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading staff...</div>
            ) : filteredStaff.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-white rounded-xl border border-gray-200">No staff members found.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStaff.map(staff => (
                        <div key={staff._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-600 border border-gray-200 group-hover:scale-105 transition-transform">
                                            {(staff.name || staff.username).charAt(0).toUpperCase()}
                                        </div>
                                        <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${getStatusColor(staff.status)}`}></div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{staff.name || staff.username}</h3>
                                        <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                            {staff.role}
                                        </span>
                                    </div>
                                </div>
                                <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50">
                                    <MoreHorizontal />
                                </button>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Badge sx={{ fontSize: 16 }} className="text-gray-400" />
                                    <span>@{staff.username}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <DomainAsSectorIcon sx={{ fontSize: 16 }} className="text-gray-400" />
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${getSectorColor(staff.sector)}`}>
                                        {staff.sector || 'Unassigned'}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs font-medium text-gray-500">
                                <span>Joined: {new Date(staff.createdAt).toLocaleDateString()}</span>
                                <span className={staff.status === 'available' ? 'text-green-600' : 'text-gray-500'}>
                                    {staff.status || 'Offline'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Staff Modal */}
            {isModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 h-full">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden animate-fade-in relative">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800 text-lg">Add New Staff Member</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><Close /></button>
                        </div>
                        <form onSubmit={handleAddStaff} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                                <input required type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#5B52FF]/20 outline-none"
                                    value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} placeholder="e.g. John Doe" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                                    <input required type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#5B52FF]/20 outline-none"
                                        value={newStaff.username} onChange={e => setNewStaff({ ...newStaff, username: e.target.value })} placeholder="e.g. johndoe" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                                    <input required type="password" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#5B52FF]/20 outline-none"
                                        value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} placeholder="******" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                                    <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#5B52FF]/20 outline-none"
                                        value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}>
                                        <option value="staff">Staff</option>
                                        <option value="admin">Admin</option>
                                        <option value="citizen">Citizen</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sector</label>
                                    <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#5B52FF]/20 outline-none"
                                        value={newStaff.sector} onChange={e => setNewStaff({ ...newStaff, sector: e.target.value })}>
                                        <option value="other">Other</option>
                                        <option value="roads">Roads</option>
                                        <option value="water">Water</option>
                                        <option value="lighting">Lighting</option>
                                        <option value="drainage">Drainage</option>
                                        <option value="waste">Waste</option>
                                        <option value="power">Power</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#5B52FF]/20 outline-none"
                                    value={newStaff.status} onChange={e => setNewStaff({ ...newStaff, status: e.target.value })}>
                                    <option value="available">Available</option>
                                    <option value="busy">Busy</option>
                                    <option value="offline">Offline</option>
                                </select>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-[#5B52FF] hover:bg-[#4338CA] text-white rounded-lg text-sm font-bold shadow-md transition-colors">Add Staff</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const DomainAsSectorIcon = (props) => <SectorIcon {...props} />;

export default Staff;
