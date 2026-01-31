import React from 'react';
import { Bell, MapPin, AlertTriangle } from 'lucide-react';

const TopBar = ({ address }) => {
    return (
        <div className="fixed top-0 left-0 right-0 z-overlay flex flex-col gap-2 p-4">
            {/* Glass Header */}
            <div className="glass-panel p-3 flex justify-between items-center rounded-2xl">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                        <MapPin size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 font-bold tracking-wider">LIVE GPS</span>
                        <span className="text-sm font-bold text-gray-900 truncate max-w-[200px]">
                            {address || 'Locating...'}
                        </span>
                    </div>
                </div>

                <button className="relative p-2 bg-white rounded-full shadow-sm border border-gray-100">
                    <Bell size={20} className="text-gray-600" />
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
            </div>

            {/* Alert Banner */}
            <div className="bg-yellow-400 text-black px-4 py-2 rounded-xl flex items-center gap-3 shadow-lg animate-pulse">
                <AlertTriangle size={18} className="shrink-0" />
                <span className="text-xs font-bold leading-tight">
                    ALERT: Heavy rain expected in Sector 4. Drainage teams deployed.
                </span>
            </div>
        </div>
    );
};

export default TopBar;
