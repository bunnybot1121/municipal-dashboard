import React, { useState } from 'react';
import { ChevronUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const BottomSheet = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Mock History
    const history = [
        { id: 1, type: 'Pothole', title: 'Main Street Crack', status: 'Fix Scheduled', time: '2h ago', color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 2, type: 'Garbage', title: 'Overflowing Bin', status: 'Completed', time: '1d ago', color: 'text-green-600', bg: 'bg-green-50' },
        { id: 3, type: 'Light', title: 'Street Light #404', status: 'AI Processing', time: 'Just now', color: 'text-orange-600', bg: 'bg-orange-50' },
    ];

    return (
        <div
            className={`bottom-sheet ${isExpanded ? 'bottom-sheet-expanded' : 'bottom-sheet-collapsed'} transition-all duration-300`}
            onClick={() => setIsExpanded(!isExpanded)}
        >
            {/* Handle Bar */}
            <div className="w-full flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>

            {/* Header (Always Visible) */}
            <div className="px-6 pb-4 flex justify-between items-center border-b border-gray-100">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">My Reports</h3>
                    {!isExpanded && <p className="text-xs text-gray-500">Tap to see status</p>}
                </div>
                <div className="bg-gray-100 p-2 rounded-full">
                    <ChevronUp size={20} className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* List Content (Scrollable) */}
            <div className="p-4 overflow-y-auto h-full pb-20">
                <div className="flex flex-col gap-3">
                    {history.map(item => (
                        <div key={item.id} className="flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                            <div className={`p-3 rounded-lg ${item.bg} ${item.color}`}>
                                {item.status === 'Completed' ? <CheckCircle size={20} /> :
                                    item.status === 'Fix Scheduled' ? <Clock size={20} /> : <AlertCircle size={20} />}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm text-gray-900">{item.title}</h4>
                                <span className={`text-xs font-bold ${item.color} uppercase tracking-wide`}>
                                    {item.status}
                                </span>
                            </div>
                            <span className="text-xs text-gray-400 font-medium">{item.time}</span>
                        </div>
                    ))}

                    <button className="w-full py-3 mt-4 text-sm font-bold text-gray-500 bg-gray-50 rounded-lg">
                        View Older Reports
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BottomSheet;
