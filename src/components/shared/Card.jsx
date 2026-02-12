import React from 'react';

export function MetricCard({ title, value, trend, icon, color = 'blue' }) {
    const colors = {
        blue: 'border-blue-500',
        green: 'border-green-500',
        yellow: 'border-yellow-500',
        red: 'border-red-500'
    };

    return (
        <div className={`bg-white rounded-lg border-l-4 ${colors[color]} p-6 shadow-sm`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600 font-medium">{title}</p>
                    <p className="text-3xl font-bold mt-2">{value}</p>
                    {trend && (
                        <p className={`text-sm mt-2 ${trend.includes('+') ? 'text-green-600' : 'text-red-600'}`}>
                            {trend}
                        </p>
                    )}
                </div>
                <div className="text-4xl opacity-20">{icon}</div>
            </div>
        </div>
    );
}