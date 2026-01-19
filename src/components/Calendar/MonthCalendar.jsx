import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SECTORS } from '../../services/mockData';

const MonthCalendar = ({ issues, selectedDate, onDateSelect }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const monthName = currentMonth.toLocaleString('default', { month: 'long' });

    const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

    const weeks = [];
    let days = [];
    // Pad start
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    // Days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }
    // Chunk into weeks
    while (days.length > 0) {
        weeks.push(days.splice(0, 7));
    }

    // Task helper
    const getTasksForDay = (date) => {
        if (!date) return [];
        return issues.filter(i => {
            if (!i.scheduledStart) return false;
            const d = new Date(i.scheduledStart);
            return d.getDate() === date.getDate() &&
                d.getMonth() === date.getMonth() &&
                d.getFullYear() === date.getFullYear();
        });
    };

    const isToday = (date) => {
        if (!date) return false;
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const isSelected = (date) => {
        if (!date || !selectedDate) return false;
        return date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();
    };

    return (
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{monthName} {year}</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={prevMonth} className="btn btn-outline" style={{ padding: '0.5rem' }}><ChevronLeft size={20} /></button>
                    <button onClick={nextMonth} className="btn btn-outline" style={{ padding: '0.5rem' }}><ChevronRight size={20} /></button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--color-border)', flex: 1, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} style={{ background: 'var(--color-card)', padding: '0.75rem', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem' }}>{d}</div>
                ))}

                {weeks.flat().map((date, idx) => {
                    const dayTasks = getTasksForDay(date);
                    const isDaySelected = isSelected(date);
                    const isDayToday = isToday(date);
                    const hasTasks = dayTasks.length > 0;

                    return (
                        <div
                            key={idx}
                            onClick={() => date && onDateSelect(date)}
                            style={{
                                background: isDaySelected ? 'var(--color-primary-light)' : 'var(--color-card)',
                                padding: '0.5rem',
                                minHeight: '100px',
                                cursor: date ? 'pointer' : 'default',
                                position: 'relative',
                                transition: 'background 0.2s',
                                border: isDaySelected ? '2px solid var(--color-primary)' : 'none'
                            }}
                            className={date && !isDaySelected ? 'hover-bg-muted' : ''}
                        >
                            {date && (
                                <>
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem',
                                        fontWeight: isDayToday ? 700 : 400,
                                        color: isDayToday ? 'var(--color-primary)' : 'inherit'
                                    }}>
                                        <span style={{
                                            width: 24, height: 24, display: 'grid', placeItems: 'center',
                                            borderRadius: '50%', background: isDayToday ? 'var(--color-primary)' : 'transparent',
                                            color: isDayToday ? 'white' : 'inherit'
                                        }}>
                                            {date.getDate()}
                                        </span>
                                        {hasTasks && <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{dayTasks.length} tasks</span>}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        {dayTasks.slice(0, 3).map(task => {
                                            const sectorColor = SECTORS.find(s => s.id === task.sector)?.color || '#999';
                                            return (
                                                <div key={task.id} style={{
                                                    fontSize: '0.7rem',
                                                    padding: '2px 4px',
                                                    borderRadius: '3px',
                                                    background: sectorColor + '20',
                                                    color: sectorColor,
                                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                    borderLeft: `2px solid ${sectorColor}`
                                                }}>
                                                    {task.title}
                                                </div>
                                            );
                                        })}
                                        {dayTasks.length > 3 && (
                                            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                                                +{dayTasks.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MonthCalendar;
