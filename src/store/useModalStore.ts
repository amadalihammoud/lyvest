// src/store/useModalStore.ts
// Zustand store replacing ModalContext — no provider needed
import { create } from 'zustand';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
    message: string;
    type: NotificationType;
}

interface ModalState {
    // Modal
    activeModal: string | null;
    modalData: unknown;
    openModal: (modalName: string, data?: unknown) => void;
    closeModal: () => void;
    // Drawer
    activeDrawer: string | null;
    openDrawer: (drawerName: string) => void;
    closeDrawer: () => void;
    // Notification
    notification: Notification | null;
    showNotification: (message: string, type?: NotificationType) => void;
    // Tracking
    trackingCode: string | null;
    setTrackingCode: (code: string | null) => void;
    trackingResult: unknown;
    setTrackingResult: (result: unknown) => void;
}

export const useModalStore = create<ModalState>((set) => ({
    // Modal
    activeModal: null,
    modalData: null,
    openModal: (modalName: string, data: unknown = null) =>
        set({ activeModal: modalName, modalData: data }),
    closeModal: () => set({ activeModal: null, modalData: null }),

    // Drawer
    activeDrawer: null,
    openDrawer: (drawerName: string) => set({ activeDrawer: drawerName }),
    closeDrawer: () => set({ activeDrawer: null }),

    // Notification
    notification: null,
    showNotification: (message: string, type: NotificationType = 'success') => {
        set({ notification: { message, type } });
        setTimeout(() => set({ notification: null }), 3000);
    },

    // Tracking
    trackingCode: null,
    setTrackingCode: (code: string | null) => set({ trackingCode: code }),
    trackingResult: null,
    setTrackingResult: (result: unknown) => set({ trackingResult: result }),
}));

// Backward-compatible hook alias
export const useModal = useModalStore;
