import React from 'react';
import { RouteObject } from 'react-router-dom';
import { AdminPanel } from './components/admin/AdminPanel';
import { ModerationDashboard } from './components/moderation/ModerationDashboard';
import { AdminOnly, ModeratorOnly } from './components/PermissionGate';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import BuyCredits from './pages/BuyCredits';
import Dashboard from './pages/Dashboard';
import FeaturesPage from './pages/FeaturesPage';
import Home from './pages/Home';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';
import Login from './pages/Login';
import MarketingHome from './pages/MarketingHome';
import Marketplace from './pages/Marketplace';
import PricingPage from './pages/PricingPage';
import Scenarios from './pages/Scenarios';
import Signup from './pages/Signup';
import Stories from './pages/Stories';
import StoryDetail from './pages/StoryDetail';
import Templates from './pages/Templates';

// Component to handle the root route logic
const MarketingHomeOrDashboard: React.FC = () => {
  const { authenticated } = useAuth();
  
  if (authenticated) {
    return <Dashboard />;
  }
  
  return <MarketingHome />;
};

const getRoutes = (): RouteObject[] => {
  return [
    { 
      path: '/', 
      element: <MarketingHomeOrDashboard />
    },
    { 
      path: '/dashboard', 
      element: (
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      )
    },
    { 
      path: '/app', 
      element: (
        <ProtectedRoute>
          <Home />
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
      path: '/scenarios', 
      element: (
        <ProtectedRoute>
          <Scenarios />
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
    { path: '/marketplace', element: <Marketplace /> },
    { path: '/marketplace/story/:id', element: <StoryDetail /> },
    { path: '/features', element: <FeaturesPage /> },
    { path: '/pricing', element: <PricingPage /> },
    { path: '/login', element: <Login /> },
    { path: '/signup', element: <Signup /> },
    { path: '/privacy', element: <PrivacyPolicy /> },
    { path: '/terms', element: <TermsOfService /> },
    
    // Admin-only routes
    { 
      path: '/admin', 
      element: (
        <ProtectedRoute>
          <AdminOnly fallback={<div>Access Denied: Admin privileges required</div>}>
            <AdminPanel />
          </AdminOnly>
        </ProtectedRoute>
      )
    },
    
    // Moderation routes (accessible to both moderators and admins)
    { 
      path: '/moderation', 
      element: (
        <ProtectedRoute>
          <ModeratorOnly fallback={<div>Access Denied: Moderation privileges required</div>}>
            <ModerationDashboard />
          </ModeratorOnly>
        </ProtectedRoute>
      )
    }
  ];
};

export default getRoutes;
