import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { api } from '../services/apiClient';
import { subscribeToNotifications, fetchNotifications, NOTIFICATION_TYPES } from '../services/notificationService';
import { LogOut, Bell, CheckCircle, Clock, AlertTriangle, RefreshCw, Loader, ChevronDown, Camera, X } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
const STATUS_CONFIG = {
    pending: { label: 'Pending', color: '#F59E0B', bg: '#FFFBEB', next: 'in_progress' },
    in_progress: { label: 'In Progress', color: '#3B82F6', bg: '#EFF6FF', next: 'done' },
    done: { label: 'Done', color: '#10B981', bg: '#ECFDF5', next: null },
    completed: { label: 'Completed', color: '#10B981', bg: '#ECFDF5', next: null },
};

const PRIORITY_COLORS = {
    high: 'text-red-600 bg-red-50',
    critical: 'text-red-700 bg-red-100',
    medium: 'text-amber-600 bg-amber-50',
    low: 'text-gray-500 bg-gray-100',
};

function timeAgo(ts) {
    if (!ts) return '—';
    const m = Math.floor((Date.now() - new Date(ts)) / 60_000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(ts).toLocaleDateString();
}

function formatDate(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function WorkerDashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [sectorIssues, setSectorIssues] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [filter, setFilter] = useState('all');
    const [showBell, setShowBell] = useState(false);
    const [toastNote, setToastNote] = useState(null);
    const [unread, setUnread] = useState(0);

    // Photo Upload Modal State
    const [uploadModalTask, setUploadModalTask] = useState(null);
    const [beforePhoto, setBeforePhoto] = useState(null);
    const [afterPhoto, setAfterPhoto] = useState(null);
    const [beforePhotoFile, setBeforePhotoFile] = useState(null);
    const [afterPhotoFile, setAfterPhotoFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const beforeInputRef = React.useRef(null);
    const afterInputRef = React.useRef(null);

    // Reports State (For Supervisors)
    const [completedReports, setCompletedReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(false);

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        if (user) init();
        else navigate('/worker', { replace: true });
    }, [user]);

    async function init() {
        if (!user) return;
        setLoading(true);
        try {
            setProfile(user);

            const [workerTasks, issues, notes, assignedIssues] = await Promise.all([
                api.getWorkerTasks(user.id, user.sector, user.assigned_zone),
                api.getIssues({ sector: user.sector || 'other', assignedZone: user.assigned_zone }),
                fetchNotifications(20),
                api.getIssues({ assignedTo: user.id })
            ]);
            
            const mappedIssues = assignedIssues.map(i => ({
                id: i.id,
                title: i.issue_type || i.title || 'Citizen Issue',
                description: i.description,
                sector: i.sector,
                priority: i.priority || i.severity,
                status: (i.status === 'open' || i.status === 'pending') ? 'pending' : 
                        (i.status === 'accepted' || i.status === 'in_progress') ? 'in_progress' : 
                        (i.status === 'resolved' ? 'done' : 'pending'),
                scheduledDate: i.created_at?.split('T')[0],
                isIssueType: true,
                address: i.location?.address || 'Location provided',
                imageUrl: i.imageUrl
            }));
            
            setTasks([...workerTasks, ...mappedIssues]);
            setSectorIssues(issues);
            setNotifications(notes);
            setUnread(notes.length);

            // Fetch completed reports for the sector
            fetchSectorReports(user.sector);

        } catch (e) {
            console.error("Dashboard Init Error:", e);
        } finally {
            setLoading(false);
        }
    }

    async function fetchSectorReports(sector) {
        if (!sector) return;
        setLoadingReports(true);
        try {
            // Fetch resolved issues
            let queryIssues = supabase.from('issues')
                .select('*')
                .in('status', ['done', 'resolved', 'completed', 'closed']);

            // Fetch completed tasks
            let queryTasks = supabase.from('tasks')
                .select('*')
                .in('status', ['done', 'completed', 'closed']);

            const [resIssues, resTasks] = await Promise.all([queryIssues, queryTasks]);
            
            let allItems = [];
            
            if (resIssues.data) {
                allItems = [...allItems, ...resIssues.data.map(i => ({
                    ...i,
                    isTask: false,
                    title: i.issue_type || 'Citizen Issue',
                    refId: i.id
                }))];
            }
            
            if (resTasks.data) {
                allItems = [...allItems, ...resTasks.data.map(t => ({
                    ...t,
                    isTask: true,
                    title: t.title || 'Assigned Task',
                    refId: t.id
                }))];
            }

            // Filter for sector
            const sect = sector.toLowerCase();
            allItems = allItems.filter(item => {
                const sectorMatch = (item.sector || '').toLowerCase() === sect;
                const typeMatch = (item.title || '').toLowerCase().startsWith(sect);
                return sectorMatch || typeMatch;
            });

            // Must have photos to be a valid visual report
            allItems = allItems.filter(item => item.before_photo_url || item.after_photo_url);
            allItems.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
            
            setCompletedReports(allItems);
        } catch (e) {
            console.error("Failed fetching reports:", e);
        } finally {
            setLoadingReports(false);
        }
    }

    // Real-time notifications
    useEffect(() => {
        if (!profile) return;
        const unsub = subscribeToNotifications((n) => {
            // Only show if targeting 'all' or specifically this worker's sector
            const isTargeted = n.target === 'all' || (n.target === 'sector' && n.sector === profile.sector);
            if (isTargeted) {
                setNotifications(prev => [n, ...prev]);
                setUnread(u => u + 1);
                setToastNote(n);
                setTimeout(() => setToastNote(null), 6000);
            }
        });
        return unsub;
    }, [profile?.sector]);

    async function advanceStatus(task) {
        const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
        if (!cfg.next) return;

        // If next is 'done', we must intercept and ask for photos
        if (cfg.next === 'done' || cfg.next === 'completed') {
            setUploadModalTask(task);
            return;
        }

        performStatusUpdate(task, cfg.next, {});
    }

    async function performStatusUpdate(task, nextStatus, extraFields = {}) {
        setUpdatingId(task.id);
        try {
            if (task.isIssueType) {
                let nextDbStatus = nextStatus;
                if (nextDbStatus === 'done') nextDbStatus = 'resolved';
                await api.updateIssue(task.id, { status: nextDbStatus, ...extraFields });
            } else {
                await api.updateTask(task.id, { status: nextStatus, ...extraFields });
            }
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
            
            // Refresh reports just in case we completed something
            if (nextStatus === 'done' || nextStatus === 'completed' || nextStatus === 'resolved') {
                fetchSectorReports(profile?.sector);
            }
        } catch (e) {
            alert('Failed to update: ' + e.message);
        } finally {
            setUpdatingId(null);
        }
    }

    async function handlePhotoCapture(e, type) {
        const file = e.target.files[0];
        if (!file) return;

        if (type === 'before') setBeforePhotoFile(file);
        else setAfterPhotoFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'before') setBeforePhoto(reader.result);
            else setAfterPhoto(reader.result);
        };
        reader.readAsDataURL(file);
    }

    async function submitTaskCompletion() {
        if (!beforePhoto || !afterPhoto) {
            alert("Both before and after photos are required to complete this task.");
            return;
        }

        const task = uploadModalTask;
        setIsUploading(true);
        
        try {
            let beforeUrl = beforePhoto;
            let afterUrl = afterPhoto;

            const uploadToBucket = async (file, label) => {
                const ext = file.name.split('.').pop() || 'jpg';
                const fileName = `${task.id}_${label}_${Date.now()}.${ext}`;
                const { data, error } = await supabase.storage.from('photos').upload(fileName, file);
                
                if (error) {
                    console.warn(`Bucket upload failed, falling back to base64:`, error);
                    return null;
                }
                const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName);
                return publicUrl;
            };

            if (beforePhotoFile) {
                const url = await uploadToBucket(beforePhotoFile, 'before');
                if (url) beforeUrl = url;
            }
            if (afterPhotoFile) {
                const url = await uploadToBucket(afterPhotoFile, 'after');
                if (url) afterUrl = url;
            }

            const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
            
            await performStatusUpdate(task, cfg.next, {
                before_photo_url: beforeUrl,
                after_photo_url: afterUrl
            });

            // Clear modal state
            setUploadModalTask(null);
            setBeforePhoto(null);
            setAfterPhoto(null);
            setBeforePhotoFile(null);
            setAfterPhotoFile(null);
        } catch (e) {
            console.error("Task completion failed: ", e);
            alert("Failed to submit photos. Check connection.");
        } finally {
            setIsUploading(false);
        }
    }

    async function handleLogout() {
        await logout();
        navigate('/worker', { replace: true });
    }

    const filtered = tasks.filter(t => {
        if (filter === 'all') return true;
        if (filter === 'active') return ['pending', 'in_progress'].includes(t.status);
        if (filter === 'done') return ['done', 'completed'].includes(t.status);
        return true;
    });

    const doneCt = tasks.filter(t => ['done', 'completed'].includes(t.status)).length;
    const activeCt = tasks.filter(t => ['pending', 'in_progress'].includes(t.status)).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center gap-3 text-white/70">
                <Loader size={28} className="animate-spin text-blue-400" />
                <p className="m-0 text-sm font-medium drop-shadow-sm">Loading your dashboard…</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans relative overflow-hidden">
            {/* Global Photorealistic Background */}
            <div className="fixed inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop"
                    className="w-full h-full object-cover"
                    alt="Elegant nature background"
                />
                <div className="absolute inset-0 bg-black/30 mix-blend-overlay"></div>
            </div>

            <div className="relative z-10">
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-lg px-4">
                <div className="max-w-3xl mx-auto flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-xl text-white font-bold border border-white/20 shadow-inner">
                            {(profile?.full_name || 'W').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm m-0 drop-shadow-sm">{profile?.full_name || 'Worker'}</p>
                            <p className="text-white/70 text-xs m-0 capitalize drop-shadow-sm">
                                {profile?.sector || 'Field Worker'} • {profile?.status || 'Active'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Bell */}
                        <div style={{ position: 'relative' }}>
                            <button onClick={() => { setShowBell(v => !v); setUnread(0); }}
                                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                                <Bell size={18} />
                                {unread > 0 && (
                                    <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#EF4444', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #4338ca' }}>
                                        {unread > 9 ? '9+' : unread}
                                    </span>
                                )}
                            </button>

                            {/* Notification dropdown */}
                            {showBell && (
                                <div style={{ position: 'absolute', right: 0, top: '48px', width: '300px', background: '#fff', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', zIndex: 100, maxHeight: '360px', overflowY: 'auto', border: '1px solid #E5E7EB' }}>
                                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', fontWeight: 700, fontSize: '13px', color: '#111' }}>🔔 Notifications</div>
                                    {notifications.length === 0 ? (
                                        <p style={{ textAlign: 'center', color: '#aaa', padding: '24px', fontSize: '13px' }}>No notifications yet</p>
                                    ) : notifications.map(n => {
                                        const cfg = NOTIFICATION_TYPES[n.type] || NOTIFICATION_TYPES.info;
                                        return (
                                            <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #F9FAFB' }}>
                                                <p style={{ fontWeight: 600, fontSize: '13px', color: '#111', margin: '0 0 2px' }}>{cfg.icon} {n.title}</p>
                                                <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 4px' }}>{n.message}</p>
                                                <p style={{ fontSize: '10px', color: '#D1D5DB', margin: 0 }}>{timeAgo(n.created_at)}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <button onClick={handleLogout}
                            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6 pb-12">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: 'Total Tasks', value: tasks.length, icon: '📋', color: 'text-blue-400' },
                        { label: 'Active', value: activeCt, icon: '⚡', color: 'text-amber-400' },
                        { label: 'Completed', value: doneCt, icon: '✅', color: 'text-green-400' },
                    ].map(s => (
                        <div key={s.label} className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 text-center border border-white/20 shadow-lg hover:bg-white/20 transition-all">
                            <p className="text-2xl m-0 mb-1 drop-shadow-sm">{s.icon}</p>
                            <p className={`text-2xl font-bold m-0 mb-0.5 drop-shadow-md ${s.color}`}>{s.value}</p>
                            <p className="text-[11px] text-white/70 m-0 font-semibold uppercase tracking-wider">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-1 hide-scrollbar">
                    {[['all', 'All'], ['active', 'My Tasks'], ['problems', 'Sector Problems'], ['reports', 'Completed Reports']].map(([val, lbl]) => (
                        <button key={val} onClick={() => setFilter(val)}
                            className={`px-4 py-1.5 rounded-full border text-sm font-semibold cursor-pointer transition-all whitespace-nowrap shadow-sm ${
                                filter === val 
                                    ? 'border-white/40 bg-white/20 text-white backdrop-blur-md font-bold' 
                                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white backdrop-blur-sm'
                            }`}>
                            {lbl}
                        </button>
                    ))}
                    <button onClick={init} className="ml-auto bg-white/10 border border-white/20 hover:bg-white/20 rounded-full px-4 py-1.5 cursor-pointer text-white flex items-center gap-1 text-xs font-semibold backdrop-blur-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-white/50">
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>

                {/* Dashboard Content */}
                {filter === 'problems' ? (
                    <div className="flex flex-col gap-3 animate-fade-in">
                        <div className="bg-blue-500/10 border border-blue-400/30 p-3 rounded-xl mb-2 backdrop-blur-sm shadow-sm">
                            <p className="m-0 text-sm text-blue-200 font-semibold drop-shadow-sm flex items-center gap-2">
                                <span>📍</span> Showing all reports for {profile?.sector || 'your sector'}
                            </p>
                        </div>
                        {sectorIssues.length === 0 ? (
                            <div className="p-10 text-center text-white/50 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm shadow-sm">No problems reported in your sector yet.</div>
                        ) : sectorIssues.map(issue => (
                            <div key={issue.id} className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-lg hover:bg-white/20 transition-all group">
                                <div className="flex gap-3">
                                    {issue.imageUrl && <img src={issue.imageUrl} className="w-16 h-16 rounded-xl object-cover shadow-sm border border-white/10 group-hover:scale-105 transition-transform" alt="Issue" />}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="font-bold text-sm m-0 text-white drop-shadow-sm">{issue.title}</p>
                                            <span className="text-[10px] text-white/50 font-medium">{timeAgo(issue.created_at)}</span>
                                        </div>
                                        <p className="text-xs text-white/70 my-1 line-clamp-2">{issue.description}</p>
                                        <div className="flex gap-2 mt-2 items-center">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-200 border border-red-500/30 font-bold uppercase backdrop-blur-sm shadow-sm">{issue.priority || 'Medium'}</span>
                                            <span className="text-[10px] text-white/60 font-medium flex items-center gap-1 drop-shadow-sm"><span className="text-[12px]">📍</span> {issue.address || 'Location provided'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filter === 'reports' ? (
                    <div className="flex flex-col gap-4 animate-fade-in">
                        <div className="bg-emerald-500/10 border border-emerald-400/30 p-3 rounded-xl mb-2 backdrop-blur-sm shadow-sm flex items-center justify-between">
                            <p className="m-0 text-sm text-emerald-200 font-semibold drop-shadow-sm flex items-center gap-2">
                                <span>📸</span> Completed Reports for {profile?.sector || 'your sector'}
                            </p>
                        </div>
                        {loadingReports ? (
                            <div className="p-10 text-center text-white flex justify-center"><Loader className="animate-spin text-emerald-400" /></div>
                        ) : completedReports.length === 0 ? (
                            <div className="p-10 text-center text-white/50 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm shadow-sm">No completed reports with photos found.</div>
                        ) : completedReports.map(item => (
                            <div key={item.refId} className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-lg hover:bg-white/20 transition-all group overflow-hidden">
                                <div className="flex justify-between items-start mb-3 border-b border-white/10 pb-2">
                                    <div>
                                        <p className="font-bold text-sm m-0 text-white drop-shadow-sm">{item.title}</p>
                                        <p className="text-xs text-emerald-300 font-medium">Status: {item.status.toUpperCase()}</p>
                                    </div>
                                    <span className="text-[10px] text-white/50 font-medium">{timeAgo(item.updated_at || item.created_at)}</span>
                                </div>
                                <div className="flex gap-2 h-28">
                                    <div className="w-1/2 relative bg-black/40 rounded-xl overflow-hidden border border-white/10">
                                        <div className="absolute top-1 left-1 bg-red-500/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-md">BEFORE</div>
                                        {item.before_photo_url ? (
                                            <img src={item.before_photo_url} className="w-full h-full object-cover" alt="Before" />
                                        ) : <div className="w-full h-full flex justify-center items-center text-white/30 text-xs">No Photo</div>}
                                    </div>
                                    <div className="w-1/2 relative bg-black/40 rounded-xl overflow-hidden border border-white/10">
                                        <div className="absolute top-1 right-1 bg-emerald-500/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-md">AFTER</div>
                                        {item.after_photo_url ? (
                                            <img src={item.after_photo_url} className="w-full h-full object-cover" alt="After" />
                                        ) : <div className="w-full h-full flex justify-center items-center text-white/30 text-xs">No Photo</div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-10 text-center text-white/50 border border-white/10 shadow-lg animate-fade-in">
                        <p className="text-4xl m-0 mb-2 drop-shadow-sm">📋</p>
                        <p className="font-bold text-white/80 m-0 mb-1 drop-shadow-sm">No tasks here</p>
                        <p className="text-xs m-0">Your supervisor will assign tasks to you</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 animate-fade-in">
                        {filtered.map(task => {
                            const sCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
                            const isUpdating = updatingId === task.id;

                            // Translate hardcoded colors to tailwind tokens for border/bg
                            const statusColorCss = sCfg.color === '#F59E0B' ? 'border-amber-400/50 text-amber-300 bg-amber-500/20' : 
                                                   sCfg.color === '#3B82F6' ? 'border-blue-400/50 text-blue-300 bg-blue-500/20' : 
                                                   sCfg.color === '#10B981' ? 'border-green-400/50 text-green-300 bg-green-500/20' : 'border-gray-400/50 text-gray-300 bg-gray-500/20';
                            
                            const priorityColorCss = task.priority === 'critical' || task.priority === 'high' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 
                                                     task.priority === 'low' ? 'bg-white/10 text-white/70 border-white/20' :
                                                     'bg-amber-500/20 text-amber-300 border-amber-500/30';

                            return (
                                <div key={task.id} className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-lg border-y border-r border-white/20 border-l-[4px] relative overflow-hidden group hover:bg-white/20 transition-all" style={{ borderLeftColor: sCfg.color }}>
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                                <span className="font-bold text-sm text-white drop-shadow-sm">{task.title}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-sm shadow-sm ${statusColorCss}`}>
                                                    {sCfg.label}
                                                </span>
                                            </div>
                                            {task.description && (
                                                <p className="text-xs text-white/70 m-0 mb-2 leading-relaxed max-w-lg">{task.description}</p>
                                            )}
                                            <div className="flex gap-2 flex-wrap items-center">
                                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase border shadow-sm backdrop-blur-sm ${priorityColorCss}`}>
                                                    {(task.priority || 'Medium')}
                                                </span>
                                                {task.sector && (
                                                    <span className="text-[10px] font-medium text-white/80 bg-white/10 border border-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm shadow-sm flex items-center gap-1">
                                                        <span>📍</span> {task.sector}
                                                    </span>
                                                )}
                                                {task.scheduledDate && (
                                                    <span className="text-[11px] font-medium text-white/60 flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full border border-white/10 shadow-inner">
                                                        <Clock size={10} /> {formatDate(task.scheduledDate)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action button */}
                                        {sCfg.next && (
                                            <button onClick={() => advanceStatus(task)} disabled={isUpdating}
                                                className={`flex-shrink-0 px-4 py-2 text-white border-0 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1 shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed`}
                                                style={{ background: sCfg.color }}>
                                                {isUpdating ? <Loader size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                                {task.status === 'pending' ? 'Start' : 'Mark Done'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Toast notification */}
            {toastNote && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-2xl border-2 rounded-2xl p-4 shadow-2xl z-50 min-w-[280px] max-w-[90vw] flex gap-3 items-start animate-fade-in`} style={{ borderColor: NOTIFICATION_TYPES[toastNote.type]?.color || '#3B82F6' }}>
                    <span className="text-xl drop-shadow-md">{NOTIFICATION_TYPES[toastNote.type]?.icon || 'ℹ️'}</span>
                    <div className="flex-1">
                        <p className="font-bold text-sm m-0 mb-0.5 text-white drop-shadow-sm">{toastNote.title}</p>
                        <p className="text-xs text-white/70 m-0">{toastNote.message}</p>
                    </div>
                    <button onClick={() => setToastNote(null)} className="bg-transparent border-0 text-white/40 hover:text-white/80 text-xl cursor-pointer transition-colors outline-none focus:outline-none focus:ring-2 focus:ring-white/20 rounded-full w-6 h-6 flex items-center justify-center p-0 leading-none">×</button>
                </div>
            )}

            {/* Photo Upload Modal */}
            {uploadModalTask && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full shadow-2xl">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="font-extrabold text-xl m-0 text-gray-900">Task Completion</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase mt-1">Upload Required Photos</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setUploadModalTask(null);
                                    setBeforePhoto(null);
                                    setAfterPhoto(null);
                                    setBeforePhotoFile(null);
                                    setAfterPhotoFile(null);
                                }} 
                                disabled={isUploading}
                                className="p-2 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Before Photo */}
                            <div>
                                <input type="file" accept="image/*" capture="environment" ref={beforeInputRef} className="hidden" onChange={(e) => handlePhotoCapture(e, 'before')} />
                                <div 
                                    onClick={() => beforeInputRef.current?.click()}
                                    className={`h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all relative ${beforePhoto ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                                >
                                    {beforePhoto ? (
                                        <>
                                            <img src={beforePhoto} alt="Before" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity">
                                                <Camera size={24} />
                                                <span className="text-xs font-bold mt-1">Retake Before</span>
                                            </div>
                                            <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">BEFORE</div>
                                        </>
                                    ) : (
                                        <>
                                            <Camera size={28} className="text-gray-400 mb-2" />
                                            <span className="text-sm font-bold text-gray-600">Take "Before" Photo</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* After Photo */}
                            <div>
                                <input type="file" accept="image/*" capture="environment" ref={afterInputRef} className="hidden" onChange={(e) => handlePhotoCapture(e, 'after')} />
                                <div 
                                    onClick={() => afterInputRef.current?.click()}
                                    className={`h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all relative ${afterPhoto ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                                >
                                    {afterPhoto ? (
                                        <>
                                            <img src={afterPhoto} alt="After" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity">
                                                <Camera size={24} />
                                                <span className="text-xs font-bold mt-1">Retake After</span>
                                            </div>
                                            <div className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">AFTER</div>
                                        </>
                                    ) : (
                                        <>
                                            <Camera size={28} className="text-gray-400 mb-2" />
                                            <span className="text-sm font-bold text-gray-600">Take "After" Photo</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setUploadModalTask(null);
                                    setBeforePhoto(null);
                                    setAfterPhoto(null);
                                    setBeforePhotoFile(null);
                                    setAfterPhotoFile(null);
                                }}
                                disabled={isUploading}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitTaskCompletion}
                                disabled={!beforePhoto || !afterPhoto || isUploading || updatingId}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {(isUploading || updatingId) ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                {(isUploading || updatingId) ? 'Uploading...' : 'Submit Verification'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}
