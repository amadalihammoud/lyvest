import { ReactNode, ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageLoader from './ui/PageLoader';

interface ProtectedRouteProps {
    children: ReactNode;
}

/**
 * Componente para proteger rotas que requerem autenticação
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps): ReactElement {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <PageLoader />;
    }

    if (!isAuthenticated) {
        // Salva a localização atual para redirecionar depois do login
        return <Navigate to="/" state={{ from: location, openLogin: true }} replace />;
    }

    return <>{children}</>;
}
