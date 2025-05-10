// src/services/authService.js

import axios from 'axios';

// Local storage keys
const TOKEN_KEY = 'jarvis_tokens';
const USER_KEY = 'jarvis_user';

/**
 * Get authentication URL for Google OAuth
 * @returns {Promise<string>} Google OAuth URL
 */
export const getAuthUrl = async () => {
  try {
    const response = await axios.get('/api/auth/google/url');
    return response.data.url;
  } catch (error) {
    console.error('Error getting auth URL:', error);
    throw error;
  }
};

/**
 * Exchange authorization code for tokens
 * @param {string} code - Authorization code from Google OAuth
 * @returns {Promise<Object>} Authentication result with tokens and user info
 */
export const authenticateWithCode = async (code) => {
  try {
    const response = await axios.post('/api/auth/google/callback', { code });
    
    if (response.data.success) {
      // Save tokens and user info to local storage
      localStorage.setItem(TOKEN_KEY, JSON.stringify(response.data.tokens));
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
      
      return response.data;
    } else {
      throw new Error('Authentication failed');
    }
  } catch (error) {
    console.error('Error authenticating:', error);
    throw error;
  }
};

/**
 * Refresh access token using refresh token
 * @returns {Promise<Object>} New tokens
 */
export const refreshToken = async () => {
  try {
    const tokens = getTokens();
    
    if (!tokens || !tokens.refresh_token) {
      throw new Error('No refresh token available');
    }
    
    const response = await axios.post('/api/auth/refresh-token', {
      refreshToken: tokens.refresh_token
    });
    
    if (response.data.success) {
      // Update tokens in local storage
      localStorage.setItem(TOKEN_KEY, JSON.stringify(response.data.tokens));
      return response.data.tokens;
    } else {
      throw new Error('Token refresh failed');
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

/**
 * Get stored tokens
 * @returns {Object|null} Stored tokens or null if not found
 */
export const getTokens = () => {
  const tokensString = localStorage.getItem(TOKEN_KEY);
  return tokensString ? JSON.parse(tokensString) : null;
};

/**
 * Get stored user info
 * @returns {Object|null} User info or null if not found
 */
export const getUser = () => {
  const userString = localStorage.getItem(USER_KEY);
  return userString ? JSON.parse(userString) : null;
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is authenticated
 */
export const isAuthenticated = () => {
  const tokens = getTokens();
  
  if (!tokens) {
    return false;
  }
  
  // Check if access token is expired
  const expiryTime = tokens.expiry_date || (tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : 0);
  
  if (expiryTime && Date.now() >= expiryTime) {
    // Token is expired, try to refresh
    try {
      refreshToken();
      return true;
    } catch (error) {
      logout();
      return false;
    }
  }
  
  return true;
};

/**
 * Set up axios interceptor to handle token refresh
 */
export const setupAxiosInterceptors = () => {
  // Request interceptor
  axios.interceptors.request.use(
    (config) => {
      const tokens = getTokens();
      
      if (tokens && tokens.access_token) {
        config.headers.Authorization = `Bearer ${tokens.access_token}`;
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  // Response interceptor
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // If error is 401 Unauthorized and we haven't already tried to refresh the token
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const tokens = await refreshToken();
          originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
          return axios(originalRequest);
        } catch (refreshError) {
          // If token refresh fails, logout and redirect to login page
          logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );
};

/**
 * Logout user
 */
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  
  // Remove Authorization header from axios
  delete axios.defaults.headers.common.Authorization;
};

// Initialize axios interceptors
setupAxiosInterceptors();

export default {
  getAuthUrl,
  authenticateWithCode,
  refreshToken,
  getTokens,
  getUser,
  isAuthenticated,
  logout
};