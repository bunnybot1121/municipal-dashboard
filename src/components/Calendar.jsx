import React, { useState } from 'react';
import { CalendarMonth as CalendarIcon, Add, FilterList } from '@mui/icons-material';

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
        <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-lg p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white drop-shadow-sm flex items-center gap-2">
                    <CalendarIcon className="text-blue-400" />
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={previousMonth}
                        className="px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 transition-colors text-sm font-medium text-white/80"
                    >
                        ←
                    </button>
                    <button
                        onClick={nextMonth}
                        className="px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 transition-colors text-sm font-medium text-white/80"
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
                        className="text-center text-xs font-bold text-white/50 uppercase py-2"
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
                                aspect-square rounded-lg p-1 text-sm font-medium transition-all relative flex flex-col items-center justify-center
                                ${isToday(day) ? 'border-2 border-blue-400' : 'border border-transparent'}
                                ${isSelected(day) ? 'bg-blue-500 text-white shadow-md' :
                                    dayTasks.length > 0 ? 'bg-white/10 text-white hover:bg-white/20' :
                                        'text-white/80 hover:bg-white/10'}
                            `}
                        >
                            <span>
                                {day}
                            </span>
                            {dayTasks.length > 0 && (
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 mt-0.5">
                                    <div className={`w-1 h-1 rounded-full ${hasHighPriority ? 'bg-red-400' : isSelected(day) ? 'bg-white' : 'bg-blue-400'}`} />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/20 text-xs text-white/70 font-medium">
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded border-2 border-blue-400" />
                    <span>Today</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-white/10 backdrop-blur-sm" />
                    <span>Has tasks</span>
                </div>
            </div>
        </div>
    );
};

export default Calendar;
