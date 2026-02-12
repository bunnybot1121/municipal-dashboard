import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Create custom marker icons based on priority
const createPriorityIcon = (priority) => {
    const colors = {
        critical: '#dc2626',
        high: '#f59e0b',
        medium: '#2563eb',
        low: '#6b7280'
    };

    const color = colors[priority] || colors.medium;

    return L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="
                background-color: ${color};
                width: 28px;
                height: 28px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">
                <div style="
                    width: 8px;
                    height: 8px;
                    background: white;
                    border-radius: 50%;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                "></div>
            </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28]
    });
};

const EnhancedMap = ({ center = [28.6139, 77.2090], zoom = 13, markers = [], height = '400px' }) => {
    return (
        <div style={{ height, width: '100%' }} className="rounded-xl overflow-hidden border border-[var(--border)] shadow-sm">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                {/* Use better tile layer */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Render markers */}
                {markers.map((marker, index) => {
                    const position = [marker.lat || marker.location?.lat, marker.lng || marker.location?.lng];

                    if (!position[0] || !position[1]) return null;

                    return (
                        <Marker
                            key={marker.id || index}
                            position={position}
                            icon={createPriorityIcon(marker.priority || 'medium')}
                        >
                            <Popup>
                                <div className="p-2">
                                    <h4 className="font-bold text-sm mb-1">{marker.title || 'Issue'}</h4>
                                    {marker.priority && (
                                        <span className={`text-xs px-2 py-0.5 rounded ${marker.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                            marker.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                                marker.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                            }`}>
                                            {marker.priority}
                                        </span>
                                    )}
                                    {marker.sector && (
                                        <p className="text-xs text-gray-600 mt-1">{marker.sector}</p>
                                    )}
                                    {marker.address && (
                                        <p className="text-xs text-gray-500 mt-1">{marker.address}</p>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default EnhancedMap;
