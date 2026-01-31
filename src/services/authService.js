// Use relative path for proxy validation (Production will need env var or same domain)
const API_URL = import.meta.env.VITE_API_URL || '/api/auth';

// Login user
export const login = async (username, password) => {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            if (data.token) {
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('token', data.token); // Store JWT
            }
            return data;
        } else {
            throw new Error(data.message || 'Login failed');
        }
    } catch (error) {
        throw error;
    }
};

// Register user
export const register = async (userData) => {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (response.ok) {
            if (data.token) {
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('token', data.token);
            }
            return data;
        } else {
            throw new Error(data.message || 'Registration failed');
        }
    } catch (error) {
        throw error;
    }
};

// Logout
export const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
};

// Get current user (optional check)
export const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('user'));
};
