// API Client to connect Stitch UI to your backend
const API_BASE = 'http://localhost:5001/api';

export const api = {
    // Issues
    async getIssues(filters = {}) {
        const params = new URLSearchParams(filters);
        const res = await fetch(`${API_BASE}/issues?${params}`);
        return res.json();
    },

    async getIssueById(id) {
        const res = await fetch(`${API_BASE}/issues/${id}`);
        return res.json();
    },

    async createIssue(data) {
        const res = await fetch(`${API_BASE}/issues`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    async updateIssue(id, updates) {
        const res = await fetch(`${API_BASE}/issues/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        return res.json();
    },

    // Tasks
    async getTasks(filters = {}) {
        const params = new URLSearchParams(filters);
        const res = await fetch(`${API_BASE}/tasks?${params}`);
        return res.json();
    },

    async createTask(data) {
        const res = await fetch(`${API_BASE}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    async updateTask(id, updates) {
        const res = await fetch(`${API_BASE}/tasks/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        return res.json();
    },

    // Auth
    async login(username, password) {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        return res.json();
    },

    async register(data) {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    }
};