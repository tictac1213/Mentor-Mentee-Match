// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutBtn = document.getElementById('logoutBtn');

// API Base URL
const API_BASE_URL = '/api/auth';

// Initialize auth module
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    if (localStorage.getItem('token') && !['index.html', 'register.html'].includes(window.location.pathname.split('/').pop())) {
        // User is logged in and not on auth pages - redirect to dashboard
        // window.location.href = '/dashboard.html';
    }

    // Setup event listeners
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

// Login Handler
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('loginError');

    try {
        errorElement.textContent = '';
        
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Store authentication data
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        
        // Redirect to dashboard
        window.location.href = '/dashboard.html';
    } catch (err) {
        errorElement.textContent = err.message;
        console.error('Login error:', err);
    }
}

// Registration Handler
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const role = document.getElementById('regRole').value;
    const errorElement = document.getElementById('registerError');

    try {
        errorElement.textContent = '';

        // Client-side validation
        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }

        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }

        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, name, role })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        // Store authentication data
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        
        // Redirect to profile setup
        window.location.href = '/profile.html';
    } catch (err) {
        errorElement.textContent = err.message;
        console.error('Registration error:', err);
    }
}

// Logout Handler
function handleLogout() {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    
    // Redirect to login page
    window.location.href = '/index.html';
}

// Utility function to make authenticated requests
async function makeAuthenticatedRequest(url, options = {}) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (response.status === 401) {
        // Token expired or invalid
        handleLogout();
        throw new Error('Session expired. Please log in again.');
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

// Check if user is authenticated
function isAuthenticated() {
    return !!localStorage.getItem('token');
}

// Get current user ID
function getCurrentUserId() {
    return localStorage.getItem('userId');
}

// Get auth token
function getAuthToken() {
    return localStorage.getItem('token');
}