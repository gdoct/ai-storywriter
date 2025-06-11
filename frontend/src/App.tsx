import { useState } from 'react';
import { BrowserRouter as Router, useRoutes } from 'react-router-dom';
import './App.css';
import AIBusyModal from './components/common/AIBusyModal';
import Footer from './components/Footer/Footer';
import TopBar from './components/TopBar';
import { SceneHoverProvider } from './context/SceneHoverContext';
import { AIStatusProvider } from './contexts/AIStatusContext';
import { useAIStatusPolling } from './hooks/useAIStatusPolling';
import getRoutes from './routes';
import { AuthProvider } from './services/AuthContext';

// AppContent component to use the useRoutes hook (it must be used inside Router context)
const AppContent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentSeed, setCurrentSeed] = useState<number | null>(null);
  const routes = getRoutes({ setIsLoading, seed: currentSeed });
  const routeElements = useRoutes(routes);

  // Handler for seed changes from Footer
  const handleSeedChange = (seed: number | null) => {
    setCurrentSeed(seed);
  };

  useAIStatusPolling();

  return (
    <AuthProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <AIBusyModal />
        <TopBar />
        <div className="main-content">
          {routeElements}
        </div>
        <Footer isLoading={isLoading} onSeedChange={handleSeedChange} />
      </div>
    </AuthProvider>
  );
};

function App() {
  return (
    <Router>
      <AIStatusProvider>
        <SceneHoverProvider>
          <AppContent />
        </SceneHoverProvider>
      </AIStatusProvider>
    </Router>
  );
}

export default App;
