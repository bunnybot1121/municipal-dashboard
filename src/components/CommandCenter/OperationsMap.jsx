import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- Fix for Default Leaflet Icons in React ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const createCustomIcon = (color) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const Icons = {
    red: createCustomIcon('red'),
    orange: createCustomIcon('orange'),
    blue: createCustomIcon('blue'),
    green: createCustomIcon('green'),
    grey: createCustomIcon('grey')
};

// Component to recenter map when issues change
const RecenterAutomatically = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) map.setView([lat, lng]);
    }, [lat, lng, map]);
    return null;
};

const OperationsMap = ({ issues, selectedIssueId, onIssueSelect }) => {
    const navigate = useNavigate();
    // Default Center (Mumbai)
    const [center, setCenter] = useState([19.0760, 72.8777]);

    useEffect(() => {
        if (selectedIssueId && issues) {
            const issue = issues.find(i => i.id === selectedIssueId);
            if (issue?.location?.lat) {
                setCenter([issue.location.lat, issue.location.lng]);
            }
        } else if (issues && issues.length > 0) {
            // Center on first issue if nothing selected
            const first = issues[0];
            if (first?.location?.lat) setCenter([first.location.lat, first.location.lng]);
        }
    }, [selectedIssueId, issues]);

    // Determine color based on priority/status
    const getIcon = (issue) => {
        if (issue.status === 'completed') return Icons.green;
        if (issue.riskLevel === 'Crisis' || issue.priority === 'High') return Icons.red;
        if (issue.riskLevel === 'Critical') return Icons.orange;
        return Icons.blue;
    };

    return (
        <div className="card" style={{ padding: 0, height: '100%', borderRadius: '1rem', overflow: 'hidden', position: 'relative', zIndex: 1, background: '#f8fafc' }}>
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                {/* Light Mode Tiles (Voyager) */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                {/* Dynamic Markers */}
                {issues.map(issue => (
                    issue.location?.lat && (
                        <Marker
                            key={issue.id}
                            position={[issue.location.lat, issue.location.lng]}
                            icon={getIcon(issue)}
                            eventHandlers={{
                                click: () => onIssueSelect && onIssueSelect(issue.id)
                            }}
                        >
                            <Popup>
                                <div style={{ fontSize: '0.9rem', color: '#0f172a' }}>
                                    <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: 600 }}>{issue.title}</h4>
                                    <div style={{ marginBottom: '0.25rem', color: '#64748b' }}>{issue.location.address}</div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <span className={`badge badge-${issue.status}`}>{issue.status}</span>
                                        {issue.riskLevel && <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>{issue.riskLevel}</span>}
                                    </div>
                                    <div
                                        style={{ marginTop: '0.5rem', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                                        onClick={() => navigate(`/issues/${issue.id || issue._id}`)}
                                    >
                                        View Details &rarr;
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}

                <RecenterAutomatically lat={center[0]} lng={center[1]} />

            </MapContainer>

            {/* Light Mode Legend Overlay */}
            <div className="glass-panel" style={{
                position: 'absolute',
                bottom: '1.5rem',
                left: '1.5rem',
                zIndex: 1000,
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.9)', // Light background
                borderColor: 'rgba(0,0,0,0.1)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>LIVE STATUS</div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#334155' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 4px #ef4444' }}></div> Critical
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#334155' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316' }}></div> Major
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#334155' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }}></div> Active
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#334155' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></div> Solved
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OperationsMap;
