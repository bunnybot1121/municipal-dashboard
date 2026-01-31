import React from 'react';
import { Camera } from 'lucide-react';

const ActionFab = ({ onClick }) => {
    return (
        <div className="fixed bottom-24 left-0 right-0 flex justify-center z-fab pointer-events-none">
            {/* Pointer events auto so only button clicks, but container lets clicks pass through */}
            <button
                onClick={onClick}
                className="pointer-events-auto bg-orange-500 hover:bg-orange-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 border-4 border-white/20"
                aria-label="Report Issue"
            >
                <Camera size={32} />
            </button>
        </div>
    );
};

export default ActionFab;
