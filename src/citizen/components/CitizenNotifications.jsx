import React, { useState, useEffect, useCallback } from 'react';
import { subscribeToNotifications, fetchNotifications, NOTIFICATION_TYPES } from '../../services/notificationService';

const READ_KEY = 'nagarsevak_read_notifications';

function getReadIds() {
    try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); }
    catch { return new Set(); }
}
function markRead(id) {
    const ids = getReadIds();
    ids.add(id);
    localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

function timeAgo(ts) {
    const m = Math.floor((Date.now() - new Date(ts)) / 60_000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

/** Toast shown on new real-time notification */
function Toast({ notification, onDismiss }) {
    const cfg = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.info;
    useEffect(() => {
        const t = setTimeout(onDismiss, 6000);
        return () => clearTimeout(t);
    }, [onDismiss]);

    return (
        <div
            style={{
                position: 'fixed', bottom: '90px', left: '50%', transform: 'translateX(-50%)',
                zIndex: 9999, minWidth: '300px', maxWidth: '90vw',
                backgroundColor: '#fff', borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                border: `2px solid ${cfg.color}`,
                animation: 'slideUp 0.3s ease-out',
                padding: '14px 16px',
                display: 'flex', alignItems: 'flex-start', gap: '12px',
            }}
        >
            <span style={{ fontSize: '20px', flexShrink: 0 }}>{cfg.icon}</span>
            <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: '14px', color: '#111', margin: 0 }}>{notification.title}</p>
                <p style={{ fontSize: '12px', color: '#555', margin: '3px 0 0' }}>{notification.message}</p>
            </div>
            <button
                onClick={onDismiss}
                style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '18px', cursor: 'pointer', flexShrink: 0, padding: 0, lineHeight: 1 }}
            >×</button>
            <style>{`@keyframes slideUp { from { opacity:0; transform:translateX(-50%) translateY(20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
        </div>
    );
}

/** Full notification drawer */
function NotificationDrawer({ notifications, readIds, onClose, onMarkAllRead }) {
    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000 }} />
            <div style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, width: '340px', maxWidth: '100vw',
                background: '#fff', zIndex: 1001, display: 'flex', flexDirection: 'column',
                boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
                animation: 'drawerSlide 0.25s ease-out',
            }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
                    <div>
                        <p style={{ fontWeight: 800, fontSize: '16px', color: '#111', margin: 0 }}>🔔 Notifications</p>
                        <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0' }}>{notifications.length} messages from municipality</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {notifications.some(n => !readIds.has(n.id)) && (
                            <button onClick={onMarkAllRead} style={{ fontSize: '11px', color: '#3B82F6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                                Mark all read
                            </button>
                        )}
                        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', color: '#aaa', cursor: 'pointer', lineHeight: 1 }}>×</button>
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                        <div style={{ padding: '48px 24px', textAlign: 'center', color: '#bbb' }}>
                            <p style={{ fontSize: '32px', marginBottom: '8px' }}>🔔</p>
                            <p style={{ fontWeight: 600 }}>No notifications yet</p>
                            <p style={{ fontSize: '12px', marginTop: '4px' }}>Municipality alerts will appear here</p>
                        </div>
                    ) : notifications.map(n => {
                        const cfg = NOTIFICATION_TYPES[n.type] || NOTIFICATION_TYPES.info;
                        const isUnread = !readIds.has(n.id);
                        return (
                            <div
                                key={n.id}
                                style={{
                                    padding: '14px 20px',
                                    borderBottom: '1px solid #f5f5f5',
                                    background: isUnread ? cfg.bg : '#fff',
                                    borderLeft: isUnread ? `3px solid ${cfg.color}` : '3px solid transparent',
                                    cursor: 'default',
                                }}
                            >
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '18px', flexShrink: 0 }}>{cfg.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 700, fontSize: '13px', color: '#111', margin: 0 }}>{n.title}</p>
                                        <p style={{ fontSize: '12px', color: '#555', margin: '3px 0 0', lineHeight: 1.4 }}>{n.message}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                            <span style={{ fontSize: '10px', color: '#bbb' }}>{timeAgo(n.created_at)}</span>
                                            {n.sector && <span style={{ fontSize: '10px', padding: '1px 6px', background: '#f0f0f0', borderRadius: '99px', color: '#777' }}>📍 {n.sector}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <style>{`@keyframes drawerSlide { from { transform:translateX(100%); } to { transform:translateX(0); } }`}</style>
            </div>
        </>
    );
}

/** Main exported component — mount this in CitizenApp */
export default function CitizenNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [toast, setToast] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [readIds, setReadIds] = useState(getReadIds);

    // Load history on mount
    useEffect(() => {
        fetchNotifications(30).then(setNotifications).catch(console.error);
    }, []);

    // Real-time subscription
    useEffect(() => {
        const unsub = subscribeToNotifications((n) => {
            setNotifications(prev => [n, ...prev]);
            setToast(n);
        });
        return unsub;
    }, []);

    const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

    function openDrawer() {
        setDrawerOpen(true);
        // Mark all as read when drawer is opened
        const allIds = new Set(notifications.map(n => n.id));
        allIds.forEach(id => markRead(id));
        setReadIds(new Set([...readIds, ...allIds]));
    }

    function markAllRead() {
        notifications.forEach(n => markRead(n.id));
        setReadIds(new Set(notifications.map(n => n.id)));
    }

    return (
        <>
            {/* Bell button (top-right of citizen app) */}
            <button
                onClick={openDrawer}
                style={{
                    position: 'fixed', top: '16px', right: '16px', zIndex: 500,
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(8px)',
                    border: '1.5px solid rgba(0,0,0,0.1)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', position: 'fixed',
                }}
            >
                <span style={{ fontSize: '20px' }}>🔔</span>
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: '-4px', right: '-4px',
                        background: '#EF4444', color: '#fff',
                        fontSize: '10px', fontWeight: 800,
                        width: '18px', height: '18px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid #fff',
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Toast for incoming real-time notification */}
            {toast && (
                <Toast notification={toast} onDismiss={() => setToast(null)} />
            )}

            {/* Notification drawer */}
            {drawerOpen && (
                <NotificationDrawer
                    notifications={notifications}
                    readIds={readIds}
                    onClose={() => setDrawerOpen(false)}
                    onMarkAllRead={markAllRead}
                />
            )}
        </>
    );
}
