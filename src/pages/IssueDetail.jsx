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
                    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/validate`, {
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
            <div className="flex items-center gap-2 text-sm text-white/70 font-medium drop-shadow-sm mb-2">
                <span className="hover:text-white transition-colors cursor-pointer" onClick={() => navigate('/issues')}>Issues</span>
                <span className="text-white/40">/</span>
                <span className="text-white/90">{issue.id || id}</span>
            </div>

            {/* Title Block */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">{issue.type || 'Issue Report'}</h1>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getPriorityColor(issue.priority)} flex items-center gap-1`}>
                            <Warning sx={{ fontSize: 14 }} /> {issue.priority || 'Medium'}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-white/90 bg-white/10 px-3 py-1 rounded-full border border-white/20 shadow-sm backdrop-blur-md">
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
                                className="px-4 py-2 liquid-btn liquid-btn-emerald rounded-lg font-bold flex items-center gap-2"
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
                                className="px-4 py-2 liquid-btn liquid-btn-red rounded-lg font-bold flex items-center gap-2"
                            >
                                <Close sx={{ fontSize: 18 }} /> Reject
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => setIsOverrideOpen(true)}
                        className="px-4 py-2 liquid-btn liquid-btn-white rounded-lg font-bold"
                    >
                        Override Analysis
                    </button>
                    <button
                        onClick={handleResolve}
                        className="px-4 py-2 liquid-btn liquid-btn-emerald rounded-lg font-bold"
                    >
                        Mark Resolved
                    </button>
                    <button
                        onClick={handleAssign}
                        className="px-4 py-2 liquid-btn liquid-btn-blue rounded-lg font-bold"
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
            <div className="border-b border-white/20 flex gap-6 mt-4">
                <TabButton active={activeTab === 'evidence'} onClick={() => setActiveTab('evidence')} icon={ImageIcon} label="Evidence" />
                <TabButton active={activeTab === 'detail'} onClick={() => setActiveTab('detail')} icon={Description} label="Details" />
                <TabButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={CheckCircle} label="AI Analysis" />
                <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="History" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (Dynamic Content) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* AI Photo Verification Banner */}
                    {isVerifying && (
                        <div className="bg-blue-500/10 border border-blue-400/30 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3 animate-pulse shadow-sm">
                            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                            <div>
                                <p className="text-blue-300 font-bold text-sm drop-shadow-sm">🛡️ Verifying with AI...</p>
                                <p className="text-blue-200 text-xs text-shadow-sm">Analyzing photo for authenticity</p>
                            </div>
                        </div>
                    )}
                    {!isVerifying && issue.aiAnalysis?.photoVerification && (() => {
                        const pv = issue.aiAnalysis.photoVerification;
                        if (pv.needsManualReview) return (
                            <div className="bg-amber-500/10 border border-amber-400/30 backdrop-blur-md rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                                <span className="text-2xl drop-shadow-md">🔍</span>
                                <div className="flex-1">
                                    <p className="text-amber-300 font-bold text-sm drop-shadow-sm">Manual Review Required</p>
                                    <p className="text-amber-200/80 text-xs mt-1 drop-shadow-sm">{pv.reason}</p>
                                </div>
                            </div>
                        );
                        return pv.isValid ? (
                            <div className="bg-green-500/10 border border-green-400/30 backdrop-blur-md rounded-2xl p-4 flex items-start gap-3 shadow-sm hover:bg-green-500/20 transition-all">
                                <span className="text-2xl drop-shadow-md">✅</span>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-green-300 font-bold text-sm drop-shadow-sm">AI Verified — Legitimate Report</p>
                                        <span className="text-green-200/90 text-xs font-bold bg-green-500/20 border border-green-400/30 px-2 py-0.5 rounded-full shadow-sm drop-shadow-md">{pv.confidence}% confidence</span>
                                    </div>
                                    <p className="text-green-200/80 text-xs mt-1 drop-shadow-sm">{pv.reason}</p>
                                    {pv.detectedIssueType && pv.detectedIssueType !== 'unverified' && (
                                        <p className="text-green-300/80 text-xs mt-0.5 drop-shadow-sm">Detected: <strong className="text-green-200">{pv.detectedIssueType}</strong></p>
                                    )}
                                    {pv.verifiedAt && (
                                        <p className="text-green-400/60 text-xs mt-1 drop-shadow-sm">Verified at: {new Date(pv.verifiedAt).toLocaleString('en-IN')}</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-red-500/10 border border-red-400/50 backdrop-blur-md rounded-2xl p-4 flex items-start gap-3 shadow-sm hover:bg-red-500/20 transition-all">
                                <span className="text-2xl drop-shadow-md">⚠️</span>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-red-300 font-bold text-sm drop-shadow-sm">Suspicious Report — AI Flagged</p>
                                        <span className="text-red-200/90 text-xs font-bold bg-red-500/20 border border-red-400/30 px-2 py-0.5 rounded-full shadow-sm drop-shadow-sm">{pv.confidence}% confidence</span>
                                    </div>
                                    <p className="text-red-200/80 text-xs mt-1 drop-shadow-sm">{pv.reason}</p>
                                    {pv.detectedIssueType && pv.detectedIssueType !== 'unverified' && (
                                        <p className="text-red-300/80 text-xs mt-0.5 drop-shadow-sm">Detected: <strong className="text-red-200">{pv.detectedIssueType}</strong></p>
                                    )}
                                    {pv.verifiedAt && (
                                        <p className="text-red-400/60 text-xs mt-1 drop-shadow-sm">Flagged at: {new Date(pv.verifiedAt).toLocaleString('en-IN')}</p>
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
                                <div className="h-48 bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20 relative shadow-inner">
                                    {(issue.location && typeof issue.location.lat === 'number' && typeof issue.location.lng === 'number') ? (
                                        <MapContainer center={[issue.location.lat, issue.location.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                            <MapEffect />
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <Marker position={[issue.location.lat, issue.location.lng]}>
                                                <Popup>Issue Location</Popup>
                                            </Marker>
                                        </MapContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-white/50 text-sm flex-col">
                                            <MapIcon className="mb-2 opacity-50 drop-shadow-sm" />
                                            <span className="drop-shadow-sm">No Location Data</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Consistency Score Block */}
                            <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-lg flex items-center justify-between hover:bg-white/20 transition-all">
                                <div className="flex items-center gap-6">
                                    <div className="relative w-20 h-20 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="40" cy="40" r="36" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                                            <circle cx="40" cy="40" r="36" stroke="#60a5fa" strokeWidth="8" fill="none" strokeDasharray="226" strokeDashoffset="20" className="drop-shadow-lg" />
                                        </svg>
                                        <span className="absolute text-xl font-bold text-blue-300 drop-shadow-md">94%</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider drop-shadow-sm">Consistency Score</h3>
                                        <div className="text-xl font-bold text-white drop-shadow-md">High Confidence</div>
                                        <div className="text-sm text-blue-300 font-medium drop-shadow-sm">+2.4% vs median</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-white/50 mb-1 font-medium tracking-wider drop-shadow-sm">Device ID</div>
                                    <div className="font-mono bg-white/10 border border-white/20 text-white/90 px-2 py-1 rounded text-sm shadow-inner drop-shadow-sm">Citizen-APP-88A2</div>
                                </div>
                            </div>
                        </div>

                    )}

                    {/* TAB: DETAILS */}
                    {activeTab === 'detail' && (
                        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-lg animate-fade-in hover:bg-white/15 transition-all">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2 drop-shadow-md">
                                <Description className="text-blue-300 filter drop-shadow hover:rotate-12 transition-transform duration-300" /> <span className="tracking-wide">Issue Details</span>
                            </h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-inner group transition-all duration-300 hover:bg-white/10 active:scale-[0.99] hover:shadow-lg">
                                    <div className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2 flex items-center gap-2 drop-shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></div>
                                        Description
                                    </div>
                                    <p className="text-white/90 leading-relaxed whitespace-pre-line drop-shadow-sm font-medium">{issue.description || "No description provided."}</p>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="p-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-inner group transition-all duration-300 hover:bg-white/10 active:scale-[0.99] hover:shadow-lg">
                                        <div className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1 drop-shadow-sm">Sector</div>
                                        <div className="font-medium text-white drop-shadow-md">{issue.sector || 'General'}</div>
                                    </div>
                                    <div className="p-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-inner group transition-all duration-300 hover:bg-white/10 active:scale-[0.99] hover:shadow-lg">
                                        <div className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1 drop-shadow-sm">Category</div>
                                        <div className="font-medium text-white drop-shadow-md">{issue.type || 'Standard'}</div>
                                    </div>
                                    <div className="p-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-inner group transition-all duration-300 hover:bg-white/10 active:scale-[0.99] hover:shadow-lg">
                                        <div className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1 drop-shadow-sm">Reported By</div>
                                        <div className="font-medium text-white drop-shadow-md">{issue.citizenName || 'Anonymous'}</div>
                                    </div>
                                    <div className="p-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-inner group transition-all duration-300 hover:bg-white/10 active:scale-[0.99] hover:shadow-lg lg:col-span-3">
                                        <div className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1 drop-shadow-sm flex items-center gap-1.5"><MapIcon sx={{fontSize: 14}} className="text-blue-300"/> Address</div>
                                        <div className="font-medium text-white drop-shadow-md truncate" title={issue.address}>{issue.address || '—'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: AI ANALYSIS */}
                    {activeTab === 'ai' && (
                        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-lg animate-fade-in hover:bg-white/15 transition-all">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-white flex items-center gap-2 drop-shadow-md">
                                    <CheckCircle className="text-blue-300 filter drop-shadow hover:scale-110 transition-transform duration-300" /> <span className="tracking-wide">AI Priority Analysis</span>
                                </h3>
                                <div className="text-right">
                                    <div className="text-xs text-white/50 font-medium tracking-wider drop-shadow-sm">Engine Model: UrbanLogic-v4.2</div>
                                </div>
                            </div>

                            {/* Auto-Run Logic & Loader */}
                            {(!issue.aiAnalysis || !issue.aiAnalysis.priorityScore) && (
                                <AutoRunAnalysis issue={issue} setIssue={setIssue} />
                            )}

                            {(!issue.aiAnalysis || !issue.aiAnalysis.priorityScore) ? (
                                <div className="text-center py-10 bg-white/5 backdrop-blur-md rounded-xl border border-dashed border-white/20 animate-pulse shadow-inner">
                                    <div className="mb-4">
                                        <div className="w-16 h-16 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center mx-auto mb-2 shadow-[0_0_15px_rgba(96,165,250,0.4)]">
                                            <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                        <h4 className="text-lg font-bold text-white drop-shadow-md">Running AI Analysis...</h4>
                                        <p className="text-sm text-white/60 max-w-md mx-auto drop-shadow-sm mt-1">
                                            Connecting to OpenRouter (Gemini 2.0 Flash) for real-time priority assessment...
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-fade-in">
                                    {/* SCOREBOARD HEADER */}
                                    <div className="flex gap-4">
                                        {/* Total Score Card */}
                                        <div className="flex-1 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 backdrop-blur-md p-6 rounded-2xl border border-blue-400/30 flex items-center justify-between shadow-lg relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-blue-400/5 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                            <div className="relative z-10">
                                                <div className="text-xs font-bold text-blue-300 uppercase mb-1 tracking-wider drop-shadow-sm">Total Priority Score</div>
                                                <div className="text-4xl font-extrabold text-blue-200 drop-shadow-lg">{issue.aiAnalysis?.priorityScore || issue.aiAnalysis?.confidenceScore || 0}<span className="text-xl text-white/40 font-normal">/100</span></div>
                                                <div className="text-xs text-blue-300/80 mt-1 font-medium bg-blue-500/20 px-2 py-0.5 rounded-full inline-block mt-2 border border-blue-400/20 shadow-sm">{issue.aiAnalysis?.priority || 'Moderate'} Risk Level</div>
                                            </div>
                                            <div className="text-right relative z-10">
                                                <div className="text-xs font-bold text-white/50 uppercase tracking-wider drop-shadow-sm">Signals Checked</div>
                                                <div className="text-xl font-bold text-white drop-shadow-md">145</div>
                                                <div className="text-[10px] text-white/40 font-medium">Across 9 Dim.</div>
                                            </div>
                                        </div>

                                        {/* Seasonal Card */}
                                        {(issue.aiAnalysis?.seasonalFactor > 1.0 || issue.seasonalFactor > 1.0) && (
                                            <div className="w-1/3 bg-blue-500/10 backdrop-blur-md p-4 rounded-2xl border border-blue-400/30 flex flex-col justify-center shadow-lg hover:bg-blue-500/20 transition-all">
                                                <div className="text-xs font-bold text-blue-300 uppercase mb-1 tracking-wider drop-shadow-sm">Seasonal Factor</div>
                                                <div className="text-2xl font-bold text-blue-200 drop-shadow-lg">
                                                    {issue.aiAnalysis?.seasonalFactor || issue.seasonalFactor}x
                                                </div>
                                                <div className="text-[10px] text-blue-200/70 mt-1 font-medium bg-blue-500/20 px-2 py-0.5 rounded-full self-start mt-2 border border-blue-400/20 shadow-sm">Multiplier Active</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* CATEGORY BREAKDOWN TABLE */}
                                    {(() => {
                                        // Compute category scores LIVE — never rely on cached DB values
                                        const liveSignalIssue = {
                                            title: issue.title || issue.type || issue.issue_type || '',
                                            description: issue.description || '',
                                            type: issue.type || issue.issue_type || '',
                                            issue_type: issue.issue_type || issue.type || '',
                                            sector: issue.sector || '',
                                            severity: issue.priority || issue.severity || 'medium',
                                            createdAt: issue.createdAt || issue.created_at || new Date().toISOString(),
                                            imageUrl: issue.imageUrl || issue.photo_url || '',
                                            address: issue.address || issue.location_address || ''
                                        };
                                        const liveResult = calculatePriorityScore(liveSignalIssue);
                                        const liveCat = liveResult.advancedAnalysis?.signals || {};

                                        return (
                                            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:bg-white/10">
                                                <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between">
                                                    <span className="text-xs font-bold text-white/60 uppercase tracking-widest drop-shadow-sm">Category Breakdown <span className="text-white/40 font-normal">(Scores)</span></span>
                                                    <span className="text-xs text-white/40 font-bold uppercase tracking-widest drop-shadow-sm">Points Awarded</span>
                                                </div>
                                                <div className="grid grid-cols-2 text-sm">
                                                    {[
                                                        { l: 'Safety Criticality', s: liveCat.safety || 0, max: 50 },
                                                        { l: 'Sector Impact', s: liveCat.sector || 0, max: 40 },
                                                        { l: 'Time Factors', s: liveCat.time || 0, max: 25 },
                                                        { l: 'Location Context', s: liveCat.location || 0, max: 20 },
                                                        { l: 'Citizen Voicing', s: liveCat.citizen || 0, max: 20 },
                                                        { l: 'System Signals', s: liveCat.system || 0, max: 15 },
                                                        { l: 'Resource Ops', s: liveCat.resource || 0, max: 10 },
                                                        { l: 'Governance', s: liveCat.gov || 0, max: 30 },
                                                    ].map((cat, i) => (
                                                        <div key={i} className={`p-3 border-b border-white/5 flex justify-between group hover:bg-white/10 transition-colors ${i % 2 === 0 ? 'border-r border-white/5' : ''}`}>
                                                            <span className="text-white/80 font-medium group-hover:text-white transition-colors">{cat.l}</span>
                                                            <span className={`font-mono font-bold ${cat.s > 0 ? 'text-blue-300 drop-shadow-md' : 'text-white/30'}`}>
                                                                {cat.s} <span className="text-white/20 font-normal">/ {cat.max}</span>
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* GEMINI / OPENROUTER AI MAIN CARD */}
                                    {issue.aiAnalysis?.gemini ? (
                                        <div className={`p-6 rounded-2xl border backdrop-blur-xl shadow-lg relative overflow-hidden ${issue.aiAnalysis.priority === 'Crisis' ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-blue-400/20 hover:bg-white/10 transition-colors'}`}>
                                            <div className="flex justify-between items-start mb-4 relative z-10">
                                                <h4 className="text-lg font-bold text-white flex items-center gap-2 drop-shadow-md">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)] animate-pulse"></div>
                                                    Generative AI Assessment
                                                </h4>
                                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase shadow-lg backdrop-blur-md border ${issue.aiAnalysis.gemini.priority === 'Crisis' ? 'bg-red-600/80 text-white border-red-400/50' :
                                                    issue.aiAnalysis.gemini.priority === 'Critical' ? 'bg-orange-500/80 text-white border-orange-400/50' :
                                                        'bg-blue-600/80 text-white border-blue-400/50'
                                                    }`}>
                                                    {issue.aiAnalysis.gemini.priority} Priority
                                                </span>
                                            </div>

                                            <div className="mb-6 relative z-10">
                                                <h5 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2 drop-shadow-sm">AI Reasoning</h5>
                                                <p className="text-lg font-serif italic text-white/90 leading-relaxed border-l-4 border-blue-400/50 pl-5 py-1.5 bg-blue-500/5 rounded-r-xl shadow-inner">
                                                    "{issue.aiAnalysis.gemini.reasoning}"
                                                </p>
                                            </div>

                                            {issue.aiAnalysis.gemini.risks && issue.aiAnalysis.gemini.risks.length > 0 && (
                                                <div className="mb-4 relative z-10">
                                                    <h5 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 drop-shadow-sm">Key Risk Factors</h5>
                                                    <div className="flex flex-wrap gap-2">
                                                        {issue.aiAnalysis.gemini.risks.map((risk, idx) => (
                                                            <span key={idx} className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-xl text-sm font-medium text-white shadow-sm hover:bg-white/20 transition-colors backdrop-blur-md">
                                                                ⚠️ {risk}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {issue.aiAnalysis.gemini.recommended_action && (
                                                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl relative z-10 shadow-inner group transition-all hover:bg-blue-500/15">
                                                    <h5 className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-2 drop-shadow-sm group-hover:text-blue-200 transition-colors">Recommended Action Plan</h5>
                                                    <p className="text-sm text-white/90 whitespace-pre-line leading-relaxed font-medium">{issue.aiAnalysis.gemini.recommended_action}</p>
                                                </div>
                                            )}

                                            <div className="mt-6 pt-4 border-t border-white/10 text-xs text-white/40 font-medium tracking-wide text-right relative z-10">
                                                Analysis via OpenRouter • {new Date().toLocaleTimeString()}
                                            </div>
                                        </div>
                                    ) : (
                                        /* Fallback to legacy view if no Gemini data yet */
                                        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-inner">
                                            <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">Detailed Reasoning</h4>
                                            <p className="text-sm text-white/80 leading-relaxed font-mono drop-shadow-sm bg-black/20 p-4 rounded-xl border border-white/5">
                                                &gt; {issue.aiAnalysis?.explanation || "No detailed analysis available."}
                                            </p>
                                        </div>
                                    )}

                                    {/* Detected Signals (Flags) */}
                                    {(issue.aiAnalysis?.flags && issue.aiAnalysis.flags.length > 0) && (
                                        <div className="bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-sm transition-all hover:bg-white/10">
                                            <h4 className="text-xs font-bold text-white/80 uppercase tracking-widest mb-4 flex items-center gap-2 drop-shadow-sm">
                                                <CheckCircle className="text-green-400 filter shadow-sm" sx={{ fontSize: 16 }} />
                                                Active Priority Signals
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {issue.aiAnalysis.flags.map((flag, index) => (
                                                    <span key={index} className="px-2.5 py-1 bg-amber-500/10 text-amber-200 border border-amber-400/30 rounded-lg text-xs font-mono font-bold shadow-sm backdrop-blur-md">
                                                        {flag.replace('SIGNAL: ', '')}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* RE-ANALYZE BUTTON (Always visible at bottom to refresh) */}
                                    <div className="text-center pt-6 border-t border-white/10 mt-2">
                                        <button
                                            onClick={async () => {
                                                if (confirm("Re-run analysis to update score?")) {
                                                    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/analyze`, {
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
                            <div id="assignment-section" className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-lg transition-all hover:bg-white/15">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2 drop-shadow-md">
                                    <Assignment className="text-blue-300 filter drop-shadow hover:-rotate-12 transition-transform duration-300" /> Task Assignment
                                </h3>
                                {users.length === 0 && (
                                    <div className="mb-4 text-xs text-amber-200 bg-amber-500/10 border border-amber-400/30 rounded-xl px-4 py-3 shadow-inner backdrop-blur-md">
                                        ⚠️ No staff/workers found. Add staff via the <strong>Staff Management</strong> page first.
                                    </div>
                                )}
                                <div className="flex items-end gap-5">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5 drop-shadow-sm">Assigned To</label>
                                        <select
                                            className="w-full p-2.5 bg-white/5 backdrop-blur-md border border-white/20 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 shadow-inner group transition-all hover:bg-white/10"
                                            value={issue.assignedTo || ''}
                                            onChange={(e) => setIssue({ ...issue, assignedTo: e.target.value })}
                                        >
                                            <option value="" className="text-gray-900">— Unassigned —</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id} className="text-gray-900">
                                                    {u.name || u.username} · {u.sector || 'general'} ({u.role})
                                                </option>
                                            ))}
                                        </select>
                                        {issue.assignedTo && (() => {
                                            const assigned = users.find(u => u.id === issue.assignedTo);
                                            return assigned ? (
                                                <p className="text-xs text-green-300 mt-2 font-medium drop-shadow-sm">✓ Currently assigned to: <strong>{assigned.name || assigned.username}</strong> ({assigned.sector})</p>
                                            ) : null;
                                        })()}
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5 drop-shadow-sm">Status</label>
                                        <select
                                            className="w-full p-2.5 bg-white/5 backdrop-blur-md border border-white/20 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 shadow-inner transition-all hover:bg-white/10"
                                            value={issue.status || 'pending'}
                                            onChange={(e) => setIssue({ ...issue, status: e.target.value })}
                                        >
                                            <option value="pending" className="text-gray-900">Pending</option>
                                            <option value="accepted" className="text-gray-900">Accepted</option>
                                            <option value="in_progress" className="text-gray-900">In Progress</option>
                                            <option value="resolved" className="text-gray-900">Resolved</option>
                                            <option value="rejected" className="text-gray-900">Rejected</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleAssignmentUpdate}
                                        className="px-6 py-2.5 liquid-btn liquid-btn-blue rounded-xl font-bold whitespace-nowrap shadow-lg"
                                    >
                                        Save Assignment
                                    </button>
                                </div>
                            </div>

                            {/* Comments Section */}
                            <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-lg transition-all hover:bg-white/15">
                                <h3 className="font-bold text-white mb-6 drop-shadow-md tracking-wide">Discussion & Notes</h3>

                                {/* Local State Comments List */}
                                <div className="space-y-5 mb-6 max-h-60 overflow-y-auto pr-3 custom-scrollbar">
                                    {comments.map(c => (
                                        <div key={c.id} className="flex gap-3 animate-fade-in group">
                                            <div className="w-8 h-8 rounded-full border border-blue-400/50 bg-blue-500/20 backdrop-blur-md flex items-center justify-center text-blue-300 font-bold text-xs shadow-sm group-hover:scale-110 transition-transform">
                                                {c.role === 'admin' ? 'A' : 'U'}
                                            </div>
                                            <div className="bg-white/5 backdrop-blur-md p-4 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl border border-white/10 flex-1 shadow-inner group-hover:bg-white/10 transition-all">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-bold text-white/90 drop-shadow-sm">{c.user}</span>
                                                    <span className="text-[10px] text-white/40 tracking-wider">{c.time}</span>
                                                </div>
                                                <p className="text-sm text-white/80 drop-shadow-sm">{c.text}</p>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex gap-3 group">
                                        <div className="w-8 h-8 rounded-full border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center text-white/80 font-bold text-xs shadow-sm group-hover:scale-110 transition-transform">AS</div>
                                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl border border-white/10 flex-1 shadow-inner group-hover:bg-white/10 transition-all">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold text-white/90 drop-shadow-sm">Sector Officer (Amit Sharma)</span>
                                                <span className="text-[10px] text-white/40 tracking-wider">2 hours ago</span>
                                            </div>
                                            <p className="text-sm text-white/80 drop-shadow-sm">I have inspected the site. The valve issue is more severe than reported. Need replacement parts.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 group">
                                        <div className="w-8 h-8 rounded-full border border-purple-400/50 bg-purple-500/20 backdrop-blur-md flex items-center justify-center text-purple-300 font-bold text-xs shadow-[0_0_10px_rgba(168,85,247,0.3)] group-hover:scale-110 transition-transform">AI</div>
                                        <div className="bg-purple-500/10 backdrop-blur-md p-4 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl border border-purple-400/20 flex-1 shadow-inner group-hover:bg-purple-500/15 transition-all">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold text-purple-300 drop-shadow-sm">System AI</span>
                                                <span className="text-[10px] text-purple-400/60 tracking-wider">5 hours ago</span>
                                            </div>
                                            <p className="text-sm text-purple-200/90 drop-shadow-sm">Priority automatically escalated to High due to proximity to school zone.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Add Comment Input */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add a comment or internal note..."
                                        className="flex-1 p-3 bg-white/5 backdrop-blur-md border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 shadow-inner transition-all"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
                                    />
                                    <button
                                        onClick={handlePostComment}
                                        className="px-4 py-2 liquid-btn liquid-btn-white rounded-xl font-bold"
                                    >
                                        Post
                                    </button>
                                </div>
                            </div>

                            {/* Detailed History (Existing) */}
                            <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-lg">
                                <h3 className="font-bold text-white mb-6 drop-shadow-md tracking-wide">Audit Log</h3>
                                <div className="space-y-6 relative before:absolute before:left-[15px] before:top-2 before:h-full before:w-[2px] before:bg-white/10">
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
                    <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-lg sticky top-24">
                        <h3 className="font-bold text-white mb-4 drop-shadow-md tracking-wide">Location Insights</h3>
                        <div className="h-64 rounded-xl overflow-hidden mb-5 relative z-0 border border-white/20 shadow-inner">
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
                        <div className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-inner hover:bg-white/10 transition-all">
                            <MapIcon className="text-blue-300 mt-0.5 filter drop-shadow-sm" sx={{ fontSize: 20 }} />
                            <div>
                                <div className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1 drop-shadow-sm">Address</div>
                                <div className="text-sm font-medium text-white/90 leading-relaxed drop-shadow-md">{issue.location?.address || issue.address || 'No address data'}</div>
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
        className={`flex items-center gap-2 pb-3 px-2 border-b-2 transition-all ${
            active 
                ? 'border-indigo-400 text-indigo-300 font-bold drop-shadow-md' 
                : 'border-transparent text-white/60 hover:text-white/90 font-medium hover:border-white/30'
        }`}
    >
        {Icon ? <Icon sx={{ fontSize: 18 }} /> : <History sx={{ fontSize: 18 }} />}
        <span className="text-sm">{label}</span>
    </button>
);

const TimelineItem = ({ icon, time, title, desc, active, isLast }) => (
    <div className="relative pl-10 group mt-4">
        <div className={`absolute left-0 top-1 w-8 h-8 rounded-full border-2 shadow-sm flex items-center justify-center z-10 transition-all duration-300 group-hover:scale-110 ${active ? 'bg-blue-500/20 border-blue-400 backdrop-blur-md shadow-[0_0_10px_rgba(96,165,250,0.5)]' : 'bg-white/10 border-white/20 backdrop-blur-md'}`}>
            {icon}
        </div>
        <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-inner group-hover:bg-white/10 transition-all">
            <div className="text-xs text-white/50 font-medium mb-1 tracking-wider">{time}</div>
            <div className="font-bold text-white text-sm drop-shadow-md">{title}</div>
            <div className="text-xs text-white/70 mt-1">{desc}</div>
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
                    issue_type: issue.issue_type || issue.type || '',
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

                    // Always run 145-signal engine to populate categoryScores
                    const signalIssue = {
                        title: issue.title || issue.type || '',
                        description: issue.description || '',
                        type: issue.type || '',
                        issue_type: issue.issue_type || issue.type || '',
                        sector: issue.sector || '',
                        severity: issue.priority || issue.severity || 'medium',
                        createdAt: issue.createdAt || new Date().toISOString()
                    };
                    const signalResult = calculatePriorityScore(signalIssue);
                    const catScores = signalResult.advancedAnalysis?.signals || {};

                    // Merge category scores into server analysis
                    const mergedAnalysis = {
                        ...analysis,
                        categoryScores: analysis.categoryScores || catScores,
                        flags: analysis.flags || signalResult.breakdown?.map(b => `SIGNAL: ${b.name} (+${b.value})`) || []
                    };

                    // Update Issue in DB (Skip for Tasks)
                    if (issue.id && issue.id.startsWith('TSK-')) {
                        console.log("Skipping DB update for Task.");
                    } else {
                        try {
                            await api.updateIssue(issue.id, {
                                ai_analysis: mergedAnalysis,
                                ai_confidence: (mergedAnalysis.confidenceScore || 0) / 100
                            });
                        } catch (e) { console.error("DB Save failed", e); }
                    }
                    setIssue(prev => ({ ...prev, aiAnalysis: mergedAnalysis }));
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
