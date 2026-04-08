import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
    CheckCircle, 
    ImageSearch, 
    Refresh, 
    Check, 
    Close,
    Shield
} from '@mui/icons-material';

export default function PhotoVerificationDashboard() {
    const { user, isDepartment, isSeniorEngineer, isJuniorEngineer, department } = useAuth();
    const [verifications, setVerifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch resolved issues
            let queryIssues = supabase.from('issues')
                .select('*')
                .in('status', ['done', 'resolved', 'completed', 'pending_review']);

            // Fetch completed tasks
            let queryTasks = supabase.from('tasks')
                .select('*')
                .in('status', ['done', 'completed', 'pending_review']);

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

            // Filter for department if needed
            const isDeptScoped = isDepartment || isSeniorEngineer || isJuniorEngineer;
            if (isDeptScoped && department) {
                const dept = department.toLowerCase();
                allItems = allItems.filter(item => {
                    const sectorMatch = (item.sector || '').toLowerCase() === dept;
                    const typeMatch = (item.title || '').toLowerCase().startsWith(dept);
                    return sectorMatch || typeMatch;
                });
            }

            // Filter only items that actually have before/after photos uploaded
            allItems = allItems.filter(item => item.before_photo_url || item.after_photo_url);
            
            // Sort by most recent
            allItems.sort((a, b) => new Date(b.created_at || b.updated_at || Date.now()) - new Date(a.created_at || a.updated_at || Date.now()));
            
            setVerifications(allItems);
        } catch (e) {
            console.error("Failed fetching for verification:", e);
        } finally {
            setLoading(false);
        }
    }, [isDepartment, isSeniorEngineer, isJuniorEngineer, department]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleVerify = async (item, action) => {
        // action: 'approved' or 'rejected'
        const newStatus = action === 'approved' ? 'closed' : 'in_progress';
        try {
            let updateError = null;

            if (item.isTask) {
                const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', item.id);
                updateError = error;
            } else {
                const { error } = await supabase.from('issues').update({ status: newStatus }).eq('id', item.id);
                updateError = error;
            }

            if (updateError) {
                console.error("Supabase Error:", updateError);
                throw updateError;
            }

            // Remove from list or refresh
            setVerifications(prev => prev.filter(v => v.refId !== item.refId));
        } catch (err) {
            console.error(err);
            alert('Failed to verify: ' + (err.message || JSON.stringify(err)));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Refresh className="animate-spin text-blue-500" sx={{ fontSize: 40 }} />
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-10">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-white flex items-center gap-3">
                        <Shield className="text-emerald-400" sx={{ fontSize: 32 }} />
                        Photo Verification 
                    </h1>
                    <p className="text-white/70 text-sm mt-1 font-medium">Verify field staff work via Before & After photos</p>
                </div>
                <button 
                    onClick={fetchData}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-sm transition-all"
                >
                    <Refresh sx={{ fontSize: 18 }} />
                    Refresh
                </button>
            </div>

            {verifications.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-16 text-center shadow-lg">
                    <ImageSearch sx={{ fontSize: 60 }} className="text-white/20 mb-4 inline-block" />
                    <h2 className="text-white text-xl font-bold">No Pending Verifications</h2>
                    <p className="text-white/50 text-sm mt-2">All field staff photos have been reviewed.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {verifications.map(item => (
                        <div key={item.refId} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all">
                            {/* Header */}
                            <div className="p-5 border-b border-white/10 bg-black/20 flex justify-between items-start">
                                <div>
                                    <span className="text-[10px] font-extrabold tracking-widest text-emerald-300 uppercase bg-emerald-500/20 px-2 py-1 rounded-md border border-emerald-500/30">
                                        WORK DONE
                                    </span>
                                    <h3 className="text-lg font-bold text-white mt-2 drop-shadow-sm line-clamp-1">{item.title}</h3>
                                    <p className="text-xs text-white/50 font-medium mt-1">
                                        {item.sector ? `Sector: ${item.sector} | ` : ''} 
                                        ID: {String(item.id).substring(0,8).toUpperCase()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">Priority</span>
                                    <span className="text-xs font-bold text-white uppercase bg-white/10 px-2 py-1 rounded shadow-inner">
                                        {item.priority || item.severity || 'Medium'}
                                    </span>
                                </div>
                            </div>

                            {/* Images */}
                            <div className="flex divide-x divide-white/10 border-b border-white/10 h-[220px]">
                                <div className="w-1/2 relative group bg-black/40">
                                    <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md border border-red-400">
                                        BEFORE
                                    </div>
                                    {item.before_photo_url ? (
                                        <img src={item.before_photo_url} alt="Before" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/30 text-sm font-bold">No Photo</div>
                                    )}
                                </div>
                                <div className="w-1/2 relative group bg-black/40">
                                    <div className="absolute top-2 right-2 z-10 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md border border-emerald-400">
                                        AFTER
                                    </div>
                                    {item.after_photo_url ? (
                                        <img src={item.after_photo_url} alt="After" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/30 text-sm font-bold">No Photo</div>
                                    )}
                                </div>
                            </div>

                            {/* Info */}
                            {item.description && (
                                <div className="p-5 text-sm text-white/80 bg-black/10 border-b border-white/5">
                                    {item.description}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="p-5 flex gap-3">
                                <button 
                                    onClick={() => handleVerify(item, 'approved')}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <CheckCircle sx={{ fontSize: 20 }} /> Approve & Close
                                </button>
                                <button 
                                    onClick={() => {
                                        if(window.confirm('Reject this work? It will be sent back to In Progress.')) handleVerify(item, 'rejected');
                                    }}
                                    className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <Close sx={{ fontSize: 20 }} /> Reject Fix
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
