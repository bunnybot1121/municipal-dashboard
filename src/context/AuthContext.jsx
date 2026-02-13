import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../services/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for stored token/user on mount
        console.log('%c[AuthContext] Initializing...', 'color: blue; font-weight: bold');
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (storedUser && token) {
            console.log('%c[AuthContext] Found stored user', 'color: green', { storedUser, token: token.substring(0, 20) + '...' });
            setUser(JSON.parse(storedUser));
        } else {
            console.log('%c[AuthContext] No stored user found', 'color: orange');
        }
        setLoading(false);
        console.log('%c[AuthContext] Loading complete, rendering children', 'color: green; font-weight: bold');
    }, []);

    // Login function
    const login = async (username, password) => {
        try {
            const response = await api.login(username, password);
            if (response.token && response.user) {
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
                setUser(response.user);
                return { success: true };
            }
        } catch (error) {
            console.error('Login failed:', error);
            return { success: false, error: error.message };
        }
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    console.log('%c[AuthContext] Render called', 'color: purple', { loading, hasUser: !!user });

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
