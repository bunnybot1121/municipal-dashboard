import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ISSUES, SECTORS } from '../services/mockData';
import { Filter, Search, ChevronRight, ArrowUpDown } from 'lucide-react';

const IssueList = () => {
    const navigate = useNavigate();
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterSector, setFilterSector] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'reportedAt', direction: 'desc' });

    // Filter and Sort Logic
    const filteredIssues = useMemo(() => {
        let result = [...ISSUES];

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
        <div className="animate-fade-in">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Issue Management</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Track and manage civic complaints.</p>
                </div>
                <button className="btn btn-primary">
                    + Log Manual Issue
                </button>
            </header>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Toolbar */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search issues by ID, title, or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                                borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>

                        <select
                            value={filterSector}
                            onChange={(e) => setFilterSector(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                        >
                            <option value="all">All Sectors</option>
                            {SECTORS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead style={{ background: 'var(--color-bg-body)', color: 'var(--color-text-muted)', textAlign: 'left' }}>
                            <tr>
                                <th style={{ padding: '1rem' }}>ID</th>
                                <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('title')}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        Issue <ArrowUpDown size={14} />
                                    </div>
                                </th>
                                <th style={{ padding: '1rem' }}>Sector</th>
                                <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('status')}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        Status <ArrowUpDown size={14} />
                                    </div>
                                </th>
                                <th style={{ padding: '1rem' }}>Priority</th>
                                <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('reportedAt')}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        Reported <ArrowUpDown size={14} />
                                    </div>
                                </th>
                                <th style={{ padding: '1rem' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredIssues.map((issue) => (
                                <tr key={issue.id}
                                    style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 0.2s' }}
                                    onClick={() => navigate(`/issues/${issue.id}`)}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-body)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '1rem', fontWeight: 500, fontFamily: 'monospace' }}>{issue.id}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 500 }}>{issue.title}</div>
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{issue.location.address}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>{getSectorLabel(issue.sector)}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span className={`badge badge-${issue.status}`}>{issue.status.replace('-', ' ')}</span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                                            background: issue.severity === 'high' ? 'var(--color-red-500)' :
                                                issue.severity === 'medium' ? 'var(--color-yellow-500)' : 'var(--color-emerald-500)',
                                            marginRight: '0.5rem'
                                        }}></span>
                                        {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {new Date(issue.reportedAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <ChevronRight size={16} color="var(--color-text-muted)" />
                                    </td>
                                </tr>
                            ))}
                            {filteredIssues.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        No issues found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default IssueList;
