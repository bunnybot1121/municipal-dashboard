import React, { useState, useRef, useEffect } from 'react';
import '../styles/citizen-camera.css';

const SECTORS = ['roads', 'water', 'drainage', 'lighting', 'waste'];

const ReportIssue = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [stream, setStream] = useState(null);

    // GPS & Metadata State
    const [location, setLocation] = useState(null);
    const [addressDetails, setAddressDetails] = useState(null);
    const [fullAddress, setFullAddress] = useState('Acquiring GPS Signal...');
    const [gpsAccuracy, setGpsAccuracy] = useState(null);
    const [gpsTier, setGpsTier] = useState('searching');
    const [deviceOrientation, setDeviceOrientation] = useState('portrait');
    const [failsafeTriggered, setFailsafeTriggered] = useState(false);

    // Submission State
    const [capturedImage, setCapturedImage] = useState(null);
    const [capturedMetadata, setCapturedMetadata] = useState(null);
    const [formData, setFormData] = useState({ sector: 'roads', description: '', severity: 'Low' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Failsafe Timer
    useEffect(() => {
        const timer = setTimeout(() => setFailsafeTriggered(true), 5000);
        return () => clearTimeout(timer);
    }, []);

    // Initialize Camera, GPS, and Orientation
    useEffect(() => {
        startCamera();
        const cleanupGPS = startGPS();

        // Orientation Listener
        const handleOrientation = () => {
            const type = screen.orientation ? screen.orientation.type : 'portrait-primary';
            setDeviceOrientation(type.includes('landscape') ? 'landscape' : 'portrait');
        };
        window.addEventListener('orientationchange', handleOrientation);

        return () => {
            stopCamera();
            if (cleanupGPS) cleanupGPS();
            window.removeEventListener('orientationchange', handleOrientation);
        };
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
                audio: false
            });
            setStream(mediaStream);
            streamRef.current = mediaStream;
            if (videoRef.current) videoRef.current.srcObject = mediaStream;
        } catch (err) {
            setError('Camera access denied. Please allow permissions.');
        }
    };

    const stopCamera = () => {
        const s = streamRef.current || stream;
        if (s) s.getTracks().forEach(track => track.stop());
        setStream(null);
        streamRef.current = null;
    };

    const startGPS = () => {
        if (!navigator.geolocation) {
            setFullAddress('GPS Hardware Not Found');
            return;
        }
        const id = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                setLocation({ latitude, longitude, accuracy, timestamp: position.timestamp });
                setGpsAccuracy(accuracy);

                if (accuracy <= 15) setGpsTier('high');
                else if (accuracy <= 50) setGpsTier('medium');
                else setGpsTier('low');

                if (accuracy < 200) fetchAddress(latitude, longitude);
            },
            (err) => {
                console.error(err);
                setError('GPS Signal Lost. Move outdoors.');
                setGpsTier('searching');
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
        );
        return () => navigator.geolocation.clearWatch(id);
    };

    const mapTileRef = useRef(null);

    // Fetch Map Tile when location updates
    useEffect(() => {
        if (!location) return;

        const loadMapTile = () => {
            // Calculate Tile X/Y (Zoom 15)
            const zoom = 15;
            const latRad = location.latitude * Math.PI / 180;
            const n = Math.pow(2, zoom);
            const xTile = Math.floor((location.longitude + 180) / 360 * n);
            const yTile = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);

            // Esri World Imagery (Satellite) - Premium Look, Free Usage
            // Note: Esri tile server uses /{z}/{y}/{x} format
            const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${yTile}/${xTile}`;

            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                mapTileRef.current = img;
            };
            img.src = url;
        };

        loadMapTile();
    }, [location?.latitude, location?.longitude]);

    const fetchAddress = async (lat, lng) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
            const data = await res.json();
            if (data && data.address) {
                setAddressDetails(data.address);
                setFullAddress(data.display_name);
            }
        } catch (e) { }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current || !location) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // 1. Draw Video Frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 2. Prepare Overlay Data
        const timestamp = new Date().toLocaleString();
        const latRef = location.latitude.toFixed(6);
        const lngRef = location.longitude.toFixed(6);
        const addressLine1 = addressDetails?.suburb || addressDetails?.city || addressDetails?.town || 'Unknown Location';
        const addressLine2 = `${addressDetails?.state || ''}, ${addressDetails?.country || ''}`;
        const addressFull = fullAddress.substring(0, 60) + (fullAddress.length > 60 ? '...' : '');

        // 3. Draw Professional Map Camera Overlay (Bottom Section)
        const overlayHeight = Math.min(300, canvas.height * 0.25);
        const margin = 20;
        const overlayY = canvas.height - overlayHeight - margin;

        // --- A. Left: Mini-Map (Real Static Tile) ---
        const mapWidth = overlayHeight; // Square
        const mapX = margin;

        if (mapTileRef.current) {
            // Draw Real Map Tile
            ctx.drawImage(mapTileRef.current, mapX, overlayY, mapWidth, overlayHeight);
        } else {
            // Fallback: GPS Grid
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(mapX, overlayY, mapWidth, overlayHeight);
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            // Grid lines
            for (let i = 0; i <= 4; i++) {
                ctx.moveTo(mapX + (i * mapWidth / 4), overlayY);
                ctx.lineTo(mapX + (i * mapWidth / 4), overlayY + overlayHeight);
                ctx.moveTo(mapX, overlayY + (i * overlayHeight / 4));
                ctx.lineTo(mapX + mapWidth, overlayY + (i * overlayHeight / 4));
            }
            ctx.stroke();
        }

        // Draw Crosshair on Map center
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const centerX = mapX + mapWidth / 2;
        const centerY = overlayY + overlayHeight / 2;
        ctx.moveTo(centerX - 10, centerY);
        ctx.lineTo(centerX + 10, centerY);
        ctx.moveTo(centerX, centerY - 10);
        ctx.lineTo(centerX, centerY + 10);
        ctx.stroke();

        // Pin Pulse Effect (Static in image)
        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.beginPath();
        ctx.arc(mapX + mapWidth / 2, overlayY + overlayHeight / 2, 20, 0, Math.PI * 2);
        ctx.fill();

        // Map Pin Icon
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(mapX + mapWidth / 2, overlayY + overlayHeight / 2, 6, 0, Math.PI * 2);
        ctx.fill();

        // Compass
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mapX + mapWidth - 20, overlayY + 20, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'red';
        ctx.textAlign = 'center';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText('N', mapX + mapWidth - 20, overlayY + 24);
        ctx.textAlign = 'left'; // Reset

        // --- B. Right: Address & Data Panel ---
        const infoX = mapX + mapWidth + 10;
        const infoWidth = canvas.width - infoX - margin;

        ctx.fillStyle = 'rgba(20, 20, 20, 0.85)';
        ctx.beginPath();
        ctx.roundRect(infoX, overlayY, infoWidth, overlayHeight, 10);
        ctx.fill();

        // Text Styles
        ctx.fillStyle = 'white';
        ctx.textBaseline = 'top';

        // 1. Header (Location Name)
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText(addressLine1, infoX + 20, overlayY + 20);

        // 2. Sub-Header (Full Address)
        ctx.font = '24px sans-serif';
        ctx.fillStyle = '#d1d5db';
        ctx.fillText(addressFull, infoX + 20, overlayY + 70);

        // 3. Coordinates & Date Block
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px monospace';
        const metaY = overlayY + overlayHeight - 80;

        ctx.fillText(`Lat  ${latRef}°`, infoX + 20, metaY);
        ctx.fillText(`Long ${lngRef}°`, infoX + 20, metaY + 30);

        ctx.font = '18px monospace';
        ctx.fillStyle = '#fbbf24'; // Amber for date
        ctx.fillText(timestamp, infoX + 20, metaY + 60);

        // 4. Capture Metadata (The "Golden Record")
        const metadata = {
            captureTimestamp: new Date().toISOString(),
            gps: {
                lat: location.latitude,
                lng: location.longitude,
                accuracy: location.accuracy,
                timestamp: new Date(location.timestamp).toISOString()
            },
            device: {
                userAgent: navigator.userAgent,
                orientation: deviceOrientation,
                screen: `${window.screen.width}x${window.screen.height}`
            },
            validation: {
                isGpsAccurate: location.accuracy <= 50,
                isRecent: (Date.now() - location.timestamp) < 60000 // GPS fix < 1 min old
            }
        };
        setCapturedMetadata(metadata);
        setCapturedImage(canvas.toDataURL('image/jpeg', 0.9));
        stopCamera();
    };

    const retake = () => {
        setCapturedImage(null);
        setCapturedMetadata(null);
        startCamera();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = {
            title: `${formData.sector.toUpperCase()} Issue`,
            description: formData.description,
            sector: formData.sector,
            severity: 'Medium', // AI will re-evaluate this
            source: 'citizen',
            imageUrl: capturedImage,
            metadata: capturedMetadata, // CRITICAL: Sending the separate metadata object
            location: {
                lat: location.latitude,
                lng: location.longitude,
                address: fullAddress
            },
            timestamp: capturedMetadata.captureTimestamp
        };

        // Mock Submission
        setTimeout(() => {
            alert('Verified Report Submitted Successfully!');
            window.location.reload();
        }, 1500);
    };

    const isCaptureReady = gpsTier === 'high' || gpsTier === 'medium' || (gpsTier === 'low' && failsafeTriggered);

    return (
        <div style={{ background: '#000', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
            {!capturedImage ? (
                // --- LIVE CAMERA VIEW ---
                <div style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', background: 'black' }}>

                    {/* Visual FX Layers */}
                    <div className="grid-overlay"></div>
                    <div className="scan-line"></div>
                    <div className="hud-corner hud-tl"></div>
                    <div className="hud-corner hud-tr"></div>
                    <div className="hud-corner hud-bl"></div>
                    <div className="hud-corner hud-br"></div>

                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                    />

                    {/* Error Overlay */}
                    {error && (
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            background: 'rgba(239, 68, 68, 0.9)', color: 'white', padding: '1rem',
                            borderRadius: '8px', zIndex: 100, textAlign: 'center', maxWidth: '80%'
                        }}>
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
                            <b>System Error</b>
                            <div style={{ fontSize: '14px', marginTop: '4px' }}>{error}</div>
                        </div>
                    )}

                    {/* LIVE OVERLAY (Before Capture) */}
                    <div className="camera-overlay">
                        <div className="overlay-section">
                            <div className="data-label">DETECTED LOCATION</div>
                            <div className="data-value">{addressDetails?.suburb || addressDetails?.residential || 'Scanning Sector...'}</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontFamily: 'sans-serif', marginTop: '4px' }}>
                                {fullAddress.substring(0, 45)}...
                            </div>
                        </div>
                        <div className="overlay-section" style={{ alignItems: 'flex-end' }}>
                            <div className="data-label">GPS TELEMETRY</div>
                            <div className="data-large">
                                {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'ACQUIRING...'}
                            </div>
                            <div className={`tier-badge tier-${gpsTier}`}>
                                {gpsTier === 'high' ? 'LOCKED: OPTIMAL' : gpsTier === 'medium' ? 'SIGNAL: GOOD' : 'SIGNAL: POOR'}
                            </div>
                            <div style={{ fontSize: '10px', marginTop: '4px', letterSpacing: '1px', color: '#9ca3af' }}>
                                PRECISION: ±{location ? Math.round(location.accuracy) : '--'}M
                            </div>
                        </div>
                    </div>

                    {/* CAPTURE BUTTON */}
                    <div style={{ position: 'absolute', bottom: '120px', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 20 }}>
                        <button
                            onClick={capturePhoto}
                            disabled={!isCaptureReady}
                            style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: isCaptureReady ? 'rgba(255,255,255,0.2)' : 'rgba(50,50,50,0.5)',
                                border: isCaptureReady ? '4px solid white' : '4px solid #666',
                                cursor: isCaptureReady ? 'pointer' : 'not-allowed',
                                backdropFilter: 'blur(4px)',
                                boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                                display: 'grid', placeItems: 'center',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <div style={{ width: '60px', height: '60px', background: isCaptureReady ? 'white' : '#888', borderRadius: '50%' }}></div>
                        </button>
                    </div>
                </div>
            ) : (
                // --- REVIEW & SUBMIT VIEW (Scrollable) ---
                <div style={{ height: '100vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '20px', paddingBottom: '120px', background: '#111' }}>
                    <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
                        <img src={capturedImage} style={{ width: '100%', display: 'block' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', padding: '10px', fontSize: '10px' }}>
                            METADATA LOCKED: {capturedMetadata?.captureTimestamp}
                        </div>
                    </div>

                    {/* Metadata Preview (Trusted UI) */}
                    <div style={{ background: '#1f2937', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '12px' }}>
                        <div style={{ color: '#9ca3af', marginBottom: '4px' }}>EVIDENCE METADATA</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                                <span style={{ color: '#6b7280' }}>Device:</span> {capturedMetadata?.device.orientation}
                            </div>
                            <div>
                                <span style={{ color: '#6b7280' }}>Acc:</span> ±{Math.round(capturedMetadata?.gps.accuracy)}m
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <span style={{ color: '#6b7280' }}>Time:</span> {capturedMetadata?.captureTimestamp}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <label className="data-label">Sector</label>
                            <select
                                value={formData.sector}
                                onChange={e => setFormData({ ...formData, sector: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: '#374151', color: 'white', border: '1px solid #4b5563', borderRadius: '6px' }}
                            >
                                {SECTORS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="data-label">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                required
                                style={{ width: '100%', padding: '12px', background: '#374151', color: 'white', border: '1px solid #4b5563', borderRadius: '6px', minHeight: '80px' }}
                            />
                        </div>


                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="button" onClick={retake} style={{ flex: 1, padding: '15px', background: '#4b5563', color: 'white', border: 'none', borderRadius: '8px' }}>
                                Retake
                            </button>
                            <button type="submit" style={{ flex: 2, padding: '15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
                                SUBMIT REPORT
                            </button>
                        </div>
                    </form>
                </div>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
};

export default ReportIssue;

