import { ThemeProvider } from '@drdata/ai-styles';
import { BrowserRouter as Router, useRoutes } from 'react-router-dom';
import './App.css';
import AIBusyModal from './shared/components/common/AIBusyModal';
import TopBar from './shared/components/TopBar/TopBar';
import { SceneHoverProvider } from './shared/context/SceneHoverContext';
import { AIStatusProvider } from './shared/contexts/AIStatusContext';
import { AuthProvider } from './shared/contexts/AuthContext';
import getRoutes from './routes';

// AppContent component to use the useRoutes hook (it must be used inside Router context)
const AppContent = () => {
  const routes = getRoutes();
  const routeElements = useRoutes(routes);

  return (
    <AuthProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AIBusyModal />
        <TopBar />
        <div className="main-content" style={{ 
          marginBottom: '0',
          minHeight: 'calc(100vh - 56px)'
        }}>
          {routeElements}
        </div>
      </div>
    </AuthProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AIStatusProvider>
          <SceneHoverProvider>
            <AppContent />
          </SceneHoverProvider>
        </AIStatusProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
