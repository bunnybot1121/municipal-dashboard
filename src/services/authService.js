// Use relative path for proxy validation (Production will need env var or same domain)
const API_URL = import.meta.env.VITE_API_URL || '/api/auth';

// Login user
export const login = async (username, password) => {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            if (data.token) {
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('token', data.token);
            }
            return data;
        } else {
            throw new Error(data.message || 'Login failed');
        }
    } catch (error) {
        // --- MOCK FALLBACK FOR GITHUB PAGES ---
        console.warn('Backend unreachable (likely Demo Mode). Failing over to Mock Login.');

        // Check for Demo Credentials
        if (username === 'admin' && password === 'admin123') {
            const mockUser = {
                id: 'mock-admin-id',
                username: 'admin',
                role: 'admin',
                name: 'Demo Admin',
                sector: 'Headquarters'
            };
            const mockToken = 'mock-demo-token-12345';

            localStorage.setItem('user', JSON.stringify(mockUser));
            localStorage.setItem('token', mockToken);

            // Artificial delay to simulate network
            await new Promise(r => setTimeout(r, 800));

            return { user: mockUser, token: mockToken };
        }

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
