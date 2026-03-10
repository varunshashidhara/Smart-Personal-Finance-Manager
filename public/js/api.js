const API_URL = 'http://localhost:5000/api';

const fetchWithAuth = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');

    if (!options.headers) {
        options.headers = {};
    }

    options.headers['Content-Type'] = 'application/json';
    if (token) {
        options.headers['x-auth-token'] = token;
    }

    // Handles form data where Content-Type should be automatically set by browser
    if (options.body instanceof FormData) {
        delete options.headers['Content-Type'];
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.msg || data.message || 'API Error');
        }
        return data;
    } catch (error) {
        throw error;
    }
};

// API Methods wrappers
const api = {
    auth: {
        login: (credentials) => fetchWithAuth('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
        register: (details) => fetchWithAuth('/auth/register', { method: 'POST', body: JSON.stringify(details) })
    },
    transactions: {
        getAll: () => fetchWithAuth('/transactions'),
        create: (tx) => fetchWithAuth('/transactions', { method: 'POST', body: JSON.stringify(tx) }),
        delete: (id) => fetchWithAuth(`/transactions/${id}`, { method: 'DELETE' })
    },
    analytics: {
        getOverview: () => fetchWithAuth('/analytics')
    },
    goals: {
        getAll: () => fetchWithAuth('/goals'),
        create: (goal) => fetchWithAuth('/goals', { method: 'POST', body: JSON.stringify(goal) }),
        addFunds: (id, savedAmount) => fetchWithAuth(`/goals/${id}`, { method: 'PUT', body: JSON.stringify({ savedAmount }) })
    },
    upload: {
        csv: (formData) => fetchWithAuth('/upload/csv', { method: 'POST', body: formData })
    }
};
