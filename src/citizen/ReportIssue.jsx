import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/apiClient';

export default function ReportIssue() {
    const [step, setStep] = useState('camera'); // camera, form, success
    const [photo, setPhoto] = useState(null);
    const [gps, setGps] = useState(null);
    const [address, setAddress] = useState('Loading address...');
    const [formData, setFormData] = useState({
        sector: '',
        severity: '',
        description: ''
    });

    const [validationState, setValidationState] = useState(null); // null | 'validating' | 'rejected' | 'accepted'
    const [validationResult, setValidationResult] = useState(null);

    const videoRef = useRef(null);
    const streamRef = useRef(null);

    // Start camera on mount
    useEffect(() => {
        startCamera();
        getCurrentLocation();

        return () => stopCamera();
    }, []);

    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            }
        } catch (error) {
            console.error('Camera error:', error);
            alert('Camera access denied. Please enable camera permissions.');
        }
    }

    function stopCamera() {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    }

    async function getCurrentLocation() {
        if (!navigator.geolocation) {
            setAddress('Geolocation not supported');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                setGps({ lat: latitude, lng: longitude, accuracy });

                // Reverse geocode
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                    );
                    const data = await response.json();
                    setAddress(data.display_name || `${latitude}, ${longitude}`);
                } catch {
                    setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                }
            },
            (error) => {
                console.error('GPS error:', error);
                setAddress('Location unavailable');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    function capturePhoto() {
        if (!videoRef.current || !gps) {
            alert('Waiting for GPS lock...');
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        const ctx = canvas.getContext('2d');

        // Draw video frame
        ctx.drawImage(videoRef.current, 0, 0);

        // Burn in GPS overlay
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;

        // Address (top-left)
        const addressText = address.substring(0, 50);
        ctx.strokeText(addressText, 20, 40);
        ctx.fillText(addressText, 20, 40);

        // GPS coords (top-right)
        const coordsText = `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`;
        ctx.strokeText(coordsText, canvas.width - 250, 40);
        ctx.fillText(coordsText, canvas.width - 250, 40);

        // Timestamp (bottom-right)
        const timestamp = new Date().toLocaleString('en-IN');
        ctx.strokeText(timestamp, canvas.width - 300, canvas.height - 20);
        ctx.fillText(timestamp, canvas.width - 300, canvas.height - 20);

        const photoData = canvas.toDataURL('image/jpeg', 0.9);
        setPhoto(photoData);
        stopCamera();
        setStep('form');
    }

    function retakePhoto() {
        setPhoto(null);
        setStep('camera');
        setValidationState(null);
        setValidationResult(null);
        startCamera();
    }

    async function submitReport() {
        if (!formData.sector || !formData.severity) {
            alert('Please select sector and severity');
            return;
        }

        try {
            // === STEP 1: AI VALIDATION ===
            setValidationState('validating');
            setValidationResult(null);

            let validation = { isValid: true, confidence: 50, reason: 'Validation skipped (server unavailable)' };

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 25000);

                const valResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/validate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        photo: photo,
                        description: formData.description,
                        sector: formData.sector,
                        severity: formData.severity
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (valResponse.ok) {
                    validation = await valResponse.json();
                }
            } catch (valErr) {
                console.warn("⚠️ AI Validation server unreachable:", valErr.message);
                // Accept if server is down — don't block citizens
            }

            setValidationResult(validation);

            // === STEP 2: CHECK RESULT ===
            if (!validation.isValid) {
                setValidationState('rejected');
                return; // Don't save — show rejection UI
            }

            setValidationState('accepted');

            // === STEP 3: SAVE TO DB ===
            const issueData = {
                title: `${formData.sector} - ${formData.severity}`,
                description: formData.description,
                sector: formData.sector,
                severity: formData.severity,
                photo: photo,
                location: {
                    lat: gps.lat,
                    lng: gps.lng,
                    address: address
                },
                rawGps: gps,
                aiValidation: validation,
                createdAt: new Date().toISOString()
            };

            const response = await api.createIssue(issueData);

            if (response && response.id) {
                setStep('success');
            } else {
                throw new Error("Failed to create issue");
            }
        } catch (error) {
            console.error('Submit error:', error);
            setValidationState(null);
            alert('Failed to submit report. Please try again.');
        }
    }

    // RENDER: Camera Step
    if (step === 'camera') {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col">
                <div className="bg-blue-600 text-white p-4 text-center">
                    <h1 className="text-xl font-bold">Report Issue</h1>
                    <p className="text-sm opacity-90">Capture photo with GPS</p>
                </div>

                <div className="flex-1 relative bg-black">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />

                    <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded text-sm">
                        {gps ? (
                            <span>📍 GPS: ±{gps.accuracy.toFixed(0)}m</span>
                        ) : (
                            <span>📍 Acquiring GPS...</span>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-white">
                    <button
                        onClick={capturePhoto}
                        disabled={!gps}
                        className="w-full bg-blue-600 text-white py-4 rounded-lg text-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        📷 CAPTURE
                    </button>
                </div>
            </div>
        );
    }

    // RENDER: Form Step
    if (step === 'form') {
        return (
            <div className="min-h-screen bg-gray-100">
                <div className="bg-blue-600 text-white p-4 text-center">
                    <h1 className="text-xl font-bold">Describe Issue</h1>
                </div>

                <div className="p-4 space-y-6">
                    {/* Photo Preview */}
                    <div className="bg-white rounded-lg overflow-hidden shadow">
                        <img src={photo} alt="Captured" className="w-full" />
                    </div>

                    <button
                        onClick={retakePhoto}
                        className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold"
                    >
                        ← Retake Photo
                    </button>

                    {/* Sector Selection */}
                    <div className="bg-white rounded-lg p-4 shadow">
                        <label className="block font-semibold mb-3">What type of issue?</label>
                        <div className="space-y-2">
                            {['Roads', 'Water', 'Drainage', 'Lighting', 'Waste'].map(sector => (
                                <label key={sector} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name="sector"
                                        value={sector}
                                        onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                                        className="w-5 h-5"
                                    />
                                    <span className="text-2xl">
                                        {sector === 'Roads' ? '🛣️' : sector === 'Water' ? '💧' : sector === 'Drainage' ? '🚰' : sector === 'Lighting' ? '💡' : '🗑️'}
                                    </span>
                                    <span className="font-medium">{sector}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Severity Selection */}
                    <div className="bg-white rounded-lg p-4 shadow">
                        <label className="block font-semibold mb-3">How severe is it?</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { label: 'Minor', size: 'text-sm' },
                                { label: 'Moderate', size: 'text-base' },
                                { label: 'Severe', size: 'text-lg' },
                                { label: 'Critical', size: 'text-xl' }
                            ].map(({ label, size }) => (
                                <label key={label} className="flex items-center justify-center gap-2 p-4 border-2 rounded-lg cursor-pointer hover:border-blue-500">
                                    <input
                                        type="radio"
                                        name="severity"
                                        value={label}
                                        onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                                        className="w-5 h-5"
                                    />
                                    <span className={`font-semibold ${size}`}>{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-white rounded-lg p-4 shadow">
                        <label className="block font-semibold mb-3">Describe (optional)</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="E.g., Large pothole near main gate"
                            maxLength={500}
                            rows={4}
                            className="w-full border rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-sm text-gray-500 mt-2">
                            {formData.description.length} / 500 characters
                        </p>
                    </div>

                    {/* GPS Display */}
                    <div className="bg-white rounded-lg p-4 shadow">
                        <p className="text-sm font-semibold text-gray-700">📍 Location Verified</p>
                        <p className="text-xs text-gray-600 mt-1">{address}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            Lat: {gps?.lat.toFixed(6)} | Lng: {gps?.lng.toFixed(6)} | ±{gps?.accuracy.toFixed(0)}m
                        </p>
                    </div>

                    {/* AI Validation Status & Submit */}
                    {validationState === 'validating' ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                            <div className="inline-flex items-center gap-3">
                                <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-blue-700 font-bold text-lg">Verifying with AI...</span>
                            </div>
                            <p className="text-blue-600 text-sm mt-2">Analyzing photo and description for authenticity</p>
                        </div>
                    ) : validationState === 'rejected' ? (
                        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                            <div className="text-center">
                                <div className="text-4xl mb-2">🚫</div>
                                <h3 className="text-red-700 font-bold text-lg">Report Not Verified</h3>
                                <p className="text-red-600 text-sm mt-2">{validationResult?.reason || 'AI could not verify this as a valid municipal issue.'}</p>
                                {validationResult?.detectedIssueType && (
                                    <p className="text-red-500 text-xs mt-1">Detected: {validationResult.detectedIssueType}</p>
                                )}
                                {validationResult?.suggestions?.length > 0 && (
                                    <div className="mt-3 bg-white rounded p-3 text-left">
                                        <p className="text-xs font-bold text-gray-700 mb-1">💡 Suggestions:</p>
                                        {validationResult.suggestions.map((s, i) => (
                                            <p key={i} className="text-xs text-gray-600">• {s}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={retakePhoto}
                                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold"
                                >
                                    📷 Retake Photo
                                </button>
                                <button
                                    onClick={() => { setValidationState(null); setValidationResult(null); }}
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold"
                                >
                                    ✏️ Edit & Retry
                                </button>
                            </div>
                        </div>
                    ) : validationState === 'accepted' ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                            <div className="text-3xl mb-1">✅</div>
                            <p className="text-green-700 font-bold">AI Verified — Submitting report...</p>
                            {validationResult?.detectedIssueType && (
                                <p className="text-green-600 text-xs mt-1">Detected: {validationResult.detectedIssueType}</p>
                            )}
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={submitReport}
                                className="w-full bg-blue-600 text-white py-4 rounded-lg text-lg font-bold shadow-lg"
                            >
                                🛡️ VERIFY & SUBMIT REPORT
                            </button>
                            <p className="text-center text-sm text-gray-600">
                                AI will verify your photo before submission
                            </p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // RENDER: Success Step
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-8 text-center max-w-md shadow-lg">
                <div className="text-6xl mb-4">✓</div>
                <h2 className="text-2xl font-bold mb-2">Report Submitted!</h2>
                <p className="text-gray-600 mb-6">
                    Your issue has been recorded and will be reviewed by the municipal team.
                </p>
                <button
                    onClick={() => {
                        setStep('camera');
                        setPhoto(null);
                        setFormData({ sector: '', severity: '', description: '' });
                        startCamera();
                    }}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold"
                >
                    Report Another Issue
                </button>
            </div>
        </div>
    );
}