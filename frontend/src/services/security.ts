import axios from './http';

interface LoginResponse {
  access_token: string;
  username: string;
  email: string;
  message: string;
}

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
      // Store the token in localStorage
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('username', response.data.username);
      localStorage.setItem('email', response.data.email || '');
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
    const response = await axios.post<LoginResponse>('/api/login', signupData);
    if (response.data.access_token) {
      // Store the token in localStorage
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('username', response.data.username);
      localStorage.setItem('email', response.data.email || '');
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
