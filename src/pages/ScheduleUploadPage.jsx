
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
        <div className="min-h-screen bg-gray-50 p-6 animate-fade-in">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Upload Yearly Schedule</h1>
                    <p className="text-gray-600 mt-2">
                        {city ? `For ${city}` : 'No city selected'}
                    </p>
                </div>

                {/* File Upload Area */}
                <div className={`border-2 border-dashed rounded-xl p-12 mb-6 transition-colors ${file
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 bg-white hover:border-blue-500 hover:bg-blue-50'
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
                                <Loader className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
                                <p className="font-semibold text-gray-900">Parsing markdown file...</p>
                            </div>
                        ) : file ? (
                            <div>
                                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                                <p className="font-semibold text-gray-900 text-lg">{file.name}</p>
                                <p className="text-green-700 mt-2 font-medium">
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
                                    className="mt-4 text-blue-600 hover:underline text-sm"
                                >
                                    Choose different file
                                </button>
                            </div>
                        ) : (
                            <div>
                                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="font-semibold text-gray-900 text-lg mb-2">
                                    Click to upload schedule file
                                </p>
                                <p className="text-gray-600">Markdown (.md) files only</p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Upload your municipal schedule in markdown format
                                </p>
                                <p className="text-xs text-gray-400 mt-2">Format: **Month**, **Day**, * Sector, * Task</p>
                            </div>
                        )}
                    </label>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <p className="text-green-900 font-medium">{success}</p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-red-900 font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {/* Preview Table */}
                {parsedTasks.length > 0 && (
                    <div className="bg-white rounded-lg border overflow-hidden mb-6 shadow-sm">
                        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="font-semibold text-lg text-gray-800">
                                Preview: First 10 of {parsedTasks.length} tasks
                            </h3>
                            <span className="text-xs font-medium text-gray-500 bg-white border px-2 py-1 rounded">Markdown Parsed</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Month</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Day</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Sector</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/3">Description</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Priority</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {parsedTasks.slice(0, 10).map((task, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-900 font-medium">{task.month}</td>
                                            <td className="px-4 py-3 text-gray-900">{task.day}</td>
                                            <td className="px-4 py-3 capitalize text-gray-700">{task.sector}</td>
                                            <td className="px-4 py-3 text-gray-700">{task.task_type}</td>
                                            <td className="px-4 py-3 text-gray-600 text-xs">{task.description.substring(0, 80)}...</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${task.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                                    task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                                        task.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
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
                            <div className="bg-gray-50 px-6 py-3 border-t text-xs text-gray-500 text-center">
                                ... and {parsedTasks.length - 10} more tasks
                            </div>
                        )}
                    </div>
                )}

                {/* Upload Button */}
                {parsedTasks.length > 0 && !uploading && !success.includes('Successfully uploaded') && (
                    <button
                        onClick={handleUpload}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        <Upload className="w-5 h-5" />
                        Upload {parsedTasks.length} Tasks to Database
                    </button>
                )}

                {/* Uploading State */}
                {uploading && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
                        <Loader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
                        <p className="text-blue-900 font-bold text-xl">
                            Uploading {parsedTasks.length} tasks to Supabase...
                        </p>
                        <p className="text-blue-700 mt-2">Please wait, this may take a moment.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
