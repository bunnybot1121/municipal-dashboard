import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { api } from '../services/apiClient';
import { subscribeToNotifications, fetchNotifications, NOTIFICATION_TYPES } from '../services/notificationService';
import { LogOut, Bell, CheckCircle, Clock, AlertTriangle, RefreshCw, Loader, ChevronDown } from 'lucide-react';

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

            const [workerTasks, issues, notes] = await Promise.all([
                api.getWorkerTasks(user.id),
                api.getIssues({ sector: user.sector || 'other' }),
                fetchNotifications(20),
            ]);
            setTasks(workerTasks);
            setSectorIssues(issues);
            setNotifications(notes);
            setUnread(notes.length);
        } catch (e) {
            console.error("Dashboard Init Error:", e);
        } finally {
            setLoading(false);
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
        setUpdatingId(task.id);
        try {
            await api.updateTaskStatus(task.id, cfg.next);
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: cfg.next } : t));
        } catch (e) {
            alert('Failed to update: ' + e.message);
        } finally {
            setUpdatingId(null);
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
            <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: '#6B7280' }}>
                <Loader size={28} style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>Loading your dashboard…</p>
                <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #4338ca)', padding: '0 16px', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
                <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                            {(profile?.full_name || 'W').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p style={{ color: '#fff', fontWeight: 700, fontSize: '15px', margin: 0 }}>{profile?.full_name || 'Worker'}</p>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', margin: 0, textTransform: 'capitalize' }}>
                                {profile?.sector || 'Field Worker'} • {profile?.status || 'Active'}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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

            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '20px 16px', paddingBottom: '40px' }}>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
                    {[
                        { label: 'Total Tasks', value: tasks.length, icon: '📋', color: '#6366F1' },
                        { label: 'Active', value: activeCt, icon: '⚡', color: '#F59E0B' },
                        { label: 'Completed', value: doneCt, icon: '✅', color: '#10B981' },
                    ].map(s => (
                        <div key={s.label} style={{ background: '#fff', borderRadius: '16px', padding: '16px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
                            <p style={{ fontSize: '22px', margin: '0 0 4px' }}>{s.icon}</p>
                            <p style={{ fontSize: '22px', fontWeight: 800, color: s.color, margin: '0 0 2px' }}>{s.value}</p>
                            <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0, fontWeight: 600 }}>{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Filter tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {[['all', 'All'], ['active', 'My Tasks'], ['problems', 'Sector Problems'], ['done', 'Completed']].map(([val, lbl]) => (
                        <button key={val} onClick={() => setFilter(val)}
                            style={{
                                padding: '6px 16px', borderRadius: '99px', border: '1.5px solid', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                                borderColor: filter === val ? '#5B52FF' : '#E5E7EB',
                                background: filter === val ? '#5B52FF' : '#fff',
                                color: filter === val ? '#fff' : '#6B7280',
                            }}>
                            {lbl}
                        </button>
                    ))}
                    <button onClick={init} style={{ marginLeft: 'auto', background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: '99px', padding: '6px 12px', cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                        <RefreshCw size={12} /> Refresh
                    </button>
                </div>

                {/* Dashboard Content */}
                {filter === 'problems' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ background: '#EFF6FF', border: '1px solid #DBEAFE', p: '12px', borderRadius: '12px', padding: '12px', marginBottom: '8px' }}>
                            <p style={{ margin: 0, fontSize: '13px', color: '#1E40AF', fontWeight: 600 }}>
                                📍 Showing all reports for {profile?.sector || 'your sector'}
                            </p>
                        </div>
                        {sectorIssues.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>No problems reported in your sector yet.</div>
                        ) : sectorIssues.map(issue => (
                            <div key={issue.id} style={{ background: '#fff', borderRadius: '16px', padding: '16px', border: '1px solid #F1F5F9', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    {issue.imageUrl && <img src={issue.imageUrl} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} alt="Issue" />}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <p style={{ fontWeight: 700, fontSize: '14px', margin: 0 }}>{issue.title}</p>
                                            <span style={{ fontSize: '10px', color: '#9CA3AF' }}>{timeAgo(issue.created_at)}</span>
                                        </div>
                                        <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0' }}>{issue.description}</p>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '99px', background: '#FEF2F2', color: '#EF4444', fontWeight: 700 }}>{issue.priority || 'Medium'}</span>
                                            <span style={{ fontSize: '10px', color: '#9CA3AF' }}>📍 {issue.address || 'Location provided'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#D1D5DB', border: '1px solid #F1F5F9' }}>
                        <p style={{ fontSize: '32px', margin: '0 0 8px' }}>📋</p>
                        <p style={{ fontWeight: 600, margin: '0 0 4px', color: '#9CA3AF' }}>No tasks here</p>
                        <p style={{ fontSize: '12px', margin: 0 }}>Your supervisor will assign tasks to you</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filtered.map(task => {
                            const sCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
                            const pCls = PRIORITY_COLORS[(task.priority || 'medium').toLowerCase()] || PRIORITY_COLORS.medium;
                            const isUpdating = updatingId === task.id;

                            return (
                                <div key={task.id} style={{ background: '#fff', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9', borderLeft: `4px solid ${sCfg.color}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                                <span style={{ fontWeight: 700, fontSize: '14px', color: '#111' }}>{task.title}</span>
                                                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: sCfg.bg, color: sCfg.color }}>
                                                    {sCfg.label}
                                                </span>
                                            </div>
                                            {task.description && (
                                                <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 8px', lineHeight: 1.4 }}>{task.description}</p>
                                            )}
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px' }} className={pCls}>
                                                    {(task.priority || 'Medium').toUpperCase()}
                                                </span>
                                                {task.sector && (
                                                    <span style={{ fontSize: '11px', color: '#9CA3AF', background: '#F9FAFB', padding: '2px 8px', borderRadius: '99px' }}>
                                                        📍 {task.sector}
                                                    </span>
                                                )}
                                                {task.scheduledDate && (
                                                    <span style={{ fontSize: '11px', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                        <Clock size={10} /> {formatDate(task.scheduledDate)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action button */}
                                        {sCfg.next && (
                                            <button onClick={() => advanceStatus(task)} disabled={isUpdating}
                                                style={{ flexShrink: 0, padding: '8px 14px', background: sCfg.color, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '12px', cursor: isUpdating ? 'not-allowed' : 'pointer', opacity: isUpdating ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                                                {isUpdating ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={12} />}
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
                <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#fff', border: `2px solid ${NOTIFICATION_TYPES[toastNote.type]?.color || '#3B82F6'}`, borderRadius: '16px', padding: '14px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 9999, minWidth: '280px', maxWidth: '90vw', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '18px' }}>{NOTIFICATION_TYPES[toastNote.type]?.icon || 'ℹ️'}</span>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: '13px', margin: '0 0 2px' }}>{toastNote.title}</p>
                        <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>{toastNote.message}</p>
                    </div>
                    <button onClick={() => setToastNote(null)} style={{ background: 'none', border: 'none', color: '#D1D5DB', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
