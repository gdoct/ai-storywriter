import React, { createContext, useContext, useEffect, useState } from 'react';
import { getEmail, getUsername, isAuthenticated } from './security';

interface AuthContextType {
  authenticated: boolean;
  username: string | null;
  email: string | null;
  setAuthenticated: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  authenticated: false,
  username: null,
  email: null,
  setAuthenticated: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // Initialize auth state when component mounts
    const authStatus = isAuthenticated();
    setAuthenticated(authStatus);
    
    if (authStatus) {
      setUsername(getUsername());
      setEmail(getEmail());
    }
    
    // Handle login/logout events from other tabs/windows
    const handleStorageChange = () => {
      const currentAuthStatus = isAuthenticated();
      setAuthenticated(currentAuthStatus);
      setUsername(currentAuthStatus ? getUsername() : null);
      setEmail(currentAuthStatus ? getEmail() : null);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ authenticated, username, email, setAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
