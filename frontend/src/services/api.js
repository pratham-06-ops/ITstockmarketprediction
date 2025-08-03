import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Stock prediction API
export const stockAPI = {
  // Get available stocks
  getStocks: () => api.get('/api/stocks'),
  
  // Make prediction
  predict: (stockSymbol, modelType = 'lstm') => 
    api.post('/api/predict', { stock_symbol: stockSymbol, model_type: modelType }),
  
  // Get charts for a stock
  getCharts: (stockSymbol) => api.get(`/api/charts/${stockSymbol}`),
  
  // Get prediction history
  getHistory: () => api.get('/api/history'),
  
  // Get statistics
  getStats: () => api.get('/api/stats'),
};

// Admin API
export const adminAPI = {
  // Get all users
  getUsers: () => api.get('/api/admin/users'),
  
  // Get all predictions
  getAllPredictions: () => api.get('/api/admin/predictions'),
  
  // Get user by ID
  getUser: (userId) => api.get(`/api/admin/users/${userId}`),
  
  // Update user
  updateUser: (userId, userData) => api.put(`/api/admin/users/${userId}`, userData),
  
  // Delete user
  deleteUser: (userId) => api.delete(`/api/admin/users/${userId}`),
};

// Authentication API
export const authAPI = {
  // Login
  login: (credentials) => api.post('/api/login', credentials),
  
  // Register
  register: (userData) => api.post('/api/register', userData),
  
  // Logout
  logout: () => api.post('/api/logout'),
  
  // Change password
  changePassword: (passwordData) => api.post('/api/change-password', passwordData),
};

// Utility functions
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    return error.response.data.error || 'An error occurred';
  } else if (error.request) {
    // Request was made but no response received
    return 'Network error. Please check your connection.';
  } else {
    // Something else happened
    return 'An unexpected error occurred';
  }
};

export default api;