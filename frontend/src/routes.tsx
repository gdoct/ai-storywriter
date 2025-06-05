import { Dispatch, SetStateAction } from 'react';
import { RouteObject } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Settings from './pages/Settings';

interface RoutesProps {
  setIsLoading: Dispatch<SetStateAction<boolean>>;
}

const getRoutes = ({ setIsLoading }: RoutesProps): RouteObject[] => {
  return [
    { 
      path: '/', 
      element: (
        <ProtectedRoute>
          <Home setIsLoading={setIsLoading} />
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
