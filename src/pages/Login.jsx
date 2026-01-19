import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, UserCog } from 'lucide-react';
import '../styles/index.css';

const LoginPage = () => {
    const [role, setRole] = useState('admin'); // admin | staff
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API delay
        setTimeout(() => {
            const mockUser = role === 'admin'
                ? { id: 'u1', name: 'Admin Authority', role: 'admin' }
                : { id: 'u2', name: 'Field Staff', role: 'staff' };

            localStorage.setItem('user', JSON.stringify(mockUser));
            setIsLoading(false);
            navigate('/');
        }, 1000);
    };

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
        }}>
            <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2.5rem',
                background: 'rgba(255,255,255,0.95)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        background: 'var(--color-primary)',
                        borderRadius: 12,
                        margin: '0 auto 1rem auto',
                        display: 'grid',
                        placeItems: 'center',
                        color: 'white'
                    }}>
                        <ShieldCheck size={28} />
                    </div>
                    <h1 style={{ marginBottom: '0.5rem' }}>For The People</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Unified Municipal Maintenance System</p>
                </div>

                <div style={{
                    display: 'flex',
                    background: '#f1f5f9',
                    padding: '0.25rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '2rem'
                }}>
                    <button
                        type="button"
                        className={role === 'admin' ? 'active-role' : 'inactive-role'}
                        onClick={() => setRole('admin')}
                        style={{
                            flex: 1,
                            padding: '0.5rem',
                            border: 'none',
                            background: role === 'admin' ? 'white' : 'transparent',
                            borderRadius: 'var(--radius-sm)',
                            boxShadow: role === 'admin' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                            fontWeight: 500,
                            cursor: 'pointer',
                            color: role === 'admin' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Admin Portal
                    </button>
                    <button
                        type="button"
                        className={role === 'staff' ? 'active-role' : 'inactive-role'}
                        onClick={() => setRole('staff')}
                        style={{
                            flex: 1,
                            padding: '0.5rem',
                            border: 'none',
                            background: role === 'staff' ? 'white' : 'transparent',
                            borderRadius: 'var(--radius-sm)',
                            boxShadow: role === 'staff' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                            fontWeight: 500,
                            cursor: 'pointer',
                            color: role === 'staff' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Staff Access
                    </button>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                            Username / ID
                        </label>
                        <input
                            type="text"
                            placeholder={role === 'admin' ? 'admin@city.gov' : 'staff_id_001'}
                            defaultValue={role === 'admin' ? 'admin' : 'staff'}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                outline: 'none',
                                boxSizing: 'border-box' // Fix styling issue
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            defaultValue="password"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading}
                        style={{
                            marginTop: '1rem',
                            justifyContent: 'center',
                            padding: '0.875rem',
                            opacity: isLoading ? 0.7 : 1
                        }}
                    >
                        {isLoading ? 'Authenticating...' : 'Secure Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
