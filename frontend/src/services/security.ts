import { LoginResponse, Permission, UserRole, UserTier } from '../types/auth';
import axios from './http';

interface SignupData {
  username: string;
  email: string;
  password: string;
  agreeToTerms: boolean;
}

export const login = async (email: string, password: string): Promise<boolean> => {
  try {
    const response = await axios.post<LoginResponse>('/api/login', { email, password });
    if (response.data.access_token) {
      // Store the token and user info in localStorage
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('username', response.data.username);
      localStorage.setItem('email', response.data.email || '');
      localStorage.setItem('tier', response.data.tier);
      localStorage.setItem('roles', JSON.stringify(response.data.roles));
      localStorage.setItem('permissions', JSON.stringify(response.data.permissions));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
};

export const signup = async (signupData: SignupData): Promise<boolean> => {
  try {
    const response = await axios.post<LoginResponse>('/api/signup', signupData);
    if (response.data.access_token) {
      // Store the token and user info in localStorage
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('username', response.data.username);
      localStorage.setItem('email', response.data.email || '');
      localStorage.setItem('tier', response.data.tier);
      localStorage.setItem('roles', JSON.stringify(response.data.roles));
      localStorage.setItem('permissions', JSON.stringify(response.data.permissions));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Signup error:', error);
    return false;
  }
};

export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('email');
  localStorage.removeItem('tier');
  localStorage.removeItem('roles');
  localStorage.removeItem('permissions');
  localStorage.removeItem('user_id');
};

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  return !!token;
};

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const getUsername = (): string | null => {
  return localStorage.getItem('username');
};

export const getEmail = (): string | null => {
  return localStorage.getItem('email');
};

export const getUserTier = (): UserTier => {
  return (localStorage.getItem('tier') as UserTier) || 'free';
};

export const getUserRoles = (): UserRole[] => {
  try {
    const roles = localStorage.getItem('roles');
    return roles ? JSON.parse(roles) : [];
  } catch {
    return [];
  }
};

export const getUserPermissions = (): Permission[] => {
  try {
    const permissions = localStorage.getItem('permissions');
    return permissions ? JSON.parse(permissions) : [];
  } catch {
    return [];
  }
};

export const hasRole = (role: UserRole): boolean => {
  const userRoles = getUserRoles();
  return userRoles.includes(role);
};

export const hasPermission = (permission: Permission): boolean => {
  const userPermissions = getUserPermissions();
  return userPermissions.includes(permission);
};

export const isAdmin = (): boolean => hasRole('admin');
export const isModerator = (): boolean => hasRole('moderator') || hasRole('admin');
export const isPremium = (): boolean => {
  const tier = getUserTier();
  return tier === 'premium';
};
export const isByokOrPremium = (): boolean => {
  const tier = getUserTier();
  return tier === 'byok' || tier === 'premium';
};
