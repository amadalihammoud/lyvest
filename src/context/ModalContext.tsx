'use client';
/* eslint-disable react-refresh/only-export-components */
// src/context/ModalContext.tsx
import React, { createContext, useState, useCallback, ReactNode, useContext } from 'react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
    message: string;
    type: NotificationType;
}

interface ModalContextType {
    activeModal: string | null;
    modalData: unknown;
    openModal: (modalName: string, data?: unknown) => void;
    closeModal: () => void;
    activeDrawer: string | null;
    openDrawer: (drawerName: string) => void;
    closeDrawer: () => void;
    notification: Notification | null;
    showNotification: (message: string, type?: NotificationType) => void;
    trackingCode: string | null;
    setTrackingCode: React.Dispatch<React.SetStateAction<string | null>>;
    trackingResult: unknown;
    setTrackingResult: React.Dispatch<React.SetStateAction<unknown>>;
}

export const ModalContext = createContext<ModalContextType | null>(null);

interface ModalProviderProps {
    children: ReactNode;
}

export const ModalProvider = ({ children }: ModalProviderProps) => {
    const [activeModal, setActiveModal] = useState<string | null>(null); // 'login', 'contact', etc.
    const [modalData, setModalData] = useState<unknown>(null); // Data passed to the modal
    const [activeDrawer, setActiveDrawer] = useState<string | null>(null); // 'cart', 'favorites', 'tracking'
    const [notification, setNotification] = useState<Notification | null>(null); // { message: string, type: 'success'|'error' }

    // Tracking State
    const [trackingCode, setTrackingCode] = useState<string | null>(null);
    const [trackingResult, setTrackingResult] = useState<unknown>(null);

    const openModal = useCallback((modalName: string, data: unknown = null) => {
        setModalData(data);
        setActiveModal(modalName);
    }, []);

    const closeModal = useCallback(() => {
        setActiveModal(null);
        setModalData(null);
    }, []);

    const openDrawer = useCallback((drawerName: string) => {
        setActiveDrawer(drawerName);
    }, []);

    const closeDrawer = useCallback(() => {
        setActiveDrawer(null);
    }, []);

    const showNotification = useCallback((message: string, type: NotificationType = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    }, []);

    return (
        <ModalContext.Provider value={{
            activeModal,
            modalData,
            openModal,
            closeModal,
            activeDrawer,
            openDrawer,
            closeDrawer,
            notification,
            showNotification,
            trackingCode,
            setTrackingCode,
            trackingResult,
            setTrackingResult
        }}>
            {children}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal deve ser usado dentro de um ModalProvider');
    }
    return context;
};
