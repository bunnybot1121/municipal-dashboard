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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-white drop-shadow-md flex items-center gap-3">
                        <Bell className="text-blue-400" size={28} />
                        Citizen Notifications
                    </h1>
                    <p className="text-white/70 font-medium text-sm mt-1">Broadcast alerts and updates to citizens in real-time</p>
                </div>
                <button onClick={loadHistory} className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-bold text-white shadow-lg transition-all">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Data
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* ── Compose Panel ── */}
                <div className="lg:col-span-2 bg-white/5 backdrop-blur-2xl border border-white/20 shadow-xl rounded-[2rem] p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="font-extrabold text-white flex items-center gap-2 drop-shadow-md">
                            <Send size={18} className="text-blue-400" /> Compose
                        </h2>
                        {/* Templates dropdown */}
                        <div className="relative border-none">
                            <button
                                onClick={() => setShowTemplates(v => !v)}
                                className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white font-bold border border-blue-400/30 bg-blue-500/10 hover:bg-blue-500/30 rounded-lg px-3 py-1.5 shadow-sm transition-colors"
                            >
                                <FileText size={14} /> Templates <ChevronDown size={14} />
                            </button>
                            {showTemplates && (
                                <div className="absolute right-0 top-10 z-20 bg-black/80 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl w-60 py-2">
                                    {TEMPLATES.map((t, i) => (
                                        <button
                                            key={i}
                                            onClick={() => applyTemplate(t)}
                                            className="w-full text-left px-4 py-3 hover:bg-white/10 text-sm font-bold text-white border-b border-white/10 last:border-0 transition-colors"
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
                            <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 block">Type</label>
                            <div className="grid grid-cols-4 gap-2">
                                {Object.entries(NOTIFICATION_TYPES).map(([key, val]) => (
                                    <button
                                        key={key} type="button"
                                        onClick={() => setType(key)}
                                        className={`py-2 flex flex-col items-center justify-center gap-1.5 rounded-xl text-[10px] sm:text-xs font-bold border transition-all shadow-sm ${type === key ? 'shadow-inner scale-105 backdrop-blur-md border-white/50' : 'bg-black/20 text-white/50 hover:bg-white/10 hover:text-white border-transparent'}`}
                                        style={type === key ? { color: val.color, backgroundColor: val.bg ? `${val.bg}40` : 'rgba(255,255,255,0.1)', borderColor: val.color } : {}}
                                    >
                                        <span className="flex items-center justify-center mb-0.5">{val.icon}</span> <span className="hidden sm:inline w-full truncate px-1">{val.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Target */}
                        <div>
                            <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 block">Target Audience</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['all', 'sector'].map(t => (
                                    <button key={t} type="button" onClick={() => setTarget(t)}
                                        className={`py-2.5 rounded-xl text-xs font-bold border border-white/20 transition-all shadow-sm ${target === t ? 'border-blue-400 bg-blue-500/20 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'border-transparent bg-black/20 text-white/50 hover:bg-white/10 hover:text-white'}`}>
                                        {t === 'all' ? '🌍 All Citizens' : '📍 By Sector'}
                                    </button>
                                ))}
                            </div>
                            {target === 'sector' && (
                                <select
                                    value={sector}
                                    onChange={e => setSector(e.target.value)}
                                    className="mt-3 w-full border border-white/20 bg-black/40 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 appearance-none shadow-sm cursor-pointer"
                                >
                                    {SECTORS.map(s => <option key={s} className="bg-slate-900 text-white">{s}</option>)}
                                </select>
                            )}
                        </div>

                        {/* Title */}
                        <div>
                            <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 block">Title</label>
                            <input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Notification headline…"
                                maxLength={100}
                                required
                                className="w-full border border-white/20 bg-black/20 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 placeholder-white/30 shadow-inner"
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 block">Message</label>
                            <textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="Full notification message…"
                                rows={4}
                                maxLength={500}
                                required
                                className="w-full border border-white/20 bg-black/20 rounded-xl px-4 py-3 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 resize-none placeholder-white/30 shadow-inner"
                            />
                            <p className="text-right text-[10px] font-bold text-white/40 mt-1">{message.length}/500</p>
                        </div>

                        {/* Preview */}
                        {(title || message) && (
                            <div className="rounded-2xl p-4 border backdrop-blur-md shadow-lg" style={{ backgroundColor: cfg.bg ? `${cfg.bg}20` : 'rgba(255,255,255,0.05)', borderColor: cfg.color ? `${cfg.color}40` : 'rgba(255,255,255,0.2)' }}>
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: cfg.color || '#fff' }}>Preview ✨</p>
                                <p className="text-sm font-bold text-white flex items-start gap-2">{cfg.icon} <span className="mt-0.5">{title || 'Title…'}</span></p>
                                <p className="text-xs text-white/70 mt-1.5 leading-relaxed break-words">{message || 'Message…'}</p>
                            </div>
                        )}

                        {/* Send button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={sending || !title.trim() || !message.trim()}
                                className={`w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all shadow-xl hover:-translate-y-0.5 ${sent ? 'bg-green-500/20 border border-green-500/40 text-green-300' : 'liquid-btn liquid-btn-blue disabled:opacity-50 disabled:hover:translate-y-0'}`}
                            >
                                {sending ? <Loader size={18} className="animate-spin" /> : sent ? <CheckCircle size={18} /> : <Send size={18} />}
                                {sending ? 'Sending…' : sent ? 'Sent Successfully!' : 'Send to Citizens'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* ── History Panel ── */}
                <div className="lg:col-span-3 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-xl overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-white/10 bg-black/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Clock size={18} className="text-white/50" />
                            <h2 className="font-extrabold text-white drop-shadow-md">Sent Notifications</h2>
                        </div>
                        <span className="text-[10px] font-bold text-white/70 bg-white/10 border border-white/20 px-3 py-1 rounded-full shadow-inner">{history.length} total</span>
                    </div>

                    <div className="overflow-y-auto flex-1 custom-scrollbar" style={{ maxHeight: '600px' }}>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-3 text-white/50">
                                <Loader size={24} className="animate-spin" /> 
                                <span className="text-sm font-bold">Loading history…</span>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="p-16 text-center">
                                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 shadow-inner">
                                    <Bell size={32} className="text-white/30" />
                                </div>
                                <p className="text-white font-bold text-lg drop-shadow-sm">No notifications sent yet</p>
                                <p className="text-white/50 text-sm mt-1">Compose your first one on the left panel.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {history.map(n => {
                                    const c = NOTIFICATION_TYPES[n.type] || NOTIFICATION_TYPES.info;
                                    return (
                                        <div key={n.id} className="px-6 py-5 hover:bg-white/5 transition-colors group">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                                    <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm shadow-inner border border-white/10" style={{ backgroundColor: c.bg ? `${c.bg}30` : 'rgba(255,255,255,0.1)', color: c.color || '#fff' }}>
                                                        {c.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                                                            <p className="font-bold text-sm text-white truncate drop-shadow-sm">{n.title}</p>
                                                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider border shadow-sm" style={{ color: c.color || '#fff', backgroundColor: c.bg ? `${c.bg}20` : 'rgba(255,255,255,0.1)', borderColor: c.color ? `${c.color}40` : 'rgba(255,255,255,0.2)' }}>
                                                                {c.label}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-white/70 bg-white/10 border border-white/10 shadow-inner px-2 py-0.5 rounded flex items-center gap-1.5">
                                                                <Users size={10} />
                                                                {n.sector ? n.sector : 'All Citizens'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-white/80 leading-relaxed font-medium line-clamp-2">{n.message}</p>
                                                        <p className="text-[10px] font-bold text-white/40 mt-2 flex items-center gap-1"><Clock size={10} /> {timeAgo(n.created_at)}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(n.id)}
                                                    disabled={deleting === n.id}
                                                    className="flex-shrink-0 p-2 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                                                >
                                                    {deleting === n.id ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
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
