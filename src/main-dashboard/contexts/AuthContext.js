import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const savedUser = localStorage.getItem('adminUser');
      
      if (token && savedUser) {
        const userData = JSON.parse(savedUser);
        
        // First, set the user from localStorage (optimistic approach)
        setUser(userData);
        
        // Then verify token is still valid in the background
        try {
          const response = await authAPI.getCurrentUser();
          // Update user data with fresh data from server
          setUser(response.data.user);
        } catch (error) {
          // Only clear auth if it's a definitive auth failure (401)
          // Don't clear on network errors, server errors, etc.
          if (error.response?.status === 401) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            setUser(null);
          }
          // For other errors (network, server down, etc.), keep the user logged in
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Auth check failed:', error);
      setError('Authentication check failed');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      // eslint-disable-next-line no-console
      console.log('🔐 Attempting login with:', { email: credentials.email, password: '***' });
      
      const response = await authAPI.login(credentials);
      // eslint-disable-next-line no-console
      console.log('✅ Login response received:', response.status);
      
      const { token, user: userData } = response.data;
      
      if (!token) {
        throw new Error('No authentication token received from server');
      }
      
      if (!userData) {
        throw new Error('No user data received from server');
      }
      
      // eslint-disable-next-line no-console
      console.log('👤 User data:', { ...userData, password: undefined });
      
      // Allow admin, sub-admin and staff roles to sign in (staff and sub-admin supported)
      if (userData.role !== 'admin' && userData.role !== 'staff' && userData.role !== 'sub-admin') {
        throw new Error('Access denied. Admin, sub-admin or staff privileges required.');
      }
      
      // Store token and user data
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(userData));
      
      setUser(userData);
      // eslint-disable-next-line no-console
      console.log('✅ Login successful');
      return { success: true, user: userData };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Login error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      
      let errorMessage = 'Login failed';
      
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 500) {
          errorMessage = 'Server error occurred. Please try again or contact support.';
        } else if (error.response.status === 401) {
          errorMessage = error.response.data?.error || 'Invalid email or password';
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.error || 'Invalid request format';
        } else {
          errorMessage = error.response.data?.error || `Server error (${error.response.status})`;
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        // Other error
        errorMessage = error.message || 'An unexpected error occurred';
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setUser(null);
    setError(null);
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.register({
        ...userData,
        role: 'admin' // Ensure admin role for CRM users
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.forgotPassword(email);
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Password reset failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (resetData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.resetPassword(resetData);
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Password reset failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('adminUser', JSON.stringify(updatedUser));
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    updateUser,
    clearError,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'sub-admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};