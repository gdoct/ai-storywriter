import { createContext, ReactNode, useContext, useState } from 'react';

export enum AI_STATUS {
  IDLE = 'idle',
  BUSY = 'busy',
  UNAVAILABLE = 'unavailable',
  ERROR = 'error',
  LOADING = 'loading',
}

interface AIStatusContextType {
  aiStatus: AI_STATUS;
  setAiStatus: (status: AI_STATUS) => void;
  showAIBusyModal: boolean;
  setShowAIBusyModal: (show: boolean) => void;
  lastError: string | null;
  setLastError: (err: string | null) => void;
}

const AIStatusContext = createContext<AIStatusContextType | undefined>(undefined);

export const useAIStatus = () => {
  const ctx = useContext(AIStatusContext);
  if (!ctx) throw new Error('useAIStatus must be used within AIStatusProvider');
  return ctx;
};

export const AIStatusProvider = ({ children }: { children: ReactNode }) => {
  const [aiStatus, setAiStatus] = useState<AI_STATUS>(AI_STATUS.LOADING);
  const [showAIBusyModal, setShowAIBusyModal] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  return (
    <AIStatusContext.Provider value={{ aiStatus, setAiStatus, showAIBusyModal, setShowAIBusyModal, lastError, setLastError }}>
      {children}
    </AIStatusContext.Provider>
  );
};
