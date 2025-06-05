import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUsername, isAuthenticated } from './security';

interface AuthContextType {
  authenticated: boolean;
  username: string | null;
  setAuthenticated: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  authenticated: false,
  username: null,
  setAuthenticated: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Initialize auth state when component mounts
    const authStatus = isAuthenticated();
    setAuthenticated(authStatus);
    
    if (authStatus) {
      setUsername(getUsername());
    }
    
    // Handle login/logout events from other tabs/windows
    const handleStorageChange = () => {
      const currentAuthStatus = isAuthenticated();
      setAuthenticated(currentAuthStatus);
      setUsername(currentAuthStatus ? getUsername() : null);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ authenticated, username, setAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
