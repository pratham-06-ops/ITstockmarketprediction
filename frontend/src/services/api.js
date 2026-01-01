import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  // Use same-origin in dev to leverage CRA proxy for cookies; allow override via env
  baseURL: process.env.REACT_APP_API_URL || '',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (removed token auth, using sessions)
api.interceptors.request.use(
  (config) => {
    // Sessions handled by cookies
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Stock prediction API
export const stockAPI = {
  // Get available stocks
  getStocks: () => api.get('/api/stocks'),
  
  // Make prediction (allow longer timeout for first-time LSTM training)
  predict: (stockSymbol, modelType = 'lstm', daysAhead = 1) => 
    api.post('/api/predict', { 
      stock_symbol: stockSymbol, 
      model_type: modelType, 
      days_ahead: daysAhead 
    }, { timeout: 60000 }),
  
  // Get charts for a stock
  getCharts: (stockSymbol) => api.get(`/api/charts/${stockSymbol}`),
  
  // Get prediction history
  getHistory: () => api.get('/api/history'),
  
  // Get statistics
  getStats: () => api.get('/api/stats'),
  
  // Multi-duration prediction
  multiDurationPredict: (stockSymbol, duration = '1_week') => 
    api.post('/api/multi-duration-predict', { 
      stock_symbol: stockSymbol, 
      duration: duration 
    }, { timeout: 60000 }),
  
  // Get current price
  getCurrentPrice: (stockSymbol) => api.get(`/api/current-price/${stockSymbol}`),
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
  
  // Update prediction
  updatePrediction: (predictionId, predictionData) => 
    api.put(`/api/admin/predictions/${predictionId}`, predictionData),
  
  // Delete prediction
  deletePrediction: (predictionId) => 
    api.delete(`/api/admin/predictions/${predictionId}`),
};

// Authentication API
export const authAPI = {
  // Login
  login: (credentials) => api.post('/api/login', credentials),
  
  // Register
  register: (userData) => api.post('/api/register', userData),
  
  // Logout
  logout: () => api.get('/api/logout'),
  
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