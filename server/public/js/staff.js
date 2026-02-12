// Staff Management Logic

const staff = {
    state: {
        allStaff: [],
        filteredStaff: []
    },

    init: async () => {
        console.log("Initializing Staff Management...");
        await staff.loadData();
        staff.setupEventListeners();
        staff.renderStaffGrid();
    },

    loadData: async () => {
        try {
            const res = await fetch('/api/users');
            const data = await res.json();
            if (Array.isArray(data)) {
                staff.state.allStaff = data;
                staff.state.filteredStaff = data;
            }
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('staff-grid').classList.remove('hidden');
        } catch (error) {
            console.error("Failed to fetch staff", error);
            document.getElementById('loading').textContent = 'Failed to load staff data.';
        }
    },

    setupEventListeners: () => {
        // Search
        const searchInput = document.getElementById('search-staff');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                staff.state.filteredStaff = staff.state.allStaff.filter(s =>
                    (s.name && s.name.toLowerCase().includes(term)) ||
                    (s.username && s.username.toLowerCase().includes(term)) ||
                    (s.role && s.role.toLowerCase().includes(term))
                );
                staff.renderStaffGrid();
            });
        }

        // Add Staff Button
        const addBtn = document.getElementById('add-staff-btn');
        const modal = document.getElementById('staff-modal');
        const closeBtn = document.getElementById('close-modal');
        const cancelBtn = document.getElementById('cancel-btn');

        if (addBtn && modal) {
            addBtn.addEventListener('click', () => {
                modal.classList.add('show');
            });
        }

        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('show');
            });
        }

        if (cancelBtn && modal) {
            cancelBtn.addEventListener('click', () => {
                modal.classList.remove('show');
            });
        }

        // Form Submit
        const form = document.getElementById('staff-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await staff.addStaff();
            });
        }
    },

    addStaff: async () => {
        const newStaff = {
            name: document.getElementById('staff-name').value,
            username: document.getElementById('staff-username').value,
            password: document.getElementById('staff-password').value,
            role: document.getElementById('staff-role').value,
            sector: document.getElementById('staff-sector').value,
            status: document.getElementById('staff-status').value
        };

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStaff)
            });

            if (res.ok) {
                alert('Staff member added successfully!');
                document.getElementById('staff-modal').classList.remove('show');
                document.getElementById('staff-form').reset();
                await staff.loadData();
                staff.renderStaffGrid();
            } else {
                const error = await res.json();
                alert(`Failed to add staff: ${error.message || 'Username might be taken'}`);
            }
        } catch (error) {
            console.error('Failed to add staff', error);
            alert('Failed to add staff. Please try again.');
        }
    },

    getSectorColor: (sector) => {
        const colors = {
            water: 'bg-blue-100 text-blue-700',
            roads: 'bg-slate-100 text-slate-700',
            lighting: 'bg-yellow-100 text-yellow-700',
            drainage: 'bg-cyan-100 text-cyan-700',
            waste: 'bg-green-100 text-green-700',
            power: 'bg-orange-100 text-orange-700',
            other: 'bg-gray-100 text-gray-700'
        };
        return colors[(sector || 'other').toLowerCase()] || colors['other'];
    },

    getStatusColor: (status) => {
        switch ((status || 'offline').toLowerCase()) {
            case 'available': return 'bg-green-500';
            case 'busy': return 'bg-amber-500';
            default: return 'bg-gray-400';
        }
    },

    renderStaffGrid: () => {
        const grid = document.getElementById('staff-grid');
        if (!grid) return;

        if (staff.state.filteredStaff.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-10 text-slate-500 bg-white rounded-xl border border-slate-200">No staff members found.</div>';
            return;
        }

        grid.innerHTML = staff.state.filteredStaff.map(member => `
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center gap-4">
                        <div class="relative">
                            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-lg font-bold text-white border-2 border-slate-100">
                                ${(member.name || member.username).charAt(0).toUpperCase()}
                            </div>
                            <div class="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${staff.getStatusColor(member.status)}"></div>
                        </div>
                        <div>
                            <h3 class="font-bold text-slate-800">${member.name || member.username}</h3>
                            <span class="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                ${member.role}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="space-y-3 mb-4">
                    <div class="flex items-center gap-2 text-sm text-slate-600">
                        <span class="material-symbols-outlined text-[16px] text-slate-400">badge</span>
                        <span>@${member.username}</span>
                    </div>
                    <div class="flex items-center gap-2 text-sm text-slate-600">
                        <span class="material-symbols-outlined text-[16px] text-slate-400">apartment</span>
                        <span class="px-2 py-0.5 rounded text-xs font-bold uppercase ${staff.getSectorColor(member.sector)}">
                            ${member.sector || 'Unassigned'}
                        </span>
                    </div>
                </div>

                <div class="pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-medium text-slate-500">
                    <span>Joined: ${new Date(member.createdAt).toLocaleDateString()}</span>
                    <span class="${member.status === 'available' ? 'text-green-600' : 'text-slate-500'}">
                        ${member.status || 'Offline'}
                    </span>
                </div>
            </div>
        `).join('');
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', staff.init);
} else {
    staff.init();
}
