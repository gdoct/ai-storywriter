import { useState } from 'react';
import { BrowserRouter as Router, useLocation, useRoutes } from 'react-router-dom';
import './App.css';
import AIBusyModal from './components/common/AIBusyModal';
import Footer from './components/Footer/Footer';
import TopBar from './components/TopBar/TopBar';
import { SceneHoverProvider } from './context/SceneHoverContext';
import { AIStatusProvider } from './contexts/AIStatusContext';
import { AuthProvider } from './contexts/AuthContext';
import { AuthenticatedUserProvider } from './contexts/AuthenticatedUserContext';
import { useAIStatusPolling } from './hooks/useAIStatusPolling';
import getRoutes from './routes';

// AppContent component to use the useRoutes hook (it must be used inside Router context)
const AppContent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentSeed, setCurrentSeed] = useState<number | null>(null);
  const routes = getRoutes({ setIsLoading, seed: currentSeed });
  const routeElements = useRoutes(routes);
  const location = useLocation();

  // Handler for seed changes from Footer
  const handleSeedChange = (seed: number | null) => {
    setCurrentSeed(seed);
  };

  useAIStatusPolling();

  // Only show Footer on the /app route (ScenarioWriter)
  const shouldShowFooter = location.pathname === '/app';

  return (
    <AuthProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AIBusyModal />
        <TopBar />
        <div className="main-content" style={{ 
          marginBottom: shouldShowFooter ? '50px' : '0',
          minHeight: shouldShowFooter ? 'calc(100vh - 110px)' : 'calc(100vh - 60px)'
        }}>
          {routeElements}
        </div>
        {shouldShowFooter && (
          <Footer isLoading={isLoading} onSeedChange={handleSeedChange} />
        )}
      </div>
    </AuthProvider>
  );
};

function App() {
  return (
    <Router>
      <AIStatusProvider>
        <AuthenticatedUserProvider>
          <SceneHoverProvider>
            <AppContent />
          </SceneHoverProvider>
        </AuthenticatedUserProvider>
      </AIStatusProvider>
    </Router>
  );
}

export default App;
