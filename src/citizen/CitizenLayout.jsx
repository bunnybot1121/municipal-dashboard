import React from 'react';
import { Outlet } from 'react-router-dom';

export const CitizenLayout = () => {
    return (
        <div className="citizen-layout" style={{
            fontFamily: 'Inter, sans-serif',
            backgroundColor: '#111827',
            minHeight: '100vh',
            color: '#e5e7eb'
        }}>
            <header style={{
                padding: '1rem',
                backgroundColor: '#1f2937',
                borderBottom: '1px solid #374151',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
            }}>
                <img src="/logo.png" alt="Logo" style={{ width: '48px', height: '48px', borderRadius: '12px' }} />
                <div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#60a5fa', margin: 0 }}>
                        Nagarsevak Setup
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: 0 }}>Citizen Reporting Portal</p>
                </div>
            </header>
            <main>
                <Outlet />
            </main>
        </div>
    );
};
