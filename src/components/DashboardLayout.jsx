import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListTodo, LogOut, Settings, ShieldAlert, Calendar as CalendarIcon } from 'lucide-react';

const Sidebar = () => {
    const navigate = useNavigate();
    // Mock logout
    const handleLogout = () => {
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <div className="sidebar">
            <div style={{ padding: '0 0.5rem 2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 32, height: 32, background: 'var(--color-primary)', borderRadius: 8, display: 'grid', placeItems: 'center', color: 'white' }}>
                    <ShieldAlert size={20} />
                </div>
                <div>
                    <h3 style={{ fontSize: '1.1rem' }}>MuniSafe</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Admin Dashboard</span>
                </div>
            </div>

            <nav style={{ flex: 1 }}>
                <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <LayoutDashboard size={20} />
                    <span>Overview</span>
                </NavLink>
                <NavLink to="/calendar" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <CalendarIcon size={20} />
                    <span>Calendar</span>
                </NavLink>
                <NavLink to="/issues" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <ListTodo size={20} />
                    <span>Issue Management</span>
                </NavLink>
                <div className="nav-item" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                    <Settings size={20} />
                    <span>Settings (Locked)</span>
                </div>
            </nav>

            <button onClick={handleLogout} className="nav-item" style={{ marginTop: 'auto', border: 'none', background: 'transparent', cursor: 'pointer', width: '100%' }}>
                <LogOut size={20} />
                <span>Logout</span>
            </button>
        </div>
    );
};

export const DashboardLayout = () => {
    return (
        <div className="layout-container">
            <Sidebar />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};
