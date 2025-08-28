import React from 'react';
import { RouteObject } from 'react-router-dom';
import { AdminPanel } from './admin/components/admin/AdminPanel';
import { ModerationDashboard } from './admin/components/moderation/ModerationDashboard';
import { AdminOnly, ModeratorOnly } from './shared/components/PermissionGate';
import ProtectedRoute from './shared/components/ProtectedRoute';
import { useAuth } from './shared/contexts/AuthContext';
import BuyCredits from './members/pages/BuyCredits';
import Dashboard from './members/pages/Dashboard';
import FeaturesPage from './anonymous/pages/FeaturesPage';
import Home from './members/pages/Home';
import PrivacyPolicy from './anonymous/pages/legal/PrivacyPolicy';
import TermsOfService from './anonymous/pages/legal/TermsOfService';
import Login from './anonymous/pages/Login';
import MarketingHome from './anonymous/pages/MarketingHome';
import Marketplace from './shared/pages/Marketplace';
import MarketplaceBrowse from './shared/pages/MarketplaceBrowse';
import PricingPage from './anonymous/pages/PricingPage';
import Scenarios from './members/pages/Scenarios';
import Settings from './members/pages/Settings';
import Signup from './anonymous/pages/Signup';
import Stories from './members/pages/Stories';
import StoryDetail from './shared/pages/StoryDetail';
import Templates from './members/pages/Templates';
import Test from './shared/pages/Test';

// Component to handle the root route logic
// eslint-disable-next-line react-refresh/only-export-components
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
    { path: '/marketplace/browse', element: <MarketplaceBrowse /> },
    { path: '/marketplace/story/:id', element: <StoryDetail /> },
    { path: '/features', element: <FeaturesPage /> },
    { path: '/pricing', element: <PricingPage /> },
    { path: '/login', element: <Login /> },
    { path: '/signup', element: <Signup /> },
    { path: '/privacy', element: <PrivacyPolicy /> },
    { path: '/terms', element: <TermsOfService /> },
    { path: '/test', element: <Test /> },
    { 
      path: '/settings', 
      element: (
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      )
    },
    
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
