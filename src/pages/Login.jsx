import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, Lock } from 'lucide-react';

const LoginPage = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('admin');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

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

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const result = await login(username, password);

        if (result && result.success) {
            navigate('/');
        } else {
            setError(result?.error || 'Invalid credentials');
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

                {/* Role Toggle */}
                <div className="flex justify-center mb-8" style={{ transform: 'translateZ(20px)' }}>
                    <div className="bg-slate-800/80 p-1 rounded-full flex relative">
                        <div
                            className="absolute top-1 left-1 w-[calc(50%-4px)] h-[calc(100%-8px)] bg-blue-600 rounded-full transition-all duration-300"
                            style={{
                                transform: role === 'staff' ? 'translateX(100%)' : 'translateX(0%)',
                                width: '92px'  // Fixed width to match button roughly
                            }}
                        ></div>
                        <button
                            onClick={() => setRole('admin')}
                            className={`relative z-10 w-24 py-1.5 text-sm font-medium transition-colors ${role === 'admin' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Admin
                        </button>
                        <button
                            onClick={() => setRole('staff')}
                            className={`relative z-10 w-24 py-1.5 text-sm font-medium transition-colors ${role === 'staff' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Staff
                        </button>
                    </div>
                </div>

                {/* Form Section */}
                <form onSubmit={handleLogin} className="space-y-5" style={{ transform: 'translateZ(10px)' }}>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-200 text-sm p-3 rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Username"
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
                        <span className="relative z-10">{isLoading ? 'Authenticating...' : 'Initialize System'}</span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    </button>
                </form>



            </div>
        </div>
    );
};

export default LoginPage;
