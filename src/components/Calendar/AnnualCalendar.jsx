import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { SECTORS } from '../../services/mockData';

const AnnualCalendar = ({ issues, selectedDate, onDateSelect }) => {
    // Filter for scheduled maintenance tasks
    const maintenanceTasks = issues.filter(i =>
        (i.type === 'maintenance' || i.status === 'scheduled' || i.scheduledStart) &&
        i.status !== 'cancelled'
    );

    // We'll show the current year's calendar
    // In a full app, you might want to allow year navigation
    const currentYear = new Date().getFullYear();
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Helper to get all days in a month
    const getDaysInMonth = (year, monthIndex) => {
        const date = new Date(year, monthIndex, 1);
        const days = [];
        while (date.getMonth() === monthIndex) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    };

    // Helper to check if two dates are the same day
    const isSameDay = (d1, d2) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    return (
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid var(--color-border)'
            }}>
                <Clock size={20} /> Annual Maintenance Plan ({currentYear})
            </h3>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1rem',
                overflowY: 'auto',
                paddingRight: '0.5rem',
                flex: 1
            }}>
                {months.map((monthName, monthIndex) => {
                    const days = getDaysInMonth(currentYear, monthIndex);
                    // Get start day of week (0-6) for alignment
                    const startDayOfWeek = days[0].getDay();

                    return (
                        <div key={monthName} style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            background: 'white',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)' }}>
                                {monthName}
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, 1fr)',
                                gap: '2px',
                                textAlign: 'center',
                                fontSize: '0.75rem'
                            }}>
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                                    <div key={d} style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{d}</div>
                                ))}

                                {/* Padding for start of month */}
                                {Array(startDayOfWeek).fill(null).map((_, i) => (
                                    <div key={`empty-${i}`} />
                                ))}

                                {days.map(day => {
                                    // Find tasks for this day
                                    const dayTasks = maintenanceTasks.filter(t => {
                                        if (!t.scheduledStart) return false;
                                        return isSameDay(new Date(t.scheduledStart), day);
                                    });

                                    const isSelected = selectedDate && isSameDay(selectedDate, day);
                                    const isToday = isSameDay(new Date(), day);
                                    const hasTasks = dayTasks.length > 0;

                                    // Determine indicator color (use highest priority or first sector)
                                    // If multiple sectors, maybe use a generic color or split?
                                    // For now, let's just show a dot for presence

                                    return (
                                        <div
                                            key={day.toISOString()}
                                            onClick={() => onDateSelect(day)}
                                            style={{
                                                aspectRatio: '1',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                borderRadius: '4px',
                                                background: isSelected ? 'var(--color-primary)' : (isToday ? 'var(--color-bg-subtle)' : 'transparent'),
                                                color: isSelected ? 'white' : (isToday ? 'var(--color-primary)' : 'inherit'),
                                                fontWeight: isSelected || isToday ? 'bold' : 'normal',
                                                position: 'relative',
                                                border: hasTasks && !isSelected ? '1px solid var(--color-border)' : 'none',
                                            }}
                                            className={!isSelected ? "hover-bg-muted" : ""}
                                        >
                                            <span>{day.getDate()}</span>

                                            {/* Task Indicators */}
                                            {hasTasks && (
                                                <div style={{ display: 'flex', gap: '1px', marginTop: '2px' }}>
                                                    {dayTasks.slice(0, 3).map((t, idx) => (
                                                        <div key={idx} style={{
                                                            width: '4px', height: '4px', borderRadius: '50%',
                                                            backgroundColor: isSelected ? 'white' : (SECTORS.find(s => s.id === t.sector)?.color || 'gray')
                                                        }} />
                                                    ))}
                                                    {dayTasks.length > 3 && (
                                                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: isSelected ? 'white' : 'gray' }} />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AnnualCalendar;
