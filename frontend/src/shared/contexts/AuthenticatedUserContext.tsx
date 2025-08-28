import { createContext, ReactNode, useContext, useState } from 'react';

interface AuthenticatedUserContextType {
  creditRefreshTrigger: number;
  refreshCredits: () => void;
}

const AuthenticatedUserContext = createContext<AuthenticatedUserContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthenticatedUser = () => {
  const ctx = useContext(AuthenticatedUserContext);
  if (!ctx) throw new Error('useAuthenticatedUser must be used within AuthenticatedUserProvider');
  return ctx;
};

export const AuthenticatedUserProvider = ({ children }: { children: ReactNode }) => {
  const [creditRefreshTrigger, setCreditRefreshTrigger] = useState(0);

  const refreshCredits = () => {
    setCreditRefreshTrigger(prev => prev + 1);
  };

  return (
    <AuthenticatedUserContext.Provider value={{ creditRefreshTrigger, refreshCredits }}>
      {children}
    </AuthenticatedUserContext.Provider>
  );
};
