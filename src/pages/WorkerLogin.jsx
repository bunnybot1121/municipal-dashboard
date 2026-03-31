import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, ArrowRight, Loader } from 'lucide-react';

const DOMAIN = 'nagarsevak.com';

export default function WorkerLogin() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleLogin(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const trimmedUsername = username.trim().toLowerCase();

            // Query profiles directly by username + password (no Supabase Auth needed)
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', trimmedUsername)
                .eq('password', password)
                .single();

            if (profileError || !profile) {
                throw new Error('Incorrect username or password.');
            }

            if (!['worker', 'staff', 'admin'].includes(profile.role)) {
                throw new Error('Access denied. This portal is for field workers only.');
            }

            // Store worker session in localStorage
            localStorage.setItem('worker_session', JSON.stringify({
                id: profile.id,
                username: profile.username,
                full_name: profile.full_name,
                role: profile.role,
                sector: profile.sector,
                assigned_zone: profile.assigned_zone
            }));

            navigate('/worker/dashboard', { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div style={{ width: '100%', maxWidth: '400px' }}>
                {/* Logo / Brand */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 12px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                        🏛️
                    </div>
                    <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '22px', margin: 0 }}>Nagarsevak AI</h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginTop: '4px' }}>Worker Field Portal</p>
                </div>

                {/* Card */}
                <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
                    <h2 style={{ fontWeight: 700, fontSize: '20px', color: '#111', marginBottom: '6px', marginTop: 0 }}>Welcome back</h2>
                    <p style={{ color: '#888', fontSize: '13px', marginBottom: '24px', marginTop: 0 }}>Sign in with your worker credentials</p>

                    {error && (
                        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                                Username
                            </label>
                            <input
                                type="text" required autoFocus
                                value={username} onChange={e => setUsername(e.target.value)}
                                placeholder="e.g. ravi123"
                                style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #E5E7EB', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', fontFamily: 'monospace', fontWeight: 600 }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPass ? 'text' : 'password'} required
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="Your password"
                                    style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #E5E7EB', borderRadius: '10px', padding: '10px 40px 10px 14px', fontSize: '14px', outline: 'none' }}
                                />
                                <button type="button" onClick={() => setShowPass(v => !v)}
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #5B52FF, #4338ca)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
                            {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={16} />}
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '12px', marginTop: '20px', marginBottom: 0 }}>
                        Forgot your credentials? Contact your supervisor.
                    </p>
                </div>

                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '24px' }}>
                    Admin portal at <strong style={{ color: 'rgba(255,255,255,0.6)' }}>/login</strong>
                </p>
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
