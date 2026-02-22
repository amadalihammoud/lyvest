'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';

import { useFavorites } from '@/context/FavoritesContext';

// Componente separado que USA Clerk (useUser) e sincroniza o contexto
export const FavoritesSync = () => {
    const { user, isLoaded } = useUser();
    const context = useFavorites();

    useEffect(() => {
        if (isLoaded) {
            if (context._setUserId) {
                context._setUserId(user ? user.id : null);
            }
            if (user && context._syncWithUser) {
                context._syncWithUser(user);
            }
        }
    }, [user, isLoaded, context]);

    return null;
};

export default FavoritesSync;
