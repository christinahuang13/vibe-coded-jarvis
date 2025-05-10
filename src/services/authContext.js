// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  getAuthUrl, 
  authenticateWithCode, 
  refreshToken, 
  getTokens, 
  getUser, 
  isAuthenticated as checkAuth,
  logout as doLogout
} from '../services/authService';

// Create the context
const AuthContext = createContext();

// Custom hook for using the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if user is already authenticated
        const authenticated = checkAuth();
        setIsAuthenticated(authenticated);
        
        if (authenticated) {
          // Get user data from local storage
          const userData = getUser();
          setCurrentUser(userData);
          
          // Check if token needs refresh
          const tokens = getTokens();
          const expiryTime = tokens.expiry_date || (tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : 0);
          
          if (expiryTime && Date.now() + 5 * 60 * 1000 >= expiryTime) {
            // Token will expire in less than 5 minutes, refresh it
            await refreshToken();
          }
        }
      } catch (error) {
        console.error('Error initializing authentication:', error);
        // Reset auth state if initialization fails
        setIsAuthenticated(false);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);
  
  // Handle OAuth callback
  const handleAuthCallback = async (code) => {
    setLoading(true);
    try {
      const result = await authenticateWithCode(code);
      setCurrentUser(result.user);
      setIsAuthenticated(true);
      return result;
    } catch (error) {
      console.error('Error handling auth callback:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Start OAuth flow
  const login = async () => {
    try {
      const authUrl = await getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error starting authentication flow:', error);
      throw error;
    }
  };
  
  // Logout user
  const logout = () => {
    doLogout();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };
  
  // Context value
  const value = {
    currentUser,
    isAuthenticated,
    loading,
    login,
    logout,
    handleAuthCallback,
    refreshToken
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;