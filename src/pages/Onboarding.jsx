import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Upload, MapPin, CheckCircle, FileText, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

import { parseSchedule } from '../utils/scheduleParser';

const Onboarding = () => {
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [city, setCity] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [parsing, setParsing] = useState(false);

    const handleCitySubmit = async (e) => {
        e.preventDefault();
        if (!city) return;

        // Save city to profile (assuming 'city' column exists or using metadata)
        try {
            // Upsert ensures the row exists if missing
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    email: user.email,
                    assigned_zone: city,
                    role: 'admin', // Ensure role persists
                    updated_at: new Date()
                });

            if (error) throw error;
            setStep(2);
        } catch (error) {
            console.error("Error saving city:", error);
            alert("Failed to save city choice.");
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (file) setFile(file);
    };

    const processSchedule = async () => {
        if (!file) return;
        setUploading(true);
        setParsing(true);

        // READ FILE CONTENT
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;

            try {
                // 1. Parse
                const pTasks = parseSchedule(text);
                console.log(`Parsed ${pTasks.length} tasks`);

                if (pTasks.length === 0) {
                    alert("No valid tasks found. Please check file format (YYYY-MM-DD: Task)");
                    setUploading(false);
                    setParsing(false);
                    return;
                }

                // 2. Upload to Supabase
                const dbTasks = pTasks.map(t => ({
                    ...t,
                    user_id: user.id
                }));

                console.log(`Attempting to insert ${dbTasks.length} tasks...`);
                const { data, error } = await supabase.from('tasks').insert(dbTasks).select();

                if (error) {
                    console.error("Insert error:", error);
                    throw error;
                }

                if (!data || data.length === 0) {
                    throw new Error("Insert returned no data - RLS policy may be blocking INSERT");
                }

                console.log(`Successfully inserted ${data.length} tasks`);

                // Success
                setParsing(false);
                setUploading(false);
                setStep(3);

            } catch (error) {
                console.error("Error processing schedule:", error);
                alert("Failed to upload schedule. " + error.message);
                setUploading(false);
                setParsing(false);
            }
        };
        reader.readAsText(file);
    };

    const finishOnboarding = async () => {
        // Refresh auth context to pick up the new city assignment
        if (refreshProfile) {
            await refreshProfile();
        }
        // Navigate to dashboard (breaks the loop)
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row h-[500px]">

                {/* Visual Side */}
                <div className="w-full md:w-1/3 bg-blue-600 p-8 flex flex-col justify-between text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm">
                            <MapPin className="text-white" size={24} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Setup Wizard</h2>
                        <p className="text-blue-100 text-sm">Let's get your municipality ready for AI-driven management.</p>

                        {/* DEBUG OVERLAY */}
                        <div className="mt-4 bg-red-600/90 text-white p-2 rounded text-xs font-mono border border-red-400">
                            <p><strong>DEBUG INFO:</strong></p>
                            <p>User ID: {user?.id?.substring(0, 8)}...</p>
                            <p>Context City: {String(user?.assigned_zone)}</p>
                            <p>Role: {user?.role}</p>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="space-y-4 relative z-10">
                        <StepIndicator number={1} title="Select City" active={step >= 1} current={step === 1} />
                        <StepIndicator number={2} title="Upload Schedule" active={step >= 2} current={step === 2} />
                        <StepIndicator number={3} title="Ready" active={step >= 3} current={step === 3} />
                    </div>

                    {/* Decorative Circles */}
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500 rounded-full opacity-50"></div>
                    <div className="absolute top-10 -left-10 w-20 h-20 bg-blue-400 rounded-full opacity-50"></div>
                </div>

                {/* Content Side */}
                <div className="flex-1 p-10 relative">
                    {step === 1 && (
                        <div className="animate-fade-in h-full flex flex-col">
                            <h3 className="text-xl font-bold text-slate-800 mb-6">Which municipality is this for?</h3>
                            <form onSubmit={handleCitySubmit} className="flex-1 flex flex-col">
                                <form className="space-y-4 mb-auto">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-500 uppercase">City Name</label>
                                        <input
                                            type="text"
                                            className="w-full p-4 border border-slate-200 rounded-xl text-lg font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder="e.g. Khargar"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        {['Khargar', 'Panvel', 'Belapur', 'Vashi'].map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setCity(c)}
                                                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${city === c ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </form>
                                <button type="submit" disabled={!city} className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                                    Continue <ArrowRight size={18} />
                                </button>
                            </form>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-fade-in h-full flex flex-col">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Upload Maintenance Schedule</h3>
                            <p className="text-slate-500 text-sm mb-6">Upload your yearly plan in Markdown (.md/ .txt) format.</p>

                            <div className="flex-1 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer relative">
                                <input type="file" accept=".md,.txt" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <div className="w-16 h-16 bg-blue-100/50 rounded-full flex items-center justify-center mb-4 text-blue-600">
                                    <FileText size={32} />
                                </div>
                                {file ? (
                                    <div className="text-center">
                                        <p className="font-bold text-slate-700">{file.name}</p>
                                        <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <p className="font-medium text-slate-600">Click or Drag file to upload</p>
                                        <p className="text-xs text-slate-400 mt-1">Supports .md, .txt</p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={processSchedule}
                                disabled={!file || uploading}
                                className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {uploading ? 'Processing...' : 'Upload & Parse'}
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-fade-in h-full flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600 animate-bounce-slow">
                                <CheckCircle size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">All Set!</h3>
                            <p className="text-slate-500 mb-8 max-w-xs">City <strong>{city}</strong> configured.<br />Calendar has been populated with your schedule.</p>

                            <button onClick={finishOnboarding} className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl">
                                Go to Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StepIndicator = ({ number, title, active, current }) => (
    <div className={`flex items-center gap-3 ${active ? 'opacity-100' : 'opacity-40'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${current ? 'bg-white text-blue-600 border-white' : 'border-white text-white'}`}>
            {active && !current ? <CheckCircle size={16} /> : number}
        </div>
        <span className="font-medium">{title}</span>
    </div>
);

export default Onboarding;
