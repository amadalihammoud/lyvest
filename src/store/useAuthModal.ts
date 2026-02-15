import { create } from 'zustand';

type AuthView = 'sign-in' | 'sign-up';

interface AuthModalStore {
    isOpen: boolean;
    view: AuthView;
    onOpen: (view?: AuthView) => void;
    onClose: () => void;
    setView: (view: AuthView) => void;
}

export const useAuthModal = create<AuthModalStore>((set) => ({
    isOpen: false,
    view: 'sign-in',
    onOpen: (view = 'sign-in') => set({ isOpen: true, view }),
    onClose: () => set({ isOpen: false }),
    setView: (view) => set({ view }),
}));
