
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
// NEW IMPORT
import { parseMarkdownSchedule } from '../utils/markdownScheduleParser';
import { uploadTasksToSupabase } from '../services/taskService';
import { useAuth } from '../contexts/AuthContext';

export default function ScheduleUploadPage() {
    const [file, setFile] = useState(null);
    const [parsedTasks, setParsedTasks] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();
    const { city } = useAuth(); // Use Auth Context for City

    async function handleFileSelect(e) {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        // Validate file type - ACCEPT .md files
        if (!selectedFile.name.endsWith('.md') && !selectedFile.name.endsWith('.markdown')) {
            setError('Please upload a .md (Markdown) file');
            return;
        }

        setFile(selectedFile);
        setError('');
        setSuccess('');
        setParsing(true);

        try {
            // USE MARKDOWN PARSER
            const tasks = await parseMarkdownSchedule(selectedFile);

            setParsedTasks(tasks);
            setSuccess(`✅ Successfully parsed ${tasks.length} tasks from markdown file`);

            console.log(`✅ READY TO UPLOAD: ${tasks.length} real tasks`);

        } catch (err) {
            setError(`Parse failed: ${err.message}`);
            setParsedTasks([]);
            console.error('❌ PARSE ERROR:', err);
        } finally {
            setParsing(false);
        }
    }

    async function handleUpload() {
        if (!parsedTasks || parsedTasks.length === 0) {
            setError('No tasks to upload. Please select a valid file.');
            return;
        }

        setUploading(true);
        setError('');
        setSuccess('');

        try {
            // REAL UPLOAD TO SUPABASE - NOT MOCKED
            // Pass city from context or default
            const result = await uploadTasksToSupabase(parsedTasks, city || 'Khargar');

            console.log(`✅ UPLOAD COMPLETE: ${result.count} tasks in Supabase`);

            // Verify counts match (or are close enough if chunking implies >0)
            if (result.count === 0 && parsedTasks.length > 0) {
                throw new Error("Upload seemed to fail (0 tasks inserted).");
            }

            setSuccess(`✅ Successfully uploaded ${result.count} tasks to database!`);

            // Save to localStorage
            localStorage.setItem('scheduleUploaded', 'true');
            localStorage.setItem('uploadedTaskCount', result.count);

            // DEBUG ALERT
            alert(`Upload Complete! Inserted ${result.count} tasks.\n\nRedirecting to Dashboard...`);

            // Navigate to dashboard after 2 seconds
            setTimeout(() => {
                navigate('/');
            }, 1000);

        } catch (err) {
            setError(`Upload failed: ${err.message}`);
            console.error('❌ UPLOAD ERROR:', err);
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="animate-fade-in max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white drop-shadow-md">Upload Yearly Schedule</h1>
                <p className="text-white/70 mt-2 font-medium">
                    {city ? `For ${city}` : 'No city selected'}
                </p>
            </div>

                {/* File Upload Area */}
                <div className={`border-2 border-dashed rounded-[2rem] p-12 mb-6 transition-colors shadow-lg backdrop-blur-md ${file
                    ? 'border-green-400/50 bg-green-500/10'
                    : 'border-white/20 bg-white/10 hover:border-white/40 hover:bg-white/20'
                    }`}>
                    <input
                        type="file"
                        accept=".md,.markdown"  // Accept markdown files
                        onChange={handleFileSelect}
                        disabled={parsing || uploading}
                        className="hidden"
                        id="file-upload"
                    />
                    <label htmlFor="file-upload" className="block cursor-pointer text-center">
                        {parsing ? (
                            <div>
                                <Loader className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
                                <p className="font-semibold text-white">Parsing markdown file...</p>
                            </div>
                        ) : file ? (
                            <div>
                                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4 drop-shadow-sm" />
                                <p className="font-semibold text-white/90 text-lg drop-shadow-sm">{file.name}</p>
                                <p className="text-green-300 mt-2 font-medium">
                                    {parsedTasks.length} tasks ready to upload
                                </p>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setFile(null);
                                        setParsedTasks([]);
                                        setSuccess('');
                                    }}
                                    className="mt-4 text-blue-300 hover:text-white transition-colors hover:underline text-sm font-medium"
                                >
                                    Choose different file
                                </button>
                            </div>
                        ) : (
                            <div>
                                <FileText className="w-16 h-16 text-white/40 mx-auto mb-4" />
                                <p className="font-semibold text-white/90 text-lg mb-2 drop-shadow-sm">
                                    Click to upload schedule file
                                </p>
                                <p className="text-white/70">Markdown (.md) files only</p>
                                <p className="text-sm text-white/50 mt-2">
                                    Upload your municipal schedule in markdown format
                                </p>
                                <p className="text-xs text-white/40 mt-2">Format: **Month**, **Day**, * Sector, * Task</p>
                            </div>
                        )}
                    </label>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="bg-green-500/20 border border-green-500/30 backdrop-blur-sm rounded-xl p-4 mb-6 flex items-start gap-3 shadow-md">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <p className="text-green-200 font-medium">{success}</p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500/30 backdrop-blur-sm rounded-xl p-4 mb-6 flex items-start gap-3 shadow-md">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-red-200 font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {/* Preview Table */}
                {parsedTasks.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/20 overflow-hidden mb-6 shadow-lg">
                        <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                            <h3 className="font-semibold text-lg text-white drop-shadow-sm">
                                Preview: First 10 of {parsedTasks.length} tasks
                            </h3>
                            <span className="text-xs font-medium text-white/80 bg-white/10 border border-white/20 px-2 py-1 rounded backdrop-blur-sm">Markdown Parsed</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-white/90">
                                <thead className="bg-white/5 border-b border-white/10 text-white/70">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold">Month</th>
                                        <th className="px-4 py-3 text-left font-semibold">Day</th>
                                        <th className="px-4 py-3 text-left font-semibold">Sector</th>
                                        <th className="px-4 py-3 text-left font-semibold">Type</th>
                                        <th className="px-4 py-3 text-left font-semibold w-1/3">Description</th>
                                        <th className="px-4 py-3 text-left font-semibold">Priority</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {parsedTasks.slice(0, 10).map((task, idx) => (
                                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 font-medium text-white">{task.month}</td>
                                            <td className="px-4 py-3">{task.day}</td>
                                            <td className="px-4 py-3 capitalize text-white/80">{task.sector}</td>
                                            <td className="px-4 py-3 text-white/80">{task.task_type}</td>
                                            <td className="px-4 py-3 text-white/60 text-xs">{task.description.substring(0, 80)}...</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase shadow-sm border border-white/10 ${task.priority === 'critical' ? 'bg-red-500/20 text-red-300' :
                                                    task.priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                                                        task.priority === 'medium' ? 'bg-blue-500/20 text-blue-300' :
                                                            'bg-white/10 text-white/80'
                                                    }`}>
                                                    {task.priority || 'P3'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {parsedTasks.length > 10 && (
                            <div className="bg-white/5 px-6 py-3 border-t border-white/10 text-xs text-white/50 text-center font-medium">
                                ... and {parsedTasks.length - 10} more tasks
                            </div>
                        )}
                    </div>
                )}

                {/* Upload Button */}
                {parsedTasks.length > 0 && !uploading && !success.includes('Successfully uploaded') && (
                    <button
                        onClick={handleUpload}
                        className="w-full liquid-btn liquid-btn-emerald py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Upload className="w-5 h-5" />
                        Upload {parsedTasks.length} Tasks to Database
                    </button>
                )}

                {/* Uploading State */}
                {uploading && (
                    <div className="bg-blue-500/10 border border-blue-400/20 backdrop-blur-md rounded-[2rem] p-8 text-center shadow-lg">
                        <Loader className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                        <p className="text-white drop-shadow-sm font-bold text-xl">
                            Uploading {parsedTasks.length} tasks to Supabase...
                        </p>
                        <p className="text-blue-200 mt-2 font-medium">Please wait, this may take a moment.</p>
            </div>
        )}
        </div>
    );
}
