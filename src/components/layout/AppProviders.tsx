import { useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { CheckCircle } from 'lucide-react';

// Contexts
import { CartProvider } from '@/context/CartContext';
import { ShopProvider } from '@/context/ShopContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { ModalProvider, useModal } from '@/context/ModalContext';
import { AuthProvider, useAuth, User } from '@/context/AuthContext';
import { I18nProvider, useI18n } from '@/context/I18nContext';

// Global Components
import ModalManager from './ModalManager';
import DrawerManager from './DrawerManager';
import CookieBanner from './CookieBanner';
import FloatingWhatsApp from '@/components/features/FloatingWhatsApp';
import ChatWidget from '@/components/features/ChatWidget';
import SEO from '@/components/features/SEOComponent';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

// Lazy load preload
const preloadCheckout = () => import('../../pages/CheckoutPage');

interface AppProvidersProps {
    children: ReactNode;
}

function GlobalLogic({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    const {
        notification,
        showNotification,
        closeModal,
        openModal
    } = useModal();
    const { t } = useI18n();
    const { user } = useAuth();

    // Cast user
    const currentUser = user as User | null;

    const handleLoginSuccess = (mockUser: User) => {
        showNotification(t('dashboard.welcome', { name: mockUser?.name || currentUser?.name || 'Cliente' }));
        closeModal();
        navigate('/dashboard');
    };

    // Idle Preload effect
    useEffect(() => {
        const timer = setTimeout(() => {
            preloadCheckout();
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            {/* SEO Default */}
            <SEO
                title={t('seo.defaultTitle')}
                description={t('seo.defaultDescription')}
                image="/og-image.jpg"
                url={window.location.origin}
                product={null}
            />

            {/* Managers */}
            <ModalManager onLoginSuccess={handleLoginSuccess} />
            <DrawerManager />

            {/* Notifications Overlay */}
            {notification && (
                <div
                    role="alert"
                    aria-live="polite"
                    className="fixed top-24 right-4 z-[90] bg-white shadow-xl rounded-xl p-4 border-l-4 border-[#C05060] animate-bounce-in flex items-center gap-3"
                >
                    <div className={`p-2 rounded-full ${notification.type === 'error' ? 'bg-red-100' : 'bg-green-100'}`}>
                        <CheckCircle className={`w-5 h-5 ${notification.type === 'error' ? 'text-red-600' : 'text-green-600'}`} aria-hidden="true" />
                    </div>
                    <span className="font-medium text-slate-700">{notification.message || (typeof notification === 'string' ? notification : '')}</span>
                </div>
            )}

            {/* Global Features */}
            <CookieBanner onOpenPrivacy={() => openModal('privacy')} />
            <ChatWidget />
            <FloatingWhatsApp />

            {/* Analytics */}
            <Analytics />
            <SpeedInsights />

            {/* Main Content */}
            {children}
        </>
    );
}

export default function AppProviders({ children }: AppProvidersProps) {
    return (
        <HelmetProvider>
            <I18nProvider>
                <AuthProvider>
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
                </AuthProvider>
            </I18nProvider>
        </HelmetProvider>
    );
}
