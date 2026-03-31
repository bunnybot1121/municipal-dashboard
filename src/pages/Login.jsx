import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, User, Lock, ChevronDown } from 'lucide-react';

const LoginPage = () => {
    const { login, signup, user, loading } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('admin');
    const [selectedDept, setSelectedDept] = useState('roads');
    const [deptRole, setDeptRole] = useState('department');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

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
        const finalRole = role === 'department' ? deptRole : role;
        const finalSector = role === 'department' ? selectedDept : null;

        if (isRegistering) {
            authResult = await signup(username, password, fullName, finalRole, finalSector);
        } else {
            authResult = await login(username, password, finalRole, finalSector);
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
                                placeholder="Full Name (Alphabets only)"
                                value={fullName}
                                maxLength={50}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^[A-Za-z\s]*$/.test(val)) {
                                        setFullName(val);
                                    }
                                }}
                                className="w-full bg-transparent text-white px-6 py-4 rounded-full border border-white/40 focus:border-white focus:ring-1 focus:ring-white transition-all duration-300 outline-none placeholder:text-white/60 font-light"
                            />
                        </div>
                    )}

                    {/* Role Toggle for Registration and Login context */}
                    <div className="flex bg-white/10 rounded-full p-1 border border-white/20">
                        <button 
                            type="button" 
                            onClick={() => setRole('admin')} 
                            className={`flex-1 py-3 text-sm font-medium rounded-full transition-all duration-300 ${role === 'admin' ? 'bg-white text-emerald-950 shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                        >
                           Admin Access
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setRole('department')} 
                            className={`flex-1 py-3 text-sm font-medium rounded-full transition-all duration-300 ${role === 'department' ? 'bg-white text-emerald-950 shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                        >
                           Department
                        </button>
                    </div>

                    {role === 'department' && (
                        <div className="space-y-4">
                            {/* Department Selection */}
                            <div className="relative group">
                                <div 
                                    onClick={() => {
                                        setIsDeptDropdownOpen(!isDeptDropdownOpen);
                                        setIsRoleDropdownOpen(false);
                                    }}
                                    className="w-full bg-black/20 text-white px-6 py-4 rounded-full border border-white/40 hover:border-white cursor-pointer flex justify-between items-center transition-all duration-300 shadow-inner"
                                >
                                    <span className="font-light tracking-wide">{selectedDept.charAt(0).toUpperCase() + selectedDept.slice(1)} Department</span>
                                    <ChevronDown className={`w-5 h-5 text-white/70 transition-transform duration-300 ${isDeptDropdownOpen ? 'rotate-180' : ''}`} />
                                </div>
                                
                                {isDeptDropdownOpen && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-black/90 backdrop-blur-2xl border border-white/20 rounded-2xl overflow-hidden z-50 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transform opacity-100 scale-100 transition-all duration-200">
                                        {['roads', 'water', 'electricity', 'sewage'].map((d) => (
                                            <div 
                                                key={d}
                                                onClick={() => {
                                                    setSelectedDept(d);
                                                    setIsDeptDropdownOpen(false);
                                                }}
                                                className={`px-6 py-3.5 cursor-pointer transition-colors duration-200 font-light tracking-wide ${
                                                    selectedDept === d 
                                                    ? 'bg-emerald-500/20 text-emerald-300 border-l-2 border-emerald-400' 
                                                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                                                }`}
                                            >
                                                {d.charAt(0).toUpperCase() + d.slice(1)} Department
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Role Selection */}
                            <div className="relative group">
                                <div 
                                    onClick={() => {
                                        setIsRoleDropdownOpen(!isRoleDropdownOpen);
                                        setIsDeptDropdownOpen(false);
                                    }}
                                    className="w-full bg-black/20 text-white px-6 py-4 rounded-full border border-white/40 hover:border-white cursor-pointer flex justify-between items-center transition-all duration-300 shadow-inner"
                                >
                                    <span className="font-light tracking-wide">
                                        {deptRole === 'department' ? 'HOD (Head of Department)' : (deptRole === 'senior_engineer' ? 'Senior Engineer' : 'Junior Engineer')}
                                    </span>
                                    <ChevronDown className={`w-5 h-5 text-white/70 transition-transform duration-300 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                                </div>
                                
                                {isRoleDropdownOpen && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-black/90 backdrop-blur-2xl border border-white/20 rounded-2xl overflow-hidden z-50 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transform opacity-100 scale-100 transition-all duration-200">
                                        <div 
                                            onClick={() => {
                                                setDeptRole('department');
                                                setIsRoleDropdownOpen(false);
                                            }}
                                            className={`px-6 py-3.5 cursor-pointer transition-colors duration-200 font-light tracking-wide ${
                                                deptRole === 'department' 
                                                ? 'bg-emerald-500/20 text-emerald-300 border-l-2 border-emerald-400' 
                                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                                            }`}
                                        >
                                            HOD (Head of Department)
                                        </div>
                                        <div 
                                            onClick={() => {
                                                setDeptRole('senior_engineer');
                                                setIsRoleDropdownOpen(false);
                                            }}
                                            className={`px-6 py-3.5 cursor-pointer transition-colors duration-200 font-light tracking-wide ${
                                                deptRole === 'senior_engineer' 
                                                ? 'bg-emerald-500/20 text-emerald-300 border-l-2 border-emerald-400' 
                                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                                            }`}
                                        >
                                            Senior Engineer
                                        </div>
                                        <div 
                                            onClick={() => {
                                                setDeptRole('junior_engineer');
                                                setIsRoleDropdownOpen(false);
                                            }}
                                            className={`px-6 py-3.5 cursor-pointer transition-colors duration-200 font-light tracking-wide ${
                                                deptRole === 'junior_engineer' 
                                                ? 'bg-emerald-500/20 text-emerald-300 border-l-2 border-emerald-400' 
                                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                                            }`}
                                        >
                                            Junior Engineer
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="relative group flex items-center">
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={username}
                            maxLength={50}
                            onChange={(e) => setUsername(e.target.value.trim())}
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
