import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen relative font-sans overflow-hidden">
            {/* Global Photorealistic Background */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop"
                    className="w-full h-full object-cover"
                    alt="Elegant nature mountain background"
                />
                <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
            </div>

            {/* Content Container - z-index ensures it sits above the background */}
            <div className="flex w-full h-screen relative z-10">
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
        </div>
    );
};

export { Layout as DashboardLayout };
