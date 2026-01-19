import React, { useState, useEffect } from 'react';
import AnnualCalendar from '../components/Calendar/AnnualCalendar';
import SidePanel from '../components/Calendar/SidePanel';
import { ISSUES } from '../services/mockData';

const CalendarPage = () => {
    const [selectedDate, setSelectedDate] = useState(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    // Initialize state from localStorage or mock data
    const [issues, setIssues] = useState(() => {
        const savedIssues = localStorage.getItem('municipal_issues');
        return savedIssues ? JSON.parse(savedIssues) : ISSUES;
    });

    // Persist to localStorage whenever issues change
    useEffect(() => {
        localStorage.setItem('municipal_issues', JSON.stringify(issues));
    }, [issues]);

    const onDateSelect = (date) => {
        setSelectedDate(date);
        setIsPanelOpen(true);
    };

    const closePanel = () => {
        setIsPanelOpen(false);
        // Optional: clear selected date when closing? 
        // Better to keep it selected visually but close the panel.
        // setSelectedDate(null); 
    };

    const handleAddTask = (newTask) => {
        const taskWithId = { ...newTask, id: `ISS-${Date.now()}` };
        setIssues([...issues, taskWithId]);
    };

    const handleUpdateTask = (updatedTask) => {
        setIssues(issues.map(i => i.id === updatedTask.id ? updatedTask : i));
    };

    const handleDeleteTask = (taskId) => {
        setIssues(issues.filter(i => i.id !== taskId));
    };

    // Filter tasks for the selected date
    const getTasksForDate = (date) => {
        if (!date) return [];
        return issues.filter(issue => {
            if (!issue.scheduledStart) return false;
            const issueDate = new Date(issue.scheduledStart);
            return (
                issueDate.getDate() === date.getDate() &&
                issueDate.getMonth() === date.getMonth() &&
                issueDate.getFullYear() === date.getFullYear()
            );
        });
    };

    const selectedTasks = getTasksForDate(selectedDate);

    return (
        <div className="animate-fade-in" style={{ height: 'calc(100vh - 2rem)', display: 'flex', flexDirection: 'column' }}>
            <header style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Maintenance Schedule</h1>
                <p style={{ color: 'var(--color-text-muted)' }}>Manage and track daily municipal maintenance tasks.</p>
            </header>

            <div style={{ flex: 1, display: 'flex', gap: '1.5rem', overflow: 'hidden', position: 'relative' }}>
                <div style={{ flex: 1, overflowY: 'hidden', paddingRight: '0.5rem' }}>
                    <AnnualCalendar
                        issues={issues}
                        selectedDate={selectedDate}
                        onDateSelect={onDateSelect}
                    />
                </div>

                {/* Side Panel Wrapper with animation logic */}
                <div style={{
                    width: isPanelOpen ? '420px' : '0',
                    opacity: isPanelOpen ? 1 : 0,
                    transition: 'all 0.3s ease-in-out',
                    overflow: 'hidden',
                    borderLeft: isPanelOpen ? '1px solid var(--color-border)' : 'none',
                    paddingLeft: isPanelOpen ? '1.5rem' : '0',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <SidePanel
                        date={selectedDate}
                        tasks={selectedTasks}
                        onClose={closePanel}
                        onAddTask={handleAddTask}
                        onUpdateTask={handleUpdateTask}
                        onDeleteTask={handleDeleteTask}
                    />
                </div>
            </div>
        </div>
    );
};

export default CalendarPage;
