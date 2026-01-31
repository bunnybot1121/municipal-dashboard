import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { SECTORS, ISSUES } from '../services/mockData'; // Statically import ISSUES for reliability
import { Filter, Search, ChevronRight, ArrowUpDown } from 'lucide-react';

const IssueList = () => {
    const navigate = useNavigate();
    // Initialize with static data immediately to prevent flash of empty content
    const [issues, setIssues] = useState(ISSUES);
    const [loading, setLoading] = useState(false);

    // Filter Logic State
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterSector, setFilterSector] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'reportedAt', direction: 'desc' });

    const { issues: contextIssues } = useOutletContext() || {};

    // Sync with context if available (e.g. if global state changes)
    useEffect(() => {
        if (contextIssues && contextIssues.length > 0) {
            setIssues(contextIssues);
        }
    }, [contextIssues]);

    // Filter and Sort Logic
    const filteredIssues = useMemo(() => {
        let result = [...issues];

        // Filter
        if (filterStatus !== 'all') {
            result = result.filter(i => i.status === filterStatus);
        }
        if (filterSector !== 'all') {
            result = result.filter(i => i.sector === filterSector);
        }
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(i =>
                i.title.toLowerCase().includes(lower) ||
                i.id.toLowerCase().includes(lower) ||
                i.location.address.toLowerCase().includes(lower)
            );
        }

        // Sort
        result.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return result;
    }, [filterStatus, filterSector, searchTerm, sortConfig]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSectorLabel = (id) => SECTORS.find(s => s.id === id)?.label || id;

    return (
        <div className="animate-fade-in flex-col h-full">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Issue Management</h1>
                    <p className="text-muted">Track, verify, and resolve civic complaints.</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/issues/new')}>
                    + Log Manual Issue
                </button>
            </header>

            <div className="data-grid-container">
                {/* Toolbar */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--cc-border)', background: '#F9FAFB' }} className="flex-row items-center gap-md">
                    <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} className="text-muted" />
                        <input
                            type="text"
                            placeholder="Search issues..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-std"
                            style={{ paddingLeft: '40px' }}
                        />
                    </div>

                    <div className="flex-row gap-sm">
                        <div style={{ position: 'relative' }}>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="input-std"
                                style={{ paddingRight: '32px', cursor: 'pointer', appearance: 'none' }}
                            >
                                <option value="all">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                            <Filter size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} className="text-muted" />
                        </div>

                        <select
                            value={filterSector}
                            onChange={(e) => setFilterSector(e.target.value)}
                            className="input-std"
                            style={{ cursor: 'pointer' }}
                        >
                            <option value="all">All Sectors</option>
                            {SECTORS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div style={{ overflow: 'auto', flex: 1 }}>
                    <table className="data-grid">
                        <thead>
                            <tr>
                                {[
                                    { key: 'id', label: 'ID', width: '100px' },
                                    { key: 'title', label: 'Issue Details', flex: true },
                                    { key: 'ai', label: 'Verification', width: '140px' },
                                    { key: 'sector', label: 'Sector', width: '150px' },
                                    { key: 'risk', label: 'Risk Level', width: '130px' }, // NEW
                                    { key: 'status', label: 'Status', width: '120px' },
                                    { key: 'reportedAt', label: 'Reported', width: '100px' },
                                    { key: 'action', label: '', width: '50px' }
                                ].map((col) => (
                                    <th key={col.key}
                                        style={{ width: col.width || 'auto', cursor: col.flex ? 'pointer' : 'default' }}
                                        onClick={() => col.flex && handleSort(col.key)}
                                    >
                                        <div className="flex-row items-center gap-sm">
                                            {col.label}
                                            {col.flex && <ArrowUpDown size={12} />}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredIssues.map((issue) => (
                                <tr key={issue.id} onClick={() => navigate(`/issues/${issue.id}`)}>
                                    <td className="font-bold" style={{ fontFamily: 'monospace', color: 'var(--cc-info)' }}>{issue.id}</td>
                                    <td>
                                        <div style={{ fontWeight: 600, color: 'var(--cc-text-primary)', marginBottom: '4px' }}>{issue.title}</div>
                                        <div className="text-muted" style={{ fontSize: '12px' }}>
                                            {issue.location.address}
                                        </div>
                                    </td>
                                    <td>
                                        {issue.aiAnalysis ? (
                                            <span className={`badge ${issue.aiAnalysis.isReal ? 'badge-completed' : 'badge-rejected'}`}>
                                                {issue.aiAnalysis.isReal ? 'REAL' : 'FAKE'}
                                            </span>
                                        ) : (
                                            <span className="text-muted" style={{ fontSize: '12px', fontStyle: 'italic' }}>Pending</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className="flex-row items-center gap-sm" style={{ fontSize: '13px' }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: SECTORS.find(s => s.id === issue.sector)?.color || 'gray' }}></div>
                                            {getSectorLabel(issue.sector)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${issue.status}`}>{issue.status.replace('-', ' ')}</span>
                                    </td>
                                    <td>
                                        <div className="flex-row items-center gap-xs">
                                            {/* Risk Level Badge */}
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                backgroundColor: issue.riskLevel === 'Crisis' ? '#FEF2F2' :
                                                    issue.riskLevel === 'Critical' ? '#FFF7ED' : '#F0FDF4',
                                                color: issue.riskLevel === 'Crisis' ? '#DC2626' :
                                                    issue.riskLevel === 'Critical' ? '#EA580C' : '#16A34A',
                                                border: `1px solid ${issue.riskLevel === 'Crisis' ? '#FECACA' :
                                                    issue.riskLevel === 'Critical' ? '#FED7AA' : '#BBF7D0'}`
                                            }}>
                                                {issue.riskLevel || 'Normal'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="text-muted" style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
                                        {new Date(issue.reportedAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <ChevronRight size={18} className="text-muted" />
                                    </td>
                                </tr>
                            ))}
                            {filteredIssues.length === 0 && (
                                <tr>
                                    <td colSpan="8" style={{ padding: '64px', textAlign: 'center' }}>
                                        <div style={{ background: '#F3F4F6', width: 64, height: 64, borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 16px auto' }}>
                                            <Search size={24} className="text-muted" />
                                        </div>
                                        <p style={{ fontWeight: 500, marginBottom: '8px' }}>No issues found</p>
                                        <p className="text-muted" style={{ fontSize: '13px' }}>Try adjusting your search or filters.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div style={{ padding: '12px 24px', borderTop: '1px solid var(--cc-border)', background: '#F9FAFB', fontSize: '12px' }} className="flex-row justify-between text-muted">
                    <span>Showing {filteredIssues.length} issues</span>
                    <span>Page 1 of 1</span>
                </div>
            </div>
        </div>
    );
};

export default IssueList;
