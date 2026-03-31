
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

    const login = async (email, password, overrideRole = null, overrideSector = null) => {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { success: false, error: error.message };
        
        // Force update or create the profile if the user explicitly selected a role on the login screen
        if (overrideRole && data?.user?.id) {
            await supabase.from('profiles').upsert({ 
                id: data.user.id,
                email: email,
                role: overrideRole, 
                sector: (overrideRole === 'department' || overrideRole === 'senior_engineer' || overrideRole === 'junior_engineer') ? overrideSector : null 
            }, { onConflict: 'id' });
            // Fetch immediately so UI knows we are the new role
            await fetchProfile(data.user);
        }

        return { success: true };
    };

    const signup = async (email, password, fullName, role = 'citizen', sector = null) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role,
                    sector: sector
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
            isDepartment: user?.role === 'department',
            isWorker: user?.role === 'worker',
            isCitizen: user?.role === 'citizen',
            isSeniorEngineer: user?.role === 'senior_engineer',
            isJuniorEngineer: user?.role === 'junior_engineer',
            city: user?.assigned_zone,
            department: user?.sector,
            refreshProfile: () => user && fetchProfile(user)
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
