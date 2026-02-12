import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Dashboard as DashboardIcon,
    Assignment,
    CalendarMonth,
    BarChart,
    People,
    Menu,
    ChevronLeft,
    Logout,
    AccountCircle
} from '@mui/icons-material';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
    const location = useLocation();

    const navItems = [
        { path: '/', icon: DashboardIcon, label: 'Dashboard' },
        { path: '/issues', icon: Assignment, label: 'Issues' },
        { path: '/scheduler', icon: CalendarMonth, label: 'Maintenance' },
        { path: '/analytics', icon: BarChart, label: 'Analytics' },
        { path: '/staff', icon: People, label: 'Staff' }
    ];

    const isActive = (path) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}>
            {/* Header */}
            <div className="sidebar-header">
                {!isCollapsed && (
                    <div className="sidebar-brand">
                        <div className="brand-icon">🏛️</div>
                        <span className="brand-text">Nagarsevak AI</span>
                    </div>
                )}
                <button
                    className="sidebar-toggle"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? <Menu /> : <ChevronLeft />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
                        title={isCollapsed ? item.label : ''}
                    >
                        <item.icon className="nav-icon" />
                        {!isCollapsed && <span className="nav-label">{item.label}</span>}
                        {isActive(item.path) && <div className="active-indicator" />}
                    </Link>
                ))}
            </nav>

            {/* User Section */}
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <AccountCircle className="user-avatar" />
                    {!isCollapsed && (
                        <div className="user-info">
                            <div className="user-name">Admin</div>
                            <div className="user-role">System Admin</div>
                        </div>
                    )}
                </div>
                {!isCollapsed && (
                    <button className="sidebar-logout">
                        <Logout fontSize="small" />
                        <span>Logout</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
