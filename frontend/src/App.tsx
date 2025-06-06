import { useState } from 'react';
import { BrowserRouter as Router, useRoutes } from 'react-router-dom';
import './App.css';
import Footer from './components/Footer/Footer';
import TopBar from './components/TopBar';
import { SceneHoverProvider } from './context/SceneHoverContext';
import getRoutes from './routes';
import { AuthProvider } from './services/AuthContext';

// AppContent component to use the useRoutes hook (it must be used inside Router context)
const AppContent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const routes = getRoutes({ setIsLoading });
  const routeElements = useRoutes(routes);

  return (
    <AuthProvider>
      <TopBar />
      <div className="main-content">
        {routeElements}
      </div>
      <Footer isLoading={isLoading} />
    </AuthProvider>
  );
};

function App() {
  return (
    <Router>
      <SceneHoverProvider>
        <AppContent />
      </SceneHoverProvider>
    </Router>
  );
}

export default App;
