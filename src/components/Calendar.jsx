import React, { useState } from 'react';
import { Calendar as CalendarIcon, Add, FilterList } from '@mui/icons-material';

const Calendar = ({ selectedDate, onDateSelect, tasks = [] }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const daysInMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0
    ).getDate();

    const firstDayOfMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
    ).getDay();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const previousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const getTasksForDate = (day) => {
        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return tasks.filter(task => task.scheduledDate?.startsWith(dateStr));
    };

    const isToday = (day) => {
        const today = new Date();
        return (
            day === today.getDate() &&
            currentMonth.getMonth() === today.getMonth() &&
            currentMonth.getFullYear() === today.getFullYear()
        );
    };

    const isSelected = (day) => {
        if (!selectedDate) return false;
        return (
            day === selectedDate.getDate() &&
            currentMonth.getMonth() === selectedDate.getMonth() &&
            currentMonth.getFullYear() === selectedDate.getFullYear()
        );
    };

    const handleDateClick = (day) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        onDateSelect(newDate);
    };

    return (
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                    <CalendarIcon className="text-[var(--primary)]" />
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={previousMonth}
                        className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors text-sm font-medium"
                    >
                        ←
                    </button>
                    <button
                        onClick={nextMonth}
                        className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors text-sm font-medium"
                    >
                        →
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div
                        key={day}
                        className="text-center text-xs font-bold text-[var(--text-light)] uppercase py-2"
                    >
                        {day}
                    </div>
                ))}

                {/* Empty cells for days before month starts */}
                {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                    <div key={`empty-${index}`} className="aspect-square" />
                ))}

                {/* Days of month */}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                    const day = index + 1;
                    const dayTasks = getTasksForDate(day);
                    const hasHighPriority = dayTasks.some(t => t.priority === 'high' || t.priority === 'critical');

                    return (
                        <button
                            key={day}
                            onClick={() => handleDateClick(day)}
                            className={`
                                aspect-square rounded-lg p-1 text-sm font-medium transition-all relative
                                ${isToday(day) ? 'border-2 border-[var(--primary)]' : 'border border-transparent'}
                                ${isSelected(day) ? 'bg-[var(--primary)] text-white shadow-md' :
                                    dayTasks.length > 0 ? 'bg-blue-50 hover:bg-blue-100' :
                                        'hover:bg-[var(--surface-hover)]'}
                            `}
                        >
                            <span className={isSelected(day) ? 'text-white' : 'text-[var(--text-main)]'}>
                                {day}
                            </span>
                            {dayTasks.length > 0 && (
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                    <div className={`w-1 h-1 rounded-full ${hasHighPriority ? 'bg-red-500' : isSelected(day) ? 'bg-white' : 'bg-[var(--primary)]'}`} />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-[var(--border)] text-xs">
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded border-2 border-[var(--primary)]" />
                    <span className="text-[var(--text-secondary)]">Today</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-blue-50" />
                    <span className="text-[var(--text-secondary)]">Has tasks</span>
                </div>
            </div>
        </div>
    );
};

export default Calendar;
