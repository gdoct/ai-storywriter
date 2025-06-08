import { Dispatch, SetStateAction } from 'react';
import { RouteObject } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Settings from './pages/Settings';

interface RoutesProps {
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  seed?: number | null;
}

const getRoutes = ({ setIsLoading, seed }: RoutesProps): RouteObject[] => {
  return [
    { 
      path: '/', 
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
      path: '/login',
      element: <Login />
    }
  ];
};

export default getRoutes;
