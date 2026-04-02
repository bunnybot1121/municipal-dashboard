import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/apiClient';
import Calendar from '../components/Calendar';
import {
    Add as Plus,
    UploadFile,
    Search,
    FilterList as Filter,
    MoreVert as MoreHorizontal,
    AccessTime as Clock,
    LocationOn as MapPin,
    CheckCircle,
    Circle,
    Close
} from '@mui/icons-material';

import { useAuth } from '../contexts/AuthContext'; // Import useAuth

const TaskScheduler = () => {
    const { user, isDepartment, isSeniorEngineer, isJuniorEngineer, department } = useAuth(); // Get user from context
    const isDeptScoped = isDepartment || isSeniorEngineer || isJuniorEngineer;
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterPriority, setFilterPriority] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [debugError, setDebugError] = useState(null); // Store raw error
    const [debugUploadInfo, setDebugUploadInfo] = useState(null); // Debug upload

    // New Task Form State
    const [newTask, setNewTask] = useState({
        title: '',
        sector: 'roads',
        priority: 'medium',
        scheduledDate: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        duration: '2',
        assignedTo: '',
        description: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setDebugError(null);

            setDebugError(null);

            // Check for soft reset
            // Call API directly (Removed soft reset filter)
            const tasksData = await api.getTasks({}).catch(err => {
                setDebugError(`Tasks: ${err.message}`);
                return [];
            });

            const usersData = await api.getUsers().catch(err => {
                console.error("User Fetch Error:", err);
                setDebugError(prev => `${prev || ''} | Users: ${err.message}`);
                return [];
            });

            if (tasksData && Array.isArray(tasksData)) {
                const relevantTasks = isDeptScoped ? tasksData.filter(t => (t.sector || '').toLowerCase() === (department || '').toLowerCase()) : tasksData;

                const normalizedTasks = relevantTasks.map(t => ({
                    ...t,
                    id: t.id,
                    assignee: t.assignedTo || 'Unassigned',
                    assigneeId: t.assignedToId,
                    scheduledDate: t.scheduledStart ? t.scheduledStart.split('T')[0] : (t.scheduledDate || ''),
                }));
                setTasks(normalizedTasks);
            }

            if (usersData && Array.isArray(usersData)) {
                let staffOnly = usersData.filter(u => ['admin', 'staff', 'worker'].includes(u.role));
                if (isDeptScoped && department) {
                    staffOnly = staffOnly.filter(u => u.sector && u.sector.toLowerCase() === department.toLowerCase());
                }
                setStaffList(staffOnly);
            }
        } catch (error) {
            console.error("Global Load Error:", error);
            setDebugError(`Global: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const startDateTime = new Date(`${newTask.scheduledDate}T${newTask.startTime}`);
            const hours = parseInt(newTask.duration) || 2;
            const endDateTime = new Date(startDateTime.getTime() + hours * 60 * 60 * 1000);

            const payload = {
                title: newTask.title,
                sector: isDeptScoped ? department : newTask.sector,
                priority: newTask.priority,
                description: newTask.description,
                scheduledStart: startDateTime,
                scheduledEnd: endDateTime,
                assignedTo: newTask.assignedTo || null,
                status: 'assigned'
            };

            await api.createTask(payload);
            setIsModalOpen(false);
            loadData();
            // Reset form
            setNewTask({
                title: '',
                sector: 'roads',
                priority: 'medium',
                scheduledDate: new Date().toISOString().split('T')[0],
                startTime: '09:00',
                duration: '2',
                assignedTo: '',
                description: ''
            });
        } catch (error) {
            console.error("Failed to create task", error);
            alert("Failed to create task");
        }
    };

    // Helper for Today's Date
    const isToday = (dateString) => {
        if (!dateString) return false;
        const d = new Date(dateString);
        const today = new Date();
        return d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear();
    };

    const filteredTasks = tasks.filter(task => {
        const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
        const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.sector?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = !selectedDate || task.scheduledDate === selectedDate.toISOString().split('T')[0];
        return matchesPriority && matchesSearch && matchesDate;
    });

    // Calculate Today's Stats for the Cards
    const todaysTasks = tasks.filter(t => isToday(t.scheduledStart || t.scheduled_start));
    const stats = {
        total: todaysTasks.length,
        completed: todaysTasks.filter(t => t.status === 'completed').length,
        pending: todaysTasks.filter(t => t.status === 'pending').length
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'critical': return 'bg-red-100 text-red-700 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-[var(--secondary)]';
            case 'in-progress': return 'text-[var(--primary)]';
            default: return 'text-[var(--text-light)]';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

                <div>
                    <h1 className="text-3xl font-bold text-white drop-shadow-md">Maintenance Scheduler <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-1 rounded-full ml-2">v2.0 LIVE</span></h1>
                    <p className="text-sm text-white/70 mt-1 drop-shadow-sm">Manage resources and schedule maintenance tasks</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/schedule-upload')}
                        className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors text-white shadow-sm hover:shadow-md"
                    >
                        <UploadFile sx={{ fontSize: 18 }} />
                        <span>Upload .md</span>
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-5 py-2.5 liquid-btn liquid-btn-blue rounded-xl text-sm font-semibold flex items-center gap-2"
                    >
                        <Plus sx={{ fontSize: 18 }} />
                        <span>New Task</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-1">
                    <Calendar
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                        tasks={tasks}
                    />

                    {/* Quick Stats */}
                    <div className="mt-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg p-6">
                        <h3 className="text-sm font-bold text-white mb-4 drop-shadow-sm">Quick Stats</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-white/70">Tasks Today</span>
                                <span className="text-sm text-white/70 hidden lg:inline">Total Tasks (Today)</span>
                                <span className="text-xl font-bold text-white">{stats.total}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-white/70">Completed (Today)</span>
                                <span className="text-xl font-bold text-emerald-400 drop-shadow-sm">
                                    {stats.completed}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-white/70">Pending (Today)</span>
                                <span className="text-xl font-bold text-amber-400 drop-shadow-sm">
                                    {stats.pending}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Task List */}
                <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-lg overflow-hidden">
                    {/* List Header */}
                    <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white drop-shadow-sm">
                            {selectedDate
                                ? `Tasks for ${selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`
                                : 'All Scheduled Tasks'
                            }
                        </h3>
                        <span className="text-xs text-white/70 font-medium">
                            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    {/* Filters */}
                    <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-3 bg-white/5">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" sx={{ fontSize: 18 }} />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 [&>option]:text-gray-900"
                        >
                            <option value="all">All Priorities</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                        {selectedDate && (
                            <button
                                onClick={() => setSelectedDate(null)}
                                className="px-4 py-2 bg-white/10 border border-white/20 text-white/80 rounded-xl text-sm font-medium hover:bg-white/20 transition-colors"
                            >
                                Clear Date
                            </button>
                        )}
                    </div>

                    {/* Task List */}
                    <div className="divide-y divide-white/10 max-h-[600px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-white/50">Loading tasks...</div>
                        ) : filteredTasks.length === 0 ? (
                            <div className="p-8 text-center text-white/50">
                                No tasks found{selectedDate ? ' for selected date' : ''}
                            </div>
                        ) : (
                            filteredTasks.map(task => (
                                <div key={task.id} className="p-5 hover:bg-white/5 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-0.5 ${task.status === 'completed' ? 'text-emerald-400' : 'text-blue-400'}`}>
                                            {task.status === 'completed' ? (
                                                <CheckCircle sx={{ fontSize: 20 }} />
                                            ) : (
                                                <Circle sx={{ fontSize: 20 }} />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h4 className="font-bold text-white mb-1.5">{task.title}</h4>
                                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                                        <span className={`px-2 py-0.5 rounded-md border font-bold ${getPriorityColor(task.priority)} shadow-sm`}>
                                                            {task.priority}
                                                        </span>
                                                        <span className="text-white/60 flex items-center gap-1 font-medium bg-white/10 px-2 py-0.5 rounded-md border border-white/10 backdrop-blur-sm">
                                                            <Clock sx={{ fontSize: 14 }} />
                                                            {task.scheduledDate}
                                                        </span>
                                                        {task.sector && (
                                                            <span className="text-white/60 flex items-center gap-1 font-medium bg-white/10 px-2 py-0.5 rounded-md border border-white/10 backdrop-blur-sm">
                                                                <MapPin sx={{ fontSize: 14 }} />
                                                                {task.sector}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {task.description && (
                                                        <p className="text-sm text-white/70 mt-3 line-clamp-2 leading-relaxed">
                                                            {task.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <button className="text-white/40 hover:text-white transition-colors">
                                                    <MoreHorizontal sx={{ fontSize: 20 }} />
                                                </button>
                                            </div>
                                            {task.assignee && task.assignee !== 'Unassigned' && (
                                                <div className="mt-4 flex items-center gap-2 text-xs text-white/70 font-medium">
                                                    <div className="w-6 h-6 rounded-full bg-blue-500/30 border border-blue-400/50 text-blue-200 flex items-center justify-center font-bold shadow-sm">
                                                        {task.assignee[0].toUpperCase()}
                                                    </div>
                                                    <span>{task.assignee}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {isModalOpen && (


            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all">
                <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/20 rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <h2 className="text-xl font-bold text-white drop-shadow-sm">Create New Task</h2>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full"
                        >
                            <Close />
                        </button>
                    </div>
                    <form onSubmit={handleCreateTask} className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-white/90 mb-2 drop-shadow-sm">Task Title *</label>
                            <input
                                type="text"
                                required
                                value={newTask.title}
                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white placeholder-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="e.g., Fix pothole on Main Street"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-white/90 mb-2 drop-shadow-sm">Department</label>
                                <select
                                    value={isDeptScoped ? department : newTask.sector}
                                    onChange={(e) => setNewTask({ ...newTask, sector: e.target.value })}
                                    disabled={isDeptScoped}
                                    className={`w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 [&>option]:text-gray-900 ${isDeptScoped ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <option value="roads">Roads</option>
                                    <option value="drainage">Drainage</option>
                                    <option value="power">Power</option>
                                    <option value="water">Water</option>
                                    <option value="parks">Parks</option>
                                    <option value="buildings">Buildings</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-white/90 mb-2 drop-shadow-sm">Priority</label>
                                <select
                                    value={newTask.priority}
                                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 [&>option]:text-gray-900"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-white/90 mb-2 drop-shadow-sm">Date *</label>
                                <input
                                    type="date"
                                    required
                                    value={newTask.scheduledDate}
                                    onChange={(e) => setNewTask({ ...newTask, scheduledDate: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white [color-scheme:dark] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-white/90 mb-2 drop-shadow-sm">Start Time</label>
                                <input
                                    type="time"
                                    value={newTask.startTime}
                                    onChange={(e) => setNewTask({ ...newTask, startTime: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white [color-scheme:dark] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-white/90 mb-2 drop-shadow-sm">Duration (hrs)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={newTask.duration}
                                    onChange={(e) => setNewTask({ ...newTask, duration: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-white/90 mb-2 drop-shadow-sm">Assign To</label>
                            <select
                                value={newTask.assignedTo}
                                onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 [&>option]:text-gray-900"
                            >
                                <option value="">Unassigned</option>
                                {staffList.map(staff => (
                                    <option key={staff._id || staff.id} value={staff._id || staff.id}>
                                        {staff.name || staff.username}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-white/90 mb-2 drop-shadow-sm">Description</label>
                            <textarea
                                value={newTask.description}
                                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white placeholder-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                                placeholder="Additional details about the task..."
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 px-4 py-2.5 liquid-btn liquid-btn-white rounded-xl font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2.5 liquid-btn liquid-btn-blue rounded-xl font-semibold shadow-lg shadow-blue-500/20"
                            >
                                Create Task
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            )}
        </div>
    );
};


export default TaskScheduler;
