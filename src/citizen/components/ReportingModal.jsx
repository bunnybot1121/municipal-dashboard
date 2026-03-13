import React, { useState, useRef, useEffect } from 'react';
import { X, Trash2, Zap, Droplets, AlertTriangle, Check } from 'lucide-react';
import { api } from '../../services/apiClient';

const CATEGORIES = [
    { id: 'waste', label: 'Trash', icon: Trash2, color: 'alert-orange' },
    { id: 'roads', label: 'Pothole', icon: AlertTriangle, color: 'alert-red' },
    { id: 'lighting', label: 'Light', icon: Zap, color: 'alert-yellow' },
    { id: 'water', label: 'Water', icon: Droplets, color: 'alert-blue' }
];

const ReportingModal = ({ isOpen, onClose, location, address }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stream, setStream] = useState(null);

    // Camera Start/Stop Logic
    useEffect(() => {
        if (isOpen && !capturedImage) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen, capturedImage]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            setStream(mediaStream);
            if (videoRef.current) videoRef.current.srcObject = mediaStream;
        } catch (err) {
            console.error("Camera Error:", err);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        // Burn-In Metadata Overlay
        if (location) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
            ctx.fillStyle = 'white';
            ctx.font = '24px sans-serif';
            ctx.fillText(address || 'Unknown Location', 20, canvas.height - 40);
            ctx.font = '16px monospace';
            ctx.fillText(`${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`, 20, canvas.height - 15);
        }

        setCapturedImage(canvas.toDataURL('image/jpeg'));
    };

    const handleSubmit = async () => {
        if (!capturedImage || !selectedCategory) return;
        setIsSubmitting(true);

        try {
            const sectorLabel = CATEGORIES.find(c => c.id === selectedCategory)?.label || selectedCategory;
            const issueData = {
                title: `${sectorLabel} Issue - Citizen Report`,
                description: description || `${sectorLabel} issue reported by citizen`,
                sector: selectedCategory,
                severity: 'Moderate',
                photo: capturedImage,
                location: {
                    lat: location?.latitude ?? null,
                    lng: location?.longitude ?? null,
                    address: address || 'Unknown'
                },
                rawGps: location ? { lat: location.latitude, lng: location.longitude, accuracy: 10 } : null,
                createdAt: new Date().toISOString()
            };

            const response = await api.createIssue(issueData);

            if (response && response.id) {
                // Brief success then close
                setTimeout(() => {
                    setIsSubmitting(false);
                    setCapturedImage(null);
                    setSelectedCategory(null);
                    setDescription('');
                    onClose();
                }, 1000);
            } else {
                throw new Error("Failed to create issue");
            }
        } catch (error) {
            console.error('Submit error:', error);
            setIsSubmitting(false);
            alert('Failed to submit report. Please try again.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 z-modal flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <span className="text-white font-bold text-lg">New Report</span>
                <button onClick={onClose} className="bg-white/20 p-2 rounded-full text-white backdrop-blur-md">
                    <X size={24} />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative bg-black flex flex-col">

                {/* 1. Camera View */}
                <div className="flex-1 relative overflow-hidden bg-gray-900">
                    {!capturedImage ? (
                        <>
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            <div className="absolute inset-0 border-[30px] border-black/30 pointer-events-none"></div>
                            <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10">
                                <button
                                    onClick={handleCapture}
                                    className="w-20 h-20 rounded-full border-4 border-white bg-white/20 backdrop-blur shadow-lg flex items-center justify-center"
                                >
                                    <div className="w-16 h-16 bg-white rounded-full"></div>
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="relative w-full h-full">
                            <img src={capturedImage} className="w-full h-full object-cover" alt="Evidence" />
                            {!isSubmitting && (
                                <button
                                    onClick={() => setCapturedImage(null)}
                                    className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-800/80 text-white px-6 py-2 rounded-full font-bold backdrop-blur-md"
                                >
                                    Retake Photo
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* 2. Category + Submit (after capture) */}
                {capturedImage && (
                    <div className="bg-white rounded-t-3xl -mt-6 z-20 p-6 shadow-up animate-fade-in relative">
                        <h3 className="text-center font-bold text-gray-500 mb-4 tracking-wider text-xs uppercase">Select Category</h3>

                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    disabled={isSubmitting}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${selectedCategory === cat.id ? 'bg-orange-100 ring-2 ring-orange-500 scale-105' : 'bg-gray-50'} ${isSubmitting ? 'opacity-50' : ''}`}
                                >
                                    <div className={`p-3 rounded-full ${selectedCategory === cat.id ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 shadow-sm'}`}>
                                        <cat.icon size={24} />
                                    </div>
                                    <span className="text-xs font-bold text-gray-700">{cat.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Description */}
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the issue (optional)..."
                            maxLength={300}
                            rows={2}
                            disabled={isSubmitting}
                            className="w-full border border-gray-200 rounded-xl p-3 resize-none text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50"
                        />

                        {/* Submit Button */}
                        <button
                            disabled={!selectedCategory || isSubmitting}
                            onClick={handleSubmit}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all
                                ${!selectedCategory ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : isSubmitting ? 'bg-orange-400 text-white cursor-wait' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                        >
                            {isSubmitting ? '📤 Submitting...' : (
                                <><span>Submit Report</span> <Check size={20} /></>
                            )}
                        </button>

                        <p className="text-center text-xs text-gray-400 mt-2">
                            AI will verify your report on the admin side
                        </p>
                    </div>
                )}
            </div>

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default ReportingModal;
