'use client';

import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { ReactNode, ReactElement } from 'react';

import PageLoader from '../ui/PageLoader';

interface ProtectedRouteProps {
    children: ReactNode;
}

/**
 * Componente para proteger rotas que requerem autenticação
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps): ReactElement {
    const { isSignedIn, isLoaded } = useUser();

    if (!isLoaded) {
        return <PageLoader />;
    }

    if (!isSignedIn) {
        // Redireciona para home - em Next.js, o modal de login pode ser aberto via query param ou estado
        redirect('/');
    }

    return <>{children}</>;
}
