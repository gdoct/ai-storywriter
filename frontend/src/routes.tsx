import React, { Dispatch, SetStateAction } from 'react';
import { RouteObject } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import BuyCredits from './pages/BuyCredits';
import Dashboard from './pages/Dashboard';
import FeaturesPage from './pages/FeaturesPage';
import Home from './pages/Home';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';
import Login from './pages/Login';
import MarketingHome from './pages/MarketingHome';
import PricingPage from './pages/PricingPage';
import Settings from './pages/Settings';
import Signup from './pages/Signup';
import Stories from './pages/Stories';
import Templates from './pages/Templates';
import { useAuth } from './services/AuthContext';

interface RoutesProps {
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  seed?: number | null;
}

// Component to handle the root route logic
const MarketingHomeOrDashboard: React.FC<RoutesProps> = ({ setIsLoading, seed }) => {
  const { authenticated } = useAuth();
  
  if (authenticated) {
    return <Dashboard setIsLoading={setIsLoading} seed={seed} />;
  }
  
  return <MarketingHome />;
};

const getRoutes = ({ setIsLoading, seed }: RoutesProps): RouteObject[] => {
  return [
    { 
      path: '/', 
      element: <MarketingHomeOrDashboard setIsLoading={setIsLoading} seed={seed} />
    },
    { 
      path: '/dashboard', 
      element: (
        <ProtectedRoute>
          <Dashboard setIsLoading={setIsLoading} seed={seed} />
        </ProtectedRoute>
      )
    },
    { 
      path: '/app', 
      element: (
        <ProtectedRoute>
          <Home setIsLoading={setIsLoading} seed={seed} />
        </ProtectedRoute>
      )
    },
    { 
      path: '/settings', 
      element: (
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      )
    },
    { 
      path: '/stories', 
      element: (
        <ProtectedRoute>
          <Stories />
        </ProtectedRoute>
      )
    },
    { 
      path: '/templates', 
      element: (
        <ProtectedRoute>
          <Templates />
        </ProtectedRoute>
      )
    },
    { 
      path: '/buy-credits', 
      element: (
        <ProtectedRoute>
          <BuyCredits />
        </ProtectedRoute>
      )
    },
    { path: '/features', element: <FeaturesPage /> },
    { path: '/pricing', element: <PricingPage /> },
    { path: '/login', element: <Login /> },
    { path: '/signup', element: <Signup /> },
    { path: '/privacy', element: <PrivacyPolicy /> },
    { path: '/terms', element: <TermsOfService /> }
  ];
};

export default getRoutes;
