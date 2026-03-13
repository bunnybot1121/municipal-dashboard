
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Check if we have a worker session in localStorage first
        const workerSession = localStorage.getItem('worker_session');
        if (workerSession) {
            try {
                const worker = JSON.parse(workerSession);
                setUser(worker);
                setLoading(false);
                return; // skip Supabase check if we're a worker
            } catch (e) {
                console.error("Failed to parse worker session", e);
                localStorage.removeItem('worker_session');
            }
        }

        // 2. Check active Supabase session (for Admins/Staff/Citizens)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                fetchProfile(session.user);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                fetchProfile(session.user);
            } else {
                // Only clear if we're NOT a worker (workers don't have Supabase session)
                if (!localStorage.getItem('worker_session')) {
                    setUser(null);
                    setLoading(false);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (authUser) => {
        try {
            console.log("AuthContext: Fetching profile for", authUser.id);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (data) {
                setUser({ ...authUser, ...data });
            } else {
                setUser(authUser);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        // Clear both Supabase and local worker sessions
        await supabase.auth.signOut();
        localStorage.removeItem('worker_session');
        setUser(null);
    };

    const login = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { success: false, error: error.message };
        return { success: true };
    };

    const signup = async (email, password, fullName, role = 'citizen') => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role
                }
            }
        });
        if (error) return { success: false, error: error.message };
        return { success: true, user: data.user };
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            logout,
            login,
            signup,
            isAdmin: user?.role === 'admin',
            isWorker: user?.role === 'worker',
            isCitizen: user?.role === 'citizen',
            city: user?.assigned_zone,
            refreshProfile: () => user && fetchProfile(user)
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
