// Analytics Dashboard Logic

const analytics = {
    state: {
        issues: [],
        charts: {}
    },

    init: async () => {
        console.log("Initializing Analytics...");
        await analytics.loadData();
        analytics.renderCharts();
    },

    loadData: async () => {
        try {
            const res = await fetch('/api/issues');
            const data = await res.json();
            if (Array.isArray(data)) {
                analytics.state.issues = data;
            }
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('charts-container').classList.remove('hidden');
        } catch (error) {
            console.error("Failed to fetch analytics data", error);
            document.getElementById('loading').textContent = 'Failed to load analytics data.';
        }
    },

    calculateStats: () => {
        const issues = analytics.state.issues;
        if (!issues.length) return null;

        // 1. Sector Distribution
        const sectorCounts = {};
        issues.forEach(i => {
            const s = (i.sector || 'other').toLowerCase();
            sectorCounts[s] = (sectorCounts[s] || 0) + 1;
        });
        const sectorData = {
            labels: Object.keys(sectorCounts).map(key => key.charAt(0).toUpperCase() + key.slice(1)),
            values: Object.values(sectorCounts)
        };

        // 2. Status Distribution
        const statusCounts = { pending: 0, 'in-progress': 0, resolved: 0, rejected: 0 };
        issues.forEach(i => {
            const s = (i.status || 'open').toLowerCase();
            if (statusCounts[s] !== undefined) statusCounts[s]++;
            else if (s === 'completed' || s === 'closed') statusCounts['resolved']++;
            else statusCounts['pending']++;
        });
        const statusData = {
            labels: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
            values: [statusCounts.pending, statusCounts['in-progress'], statusCounts.resolved, statusCounts.rejected],
            colors: ['#F59E0B', '#3B82F6', '#10B981', '#EF4444']
        };

        // 3. Issues Over Time (Last 7 Days)
        const last7Days = {};
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            last7Days[d.toISOString().split('T')[0]] = 0;
        }

        issues.forEach(i => {
            const date = (i.createdAt || i.reportedAt || '').split('T')[0];
            if (last7Days[date] !== undefined) {
                last7Days[date]++;
            }
        });

        const timeData = {
            labels: Object.keys(last7Days).map(date => {
                const d = new Date(date);
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            values: Object.values(last7Days)
        };

        return { sectorData, statusData, timeData };
    },

    renderCharts: () => {
        const stats = analytics.calculateStats();
        if (!stats) {
            return;
        }

        const COLORS = ['#5B52FF', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];

        // Sector Chart (Doughnut)
        const sectorCtx = document.getElementById('sectorChart');
        if (sectorCtx) {
            analytics.state.charts.sector = new Chart(sectorCtx, {
                type: 'doughnut',
                data: {
                    labels: stats.sectorData.labels,
                    datasets: [{
                        data: stats.sectorData.values,
                        backgroundColor: COLORS,
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                font: { size: 12, family: 'Inter' }
                            }
                        }
                    }
                }
            });
        }

        // Status Chart (Horizontal Bar)
        const statusCtx = document.getElementById('statusChart');
        if (statusCtx) {
            analytics.state.charts.status = new Chart(statusCtx, {
                type: 'bar',
                data: {
                    labels: stats.statusData.labels,
                    datasets: [{
                        data: stats.statusData.values,
                        backgroundColor: stats.statusData.colors,
                        borderRadius: 6,
                        borderSkipped: false
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            grid: { display: false }
                        },
                        y: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }

        // Trend Chart (Area)
        const trendCtx = document.getElementById('trendChart');
        if (trendCtx) {
            analytics.state.charts.trend = new Chart(trendCtx, {
                type: 'line',
                data: {
                    labels: stats.timeData.labels,
                    datasets: [{
                        label: 'Issues Reported',
                        data: stats.timeData.values,
                        borderColor: '#5B52FF',
                        backgroundColor: 'rgba(91, 82, 255, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#5B52FF',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: '#f1f5f9' },
                            ticks: { stepSize: 1 }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', analytics.init);
} else {
    analytics.init();
}
