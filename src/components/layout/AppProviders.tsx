'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, ReactNode, lazy, Suspense } from 'react';

// Contexts
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { CartProvider } from '@/context/CartContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { I18nProvider, useI18n } from '@/context/I18nContext';
import { ModalProvider, useModal } from '@/context/ModalContext';
import { ShopProvider } from '@/context/ShopContext';

// Global Components

// Lazy load ALL non-critical components to minimize initial JS
const ModalManager = lazy(() => import('./ModalManager'));
const DrawerManager = lazy(() => import('./DrawerManager'));
const CookieBanner = lazy(() => import('./CookieBanner'));
const FloatingWhatsApp = lazy(() => import('@/components/features/FloatingWhatsApp'));
const ChatWidget = lazy(() => import('@/components/features/ChatWidget'));


// Lazy load preload
// const preloadCheckout = () => import('../../pages/CheckoutPage'); // Removed for Next.js


interface AppProvidersProps {
    children: ReactNode;
}

function GlobalLogic({ children }: { children: ReactNode }) {
    const router = useRouter();
    const {
        notification,
        showNotification,
        closeModal,
        openModal
    } = useModal();
    const { t } = useI18n();

    // Login success handler removed — Clerk handles redirects natively

    // Idle Preload effect

    // Idle Preload effect (Removed for Next.js)
    // useEffect(() => {
    //     const timer = setTimeout(() => {
    //         preloadCheckout();
    //     }, 2000);
    //     return () => clearTimeout(timer);
    // }, []);



    // Delay heavy widgets to reduce TBT
    const [showWidgets, setShowWidgets] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowWidgets(true);
        }, 4000); // 4 seconds delay to prioritize LCP/TBT
        return () => clearTimeout(timer);
    }, []);

    return (
        <>

            {/* Managers: lazy-loaded — only parsed when modal/drawer opens */}
            <Suspense fallback={null}>
                <ModalManager onLoginSuccess={() => { }} />
            </Suspense>
            <Suspense fallback={null}>
                <DrawerManager />
            </Suspense>

            {/* Notifications Overlay */}
            {notification && (
                <div
                    role="alert"
                    aria-live="polite"
                    className="fixed top-24 right-4 z-[90] bg-white shadow-xl rounded-xl p-4 border-l-4 border-[#C05060] animate-bounce-in flex items-center gap-3"
                >
                    <div className={`p-2 rounded-full ${notification.type === 'error' ? 'bg-red-100' : 'bg-green-100'}`}>
                        <svg className={`w-5 h-5 ${notification.type === 'error' ? 'text-red-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <span className="font-medium text-slate-700">{notification.message || (typeof notification === 'string' ? notification : '')}</span>
                </div>
            )}

            {/* Global Features (Lazy Loaded) */}
            <Suspense fallback={null}>
                <CookieBanner onOpenPrivacy={() => openModal('privacy')} />
            </Suspense>

            {showWidgets && (
                <Suspense fallback={null}>
                    <ChatWidget />
                    <FloatingWhatsApp />
                </Suspense>
            )}

            {/* Main Content */}
            {children}
        </>
    );
}

export default function AppProviders({ children }: AppProvidersProps) {
    return (
        <I18nProvider>
            <ShopProvider>
                <CartProvider>
                    <FavoritesProvider>
                        <ModalProvider>
                            <ErrorBoundary>
                                <GlobalLogic>
                                    {children}
                                </GlobalLogic>
                            </ErrorBoundary>
                        </ModalProvider>
                    </FavoritesProvider>
                </CartProvider>
            </ShopProvider>
        </I18nProvider>
    );
}
