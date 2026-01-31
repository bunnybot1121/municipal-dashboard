import React, { useState, useEffect } from 'react';
import '../styles/citizen-app.css';

// Components
import MapLayer from './components/MapLayer';
import TopBar from './components/TopBar';
import ActionFab from './components/ActionFab';
import BottomSheet from './components/BottomSheet';
import ReportingModal from './components/ReportingModal';

const CitizenApp = () => {
    // State
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fullAddress, setFullAddress] = useState("Locating...");
    const [isReporting, setIsReporting] = useState(false);

    // 1. Initial GPS Fix
    useEffect(() => {
        if (!navigator.geolocation) {
            setFullAddress("GPS Not Supported");
            return;
        }

        const id = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setLocation({ latitude, longitude });
                setLoading(false);

                // Reverse Geocode (Mock)
                // In real app: fetch(`https://nominatim...`)
                if (Math.random() > 0.5) setFullAddress("Sector 4, Main Market Road"); // Keep stable for demo
            },
            (err) => {
                console.error(err);
                setFullAddress("GPS Signal Lost");
            },
            { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(id);
    }, []);

    return (
        <div className="w-full h-full overflow-hidden bg-gray-100 font-sans relative">
            {/* 1. Background Map Layer */}
            <div className="absolute inset-0 z-0">
                <MapLayer userLocation={location} />
            </div>

            {/* 2. Top UI Layer (Glass Header) */}
            <TopBar address={fullAddress} />

            {/* 3. Action Layer (Center FAB) */}
            <ActionFab onClick={() => setIsReporting(true)} />

            {/* 4. Bottom Layer (Status Sheet) */}
            <BottomSheet />

            {/* 5. Reporting Modal (Overlay) */}
            <ReportingModal
                isOpen={isReporting}
                onClose={() => setIsReporting(false)}
                location={location}
                address={fullAddress}
            />
        </div>
    );
};

export default CitizenApp;
