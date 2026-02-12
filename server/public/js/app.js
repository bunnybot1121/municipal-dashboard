
// Main Dashboard Application Logic

const app = {
    // State
    state: {
        issues: [],
        stats: {},
        map: null
    },

    // Config
    apiBase: 'http://localhost:5001/api',

    // Init
    init: async () => {
        // Check Auth
        const token = localStorage.getItem('token');
        if (!token) {
            // Redirect to login if not already there
            if (!window.location.pathname.endsWith('login.html')) {
                window.location.href = 'login.html';
            }
            return;
        }

        console.log("Initializing App...");

        // Fetch Data First
        await app.fetchData();

        // Router-like logic based on DOM elements
        if (document.getElementById('map')) {
            app.initMap();
        }

        if (document.getElementById('stat-total')) {
            app.renderStats();
        }

        if (document.getElementById('issues-table-body')) {
            app.renderRecentIssuesTable();
        }

        if (document.getElementById('all-issues-table-body')) {
            app.renderAllIssuesTable();
        }

        if (document.getElementById('detail-title')) {
            app.renderIssueDetail();
        }

        // Setup User Dropdown and Logout
        app.setupUserMenu();

        // Setup Sidebar Collapse
        app.setupSidebarCollapse();

        // Auto-refresh every 30s
        setInterval(app.fetchData, 30000);
    },

    // Setup User Menu Dropdown and Logout
    setupUserMenu: () => {
        const userMenuButton = document.getElementById('user-menu-button');
        const userDropdown = document.getElementById('user-dropdown');
        const logoutButton = document.getElementById('logout-button');

        if (userMenuButton && userDropdown) {
            // Toggle dropdown on button click
            userMenuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('hidden');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                if (!userDropdown.classList.contains('hidden')) {
                    userDropdown.classList.add('hidden');
                }
            });
        }

        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                // Clear token
                localStorage.removeItem('token');
                // Redirect to login
                window.location.href = 'login.html';
            });
        }
    },

    // Setup Sidebar Collapse Toggle
    setupSidebarCollapse: () => {
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('sidebar-toggle');
        const toggleIcon = document.getElementById('toggle-icon');

        if (!sidebar || !toggleBtn) return;

        // Load saved state
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            sidebar.classList.add('sidebar-collapsed');
        }

        // Toggle on button click
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('sidebar-collapsed');
            const collapsed = sidebar.classList.contains('sidebar-collapsed');
            localStorage.setItem('sidebarCollapsed', collapsed);

            // Rotate icon
            toggleIcon.textContent = collapsed ? 'chevron_right' : 'chevron_left';
        });
    },


    initMap: () => {
        if (!document.getElementById('map')) return;

        // Initialize Leaflet Map centered on Pune (as per user context)
        app.state.map = L.map('map', {
            zoomControl: false,
            attributionControl: false
        }).setView([18.5204, 73.8567], 13);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 20
        }).addTo(app.state.map);

        app.renderMapMarkers();
    },

    fetchData: async () => {
        try {
            console.log("Fetching data...");
            const res = await fetch(`${app.apiBase}/issues`);
            if (!res.ok) throw new Error('Failed to fetch');
            const issues = await res.json();
            app.state.issues = issues;
            console.log(`Loaded ${issues.length} issues`);

            // Calculate Stats
            app.state.stats = {
                total: issues.length,
                pending: issues.filter(i => i.status === 'pending').length,
                resolved: issues.filter(i => i.status === 'resolved' || i.status === 'completed').length,
                avgResponse: '4.2h' // Mock for now
            };

            // Update UI if elements exist
            if (document.getElementById('stat-total')) app.renderStats();
            if (document.getElementById('issues-table-body')) app.renderRecentIssuesTable();
            if (document.getElementById('all-issues-table-body')) app.renderAllIssuesTable();
            if (app.state.map) app.renderMapMarkers();

        } catch (err) {
            console.error("Failed to fetch data", err);
        }
    },

    renderStats: () => {
        const setValidText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setValidText('stat-total', app.state.stats.total || '0');
        setValidText('stat-pending', app.state.stats.pending || '0');
        setValidText('stat-resolved', app.state.stats.resolved || '0');
        setValidText('stat-response', app.state.stats.avgResponse || '--');
        setValidText('donut-pending-count', app.state.stats.pending || '0');
    },

    renderRecentIssuesTable: () => {
        const tbody = document.getElementById('issues-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        // Take top 5 recent issues
        const recentIssues = app.state.issues.slice(0, 5);

        if (recentIssues.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-slate-500">No issues found</td></tr>';
            return;
        }

        recentIssues.forEach(issue => {
            // Calculate AI Priority Score
            const aiPriority = typeof calculatePriorityScore === 'function'
                ? calculatePriorityScore(issue, [])
                : null;

            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer";
            tr.onclick = () => window.location.href = `issue_detail.html?id=${issue._id}`;


            // Helper for Badge Styles
            const getPriorityStyle = (p) => {
                const map = {
                    'critical': 'bg-rose-50 text-rose-600',
                    'high': 'bg-amber-50 text-amber-600',
                    'medium': 'bg-blue-50 text-blue-600',
                    'low': 'bg-slate-100 text-slate-600'
                };
                return map[p.toLowerCase()] || map['low'];
            };

            // Helper for Sector Icons
            const getSectorIcon = (s) => {
                const map = {
                    'water': 'water_drop',
                    'roads': 'road',
                    'lighting': 'lightbulb',
                    'waste': 'delete_sweep',
                    'drainage': 'waves'
                };
                return map[s.toLowerCase()] || 'category';
            };

            // Helper for Status Dot
            const getStatusDotColor = (s) => {
                const map = {
                    'resolved': 'bg-emerald-500',
                    'completed': 'bg-emerald-500',
                    'in-progress': 'bg-amber-400',
                    'pending': 'bg-rose-500',
                    'open': 'bg-slate-300'
                };
                return map[s.toLowerCase()] || 'bg-slate-300';
            };

            const issueIdIndex = issue._id ? issue._id.substring(issue._id.length - 4) : '0000';

            tr.innerHTML = `
                <td class="px-6 py-4 font-mono text-xs font-semibold text-slate-500">#INC-${issueIdIndex}</td>
                <td class="px-6 py-4 font-semibold text-sm">${issue.title}</td>
                <td class="px-6 py-4">
                    <span class="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                        <span class="material-symbols-outlined text-base">${getSectorIcon(issue.sector || 'other')}</span> ${issue.sector || 'General'}
                    </span>
                </td>
                <td class="px-6 py-4">
                    ${aiPriority ? `
                        <div class="flex items-center gap-2">
                            <span class="px-2 py-1 rounded text-[10px] font-bold uppercase" style="background-color: ${aiPriority.color}20; color: ${aiPriority.color};">
                                ${aiPriority.label}
                            </span>
                            <span class="text-xs font-mono text-slate-500">${aiPriority.score}/100</span>
                        </div>
                    ` : `
                        <span class="${getPriorityStyle(issue.severity || 'low')} px-2 py-1 rounded text-[10px] font-bold uppercase">
                            ${issue.severity || 'Low'}
                        </span>
                    `}
                </td>
                <td class="px-6 py-4">
                    <span class="flex items-center gap-2 text-sm font-medium">
                        <span class="w-2 h-2 rounded-full ${getStatusDotColor(issue.status || 'open')}"></span> 
                        ${(issue.status || 'Open').replace('-', ' ')}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    <a href="issue_detail.html?id=${issue._id}" class="text-primary hover:text-blue-700 font-bold text-sm">Review</a>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    renderAllIssuesTable: () => {
        const tbody = document.getElementById('all-issues-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        const issues = app.state.issues;

        if (issues.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="px-6 py-4 text-center text-slate-500">No issues found</td></tr>';
            return;
        }

        issues.forEach(issue => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors cursor-pointer";
            tr.onclick = () => window.location.href = `issue_detail.html?id=${issue._id}`;

            // Helper for Badge Styles (Duplicated for now, ideally strictly refactored)
            const getPriorityStyle = (p) => {
                const map = {
                    'critical': 'bg-rose-50 text-rose-600',
                    'high': 'bg-amber-50 text-amber-600',
                    'medium': 'bg-blue-50 text-blue-600',
                    'low': 'bg-slate-100 text-slate-600'
                };
                return map[(p || '').toLowerCase()] || map['low'];
            };

            // Helper for Sector Icons
            const getSectorIcon = (s) => {
                const map = {
                    'water': 'water_drop',
                    'roads': 'edit_road',
                    'lighting': 'lightbulb',
                    'waste': 'delete_sweep',
                    'drainage': 'waves'
                };
                return map[(s || '').toLowerCase()] || 'category';
            };

            // Helper for Status Dot
            const getStatusDotColor = (s) => {
                const map = {
                    'resolved': 'bg-emerald-500',
                    'completed': 'bg-emerald-500',
                    'in-progress': 'bg-blue-500', // Different shade in full table
                    'pending': 'bg-amber-500',
                    'open': 'bg-slate-300'
                };
                return map[(s || '').toLowerCase()] || 'bg-slate-300';
            };

            const issueIdIndex = issue._id ? issue._id.substring(issue._id.length - 4) : '0000';
            // Mock image if not present
            const imgUrl = issue.imageUrl || 'https://via.placeholder.com/150';

            tr.innerHTML = `
                <td class="px-6 py-4" onclick="event.stopPropagation()">
                    <input class="rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary dark:bg-slate-700" type="checkbox" />
                </td>
                <td class="px-4 py-4">
                    <span class="text-sm font-bold text-primary hover:underline cursor-pointer">#ISS-${issueIdIndex}</span>
                </td>
                <td class="px-4 py-4">
                    <div class="h-10 w-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                        <img class="w-full h-full object-cover" src="${imgUrl}" alt="Issue Image" />
                    </div>
                </td>
                <td class="px-4 py-4">
                    <p class="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">${issue.title}</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">${issue.description || 'No description'}</p>
                </td>
                <td class="px-4 py-4">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${issue.sector === 'Water' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'} uppercase">
                        <span class="material-symbols-outlined text-sm">${getSectorIcon(issue.sector)}</span>
                        ${issue.sector || 'General'}
                    </span>
                </td>
                <td class="px-4 py-4">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${getPriorityStyle(issue.severity)} uppercase tracking-tight">
                        ${issue.severity || 'Low'}
                    </span>
                </td>
                <td class="px-4 py-4">
                    <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-600">
                        <span class="w-1.5 h-1.5 rounded-full ${getStatusDotColor(issue.status)}"></span>
                        ${(issue.status || 'Open').replace('-', ' ')}
                    </span>
                </td>
                <td class="px-4 py-4">
                    <div class="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <span class="material-symbols-outlined text-[16px]">location_on</span>
                        <span class="text-xs truncate max-w-[100px]">${issue.location?.address || 'Unknown'}</span>
                    </div>
                </td>
                <td class="px-4 py-4">
                     <!-- Mock Score -->
                    <div class="flex items-center gap-2">
                        <div class="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-16">
                            <div class="bg-primary h-full rounded-full" style="width: 80%"></div>
                        </div>
                        <span class="text-xs font-bold text-slate-700 dark:text-slate-300">80%</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-right">
                    <button class="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400">
                        <span class="material-symbols-outlined">more_vert</span>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    renderIssueDetail: async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const issueId = urlParams.get('id');

        if (!issueId) {
            console.error("No issue ID in URL");
            return;
        }

        try {
            // Ensure issues are loaded if we navigated directly
            if (app.state.issues.length === 0) {
                await app.fetchData();
            }

            // Find in state first (opt) or fetch single
            // For now fetch single to ensure full details
            const res = await fetch(`${app.apiBase}/issues/${issueId}`);
            if (!res.ok) throw new Error('Issue not found');
            const issue = await res.json();

            // Populate Text Fields
            document.getElementById('detail-title').textContent = issue.title;
            document.getElementById('detail-description').textContent = issue.description;
            document.getElementById('detail-issue-id').textContent = `#ISS-${issue._id.slice(-4)}`;

            // Populate Status
            const statusBadge = document.getElementById('detail-status-badge');
            statusBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full ${issue.status === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}"></span> ${issue.status}`;

            // Populate Priority
            const priorityBadge = document.getElementById('detail-priority-badge');
            priorityBadge.textContent = `${issue.severity} Priority`;
            priorityBadge.className = `px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-tight ${issue.severity === 'critical' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`;

            // Populate Image if exists
            const imgEl = document.getElementById('detail-image');
            if (imgEl && issue.imageUrl) {
                imgEl.src = issue.imageUrl;
            }

            // Init Mini Map
            if (issue.location && issue.location.lat && issue.location.lng) {
                setTimeout(() => {
                    if (L.DomUtil.get('detail-map')) { // double check
                        // If map already initialized, remove? Leaflet doesn't like double init.
                        // Simple way:
                        const container = document.getElementById('detail-map');
                        if (container._leaflet_id) return; // Already init

                        const miniMap = L.map('detail-map', {
                            zoomControl: false,
                            attributionControl: false,
                            dragging: false
                        }).setView([issue.location.lat, issue.location.lng], 15);

                        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(miniMap);
                        L.marker([issue.location.lat, issue.location.lng]).addTo(miniMap);
                    }
                }, 500);
            }

        } catch (err) {
            console.error("Error loading issue detail", err);
            // Show error message on page
        }
    },

    renderMapMarkers: () => {
        if (!app.state.map) return;

        // Wrapper for legacy map
        const map = app.state.map;

        app.state.issues.forEach(issue => {
            if (issue.location && issue.location.lat && issue.location.lng) {
                const color = issue.severity === 'critical' ? '#f43f5e' :
                    issue.severity === 'high' ? '#f59e0b' : '#3b82f6';

                const markerHtml = `
                    <div class="w-4 h-4 rounded-full border-2 border-white shadow-sm" style="background-color: ${color};"></div>
                 `;

                const icon = L.divIcon({
                    className: 'custom-marker',
                    html: markerHtml,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                });

                L.marker([issue.location.lat, issue.location.lng], { icon: icon })
                    .addTo(map)
                    .bindPopup(`
                        <div class="text-xs font-sans">
                            <strong class="block mb-1">${issue.title}</strong>
                            <span class="text-slate-500">${issue.sector}</span>
                            <br/><a href="issue_detail.html?id=${issue._id}" class="text-primary hover:underline">View</a>
                        </div>
                    `);
            }
        });
    },

    logout: () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
};

// Start
document.addEventListener('DOMContentLoaded', app.init);
