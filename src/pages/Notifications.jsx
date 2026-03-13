import React, { useState, useEffect } from 'react';
import {
    Bell, Send, Trash2, Clock, Users, AlertTriangle,
    CheckCircle, Info, Zap, ChevronDown, Loader, RefreshCw, FileText
} from 'lucide-react';
import {
    sendNotification, fetchNotifications, deleteNotification,
    NOTIFICATION_TYPES, TEMPLATES
} from '../services/notificationService';

const TYPE_ICONS = {
    info: <Info size={16} className="text-blue-500" />,
    warning: <AlertTriangle size={16} className="text-amber-500" />,
    critical: <Zap size={16} className="text-red-500" />,
    success: <CheckCircle size={16} className="text-green-500" />,
};

const SECTORS = ['All Sectors', 'Roads', 'Water', 'Electricity', 'Sanitation', 'Parks', 'Safety'];

function timeAgo(ts) {
    const m = Math.floor((Date.now() - new Date(ts)) / 60_000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

export default function Notifications() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('info');
    const [target, setTarget] = useState('all');
    const [sector, setSector] = useState('All Sectors');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);
    const [showTemplates, setShowTemplates] = useState(false);

    useEffect(() => { loadHistory(); }, []);

    async function loadHistory() {
        setLoading(true);
        try { setHistory(await fetchNotifications()); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    function applyTemplate(t) {
        setTitle(t.title);
        setMessage(t.message);
        setType(t.type);
        setShowTemplates(false);
    }

    async function handleSend(e) {
        e.preventDefault();
        if (!title.trim() || !message.trim()) return;
        setSending(true);
        try {
            await sendNotification({
                title: title.trim(),
                message: message.trim(),
                type,
                target,
                sector: sector === 'All Sectors' ? null : sector,
            });
            setSent(true);
            setTitle(''); setMessage(''); setType('info'); setTarget('all'); setSector('All Sectors');
            setTimeout(() => setSent(false), 3000);
            loadHistory();
        } catch (err) {
            alert('Failed to send: ' + err.message);
        } finally {
            setSending(false);
        }
    }

    async function handleDelete(id) {
        setDeleting(id);
        try { await deleteNotification(id); setHistory(h => h.filter(n => n.id !== id)); }
        catch (e) { alert('Delete failed: ' + e.message); }
        finally { setDeleting(null); }
    }

    const cfg = NOTIFICATION_TYPES[type];

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Bell className="text-blue-600" size={24} />
                        Citizen Notifications
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Broadcast alerts and updates to citizens in real-time</p>
                </div>
                <button onClick={loadHistory} className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-gray-50 text-sm text-gray-600 shadow-sm">
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* ── Compose Panel ── */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Send size={16} className="text-blue-600" /> Compose
                        </h2>
                        {/* Templates dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowTemplates(v => !v)}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold border border-blue-200 rounded-lg px-2 py-1"
                            >
                                <FileText size={12} /> Templates <ChevronDown size={12} />
                            </button>
                            {showTemplates && (
                                <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-xl shadow-xl w-60 py-1">
                                    {TEMPLATES.map((t, i) => (
                                        <button
                                            key={i}
                                            onClick={() => applyTemplate(t)}
                                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 border-b last:border-0"
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <form onSubmit={handleSend} className="space-y-3">
                        {/* Type selector */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Type</label>
                            <div className="grid grid-cols-4 gap-1.5">
                                {Object.entries(NOTIFICATION_TYPES).map(([key, val]) => (
                                    <button
                                        key={key} type="button"
                                        onClick={() => setType(key)}
                                        className={`py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${type === key ? 'border-current shadow-sm scale-105' : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                        style={type === key ? { color: val.color, backgroundColor: val.bg, borderColor: val.color } : {}}
                                    >
                                        {val.icon} {val.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Target */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Target Audience</label>
                            <div className="grid grid-cols-2 gap-1.5">
                                {['all', 'sector'].map(t => (
                                    <button key={t} type="button" onClick={() => setTarget(t)}
                                        className={`py-2 rounded-lg text-xs font-semibold border-2 transition-all ${target === t ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                                        {t === 'all' ? '🌍 All Citizens' : '📍 By Sector'}
                                    </button>
                                ))}
                            </div>
                            {target === 'sector' && (
                                <select
                                    value={sector}
                                    onChange={e => setSector(e.target.value)}
                                    className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400"
                                >
                                    {SECTORS.map(s => <option key={s}>{s}</option>)}
                                </select>
                            )}
                        </div>

                        {/* Title */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Title</label>
                            <input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Notification headline…"
                                maxLength={100}
                                required
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400 placeholder-gray-400"
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Message</label>
                            <textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="Full notification message…"
                                rows={4}
                                maxLength={500}
                                required
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400 resize-none placeholder-gray-400"
                            />
                            <p className="text-right text-[10px] text-gray-400 mt-0.5">{message.length}/500</p>
                        </div>

                        {/* Preview */}
                        {(title || message) && (
                            <div className="rounded-xl p-3 border" style={{ backgroundColor: cfg.bg, borderColor: cfg.color + '40' }}>
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: cfg.color }}>Preview</p>
                                <p className="text-sm font-bold text-gray-800">{cfg.icon} {title || 'Title…'}</p>
                                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{message || 'Message…'}</p>
                            </div>
                        )}

                        {/* Send button */}
                        <button
                            type="submit"
                            disabled={sending || !title.trim() || !message.trim()}
                            className={`w-full py-2.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all ${sent ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-50'}`}
                        >
                            {sending ? <Loader size={16} className="animate-spin" /> : sent ? <CheckCircle size={16} /> : <Send size={16} />}
                            {sending ? 'Sending…' : sent ? 'Sent Successfully!' : 'Send to Citizens'}
                        </button>
                    </form>
                </div>

                {/* ── History Panel ── */}
                <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b bg-gray-50 flex items-center gap-2">
                        <Clock size={16} className="text-gray-500" />
                        <h2 className="font-semibold text-gray-800">Sent Notifications</h2>
                        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{history.length} total</span>
                    </div>

                    <div className="overflow-y-auto" style={{ maxHeight: '520px' }}>
                        {loading ? (
                            <div className="flex items-center justify-center gap-2 p-12 text-gray-400">
                                <Loader size={18} className="animate-spin" /> Loading history…
                            </div>
                        ) : history.length === 0 ? (
                            <div className="p-12 text-center">
                                <Bell size={32} className="mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-400 text-sm">No notifications sent yet.</p>
                                <p className="text-gray-300 text-xs mt-1">Compose your first one on the left.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {history.map(n => {
                                    const c = NOTIFICATION_TYPES[n.type] || NOTIFICATION_TYPES.info;
                                    return (
                                        <div key={n.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                                    <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: c.bg }}>
                                                        {c.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="font-semibold text-sm text-gray-900 truncate">{n.title}</p>
                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ color: c.color, backgroundColor: c.bg }}>
                                                                {c.label}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                <Users size={9} />
                                                                {n.sector ? n.sector : 'All Citizens'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                                                        <p className="text-[10px] text-gray-300 mt-1">{timeAgo(n.created_at)}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(n.id)}
                                                    disabled={deleting === n.id}
                                                    className="flex-shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                >
                                                    {deleting === n.id ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
