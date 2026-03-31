import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Dashboard as DashboardIcon,
    Assignment,
    CalendarMonth,
    BarChart,
    People,
    Menu,
    ChevronLeft,
    Logout,
    AccountCircle,
    Settings as SettingsIcon,
    ReportProblem,
    NotificationsOutlined
} from '@mui/icons-material';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
    const location = useLocation();
    const { logout, isAdmin, isDepartment, isSeniorEngineer, isJuniorEngineer, department } = useAuth();

    const allNavItems = [
        { path: '/', icon: DashboardIcon, label: 'Dashboard' },
        { path: '/issues', icon: Assignment, label: 'Scheduled Tasks' },
        { path: '/citizen-reports', icon: ReportProblem, label: 'Citizen Reports' },
        { path: '/notifications', icon: NotificationsOutlined, label: 'Notifications' },
        { path: '/scheduler', icon: CalendarMonth, label: 'Maintenance' },
        { path: '/analytics', icon: BarChart, label: 'Analytics' },
        { path: '/staff', icon: People, label: 'Field Supervisors' },
        { path: '/settings', icon: SettingsIcon, label: 'Settings' }
    ];

    const hodNavItems = [
        { path: '/', icon: DashboardIcon, label: 'Dashboard' },
        { path: '/issues', icon: Assignment, label: 'Scheduled Tasks' },
        { path: '/citizen-reports', icon: ReportProblem, label: 'Citizen Reports' },
        { path: '/scheduler', icon: CalendarMonth, label: 'Maintenance' },
        { path: '/analytics', icon: BarChart, label: 'Analytics' },
        { path: '/settings', icon: SettingsIcon, label: 'Settings' }
    ];

    const navItems = isDepartment ? hodNavItems : allNavItems;

    const isActive = (path) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <div className={`
            flex flex-col h-full bg-white/5 backdrop-blur-2xl border-r border-white/20 
            text-white transition-all duration-300 shadow-2xl relative z-10
            ${isCollapsed ? 'w-[72px]' : 'w-64'}
        `}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0 min-h-[72px]">
                {!isCollapsed && (
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="text-2xl drop-shadow-md">🏛️</div>
                        <span className="font-bold text-lg tracking-wide whitespace-nowrap overflow-hidden text-ellipsis drop-shadow-sm">Nagarsevak</span>
                    </div>
                )}
                <button
                    className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? <Menu /> : <ChevronLeft />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`
                                flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                                ${active
                                    ? 'bg-white/10 text-white font-medium border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                }
                                ${isCollapsed ? 'justify-center' : ''}
                            `}
                            title={isCollapsed ? item.label : ''}
                        >
                            <item.icon className={`shrink-0 transition-colors ${active ? 'text-emerald-400' : 'text-white/50 group-hover:text-white'}`} style={{ fontSize: 22 }} />
                            {!isCollapsed && <span className="truncate">{item.label}</span>}
                            
                            {/* Active dot indicator for collapsed state */}
                            {active && isCollapsed && (
                                <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-white/10 shrink-0">
                <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''} mb-4`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 border border-white/20 shadow-md">
                        <span className="text-white font-bold text-sm">A</span>
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 overflow-hidden">
                            <div className="text-white font-medium text-sm truncate">
                                {isAdmin ? 'System Admin' : 
                                 isDepartment ? `${department ? department.charAt(0).toUpperCase() + department.slice(1) : ''} Command Center` :
                                 isSeniorEngineer ? `${department ? department.charAt(0).toUpperCase() + department.slice(1) : ''} Senior Eng.` :
                                 isJuniorEngineer ? `${department ? department.charAt(0).toUpperCase() + department.slice(1) : ''} Junior Eng.` :
                                 (department ? `${department.charAt(0).toUpperCase() + department.slice(1)} Dept` : 'Staff')}
                            </div>
                            <div className="text-emerald-400 text-xs truncate">
                                {isAdmin ? 'System Admin View' : 
                                 isDepartment ? 'Head of Department' :
                                 isSeniorEngineer ? 'Senior Engineer View' :
                                 isJuniorEngineer ? 'Junior Engineer View' :
                                 'Department View'}
                            </div>
                        </div>
                    )}
                </div>
                {!isCollapsed && (
                    <button 
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-400 rounded-xl transition-colors border border-transparent hover:border-red-500/30 text-sm font-medium" 
                        onClick={logout}
                    >
                        <Logout fontSize="small" />
                        <span>Logout</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
