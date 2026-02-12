import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/apiClient';
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
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
    const [activeTab, setActiveTab] = useState('detail'); // evidence, detail, ai, history

    useEffect(() => {
        loadIssue();
    }, [id]);

    const loadIssue = async () => {
        try {
            setLoading(true);
            const data = await api.getIssueById(id);
            setIssue(data);
        } catch (error) {
            console.error("Failed to load issue", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading issue details...</div>;
    if (!issue) return <div className="p-10 text-center text-red-500">Issue not found</div>;

    const getPriorityColor = (p) => {
        switch (p?.toLowerCase()) {
            case 'critical': return 'bg-red-100 text-red-700 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
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
                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 shadow-sm transition-all">
                        Override Analysis
                    </button>
                    <button className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 font-bold rounded-lg hover:bg-green-100 shadow-sm transition-all">
                        Mark Resolved
                    </button>
                    <button className="px-4 py-2 bg-[#3c3cf6] text-white font-bold rounded-lg hover:bg-[#2a2abf] shadow-lg shadow-indigo-500/30 transition-all">
                        Assign to Dept
                    </button>
                </div>
            </div>

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
                                    <div>TIME: {new Date(issue.createdAt).toTimeString()}</div>
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
                                        <div className="text-xl font-bold text-gray-900">High Confidence Report</div>
                                        <div className="text-sm text-green-600 font-medium">+2.4% vs median accuracy</div>
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
                            <h3 className="font-bold text-gray-800 mb-4">Issue Details</h3>
                            <div className="space-y-4">
                                <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                                    <Description className="text-gray-400 mt-1" />
                                    <div>
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Description</div>
                                        <p className="text-gray-700 leading-relaxed">{issue.description || "No description provided."}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Sector</div>
                                        <div className="font-medium text-gray-900">{issue.sector || 'General'}</div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">Category</div>
                                        <div className="font-medium text-gray-900">{issue.type || 'Standard'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: AI ANALYSIS */}
                    {activeTab === 'ai' && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><CheckCircle className="text-[#3c3cf6]" /> AI Priority Analysis</h3>
                                <span className="text-xs text-gray-400">Model: UrbanLogic-v4.2</span>
                            </div>

                            <div className="space-y-6">
                                {/* AI Explanation Block */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Analysis Reasoning</h4>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        {issue.aiAnalysis?.explanation || "No detailed analysis available for this issue."}
                                    </p>
                                </div>

                                {/* Safety Score */}
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-700">Life Safety Risk</span>
                                        <span className="text-sm font-bold text-gray-900">{issue.aiAnalysis?.riskFactors?.lifeSafety || 5}/10</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${(issue.aiAnalysis?.riskFactors?.lifeSafety || 5) > 7 ? 'bg-red-500' : 'bg-orange-400'}`}
                                            style={{ width: `${(issue.aiAnalysis?.riskFactors?.lifeSafety || 5) * 10}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Infrastructure Score */}
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-700">Infrastructure Impact</span>
                                        <span className="text-sm font-bold text-gray-900">{issue.aiAnalysis?.riskFactors?.infrastructure || 5}/10</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${(issue.aiAnalysis?.riskFactors?.infrastructure || 5) > 7 ? 'bg-[#3c3cf6]' : 'bg-blue-400'}`}
                                            style={{ width: `${(issue.aiAnalysis?.riskFactors?.infrastructure || 5) * 10}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Seasonal Factor */}
                                {(issue.aiAnalysis?.seasonalFactor > 1.0 || issue.seasonalFactor > 1.0) && (
                                    <div className="bg-[#f0f9ff] p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                                        <div className="text-2xl font-bold text-[#3c3cf6]">
                                            {issue.aiAnalysis?.seasonalFactor || issue.seasonalFactor}x
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-[#3c3cf6] text-sm uppercase">Seasonal Factor</h4>
                                            <p className="text-xs text-blue-800 mt-1">
                                                Priority multiplier applied due to current seasonal risks.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB: HISTORY */}
                    {activeTab === 'history' && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-fade-in">
                            <h3 className="font-bold text-gray-800 mb-4">Activity Log</h3>
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
                    )}
                </div>

                {/* Right Column (Map & Quick Info) */}
                <div className="space-y-6">
                    {/* Location Card */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm sticky top-24">
                        <h3 className="font-bold text-gray-800 mb-4">Location</h3>
                        <div className="h-64 rounded-xl overflow-hidden mb-4 relative z-0 border border-gray-100">
                            {issue.location && (
                                <MapContainer center={[issue.location.lat, issue.location.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker position={[issue.location.lat, issue.location.lng]}>
                                        <Popup>{issue.address}</Popup>
                                    </Marker>
                                </MapContainer>
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

export default IssueDetail;
