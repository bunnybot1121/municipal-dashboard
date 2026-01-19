import React, { useState, useEffect } from 'react';
import { X, Plus, Clock, MapPin, User, Save, Trash2, Edit2 } from 'lucide-react';
import { SECTORS, USERS } from '../../services/mockData';

const SidePanel = ({ date, tasks, onClose, onAddTask, onUpdateTask, onDeleteTask }) => {
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'edit' | 'add'
    const [editingTask, setEditingTask] = useState(null);
    const [formData, setFormData] = useState({});

    // Reset when date changes
    useEffect(() => {
        setViewMode('list');
        setEditingTask(null);
    }, [date]);

    if (!date) return null;

    const formattedDate = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    const getSectorColor = (sectorId) => SECTORS.find(s => s.id === sectorId)?.color || 'var(--color-text-muted)';

    const handleEditClick = (task) => {
        setEditingTask(task);
        // Initialize form with task data
        const start = new Date(task.scheduledStart);
        const end = new Date(task.scheduledEnd);

        setFormData({
            title: task.title,
            sector: task.sector,
            assignedTo: task.assignedTo || '',
            status: task.status,
            startTime: start.toTimeString().slice(0, 5),
            endTime: end.toTimeString().slice(0, 5),
            address: task.location?.address || ''
        });
        setViewMode('edit');
    };

    const handleAddClick = () => {
        setFormData({
            title: '',
            sector: 'water',
            assignedTo: '',
            status: 'pending',
            startTime: '09:00',
            endTime: '10:00',
            address: ''
        });
        setViewMode('add');
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Construct Date objects
        const startDateTime = new Date(date);
        const [startH, startM] = formData.startTime.split(':');
        startDateTime.setHours(parseInt(startH), parseInt(startM));

        const endDateTime = new Date(date);
        const [endH, endM] = formData.endTime.split(':');
        endDateTime.setHours(parseInt(endH), parseInt(endM));

        const taskData = {
            title: formData.title,
            sector: formData.sector,
            assignedTo: formData.assignedTo,
            status: formData.status,
            scheduledStart: startDateTime.toISOString(),
            scheduledEnd: endDateTime.toISOString(),
            location: {
                address: formData.address,
                lat: 0, lng: 0
            },
            // Default fields for new tasks
            reportedAt: new Date().toISOString(),
            description: 'Scheduled via Calendar',
            severity: 'medium',
            image: null,
            timeline: []
        };

        if (viewMode === 'add') {
            onAddTask(taskData);
        } else {
            onUpdateTask({ ...editingTask, ...taskData });
        }

        setViewMode('list');
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to remove this task?')) {
            onDeleteTask(editingTask.id);
            setViewMode('list');
        }
    };

    // FORM RENDER
    if (viewMode === 'add' || viewMode === 'edit') {
        return (
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem' }}>{viewMode === 'add' ? 'Schedule Task' : 'Edit Task'}</h3>
                    <button onClick={() => setViewMode('list')} className="btn btn-ghost"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                    <div className="form-group">
                        <label>Task Title</label>
                        <input
                            type="text"
                            className="input"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>Start Time</label>
                            <input
                                type="time"
                                className="input"
                                required
                                value={formData.startTime}
                                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>End Time</label>
                            <input
                                type="time"
                                className="input"
                                required
                                value={formData.endTime}
                                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Sector</label>
                        <select
                            className="input"
                            value={formData.sector}
                            onChange={e => setFormData({ ...formData, sector: e.target.value })}
                        >
                            {SECTORS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Assigned Staff</label>
                        <select
                            className="input"
                            value={formData.assignedTo}
                            onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                        >
                            <option value="">-- Unassigned --</option>
                            {USERS.filter(u => u.role !== 'admin').map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Location / Address</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Status</label>
                        <select
                            className="input"
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem', paddingTop: '1rem' }}>
                        {viewMode === 'edit' && (
                            <button type="button" onClick={handleDelete} className="btn btn-outline" style={{ borderColor: 'var(--color-red-500)', color: 'var(--color-red-500)' }}>
                                <Trash2 size={18} />
                            </button>
                        )}
                        <button type="submit" className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                            <Save size={18} /> Save Task
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // LIST VIEW
    return (
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{formattedDate}</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{tasks.length} tasks scheduled</p>
                </div>
                <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.5rem' }}><X size={20} /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {tasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-muted)' }}>
                        <Clock size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No tasks scheduled for this day.</p>
                        <button
                            className="btn btn-primary"
                            style={{ marginTop: '1rem' }}
                            onClick={handleAddClick}
                        >
                            Schedule Maintenance
                        </button>
                    </div>
                ) : (
                    tasks.sort((a, b) => new Date(a.scheduledStart) - new Date(b.scheduledStart)).map(task => {
                        const start = new Date(task.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const end = new Date(task.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const color = getSectorColor(task.sector);

                        return (
                            <div key={task.id}
                                className="task-card-hover"
                                style={{
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '1rem',
                                    borderLeft: `4px solid ${color}`,
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    position: 'relative'
                                }}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleEditClick(task); }}
                                    style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', opacity: 0.5 }}
                                    className="btn btn-ghost"
                                >
                                    <Edit2 size={14} />
                                </button>

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Clock size={12} /> {start} - {end}
                                    </span>
                                    <span className={`badge badge-${task.status}`} style={{ fontSize: '0.65rem' }}>{task.status}</span>
                                </div>
                                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', paddingRight: '1.5rem' }}>{task.title}</h4>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <MapPin size={14} /> {task.location.address || 'No location'}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <User size={14} /> {USERS.find(u => u.id === task.assignedTo)?.name || 'Unassigned'}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {tasks.length > 0 && (
                <button
                    className="btn btn-outline"
                    style={{ marginTop: '1rem', width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                    onClick={handleAddClick}
                >
                    <Plus size={18} /> Add Task
                </button>
            )}
        </div>
    );
};

export default SidePanel;
