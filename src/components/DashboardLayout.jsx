import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-[var(--background)]">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <main
                className="flex-1 p-6 md:p-8 overflow-y-auto transition-all duration-300"
                style={{
                    marginLeft: isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)'
                }}
            >
                <Outlet />
            </main>
        </div>
    );
};

export { Layout as DashboardLayout };
