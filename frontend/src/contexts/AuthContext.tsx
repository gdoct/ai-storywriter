/**
 * Enhanced Authentication Context for StoryWriter
 * Provides role-based access control and user management
 */

import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import http from '../services/http';
import { getUserCredits } from '../services/marketPlaceApi';
import { AuthContextType, LoginResponse, Permission, UserProfile, UserRole, UserTier } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('tier');
    localStorage.removeItem('user_id');
    
    // Reset state
    setAuthenticated(false);
    setUserProfile(null);
    
    // Redirect to login
    window.location.href = '/login';
  }, []);

  const refreshProfile = useCallback(async (): Promise<void> => {
    try {
      const response = await http.get<UserProfile>('/api/me/profile');
      const profile = response.data;
      
      // If credits aren't included in profile, fetch them separately
      let credits = profile.credits || 0;
      if (!profile.credits) {
        try {
          const creditsResponse = await getUserCredits();
          credits = creditsResponse.credits;
        } catch (creditsError) {
          console.warn('Failed to fetch credits, defaulting to 0:', creditsError);
          credits = 0;
        }
      }
      
      const updatedProfile: UserProfile = {
        ...profile,
        credits
      };
      
      setUserProfile(updatedProfile);
      setAuthenticated(true);
      
      // Update localStorage with latest info
      localStorage.setItem('user_id', profile.user_id);
      localStorage.setItem('username', profile.username);
      localStorage.setItem('email', profile.email || '');
      localStorage.setItem('tier', profile.tier);
      
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      // If profile refresh fails, the token might be invalid
      logout();
      throw error;
    }
  }, [logout]);

  const refreshCredits = useCallback(async (): Promise<void> => {
    if (!authenticated || !userProfile) {
      return;
    }
    
    try {
      const creditsResponse = await getUserCredits();
      setUserProfile(prev => prev ? {
        ...prev,
        credits: creditsResponse.credits
      } : prev);
    } catch (error) {
      console.error('Failed to refresh credits:', error);
      // Don't throw here - credits refresh should be non-blocking
    }
  }, [authenticated, userProfile]);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Try to fetch current user profile to validate token
          await refreshProfile();
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [refreshProfile, logout]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await http.post<LoginResponse>('/api/login', { email, password });
      
      if (response.data.access_token) {
        const { access_token, username, email: userEmail, tier, roles, permissions } = response.data;
        
        // Store token and basic info in localStorage
        localStorage.setItem('token', access_token);
        localStorage.setItem('username', username);
        localStorage.setItem('email', userEmail || '');
        localStorage.setItem('tier', tier);
        
        // Set user profile
        const profile: UserProfile = {
          user_id: '', // Will be populated by refreshProfile
          username,
          email: userEmail,
          tier,
          roles,
          permissions,
          credits: 0 // Will be updated by refreshProfile
        };
        
        setUserProfile(profile);
        setAuthenticated(true);
        
        // Refresh full profile
        await refreshProfile();
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Utility functions
  const hasRole = (role: UserRole): boolean => {
    return userProfile?.roles.includes(role) || false;
  };

  const hasPermission = (permission: Permission): boolean => {
    return userProfile?.permissions.includes(permission) || false;
  };

  const hasTier = (tier: UserTier): boolean => {
    return userProfile?.tier === tier;
  };

  const hasMinimumTier = (tier: UserTier): boolean => {
    if (!userProfile) return false;
    
    const tierHierarchy: Record<UserTier, number> = {
      'free': 0,
      'byok': 1,
      'premium': 2
    };
    
    return tierHierarchy[userProfile.tier] >= tierHierarchy[tier];
  };

  const contextValue: AuthContextType = {
    // State
    authenticated,
    userProfile,
    loading,
    
    // Actions
    login,
    logout,
    refreshProfile,
    refreshCredits,
    
    // Utility functions
    hasRole,
    hasPermission,
    hasTier,
    hasMinimumTier
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
