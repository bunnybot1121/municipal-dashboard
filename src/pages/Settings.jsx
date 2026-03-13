import React, { useState, useEffect } from 'react';
import { Upload, FileText, AlertTriangle, RefreshCw, Trash2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { api } from '../services/apiClient';
// UPDATED IMPORTS
import { parseMarkdownSchedule } from '../utils/markdownScheduleParser';
import { uploadTasksToSupabase } from '../services/taskService';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
    const { user, city } = useAuth();
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, processing, success, error
    const [message, setMessage] = useState('');

    const handleFileUpload = (e) => {
        const f = e.target.files[0];
        if (f) setFile(f);
    };

    const [syncHistory, setSyncHistory] = useState([]);

    // Fetch history from DB
    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('sync_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            if (data) setSyncHistory(data);
        } catch (err) {
            console.error("Failed to fetch sync history:", err);
        }
    };

    const addToHistory = async (filename, status, count) => {
        try {
            const { error } = await supabase.from('sync_logs').insert({
                filename: filename,
                status: status,
                task_count: count,
                created_by: user.id
            });
            if (error) throw error;
            fetchHistory(); // Refresh list
        } catch (err) {
            console.error("Failed to save sync log:", err);
        }
    };

    const handleScheduleUpload = async () => {
        if (!file) return;

        setStatus('processing');
        setMessage('Parsing file...');

        // Add debug log
        setDebugLogs(prev => [...prev, `Starting upload for: ${file.name}`]);

        try {
            // 1. USE CORRECT MARKDOWN PARSER
            const pTasks = await parseMarkdownSchedule(file); // Note: this might need file object or text depending on implementation. 
            // checking parseMarkdownSchedule implementation in previous turns -> it takes 'file' object.

            if (pTasks.length === 0) {
                const msg = "No valid tasks found. Ensure format: **Month**, **Day**, * Sector, * Task";
                setDebugLogs(prev => [...prev, msg]);
                throw new Error(msg);
            }

            setMessage(`Uploading ${pTasks.length} tasks...`);
            setDebugLogs(prev => [...prev, `Parsed ${pTasks.length} tasks. Uploading to Supabase...`]);

            // 2. USE CORRECT UPLOAD SERVICE
            const result = await uploadTasksToSupabase(pTasks, city || 'Khargar');

            if (result.success || result.count > 0) {
                const successMsg = `Successfully added ${result.count} tasks.`;
                setDebugLogs(prev => [...prev, successMsg]);
                setStatus('success');
                setMessage(successMsg);
                await addToHistory(file.name, 'Success', result.count);
                setFile(null);

                // Set localStorage for soft reset consistency
                localStorage.setItem('scheduleUploaded', 'true');
                localStorage.setItem('uploadedTaskCount', result.count);

                if (document.getElementById('file-upload')) {
                    document.getElementById('file-upload').value = '';
                }
            }
        } catch (error) {
            console.error("Upload Error:", error);
            setDebugLogs(prev => [...prev, `Catch Error: ${error.message}`]);
            setStatus('error');
            setMessage(error.message);
            await addToHistory(file.name, 'Failed', 0);
        }
    };

    // ... handleTestInsert and handleResetData same as before ... 

    // BUT we need to cut out the old handleUpdateSchedule entirely from the view first to find where to insert. 
    // The replace_file_content tool matches exact content.
    // I will replace lines 18-62 mostly.

    const handleTestInsert = async () => {
        setDebugLogs(prev => [...prev, "Testing direct insert..."]);
        try {
            const dummy = {
                title: "TEST TASK " + Date.now(),
                sector: "other",
                priority: "low",
                status: "assigned",
                user_id: user.id,
                scheduled_start: new Date().toISOString(),
                scheduled_date: new Date().toISOString(),
                scheduled_time: '09:00:00'
            };
            const { data, error } = await supabase.from('tasks').insert(dummy).select();
            if (error) throw error;
            setDebugLogs(prev => [...prev, `Test Insert Success! ID: ${data[0]?.id}`]);
            alert("Test Insert Success!");
        } catch (e) {
            setDebugLogs(prev => [...prev, `Test Insert Failed: ${e.message}`]);
            alert("Test Failed: " + e.message);
        }
    };

    const [debugLogs, setDebugLogs] = useState([]);

    const handleResetData = async () => {
        if (!window.confirm("Are you sure? This will delete ALL tasks.")) return;

        try {
            const { error } = await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
            if (error) throw error;
            alert("All tasks deleted.");
        } catch (error) {
            console.error(error);
            alert("Failed to reset data");
        }
    };



    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-800">System Settings</h1>

            {/* DEBUG LOG BOX */}
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs max-h-40 overflow-auto">
                <p className="font-bold underline mb-2">UPLOAD DEBUG LOGS:</p>
                {debugLogs.length === 0 ? <p className="opacity-50">Waiting for action...</p> : debugLogs.map((l, i) => <p key={i}>{l}</p>)}
            </div>

            {/* General Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">General Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assigned Municipality</label>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-medium text-slate-900">{city || 'Not Assigned'}</span>
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                        </div>
                    </div>
                    <div>
                        <button onClick={handleTestInsert} className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700">Test DB Connection</button>
                    </div>
                </div>
            </div>

            {/* Schedule Management Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Maintenance Schedule</h2>
                        <p className="text-slate-500 text-sm">Manage the automated yearly calendar.</p>
                    </div>
                    <button onClick={handleResetData} className="text-red-500 hover:text-red-700 text-sm font-bold flex items-center gap-1">
                        <Trash2 size={16} /> Reset All Data
                    </button>
                </div>

                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 border-dashed text-center">
                    <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center mb-4 shadow-sm text-blue-600">
                        <FileText size={32} />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-1">Update Schedule</h3>
                    <p className="text-slate-500 text-sm mb-4 max-w-md mx-auto">
                        Uploading a new file will append tasks to the calendar.
                        Existing completed tasks will remain unchanged.
                    </p>

                    <div className="flex justify-center gap-3 items-center flex-col sm:flex-row">
                        <label className="cursor-pointer bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 text-slate-700 px-4 py-2 rounded-lg font-medium transition-all shadow-sm flex items-center gap-2">
                            <Upload size={18} /> {file ? file.name : 'Choose File'}
                            <input type="file" className="hidden" accept=".md,.txt" onChange={handleFileUpload} />
                        </label>
                        <button
                            onClick={handleScheduleUpload}
                            disabled={!file || status === 'processing'}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-md flex items-center gap-2"
                        >
                            {status === 'processing' ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                            Update Now
                        </button>
                    </div>
                    {status === 'success' && <div className="mt-4 text-green-600 font-bold text-sm flex items-center justify-center gap-2"><CheckCircle size={16} /> {message}</div>}
                    {status === 'error' && <div className="mt-4 text-red-500 font-bold text-sm flex items-center justify-center gap-2"><AlertTriangle size={16} /> {message}</div>}
                </div>

                <div className="mt-6">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-bold text-slate-700">Sync History (Database)</h4>
                    </div>
                    <div className="space-y-3">
                        {syncHistory.length === 0 ? (
                            <p className="text-xs text-slate-400 italic text-center py-2">No upload history found.</p>
                        ) : (
                            syncHistory.map(item => (
                                <HistoryItem
                                    key={item.id}
                                    date={new Date(item.created_at).toLocaleString()}
                                    file={item.filename}
                                    status={item.status}
                                    count={item.task_count}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const HistoryItem = ({ date, file, status, count }) => (
    <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-slate-300 transition-colors">
        <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status === 'Success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                <FileText size={16} />
            </div>
            <div>
                <div className="text-sm font-bold text-slate-800">{file}</div>
                <div className="text-xs text-slate-500">{date}</div>
            </div>
        </div>
        <div className="text-right">
            <div className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block ${status === 'Success' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>{status}</div>
            <div className="text-xs text-slate-400 mt-1">{count} tasks</div>
        </div>
    </div>
);

export default Settings;
