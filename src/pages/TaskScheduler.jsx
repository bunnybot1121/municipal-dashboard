import React, { useState, useEffect } from 'react';
import { api } from '../services/apiClient';
import Calendar from '../components/Calendar';
import {
    Add as Plus,
    Search,
    FilterList as Filter,
    MoreVert as MoreHorizontal,
    AccessTime as Clock,
    LocationOn as MapPin,
    CheckCircle,
    Circle,
    Close
} from '@mui/icons-material';

const TaskScheduler = () => {
    const [selectedDate, setSelectedDate] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterPriority, setFilterPriority] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

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
            const [fetchedTasks, fetchedUsers] = await Promise.all([
                api.getTasks().catch(() => []),
                api.getUsers().catch(() => [])
            ]);

            if (fetchedTasks && Array.isArray(fetchedTasks)) {
                const normalizedTasks = fetchedTasks.map(t => ({
                    ...t,
                    id: t._id || t.id,
                    assignee: t.assignedTo ? (t.assignedTo.name || t.assignedTo.username || 'Unassigned') : 'Unassigned',
                    scheduledDate: t.scheduledStart ? new Date(t.scheduledStart).toISOString().split('T')[0] : '',
                }));
                setTasks(normalizedTasks);
            }

            if (fetchedUsers && Array.isArray(fetchedUsers)) {
                setStaffList(fetchedUsers);
            }
        } catch (error) {
            console.error("Error loading task data:", error);
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
                sector: newTask.sector,
                priority: newTask.priority,
                description: newTask.description,
                scheduledStart: startDateTime,
                scheduledEnd: endDateTime,
                assignedTo: newTask.assignedTo || null,
                status: 'pending'
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

    const filteredTasks = tasks.filter(task => {
        const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
        const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.sector?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = !selectedDate || task.scheduledDate === selectedDate.toISOString().split('T')[0];
        return matchesPriority && matchesSearch && matchesDate;
    });

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
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-main)]">Maintenance Scheduler</h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Manage resources and schedule maintenance tasks</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                    <Plus sx={{ fontSize: 18 }} />
                    <span>New Task</span>
                </button>
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
                    <div className="mt-6 bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6">
                        <h3 className="text-sm font-bold text-[var(--text-main)] mb-4">Quick Stats</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-[var(--text-secondary)]">Total Tasks</span>
                                <span className="text-lg font-bold text-[var(--text-main)]">{tasks.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-[var(--text-secondary)]">Completed</span>
                                <span className="text-lg font-bold text-[var(--secondary)]">
                                    {tasks.filter(t => t.status === 'completed').length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-[var(--text-secondary)]">Pending</span>
                                <span className="text-lg font-bold text-[var(--accent)]">
                                    {tasks.filter(t => t.status === 'pending').length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Task List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm">
                        {/* Filters */}
                        <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-light)]" sx={{ fontSize: 18 }} />
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                                />
                            </div>
                            <select
                                value={filterPriority}
                                onChange={(e) => setFilterPriority(e.target.value)}
                                className="px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
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
                                    className="px-4 py-2 bg-[var(--surface-hover)] text-[var(--text-secondary)] rounded-lg text-sm font-medium hover:bg-[var(--border)] transition-colors"
                                >
                                    Clear Date
                                </button>
                            )}
                        </div>

                        {/* Task List */}
                        <div className="divide-y divide-[var(--border)] max-h-[600px] overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center text-[var(--text-light)]">Loading tasks...</div>
                            ) : filteredTasks.length === 0 ? (
                                <div className="p-8 text-center text-[var(--text-light)]">
                                    No tasks found{selectedDate ? ' for selected date' : ''}
                                </div>
                            ) : (
                                filteredTasks.map(task => (
                                    <div key={task.id} className="p-4 hover:bg-[var(--surface-hover)] transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 ${getStatusColor(task.status)}`}>
                                                {task.status === 'completed' ? (
                                                    <CheckCircle sx={{ fontSize: 20 }} />
                                                ) : (
                                                    <Circle sx={{ fontSize: 20 }} />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h4 className="font-semibold text-[var(--text-main)] mb-1">{task.title}</h4>
                                                        <div className="flex flex-wrap items-center gap-2 text-xs">
                                                            <span className={`px-2 py-1 rounded-md border font-medium ${getPriorityColor(task.priority)}`}>
                                                                {task.priority}
                                                            </span>
                                                            <span className="text-[var(--text-secondary)] flex items-center gap-1">
                                                                <Clock sx={{ fontSize: 14 }} />
                                                                {task.scheduledDate}
                                                            </span>
                                                            {task.sector && (
                                                                <span className="text-[var(--text-secondary)] flex items-center gap-1">
                                                                    <MapPin sx={{ fontSize: 14 }} />
                                                                    {task.sector}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {task.description && (
                                                            <p className="text-sm text-[var(--text-secondary)] mt-2 line-clamp-2">
                                                                {task.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <button className="text-[var(--text-light)] hover:text-[var(--text-main)]">
                                                        <MoreHorizontal sx={{ fontSize: 20 }} />
                                                    </button>
                                                </div>
                                                {task.assignee && task.assignee !== 'Unassigned' && (
                                                    <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                                                        <div className="w-6 h-6 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-semibold">
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
            </div>

            {/* Create Task Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
                            <h2 className="text-xl font-bold text-[var(--text-main)]">Create New Task</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-[var(--text-light)] hover:text-[var(--text-main)] transition-colors"
                            >
                                <Close />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-[var(--text-main)] mb-2">Task Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                                    placeholder="e.g., Fix pothole on Main Street"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-[var(--text-main)] mb-2">Sector</label>
                                    <select
                                        value={newTask.sector}
                                        onChange={(e) => setNewTask({ ...newTask, sector: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
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
                                    <label className="block text-sm font-semibold text-[var(--text-main)] mb-2">Priority</label>
                                    <select
                                        value={newTask.priority}
                                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
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
                                    <label className="block text-sm font-semibold text-[var(--text-main)] mb-2">Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={newTask.scheduledDate}
                                        onChange={(e) => setNewTask({ ...newTask, scheduledDate: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-[var(--text-main)] mb-2">Start Time</label>
                                    <input
                                        type="time"
                                        value={newTask.startTime}
                                        onChange={(e) => setNewTask({ ...newTask, startTime: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-[var(--text-main)] mb-2">Duration (hrs)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={newTask.duration}
                                        onChange={(e) => setNewTask({ ...newTask, duration: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[var(--text-main)] mb-2">Assign To</label>
                                <select
                                    value={newTask.assignedTo}
                                    onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
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
                                <label className="block text-sm font-semibold text-[var(--text-main)] mb-2">Description</label>
                                <textarea
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 resize-none"
                                    placeholder="Additional details about the task..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-[var(--border)] text-[var(--text-secondary)] rounded-xl font-semibold hover:bg-[var(--surface-hover)] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-colors"
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
