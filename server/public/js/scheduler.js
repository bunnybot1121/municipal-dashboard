// Scheduler Calendar Logic

const scheduler = {
    state: {
        currentMonth: new Date().getMonth(),
        currentYear: new Date().getFullYear(),
        selectedDate: null,
        tasks: []
    },

    init: async () => {
        await scheduler.fetchTasks();
        scheduler.renderCalendar();
        scheduler.attachEvents();
    },

    fetchTasks: async () => {
        try {
            const res = await fetch('http://localhost:5001/api/tasks');
            if (res.ok) {
                const rawTasks = await res.json();
                // Map API properties to match frontend expectations
                scheduler.state.tasks = rawTasks.map(task => ({
                    _id: task._id,
                    title: task.type ? `${task.type} - ${task.department || 'Municipal Task'}` : task.title || 'Scheduled Task',
                    date: new Date(task.scheduledDate || task.date),
                    time: task.time || '09:00',
                    assignedTo: task.assignedTo || task.department || 'Unassigned',
                    priority: task.priority || 'medium',
                    status: task.status || 'pending'
                }));
            } else {
                // Mock data if API not available
                scheduler.state.tasks = [
                    {
                        _id: '1',
                        title: 'Pipeline Repair - Sector 4',
                        date: new Date(2023, 9, 16),  // Oct 16
                        time: '09:00',
                        assignedTo: 'Water Works Unit 2',
                        priority: 'high',
                        status: 'pending'
                    },
                    {
                        _id: '2',
                        title: 'Road Resurfacing - MG Road',
                        date: new Date(2023, 9, 17),  // Oct 17
                        time: '10:00',
                        assignedTo: 'Road Repair Unit A',
                        priority: 'medium',
                        status: 'in-progress'
                    },
                    {
                        _id: '3',
                        title: 'Park Maintenance',
                        date: new Date(2023, 9, 19),  // Oct 19
                        time: '14:00',
                        assignedTo: 'Horticulture Team',
                        priority: 'low',
                        status: 'pending'
                    }
                ];
            }
        } catch (err) {
            console.error('Failed to fetch tasks', err);
            scheduler.state.tasks = [];
        }
    },

    renderCalendar: () => {
        const calendarGrid = document.getElementById('calendar-grid');
        if (!calendarGrid) return;

        const year = scheduler.state.currentYear;
        const month = scheduler.state.currentMonth;

        // Update month/year display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        const monthYearEl = document.getElementById('calendar-month-year');
        if (monthYearEl) {
            monthYearEl.textContent = `${monthNames[month]} ${year}`;
        }

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        // Clear grid
        calendarGrid.innerHTML = '';

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'h-24 bg-slate-50 dark:bg-slate-800/20';
            calendarGrid.appendChild(emptyCell);
        }

        // Add date cells
        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month, day);
            const tasksForDay = scheduler.getTasksForDate(dateObj);

            const cell = document.createElement('div');
            cell.className = 'h-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative';

            // Highlight today
            if (dateObj.toDateString() === today.toDateString()) {
                cell.classList.add('ring-2', 'ring-primary');
            }

            // Highlight selected date
            if (scheduler.state.selectedDate && dateObj.toDateString() === scheduler.state.selectedDate.toDateString()) {
                cell.classList.add('bg-primary/10', 'dark:bg-primary/20');
            }

            // Date number
            const dateNum = document.createElement('div');
            dateNum.className = 'text-sm font-bold text-slate-900 dark:text-white';
            dateNum.textContent = day;
            cell.appendChild(dateNum);

            // Task indicators
            if (tasksForDay.length > 0) {
                const taskBadge = document.createElement('div');
                taskBadge.className = 'absolute top-2 right-2 bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center';
                taskBadge.textContent = tasksForDay.length;
                cell.appendChild(taskBadge);

                // Task dots
                const dotsContainer = document.createElement('div');
                dotsContainer.className = 'flex gap-1 mt-1 flex-wrap';
                tasksForDay.slice(0, 3).forEach(task => {
                    const dot = document.createElement('div');
                    dot.className = `w-1.5 h-1.5 rounded-full ${task.priority === 'high' ? 'bg-red-500' :
                        task.priority === 'medium' ? 'bg-amber-500' :
                            'bg-blue-500'
                        }`;
                    dotsContainer.appendChild(dot);
                });
                cell.appendChild(dotsContainer);
            }

            // Click handler
            cell.onclick = () => scheduler.selectDate(dateObj);

            calendarGrid.appendChild(cell);
        }
    },

    getTasksForDate: (date) => {
        return scheduler.state.tasks.filter(task => {
            const taskDate = new Date(task.date);
            return taskDate.toDateString() === date.toDateString();
        });
    },

    selectDate: (date) => {
        scheduler.state.selectedDate = date;
        scheduler.renderCalendar();
        scheduler.renderTasksForSelectedDate();
    },

    renderTasksForSelectedDate: () => {
        const tasksPanel = document.getElementById('selected-date-tasks');
        const dateTitle = document.getElementById('selected-date-title');

        if (!tasksPanel || !dateTitle) return;

        const tasks = scheduler.getTasksForDate(scheduler.state.selectedDate);

        // Update title
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateTitle.textContent = scheduler.state.selectedDate.toLocaleDateString('en-US', options);

        // Clear panel
        tasksPanel.innerHTML = '';

        if (tasks.length === 0) {
            tasksPanel.innerHTML = `
                <div class="text-center py-8 text-slate-500">
                    <span class="material-symbols-outlined text-4xl mb-2 opacity-50">event_available</span>
                    <p class="text-sm">No tasks scheduled for this date</p>
                </div>
            `;
            return;
        }

        // Render tasks
        tasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = `p-4 rounded-lg border-l-4 ${task.priority === 'high' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
                task.priority === 'medium' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500' :
                    'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                } mb-3`;

            taskCard.innerHTML = `
                <div class="flex items-start justify-between mb-2">
                    <h4 class="font-bold text-sm">${task.title}</h4>
                    <span class="text-xs font-semibold ${task.status === 'completed' ? 'text-green-600' :
                    task.status === 'in-progress' ? 'text-amber-600' :
                        'text-slate-600'
                }">${task.status.toUpperCase().replace('-', ' ')}</span>
                </div>
                <div class="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <span class="flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">schedule</span>
                        ${task.time}
                    </span>
                    <span class="flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">group</span>
                        ${task.assignedTo}
                    </span>
                </div>
            `;

            tasksPanel.appendChild(taskCard);
        });
    },

    attachEvents: () => {
        // Previous month button
        const prevBtn = document.getElementById('calendar-prev');
        if (prevBtn) {
            prevBtn.onclick = () => {
                scheduler.state.currentMonth--;
                if (scheduler.state.currentMonth < 0) {
                    scheduler.state.currentMonth = 11;
                    scheduler.state.currentYear--;
                }
                scheduler.renderCalendar();
            };
        }

        // Next month button
        const nextBtn = document.getElementById('calendar-next');
        if (nextBtn) {
            nextBtn.onclick = () => {
                scheduler.state.currentMonth++;
                if (scheduler.state.currentMonth > 11) {
                    scheduler.state.currentMonth = 0;
                    scheduler.state.currentYear++;
                }
                scheduler.renderCalendar();
            };
        }

        // Today button
        const todayBtn = document.getElementById('calendar-today');
        if (todayBtn) {
            todayBtn.onclick = () => {
                const today = new Date();
                scheduler.state.currentMonth = today.getMonth();
                scheduler.state.currentYear = today.getFullYear();
                scheduler.selectDate(today);
            };
        }
    }
};

// Auto-initialize if on scheduler page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('calendar-grid')) {
        scheduler.init();
    }
});
