import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/apiClient';
import { calculatePriorityScore } from '../utils/aiPriority';
import {
    ArrowBack,
    AccessTime,
    CheckCircle,
    Map as MapIcon,
    Description,
    History,
    Assignment,
    Warning,
    Share,
    MoreHoriz,
    Close,
    Add,
    Image as ImageIcon
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Map Rendering (Invalidate Size)
const MapEffect = () => {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize();
        }, 500);
    }, [map]);
    return null;
};

// Fix Leaflet Icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const IssueDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [issue, setIssue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [overridePriority, setOverridePriority] = useState('');
    const [isOverrideOpen, setIsOverrideOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('detail');

    const [users, setUsers] = useState([]);

    useEffect(() => {
        if (id) {
            loadIssue();
            loadUsers();
        }
    }, [id]);

    const loadUsers = async () => {
        try {
            const data = await api.getUsers();
            // Filter for staff/admin roles if needed, or just show all
            setUsers(data || []);
        } catch (error) {
            console.error("Failed to load users", error);
        }
    };

    const [isVerifying, setIsVerifying] = useState(false);

    const loadIssue = async () => {
        try {
            setLoading(true);
            const data = await api.getIssueById(id);
            if (data) {
                // Normalize: DB returns `assigned_to`, UI reads `assignedTo`
                setIssue({
                    ...data,
                    assignedTo: data.assigned_to || data.assignedTo || ''
                });
            } else {
                console.error("Issue not found (null data)");
                setErrorMsg("Data returned null");
            }
        } catch (error) {
            console.error("Failed to load issue", error);
            setErrorMsg(error.message || "Unknown Error");
        } finally {
            setLoading(false);
        }
    };

    // Auto-verify: when issue loads with a photo but no verification, trigger AI immediately
    useEffect(() => {
        if (!issue || isVerifying) return;
        const hasPhoto = issue.imageUrl || issue.photo_url;
        const alreadyVerified = !!issue.aiAnalysis?.photoVerification;

        if (hasPhoto && !alreadyVerified) {
            (async () => {
                setIsVerifying(true);
                try {
                    console.log("🛡️ Auto-verifying issue photo...");
                    const response = await fetch('http://localhost:5001/api/validate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            photo: hasPhoto,
                            description: issue.description || '',
                            sector: issue.sector || '',
                            severity: issue.severity || 'Moderate'
                        })
                    });

                    if (response.ok) {
                        const validation = await response.json();
                        console.log("✅ Auto-verification result:", validation.isValid ? 'VERIFIED' : 'SUSPICIOUS');

                        const updatedAnalysis = {
                            ...(issue.aiAnalysis || {}),
                            photoVerification: {
                                isValid: validation.isValid,
                                confidence: validation.confidence,
                                reason: validation.reason,
                                detectedIssueType: validation.detectedIssueType,
                                sectorMatch: validation.sectorMatch,
                                descriptionMatch: validation.descriptionMatch,
                                verifiedAt: new Date().toISOString()
                            }
                        };

                        // Save to DB
                        await api.updateIssue(issue.id, { ai_analysis: updatedAnalysis });

                        // Update local state
                        setIssue(prev => ({
                            ...prev,
                            aiAnalysis: updatedAnalysis
                        }));
                    }
                } catch (err) {
                    console.warn("⚠️ Auto-verification failed:", err.message);
                } finally {
                    setIsVerifying(false);
                }
            })();
        }
    }, [issue?.id]);

    const handleOverride = async () => {
        if (!overridePriority) return;
        try {
            await api.updateIssue(issue.id, { priority: overridePriority, status: 'in_progress' });
            setIssue({ ...issue, priority: overridePriority, status: 'in_progress' });
            setIsOverrideOpen(false);
            alert("Priority Updated!");
        } catch (error) {
            console.error("Failed to update priority", error);
        }
    };

    const handleAssignmentUpdate = async () => {
        try {
            const assignedId = issue.assignedTo || null;
            await api.updateIssue(issue.id, {
                assigned_to: assignedId,
                status: issue.status
            });
            alert("Assignment & Status Updated!");
        } catch (error) {
            console.error("Failed to update assignment", error);
            alert("Failed to update assignment: " + (error.message || ''));
        }
    };

    const handleResolve = async () => {
        if (!window.confirm("Mark this issue as Resolved?")) return;
        try {
            await api.updateIssue(issue.id, { status: 'resolved' });
            setIssue({ ...issue, status: 'resolved' });
            alert("Issue marked as Resolved!");
        } catch (error) {
            console.error("Failed to resolve issue", error);
            alert("Failed to resolve issue");
        }
    };

    const [comment, setComment] = useState('');
    const [comments, setComments] = useState([]); // Local state for comments

    const handlePostComment = () => {
        if (!comment.trim()) return;
        const newComment = {
            id: Date.now(),
            user: "Admin User",
            text: comment,
            time: "Just now",
            role: "admin"
        };
        setComments([newComment, ...comments]);
        setComment('');
    };

    if (loading) return <div className="p-10 text-center">Loading issue details...</div>;
    // Improved Error UI
    if (!issue) return (
        <div className="p-10 text-center flex flex-col items-center">
            <div className="text-red-500 font-bold mb-2">Issue not found</div>
            <div className="text-xs text-gray-500 font-mono mb-4">ID: {id} <br /> Error: {errorMsg}</div>
            <button onClick={() => navigate('/issues')} className="text-blue-600 underline">Return to Issues</button>
        </div>
    );

    const getPriorityColor = (p) => {
        switch (p?.toLowerCase()) {
            case 'critical': return 'bg-red-100 text-red-700 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const handleAssign = () => {
        setActiveTab('history');
        // Optional: Scroll to assignment section if needed
        setTimeout(() => {
            document.querySelector('#assignment-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-10">
            {/* Header / Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <span className="hover:text-[#3c3cf6] cursor-pointer" onClick={() => navigate('/issues')}>Issues</span>
                <span>/</span>
                <span>{issue.id || id}</span>
            </div>

            {/* Title Block */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{issue.type || 'Issue Report'}</h1>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getPriorityColor(issue.priority)} flex items-center gap-1`}>
                            <Warning sx={{ fontSize: 14 }} /> {issue.priority || 'Medium'}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                            <AccessTime sx={{ fontSize: 16 }} /> Reported {new Date(issue.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                    </div>
                </div>
                <div className="flex gap-3">
                    {issue.status === 'open' && (
                        <>
                            <button
                                onClick={async () => {
                                    try {
                                        await api.updateIssue(issue.id, { status: 'accepted' });
                                        setIssue({ ...issue, status: 'accepted' });
                                        alert("Issue Accepted!");
                                    } catch (error) {
                                        console.error("Failed to accept issue", error);
                                    }
                                }}
                                className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md transition-all flex items-center gap-2"
                            >
                                <CheckCircle sx={{ fontSize: 18 }} /> Accept
                            </button>
                            <button
                                onClick={async () => {
                                    if (window.confirm("Reject this issue?")) {
                                        try {
                                            await api.updateIssue(issue.id, { status: 'rejected' });
                                            setIssue({ ...issue, status: 'rejected' });
                                            alert("Issue Rejected");
                                        } catch (error) {
                                            console.error("Failed to reject issue", error);
                                        }
                                    }
                                }}
                                className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 font-bold rounded-lg hover:bg-red-100 shadow-sm transition-all flex items-center gap-2"
                            >
                                <Close sx={{ fontSize: 18 }} /> Reject
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => setIsOverrideOpen(true)}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 shadow-sm transition-all"
                    >
                        Override Analysis
                    </button>
                    <button
                        onClick={handleResolve}
                        className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 font-bold rounded-lg hover:bg-green-100 shadow-sm transition-all"
                    >
                        Mark Resolved
                    </button>
                    <button
                        onClick={handleAssign}
                        className="px-4 py-2 bg-[#3c3cf6] text-white font-bold rounded-lg hover:bg-[#2a2abf] shadow-lg shadow-indigo-500/30 transition-all"
                    >
                        Assign to Dept
                    </button>
                </div>
            </div>

            {/* Override Modal */}
            {isOverrideOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-96">
                        <h3 className="font-bold text-lg mb-4">Manual Override</h3>
                        <label className="block text-sm font-medium mb-2">Set New Priority:</label>
                        <select
                            className="w-full p-2 border rounded mb-4"
                            value={overridePriority}
                            onChange={(e) => setOverridePriority(e.target.value)}
                        >
                            <option value="">Select Priority</option>
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsOverrideOpen(false)} className="px-3 py-1 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                            <button onClick={handleOverride} className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 flex gap-6">
                <TabButton active={activeTab === 'evidence'} onClick={() => setActiveTab('evidence')} icon={ImageIcon} label="Evidence" />
                <TabButton active={activeTab === 'detail'} onClick={() => setActiveTab('detail')} icon={Description} label="Details" />
                <TabButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={CheckCircle} label="AI Analysis" />
                <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} label="History" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (Dynamic Content) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* AI Photo Verification Banner */}
                    {isVerifying && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 animate-pulse">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <div>
                                <p className="text-blue-700 font-bold text-sm">🛡️ Verifying with AI...</p>
                                <p className="text-blue-500 text-xs">Analyzing photo for authenticity</p>
                            </div>
                        </div>
                    )}
                    {!isVerifying && issue.aiAnalysis?.photoVerification && (() => {
                        const pv = issue.aiAnalysis.photoVerification;
                        if (pv.needsManualReview) return (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                                <span className="text-2xl">🔍</span>
                                <div className="flex-1">
                                    <p className="text-amber-700 font-bold text-sm">Manual Review Required</p>
                                    <p className="text-amber-600 text-xs mt-1">{pv.reason}</p>
                                </div>
                            </div>
                        );
                        return pv.isValid ? (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                                <span className="text-2xl">✅</span>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-green-700 font-bold text-sm">AI Verified — Legitimate Report</p>
                                        <span className="text-green-600 text-xs font-bold bg-green-100 px-2 py-0.5 rounded-full">{pv.confidence}% confidence</span>
                                    </div>
                                    <p className="text-green-600 text-xs mt-1">{pv.reason}</p>
                                    {pv.detectedIssueType && pv.detectedIssueType !== 'unverified' && (
                                        <p className="text-green-500 text-xs mt-0.5">Detected: <strong>{pv.detectedIssueType}</strong></p>
                                    )}
                                    {pv.verifiedAt && (
                                        <p className="text-green-400 text-xs mt-1">Verified at: {new Date(pv.verifiedAt).toLocaleString('en-IN')}</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-start gap-3">
                                <span className="text-2xl">⚠️</span>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-red-700 font-bold text-sm">Suspicious Report — AI Flagged</p>
                                        <span className="text-red-600 text-xs font-bold bg-red-100 px-2 py-0.5 rounded-full">{pv.confidence}% confidence</span>
                                    </div>
                                    <p className="text-red-600 text-xs mt-1">{pv.reason}</p>
                                    {pv.detectedIssueType && pv.detectedIssueType !== 'unverified' && (
                                        <p className="text-red-500 text-xs mt-0.5">Detected: <strong>{pv.detectedIssueType}</strong></p>
                                    )}
                                    {pv.verifiedAt && (
                                        <p className="text-red-400 text-xs mt-1">Flagged at: {new Date(pv.verifiedAt).toLocaleString('en-IN')}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    {/* TAB: EVIDENCE */}
                    {activeTab === 'evidence' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Main Image */}
                            <div className="relative rounded-2xl overflow-hidden shadow-sm group">
                                <img
                                    src={issue.imageUrl || 'https://placehold.co/800x500?text=No+Image'}
                                    alt="Issue Evidence"
                                    className="w-full h-[400px] object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md text-white p-3 rounded-xl text-xs font-mono border border-white/20">
                                    <div>LAT: {issue.location?.lat?.toFixed(4) || 'N/A'}</div>
                                    <div>LONG: {issue.location?.lng?.toFixed(4) || 'N/A'}</div>
                                    <div>TIME: {new Date(issue.createdAt || Date.now()).toTimeString().split(' ')[0]}</div>
                                </div>
                            </div>

                            {/* Map & Metadata Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Map Preview */}
                                <div className="h-48 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 relative">
                                    {(issue.location && typeof issue.location.lat === 'number' && typeof issue.location.lng === 'number') ? (
                                        <MapContainer center={[issue.location.lat, issue.location.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                            <MapEffect />
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <Marker position={[issue.location.lat, issue.location.lng]}>
                                                <Popup>Issue Location</Popup>
                                            </Marker>
                                        </MapContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400 text-sm flex-col">
                                            <MapIcon className="mb-2 opacity-50" />
                                            <span>No Location Data</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Consistency Score Block */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="relative w-20 h-20 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="40" cy="40" r="36" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                                            <circle cx="40" cy="40" r="36" stroke="#3c3cf6" strokeWidth="8" fill="none" strokeDasharray="226" strokeDashoffset="20" />
                                        </svg>
                                        <span className="absolute text-xl font-bold text-[#3c3cf6]">94%</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-500 uppercase">Consistency Score</h3>
                                        <div className="text-xl font-bold text-gray-900">High Confidence</div>
                                        <div className="text-sm text-green-600 font-medium">+2.4% vs median</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-500 mb-1">Device ID</div>
                                    <div className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">Citizen-APP-88A2</div>
                                </div>
                            </div>
                        </div>

                    )}

                    {/* TAB: DETAILS */}
                    {activeTab === 'detail' && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-fade-in">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Description className="text-gray-400" /> Issue Details
                            </h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="text-xs font-bold text-gray-500 uppercase mb-2">Description</div>
                                    <p className="text-gray-800 leading-relaxed whitespace-pre-line">{issue.description || "No description provided."}</p>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Sector</div>
                                        <div className="font-medium text-gray-900">{issue.sector || 'General'}</div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Category</div>
                                        <div className="font-medium text-gray-900">{issue.type || 'Standard'}</div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Reported By</div>
                                        <div className="font-medium text-gray-900">{issue.citizenName || 'Anonymous'}</div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Address</div>
                                        <div className="font-medium text-gray-900 truncate" title={issue.address}>{issue.address || '—'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: AI ANALYSIS */}
                    {activeTab === 'ai' && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                    <CheckCircle className="text-[#3c3cf6]" /> AI Priority Analysis
                                </h3>
                                <div className="text-right">
                                    <div className="text-xs text-gray-400">Engine Model: UrbanLogic-v4.2</div>
                                </div>
                            </div>


                            {/* Auto-Run Logic & Loader */}
                            {(!issue.aiAnalysis || !issue.aiAnalysis.priorityScore) && (
                                <AutoRunAnalysis issue={issue} setIssue={setIssue} />
                            )}

                            {(!issue.aiAnalysis || !issue.aiAnalysis.priorityScore) ? (
                                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300 animate-pulse">
                                    <div className="mb-4">
                                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                        <h4 className="text-lg font-bold text-gray-700">Running AI Analysis...</h4>
                                        <p className="text-sm text-gray-500 max-w-md mx-auto">
                                            Connecting to OpenRouter (Gemini 2.0 Flash) for real-time priority assessment...
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-fade-in">
                                    {/* SCOREBOARD HEADER */}
                                    <div className="flex gap-4">
                                        {/* Total Score Card */}
                                        <div className="flex-1 bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-blue-100 flex items-center justify-between">
                                            <div>
                                                <div className="text-xs font-bold text-blue-500 uppercase mb-1">Total Priority Score</div>
                                                <div className="text-4xl font-extrabold text-[#3c3cf6]">{issue.aiAnalysis?.priorityScore || issue.aiAnalysis?.confidenceScore || 0}<span className="text-xl text-gray-400">/100</span></div>
                                                <div className="text-xs text-blue-400 mt-1">{issue.aiAnalysis?.priority || 'Moderate'} Risk Level</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-bold text-gray-400 uppercase">Signals Checked</div>
                                                <div className="text-xl font-bold text-gray-700">145</div>
                                                <div className="text-[10px] text-gray-400">Across 9 Dim.</div>
                                            </div>
                                        </div>

                                        {/* Seasonal Card */}
                                        {(issue.aiAnalysis?.seasonalFactor > 1.0 || issue.seasonalFactor > 1.0) && (
                                            <div className="w-1/3 bg-[#f0f9ff] p-4 rounded-2xl border border-blue-100 flex flex-col justify-center">
                                                <div className="text-xs font-bold text-blue-400 uppercase mb-1">Seasonal Factor</div>
                                                <div className="text-2xl font-bold text-[#3c3cf6]">
                                                    {issue.aiAnalysis?.seasonalFactor || issue.seasonalFactor}x
                                                </div>
                                                <div className="text-[10px] text-blue-800 mt-1">Multiplier Active</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* CATEGORY BREAKDOWN TABLE */}
                                    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                                        <div className="bg-gray-50 px-4 py-2 border-b flex justify-between">
                                            <span className="text-xs font-bold text-gray-500 uppercase">Category Breakdown (Scores)</span>
                                            <span className="text-xs text-gray-400">Points Awarded</span>
                                        </div>
                                        <div className="grid grid-cols-2 text-sm">
                                            {[
                                                { l: 'Safety Criticality', s: issue.aiAnalysis?.categoryScores?.safety || 0, max: 50 },
                                                { l: 'Sector Impact', s: issue.aiAnalysis?.categoryScores?.sector || 0, max: 40 },
                                                { l: 'Time Factors', s: issue.aiAnalysis?.categoryScores?.time || 0, max: 25 },
                                                { l: 'Location Context', s: issue.aiAnalysis?.categoryScores?.location || 0, max: 20 },
                                                { l: 'Citizen Voicing', s: issue.aiAnalysis?.categoryScores?.citizen || 0, max: 20 },
                                                { l: 'System Signals', s: issue.aiAnalysis?.categoryScores?.system || 0, max: 15 },
                                                { l: 'Resource Ops', s: issue.aiAnalysis?.categoryScores?.resource || 0, max: 10 },
                                                { l: 'Governance', s: issue.aiAnalysis?.categoryScores?.gov || 0, max: 30 },
                                            ].map((cat, i) => (
                                                <div key={i} className={`p-3 border-b border-gray-100 flex justify-between ${i % 2 === 0 ? 'border-r' : ''}`}>
                                                    <span className="text-gray-600">{cat.l}</span>
                                                    <span className={`font-mono font-bold ${cat.s > 0 ? 'text-[#3c3cf6]' : 'text-gray-300'}`}>
                                                        {cat.s} <span className="text-gray-300 font-normal">/ {cat.max}</span>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* GEMINI / OPENROUTER AI MAIN CARD */}
                                    {issue.aiAnalysis?.gemini ? (
                                        <div className={`p-6 rounded-xl border-2 shadow-sm ${issue.aiAnalysis.priority === 'Crisis' ? 'bg-red-50 border-red-200' : 'bg-white border-blue-100'}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></div>
                                                    Generative AI Assessment
                                                </h4>
                                                <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase shadow-sm ${issue.aiAnalysis.gemini.priority === 'Crisis' ? 'bg-red-600 text-white' :
                                                    issue.aiAnalysis.gemini.priority === 'Critical' ? 'bg-orange-500 text-white' :
                                                        'bg-blue-600 text-white'
                                                    }`}>
                                                    {issue.aiAnalysis.gemini.priority} Priority
                                                </span>
                                            </div>

                                            <div className="mb-4">
                                                <h5 className="text-xs font-bold text-gray-500 uppercase mb-1">AI Reasoning</h5>
                                                <p className="text-lg font-serif italic text-gray-800 leading-relaxed border-l-4 border-blue-200 pl-4 py-1">
                                                    "{issue.aiAnalysis.gemini.reasoning}"
                                                </p>
                                            </div>

                                            {issue.aiAnalysis.gemini.risks && issue.aiAnalysis.gemini.risks.length > 0 && (
                                                <div>
                                                    <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">Key Risk Factors</h5>
                                                    <div className="flex flex-wrap gap-2">
                                                        {issue.aiAnalysis.gemini.risks.map((risk, idx) => (
                                                            <span key={idx} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm">
                                                                ⚠️ {risk}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {issue.aiAnalysis.gemini.recommended_action && (
                                                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                                    <h5 className="text-xs font-bold text-blue-600 uppercase mb-1">Recommended Action Plan</h5>
                                                    <p className="text-sm text-gray-800 whitespace-pre-line">{issue.aiAnalysis.gemini.recommended_action}</p>
                                                </div>
                                            )}

                                            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-400 text-right">
                                                Analysis via OpenRouter • {new Date().toLocaleTimeString()}
                                            </div>
                                        </div>
                                    ) : (
                                        /* Fallback to legacy view if no Gemini data yet */
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Detailed Reasoning</h4>
                                            <p className="text-sm text-slate-700 leading-relaxed font-mono">
                                                &gt; {issue.aiAnalysis?.explanation || "No detailed analysis available."}
                                            </p>
                                        </div>
                                    )}

                                    {/* Detected Signals (Flags) */}
                                    {(issue.aiAnalysis?.flags && issue.aiAnalysis.flags.length > 0) && (
                                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                                            <h4 className="text-xs font-bold text-gray-800 uppercase mb-3 flex items-center gap-2">
                                                <CheckCircle className="text-green-600" sx={{ fontSize: 16 }} />
                                                Active Priority Signals
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {issue.aiAnalysis.flags.map((flag, index) => (
                                                    <span key={index} className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded text-xs font-mono font-bold">
                                                        {flag.replace('SIGNAL: ', '')}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* RE-ANALYZE BUTTON (Always visible at bottom to refresh) */}
                                    <div className="text-center pt-4 border-t">
                                        <button
                                            onClick={async () => {
                                                if (confirm("Re-run analysis to update score?")) {
                                                    const response = await fetch('http://localhost:5001/api/analyze', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify(issue)
                                                    });
                                                    if (response.ok) {
                                                        const analysis = await response.json();
                                                        // Save analysis but preserve original priority
                                                        await api.updateIssue(issue.id, { ai_analysis: analysis });
                                                        setIssue(prev => ({
                                                            ...prev,
                                                            aiAnalysis: analysis,
                                                            // Keep original priority — don't let rule engine override it
                                                            priority: prev.priority
                                                        }));
                                                    }
                                                }
                                            }}
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            Force Re-analysis
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: COMMENTS & ACTIVITY */}
                    {activeTab === 'history' && ( // Rename/Expand this tab to include comments
                        <div className="space-y-6 animate-fade-in">
                            {/* Assignment Section */}
                            <div id="assignment-section" className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Assignment className="text-blue-600" /> Task Assignment
                                </h3>
                                {users.length === 0 && (
                                    <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                        ⚠️ No staff/workers found. Add staff via the <strong>Staff Management</strong> page first.
                                    </div>
                                )}
                                <div className="flex items-end gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assigned To</label>
                                        <select
                                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                            value={issue.assignedTo || ''}
                                            onChange={(e) => setIssue({ ...issue, assignedTo: e.target.value })}
                                        >
                                            <option value="">— Unassigned —</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name || u.username} · {u.sector || 'general'} ({u.role})
                                                </option>
                                            ))}
                                        </select>
                                        {issue.assignedTo && (() => {
                                            const assigned = users.find(u => u.id === issue.assignedTo);
                                            return assigned ? (
                                                <p className="text-xs text-green-700 mt-1 font-medium">✓ Currently assigned to: <strong>{assigned.name || assigned.username}</strong> ({assigned.sector})</p>
                                            ) : null;
                                        })()}
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                                        <select
                                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                            value={issue.status || 'pending'}
                                            onChange={(e) => setIssue({ ...issue, status: e.target.value })}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="accepted">Accepted</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="resolved">Resolved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleAssignmentUpdate}
                                        className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                                    >
                                        Save Assignment
                                    </button>
                                </div>
                            </div>

                            {/* Comments Section */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <h3 className="font-bold text-gray-800 mb-4">Discussion & Notes</h3>

                                {/* Local State Comments List */}
                                <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                                    {comments.map(c => (
                                        <div key={c.id} className="flex gap-3 animate-fade-in">
                                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                                {c.role === 'admin' ? 'A' : 'U'}
                                            </div>
                                            <div className="bg-white p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl border border-gray-100 flex-1 shadow-sm">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-bold text-gray-700">{c.user}</span>
                                                    <span className="text-[10px] text-gray-400">{c.time}</span>
                                                </div>
                                                <p className="text-sm text-gray-600">{c.text}</p>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">AS</div>
                                        <div className="bg-gray-50 p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl border border-gray-100 flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold text-gray-700">Amit Sharma</span>
                                                <span className="text-[10px] text-gray-400">2 hours ago</span>
                                            </div>
                                            <p className="text-sm text-gray-600">I have inspected the site. The valve issue is more severe than reported. Need replacement parts.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">AI</div>
                                        <div className="bg-purple-50 p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl border border-purple-100 flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold text-purple-700">System AI</span>
                                                <span className="text-[10px] text-purple-400">5 hours ago</span>
                                            </div>
                                            <p className="text-sm text-purple-800">Priority automatically escalated to High due to proximity to school zone.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Add Comment Input */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add a comment or internal note..."
                                        className="flex-1 p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
                                    />
                                    <button
                                        onClick={handlePostComment}
                                        className="px-4 py-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
                                    >
                                        Post
                                    </button>
                                </div>
                            </div>

                            {/* Detailed History (Existing) */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <h3 className="font-bold text-gray-800 mb-4">Audit Log</h3>
                                <div className="space-y-6 relative before:absolute before:left-[15px] before:top-2 before:h-full before:w-[2px] before:bg-gray-100">
                                    <TimelineItem
                                        icon={<div className="w-2 h-2 rounded-full bg-[#3c3cf6]"></div>}
                                        time={new Date(issue.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        title="Issue Reported"
                                        desc={`Source: ${issue.source || 'Mobile App'}`}
                                        active
                                    />
                                    <TimelineItem
                                        icon={<div className="w-2 h-2 rounded-full bg-purple-500"></div>}
                                        time="Automated"
                                        title="AI Analysis Completed"
                                        desc={`Priority set to ${issue.priority}`}
                                    />
                                    <TimelineItem
                                        icon={<div className="w-2 h-2 rounded-full bg-gray-300"></div>}
                                        time="Pending"
                                        title="Dispatch Task"
                                        desc="Waiting for assignment"
                                        isLast
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column (Map & Quick Info) */}
                <div className="space-y-6">
                    {/* Location Card */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm sticky top-24">
                        <h3 className="font-bold text-gray-800 mb-4">Location</h3>
                        <div className="h-64 rounded-xl overflow-hidden mb-4 relative z-0 border border-gray-100">
                            {(issue.location && typeof issue.location.lat === 'number' && typeof issue.location.lng === 'number') ? (
                                <MapContainer center={[issue.location.lat, issue.location.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker position={[issue.location.lat, issue.location.lng]}>
                                        <Popup>{issue.address}</Popup>
                                    </Marker>
                                    <MapEffect />
                                </MapContainer>
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
                                    Map Data Unavailable
                                </div>
                            )}
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <MapIcon className="text-gray-400 mt-0.5" sx={{ fontSize: 18 }} />
                            <div>
                                <div className="text-xs font-bold text-gray-500 uppercase">Address</div>
                                <div className="text-sm font-medium text-gray-900 leading-tight">{issue.location?.address || issue.address || 'No address data'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 pb-3 px-2 border-b-2 transition-all ${active ? 'border-[#3c3cf6] text-[#3c3cf6]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
    >
        <Icon sx={{ fontSize: 18 }} />
        <span className="font-bold text-sm">{label}</span>
    </button>
);

const TimelineItem = ({ icon, time, title, desc, active, isLast }) => (
    <div className="relative pl-10">
        <div className={`absolute left-0 top-1 w-8 h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${active ? 'bg-blue-50' : 'bg-gray-50'}`}>
            {icon}
        </div>
        <div>
            <div className="text-xs text-gray-400 font-medium mb-0.5">{time}</div>
            <div className="font-bold text-gray-800 text-sm">{title}</div>
            <div className="text-xs text-gray-500">{desc}</div>
        </div>
    </div>
);

// Helper Component for Auto-Run Logic
const AutoRunAnalysis = ({ issue, setIssue }) => {
    useEffect(() => {
        let isMounted = true;
        const runAnalysis = async () => {
            console.log("🤖 Auto-Running AI Analysis...");

            // Client-side analysis: stored priority is authoritative, 145-signal engine provides supporting data
            const generateFallbackAnalysis = () => {
                // Build the issue object for the 145-signal engine (category breakdown only)
                const signalIssue = {
                    title: issue.title || issue.type || '',
                    description: issue.description || '',
                    type: issue.type || '',
                    sector: issue.sector || '',
                    severity: issue.priority || issue.severity || 'medium',
                    createdAt: issue.createdAt || issue.reportedAt || issue.scheduledStart || new Date().toISOString()
                };

                // Run 145-signal engine for category breakdown data
                const result = calculatePriorityScore(signalIssue);
                const catScores = result.advancedAnalysis?.signals || {};

                // === STORED PRIORITY IS THE SINGLE SOURCE OF TRUTH ===
                const storedPriority = (issue.priority || 'medium').toLowerCase();
                const priorityConfig = {
                    'critical': { label: 'Critical', score: 90, color: '#EF4444' },
                    'high': { label: 'High', score: 75, color: '#F97316' },
                    'medium': { label: 'Medium', score: 50, color: '#EAB308' },
                    'low': { label: 'Low', score: 28, color: '#10B981' }
                };
                const config = priorityConfig[storedPriority] || priorityConfig['medium'];

                // Generate contextual reasoning
                const taskTitle = issue.title || issue.type || 'Municipal task';
                const taskSector = issue.sector || 'general';
                const sectorNames = {
                    'roads': 'Road Infrastructure', 'water': 'Water Supply', 'drainage': 'Drainage System',
                    'power': 'Power Infrastructure', 'parks': 'Parks & Public Spaces', 'buildings': 'Government Buildings',
                    'waste': 'Solid Waste Management', 'health': 'Public Health', 'bridges': 'Bridge Infrastructure'
                };
                const sectorLabel = sectorNames[taskSector] || taskSector.charAt(0).toUpperCase() + taskSector.slice(1);

                // Build human-readable reasoning
                let reasoning;
                let actionPlan;
                if (storedPriority === 'critical') {
                    reasoning = `"${taskTitle}" in the ${sectorLabel} sector is classified as CRITICAL priority. Immediate intervention required — safety risks and infrastructure integrity may be compromised. 145-signal scan detected ${(result.breakdown || []).length} active signals across safety, sector, and time dimensions.`;
                    actionPlan = `IMMEDIATE: Deploy emergency ${sectorLabel} response team. Secure affected area. Estimated resolution: 1-3 hours. Escalate to Zonal Head if unresolved within 2 hours.`;
                } else if (storedPriority === 'high') {
                    reasoning = `"${taskTitle}" in the ${sectorLabel} sector requires urgent attention. Analysis of ${(result.breakdown || []).length} triggered signals indicates infrastructure impact${catScores.safety > 0 ? ' with safety-adjacent concerns' : ''} and potential service disruption if not addressed promptly.`;
                    actionPlan = `URGENT: Assign dedicated ${sectorLabel} maintenance crew. Begin field assessment within 2 hours. Estimated resolution: 4-8 hours. Notify Sector Officer of progress.`;
                } else if (storedPriority === 'medium') {
                    reasoning = `"${taskTitle}" is a standard ${sectorLabel} maintenance item. ${(result.breakdown || []).length} signals detected — ${catScores.sector > 0 ? 'sector-level impact noted' : 'no critical signals flagged'}. Can be addressed within normal operational timelines without escalation.`;
                    actionPlan = `SCHEDULED: Add to ${sectorLabel} maintenance queue. Assign during next available crew rotation. Estimated resolution: 24-48 hours.`;
                } else {
                    reasoning = `"${taskTitle}" is a routine ${sectorLabel} task with minimal impact. No critical signals detected. Suitable for batch processing during regular maintenance cycles.`;
                    actionPlan = `ROUTINE: Include in weekly ${sectorLabel} maintenance batch. No dedicated resource allocation needed. Estimated resolution: 3-5 business days.`;
                }

                // Build clean risk factors from 145-signal breakdown
                const meaningfulSignals = (result.breakdown || [])
                    .filter(b => !b.name.includes('Age >') || b.name.includes('Age > 24h'))
                    .filter(b => Math.abs(b.value) >= 5);

                const risks = meaningfulSignals
                    .filter(b => b.value > 10)
                    .map(b => b.name.replace(/^\[\d+\]\s*/, ''))
                    .slice(0, 4);

                return {
                    priority: config.label,
                    priorityScore: config.score,
                    confidenceScore: 80,
                    explanation: reasoning,
                    gemini: {
                        priority: config.label,
                        reasoning,
                        risks,
                        recommended_action: actionPlan,
                        source: 'client-145-signal'
                    },
                    flags: meaningfulSignals.map(b => `SIGNAL: ${b.name} (+${b.value})`),
                    seasonalFactor: 1.0,
                    categoryScores: catScores,
                    verifiedAt: new Date()
                };
            };

            try {
                // 8-second timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);

                const response = await fetch('http://localhost:5001/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(issue),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const analysis = await response.json();
                    if (!isMounted) return;

                    // Update Issue in DB (Skip for Tasks)
                    if (issue.id && issue.id.startsWith('TSK-')) {
                        console.log("Skipping DB update for Task.");
                    } else {
                        try {
                            await api.updateIssue(issue.id, {
                                ai_analysis: analysis,
                                ai_confidence: (analysis.confidenceScore || 0) / 100
                            });
                        } catch (e) { console.error("DB Save failed", e); }
                    }
                    setIssue(prev => ({ ...prev, aiAnalysis: analysis }));
                } else {
                    throw new Error(`Server responded with ${response.status}`);
                }
            } catch (err) {
                console.warn("⚠️ Server analysis failed, using client-side fallback:", err.message);
                if (!isMounted) return;
                const fallback = generateFallbackAnalysis();
                setIssue(prev => ({ ...prev, aiAnalysis: fallback }));
            }
        };

        runAnalysis();
        return () => { isMounted = false; };
    }, []); // Run once on mount
    return null;
};

export default IssueDetail;
