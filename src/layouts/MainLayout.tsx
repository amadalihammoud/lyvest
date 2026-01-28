import { useState, useEffect } from 'react';
import { useAuth, User } from '../context/AuthContext';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { useShop } from '../context/ShopContext';

// Components
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import AnnouncementBar from '../components/layout/AnnouncementBar';
import CookieBanner from '../components/layout/CookieBanner';
import FloatingWhatsApp from '../components/features/FloatingWhatsApp';
import ChatWidget from '../components/features/ChatWidget';
import SEO from '../components/features/SEO';
import ModalManager from '../components/layout/ModalManager';
import DrawerManager from '../components/layout/DrawerManager';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import MobileMenu from '../components/layout/MobileMenu';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Hooks
import { useModal } from '../hooks/useModal';
import { useI18n } from '../hooks/useI18n';

// Icons
import { CheckCircle } from 'lucide-react';

// Preload Routes - Lazy load workaround
const preloadCheckout = () => import('../pages/CheckoutPage');

// Define exact shape of user from AuthContext
// interface User { ... } -> Imported from AuthContext

export default function MainLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const {
        openModal,
        closeModal,
        openDrawer,
        notification,
        showNotification,
        setTrackingCode
    } = useModal();
    const { t } = useI18n();

    // Local UI state
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Global State
    const { user, isAuthenticated: isLoggedIn } = useAuth();
    const { searchQuery, setSearchQuery, selectedCategory, setSelectedCategory } = useShop();

    // Cast user to our interface if needed, or rely on AuthContext typing if improved
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
        <HelmetProvider>
            <div className="font-sans text-slate-700 bg-slate-50 min-h-screen selection:bg-lyvest-100 selection:text-purple-900 relative safe-top">
                {/* SEO Default */}
                <SEO
                    title={t('seo.defaultTitle')}
                    description={t('seo.defaultDescription')}
                    image="/og-image.jpg" // Default OG image
                    url={window.location.origin} // Default URL
                    product={null} // Not a product page
                />

                {/* Managers */}
                <ModalManager onLoginSuccess={handleLoginSuccess} />
                <DrawerManager />

                {/* Announcement Bar - Hide on Checkout */}
                {location.pathname !== '/checkout' && <AnnouncementBar />}

                {/* Header */}
                <Header
                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                    isMobileMenuOpen={isMobileMenuOpen}
                    navigateToDashboard={() => navigate('/dashboard')}
                />

                {/* Main Content - Router Outlet */}
                <main id="main-content" tabIndex={-1}>
                    <ErrorBoundary>
                        <Outlet context={{
                            user,
                            isLoggedIn,
                            setActiveDrawer: openDrawer,
                            setTrackingCode,
                            selectedCategory, // Passed from ShopContext
                            setSelectedCategory, // Passed from ShopContext
                            searchQuery, // Passed from ShopContext
                            setSearchQuery // Passed from ShopContext
                        }} />
                    </ErrorBoundary>
                </main>

                {/* Mobile Menu */}
                <MobileMenu
                    isOpen={isMobileMenuOpen}
                    onClose={() => setIsMobileMenuOpen(false)}
                    onOpenLogin={() => { openModal('login'); setIsMobileMenuOpen(false); }}
                    navigateToDashboard={() => navigate('/dashboard')}
                />

                {/* Notifications */}
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

                {/* Cookie Banner */}
                <CookieBanner onOpenPrivacy={() => openModal('privacy')} />

                {/* Chat Widget */}
                <ChatWidget />

                {/* Floating WhatsApp */}
                <FloatingWhatsApp />

                {/* Footer - Removing invalid props, as Footer only takes callbacks if properly typed */}
                <Footer setActiveModal={openModal} />

                {/* Vercel Analytics */}
                <Analytics />
                <SpeedInsights />
            </div>
        </HelmetProvider>
    );
}

