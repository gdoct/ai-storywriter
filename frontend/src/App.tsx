import { BrowserRouter as Router, useRoutes } from 'react-router-dom';
import './App.css';
import AIBusyModal from './components/common/AIBusyModal';
import TopBar from './components/TopBar/TopBar';
import { SceneHoverProvider } from './context/SceneHoverContext';
import { AIStatusProvider } from './contexts/AIStatusContext';
import { AuthProvider } from './contexts/AuthContext';
import getRoutes from './routes';
import { ThemeProvider } from '@drdata/docomo';

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
          minHeight: 'calc(100vh - 60px)'
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
      <Router>
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
