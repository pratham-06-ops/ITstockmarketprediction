import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api, { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    const userData = localStorage.getItem('user');
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authAPI.login({ username, password });
      
      if (response.data.user) {
        const loggedInUser = response.data.user;
        setUser(loggedInUser);
        setIsAuthenticated(true);
        
        // Persist user session
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        
        toast.success('Login successful!');
        return { success: true, user: loggedInUser };
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await authAPI.register({ username, email, password });
      
      if (response.status === 201) {
        toast.success('Registration successful! Please login.');
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear user data
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Nothing to clear on header since we are using cookie-based session
      
      toast.success('Logged out successfully');
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.post('/api/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      
      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};