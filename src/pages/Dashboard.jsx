import React from 'react';
import '../styles/command-center.css';

// Components
import OperationsMap from '../components/CommandCenter/OperationsMap';
import KeyMetrics from '../components/CommandCenter/KeyMetrics';
import EmergencyAlerts from '../components/CommandCenter/EmergencyAlerts';
import InfraHealth from '../components/CommandCenter/InfraHealth';
import CitizenReportFeed from '../components/CommandCenter/CitizenReportFeed';

import { useOutletContext } from 'react-router-dom';

const Dashboard = () => {
    // Access global issues state via Outlet Context
    const { issues, setIssues } = useOutletContext() || { issues: [], setIssues: () => { } };
    const [selectedSector, setSelectedSector] = React.useState('ALL');

    // Filter logic
    const filteredIssues = React.useMemo(() => {
        if (selectedSector === 'ALL') return issues;
        return issues.filter(i => i.sector?.toUpperCase() === selectedSector);
    }, [issues, selectedSector]);

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Top Header (matches design) */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-20">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/30">
                            {/* Simple logo icon */}
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">City Command Center</h1>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Intelligent Operations • Emergency • Maintenance</p>
                        </div>
                    </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-200">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold">SYSTEM ONLINE</span>
                    </div>
                    <div className="h-8 w-px bg-gray-200"></div>
                    <div className="flex items-center gap-3">
                        <select
                            value={selectedSector}
                            onChange={(e) => setSelectedSector(e.target.value)}
                            className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                            style={{ fontWeight: 600 }}
                        >
                            <option value="ALL">All Sectors</option>
                            <option value="WATER">Water Supply</option>
                            <option value="POWER">Power Grid</option>
                            <option value="ROADS">Roads & Traffic</option>
                            <option value="WASTE">Waste Management</option>
                        </select>
                        <div className="h-8 w-px bg-gray-200"></div>
                        <div className="text-right hidden md:block">
                            <div className="text-sm font-bold text-gray-900">Admin Authority</div>
                            <div className="text-xs text-gray-500">Ward A-4 Control</div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300">
                            <span className="font-bold text-slate-600">AA</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Command Center Container */}
            <div className="cc-container pt-6">

                {/* LEFT COLUMN: Operations Map (55%) */}
                <div className="cc-left-col">
                    <OperationsMap issues={filteredIssues} />
                </div>

                {/* RIGHT COLUMN: Metrics & Alerts (45%) */}
                <div className="cc-right-col">
                    <KeyMetrics issues={filteredIssues} />

                    {/* Citizen Feed Widget (New) */}
                    <div style={{ marginBottom: '1rem' }}>
                        <CitizenReportFeed
                            issues={filteredIssues}
                            onVerify={(id) => {
                                // Update issue status to 'in-progress' and mark verified
                                const updated = issues.map(i => {
                                    if (i.id === id) {
                                        return { ...i, status: 'in-progress', aiAnalysis: { ...i.aiAnalysis, isReal: true } };
                                    }
                                    return i;
                                });
                                setIssues(updated);
                            }}
                            onReject={(id) => {
                                const updated = issues.map(i => {
                                    if (i.id === id) return { ...i, status: 'rejected' };
                                    return i;
                                });
                                setIssues(updated);
                            }}
                        />
                    </div>

                    <EmergencyAlerts issues={filteredIssues} />
                    <InfraHealth />
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
