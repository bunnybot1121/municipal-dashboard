import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom User Pin
const userIcon = new L.DivIcon({
    className: 'custom-user-pin',
    html: `<div style="width: 20px; height: 20px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

const RecenterBtn = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) map.flyTo([lat, lng], 16);
    }, [lat, lng, map]);
    return null;
};

const MapLayer = ({ userLocation }) => {
    const startPos = userLocation ? [userLocation.latitude, userLocation.longitude] : [19.0760, 72.8777]; // Mumbai Default

    return (
        <MapContainer
            center={startPos}
            zoom={15}
            style={{ width: '100%', height: '100vh', zIndex: 0 }}
            zoomControl={false}
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {userLocation && (
                <>
                    <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
                        <Popup>You are here</Popup>
                    </Marker>
                    <RecenterBtn lat={userLocation.latitude} lng={userLocation.longitude} />
                </>
            )}
        </MapContainer>
    );
};

export default MapLayer;
