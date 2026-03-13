import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { CenterFocusStrong } from '@mui/icons-material';

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

const LeafletMap = ({ issues, selectedIssueId, onIssueSelect }) => {
    // Default Center (Khargar, Navi Mumbai)
    const KHARGAR_COORDS = [19.0298, 73.0583];
    const [center, setCenter] = useState(KHARGAR_COORDS);

    useEffect(() => {
        if (selectedIssueId && issues) {
            const issue = issues.find(i => i.id === selectedIssueId);
            if (issue?.location?.lat) {
                setCenter([issue.location.lat, issue.location.lng]);
            }
        }
    }, [selectedIssueId, issues]);

    // Recenter Helper
    const handleResetView = () => {
        setCenter(KHARGAR_COORDS);
    };

    const getIcon = (issue) => {
        const status = (issue.status || '').toLowerCase();
        const priority = (issue.priority || issue.severity || '').toLowerCase();

        if (status === 'resolved' || status === 'closed' || status === 'completed') return Icons.green;
        if (priority === 'critical') return Icons.red;
        if (priority === 'high') return Icons.orange;
        return Icons.blue;
    };

    return (
        <div style={{ height: '100%', width: '100%', position: 'relative', borderRadius: '1rem', overflow: 'hidden' }}>
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

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
                            <Popup className="custom-popup">
                                <div className="p-1 min-w-[200px]">
                                    <h4 className="text-sm font-bold text-slate-900 mb-1">{issue.title}</h4>
                                    <div className="text-xs text-slate-500 mb-2">{issue.location.address}</div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${(issue.status === 'resolved') ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                                            {issue.status}
                                        </span>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}

                <RecenterAutomatically lat={center[0]} lng={center[1]} />

                {/* Reset View Control */}
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 1000 }}>
                    <button
                        onClick={handleResetView}
                        className="bg-white p-2 rounded-lg shadow-md hover:bg-slate-50 text-slate-600 transition-colors"
                        title="Reset View to Khargar"
                    >
                        <CenterFocusStrong sx={{ fontSize: 20 }} />
                    </button>
                </div>

            </MapContainer>

            {/* Legend Overlay */}
            <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', zIndex: 1000, background: 'white', padding: '0.75rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>LEGEND</div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}></div> Critical
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316' }}></div> Major
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }}></div> Active
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></div> Resolved
                    </div>
                </div>
            </div>
        </div>
    );
};
export default LeafletMap;
