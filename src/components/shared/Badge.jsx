import React from 'react';

export function PriorityBadge({ priority }) {
    const styles = {
        P1: 'bg-red-600 text-white',
        P2: 'bg-orange-500 text-white',
        P3: 'bg-blue-500 text-white',
        P4: 'bg-gray-500 text-white'
    };

    const icons = {
        P1: '⚠️',
        P2: '🔸',
        P3: 'ℹ️',
        P4: '○'
    };

    return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${styles[priority]}`}>
            <span>{icons[priority]}</span>
            {priority}
        </span>
    );
}

export function StatusBadge({ status }) {
    const styles = {
        Pending: 'bg-yellow-100 text-yellow-800',
        'In Progress': 'bg-blue-100 text-blue-800',
        Resolved: 'bg-green-100 text-green-800',
        Rejected: 'bg-red-100 text-red-800'
    };

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
            <span className="w-2 h-2 rounded-full bg-current"></span>
            {status}
        </span>
    );
}

export function SectorBadge({ sector }) {
    const icons = {
        Roads: '🛣️',
        Water: '💧',
        Drainage: '🚰',
        Lighting: '💡',
        Waste: '🗑️'
    };

    return (
        <span className="inline-flex items-center gap-2 text-sm">
            <span className="text-lg">{icons[sector]}</span>
            <span>{sector}</span>
        </span>
    );
}