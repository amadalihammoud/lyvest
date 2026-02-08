'use client';

import { ReactNode, ReactElement } from 'react';
import { redirect } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import PageLoader from '../ui/PageLoader';

interface ProtectedRouteProps {
    children: ReactNode;
}

/**
 * Componente para proteger rotas que requerem autenticação
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps): ReactElement {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <PageLoader />;
    }

    if (!isAuthenticated) {
        // Redireciona para home - em Next.js, o modal de login pode ser aberto via query param ou estado
        redirect('/');
    }

    return <>{children}</>;
}
