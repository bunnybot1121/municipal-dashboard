import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, User, Lock } from 'lucide-react';

const LoginPage = () => {
    const { login, signup, user, loading } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('admin');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    const navigate = useNavigate();
    const cardRef = useRef(null);
    const btnRef = useRef(null);

    // --- 3D TILT EFFECT ---
    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;

        const handleMouseMove = (e) => {
            const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
            const yAxis = (window.innerHeight / 2 - e.pageY) / 25;
            card.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
        };

        const handleMouseLeave = () => {
            card.style.transform = `rotateY(0deg) rotateX(0deg)`;
        };

        document.addEventListener('mousemove', handleMouseMove);
        // Optional: Reset on leave if intended, but full screen tracking is requested

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    // --- MAGNETIC BUTTON EFFECT ---
    useEffect(() => {
        const btn = btnRef.current;
        if (!btn) return;

        const handleBtnMove = (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px) translateZ(20px)`; // Added translateZ to keep 3D hierarchy
        };

        const handleBtnLeave = () => {
            btn.style.transform = `translate(0px, 0px) translateZ(20px)`;
        };

        btn.addEventListener('mousemove', handleBtnMove);
        btn.addEventListener('mouseleave', handleBtnLeave);

        return () => {
            btn.removeEventListener('mousemove', handleBtnMove);
            btn.removeEventListener('mouseleave', handleBtnLeave);
        };
    }, []);

    // Redirect if already logged in
    useEffect(() => {
        if (!loading && user) {
            // Immediate redirect if user is already authenticated
            navigate('/');
        }
    }, [user, loading, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        let authResult;
        if (isRegistering) {
            // Default to 'admin' or 'citizen' since Staff role is removed from UI
            // For now, we defaults to 'admin' for this dashboard app as per context
            authResult = await signup(username, password, fullName, 'admin');
        } else {
            authResult = await login(username, password);
        }

        if (authResult?.success) {
            // Redirect handled by useEffect
        } else {
            setError(authResult?.error || 'Authentication failed');
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-full flex items-center justify-center overflow-hidden relative"
            style={{ background: '#0f172a' }}> {/* Fallback bg */}

            {/* Background Image & Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=2070&auto=format&fit=crop"
                    className="w-full h-full object-cover opacity-40"
                    alt="City Background"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40"></div>
            </div>

            {/* Glass Card */}
            <div
                id="login-card"
                ref={cardRef}
                className="glass-card z-10 p-10 rounded-2xl w-full max-w-md transform transition-all duration-100 ease-out"
                style={{ transformStyle: 'preserve-3d' }}
            >

                {/* Header Section */}
                <div className="text-center mb-8 levitate-icon" style={{ transform: 'translateZ(30px)' }}>
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/20 text-blue-400 mb-4 ring-1 ring-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mt-2">Nagarsevak AI</h1>
                    <p className="text-slate-400 text-sm mt-1">Unified Municipal Command</p>
                </div>

                {/* Role Toggle REMOVED */}

                {/* Form Section */}
                <form onSubmit={handleLogin} className="space-y-5" style={{ transform: 'translateZ(10px)' }}>



                    {isRegistering && (
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-slate-800/50 text-white pl-12 pr-4 py-3.5 rounded-xl border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-slate-800 transition-all outline-none placeholder:text-slate-500"
                            />
                        </div>
                    )}

                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-slate-800/50 text-white pl-12 pr-4 py-3.5 rounded-xl border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-slate-800 transition-all outline-none placeholder:text-slate-500"
                        />
                    </div>

                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-800/50 text-white pl-12 pr-4 py-3.5 rounded-xl border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-slate-800 transition-all outline-none placeholder:text-slate-500"
                        />
                    </div>

                    <button
                        ref={btnRef}
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all relative overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed"
                        style={{ transform: 'translateZ(20px)' }}
                    >
                        <span className="relative z-10">{isLoading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Initialize System')}</span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    </button>

                    <div className="text-center mt-4" style={{ transform: 'translateZ(10px)' }}>
                        <button
                            type="button"
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setError('');
                            }}
                            className="text-slate-400 hover:text-white text-sm transition-colors hover:underline"
                        >
                            {isRegistering ? 'Already have credentials? Login' : 'No credentials? Register Access'}
                        </button>
                    </div>
                </form>



            </div>
        </div>
    );
};

export default LoginPage;
