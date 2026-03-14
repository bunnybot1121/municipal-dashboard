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
        <div className="h-screen w-full flex items-center justify-center overflow-hidden relative font-sans">

            {/* Photorealistic Bright Background (Nature/Architecture) */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop"
                    className="w-full h-full object-cover"
                    alt="Elegant nature mountain background"
                />
                {/* Very light overlay just to ensure text readability, but keeping it bright like the reference */}
                <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
            </div>

            {/* Elegant Thin Glass Card */}
            <div
                id="login-card"
                ref={cardRef}
                className="z-10 p-12 w-full max-w-[450px] transform transition-all duration-300 ease-out bg-white/5 backdrop-blur-xl border border-white/30 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.1)] mx-4 relative overflow-hidden"
            >

                {/* Header Section */}
                <div className="text-center mb-12 levitate-icon">
                    <h1 className="text-4xl font-normal text-white tracking-tight drop-shadow-sm mb-2">Nagarsevak</h1>
                    <p className="text-white/80 text-sm font-light tracking-wide uppercase drop-shadow-sm">Municipal Command</p>
                </div>

                {/* Form Section */}
                <form onSubmit={handleLogin} className="space-y-6">

                    {isRegistering && (
                        <div className="relative group flex items-center">
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-transparent text-white px-6 py-4 rounded-full border border-white/40 focus:border-white focus:ring-1 focus:ring-white transition-all duration-300 outline-none placeholder:text-white/60 font-light"
                            />
                        </div>
                    )}

                    <div className="relative group flex items-center">
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-transparent text-white px-6 py-4 rounded-full border border-white/40 focus:border-white focus:ring-1 focus:ring-white transition-all duration-300 outline-none placeholder:text-white/60 font-light"
                        />
                    </div>

                    <div className="relative group flex items-center">
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-transparent text-white px-6 py-4 rounded-full border border-white/40 focus:border-white focus:ring-1 focus:ring-white transition-all duration-300 outline-none placeholder:text-white/60 font-light"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            ref={btnRef}
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-medium py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Initialize System')}
                        </button>
                    </div>

                    <div className="text-center mt-6 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setError('');
                            }}
                            className="text-white/70 hover:text-white text-sm font-light transition-colors duration-300"
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
