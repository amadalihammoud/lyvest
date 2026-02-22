'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';

import { useFavorites } from '@/store/useFavoritesStore';

// Componente separado que USA Clerk (useUser) e sincroniza o contexto
export const FavoritesSync = () => {
    const { user, isLoaded } = useUser();
    const _setUserId = useFavorites(state => state._setUserId);
    const _syncWithUser = useFavorites(state => state._syncWithUser);

    useEffect(() => {
        if (isLoaded) {
            if (_setUserId) {
                _setUserId(user ? user.id : null);
            }
            if (user && _syncWithUser) {
                _syncWithUser(user);
            }
        }
        // _setUserId and _syncWithUser remain stable in Zustand
    }, [user, isLoaded, _setUserId, _syncWithUser]);

    return null;
};

export default FavoritesSync;
