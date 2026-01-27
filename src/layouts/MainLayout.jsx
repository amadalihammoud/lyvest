// src/layouts/MainLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// Components
import Header from '../components/Header';
import Footer from '../components/Footer';
import AnnouncementBar from '../components/AnnouncementBar';
import CookieBanner from '../components/CookieBanner';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import ChatWidget from '../components/ChatWidget'; // chat-widget-import
import SEO from '../components/SEO';
import ModalManager from '../components/ModalManager';
import DrawerManager from '../components/DrawerManager'; // New Manager

import ErrorBoundary from '../components/ErrorBoundary';
import MobileMenu from '../components/MobileMenu';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Preload Routes
const preloadCheckout = () => import('../pages/CheckoutPage');

// Hooks
import { useModal } from '../hooks/useModal';
import { useI18n } from '../hooks/useI18n';


// Icons
import { CheckCircle } from 'lucide-react';
import { generateSlug } from '../utils/slug';

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
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);

    // Sync: Close Mobile Menu when Drawer opens
    // Effects removed: UI synchronization now handled by event handlers in Header/MobileMenu


    const handleMenuClick = (item) => {
        if (item.action === 'reset') {
            setSelectedCategory('Todos');
            setSearchQuery('');
            navigate('/');
        } else if (item.action === 'filter') {
            setSelectedCategory(item.category || item.label);
            const slug = generateSlug(item.category || item.label);
            navigate(`/categoria/${slug}`);
        } else if (item.action === 'modal') {
            openModal(item.modal);
        }
        setIsMobileMenuOpen(false);
    };

    const handleLoginSuccess = (mockUser) => {
        setIsLoggedIn(true);
        setUser(mockUser);
        showNotification(t('dashboard.welcome', { name: mockUser.name }));
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
                />

                {/* Managers */}
                <ModalManager onLoginSuccess={handleLoginSuccess} />
                <DrawerManager />

                {/* Announcement Bar - Hide on Checkout */}
                {location.pathname !== '/checkout' && <AnnouncementBar />}

                {/* Header */}
                <Header
                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                    setSelectedCategory={setSelectedCategory}
                    setSearchQuery={setSearchQuery}
                    searchQuery={searchQuery}
                    selectedCategory={selectedCategory}
                    handleMenuClick={handleMenuClick}
                    user={user}
                    isLoggedIn={isLoggedIn}
                    navigateToDashboard={() => navigate('/dashboard')}
                />

                {/* Main Content - Router Outlet */}
                <main id="main-content" tabIndex="-1">
                    <ErrorBoundary>
                        <Outlet context={{
                            user,
                            isLoggedIn,
                            setIsLoggedIn,
                            setUser,
                            setActiveDrawer: openDrawer, // Provide openDrawer as setActiveDrawer
                            setTrackingCode, // From Context
                            selectedCategory,
                            setSelectedCategory,
                            searchQuery,
                            setSearchQuery
                        }} />
                    </ErrorBoundary>
                </main>

                {/* Mobile Menu */}
                <MobileMenu
                    isOpen={isMobileMenuOpen}
                    onClose={() => setIsMobileMenuOpen(false)}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleMenuClick={handleMenuClick}
                    onOpenLogin={() => { openModal('login'); setIsMobileMenuOpen(false); }}

                    isLoggedIn={isLoggedIn}
                    user={user}
                    navigateToDashboard={() => navigate('/dashboard')}
                // Theme logic would need state in MainLayout if not using context inside MobileMenu
                // But MobileMenu should use the Hook if we want it to be cleaner.
                // However, I added props to MobileMenu. Let me check if I should just use the hook in MobileMenu.
                // Using hook in MobileMenu is better, but I added props. Let's pass null for now or mock it if ThemeContext is global.
                // Actually, I can use the useTheme hook inside MobileMenu? No, I added them as props.
                // Wait, MainLayout doesn't have theme state. ThemeProvider wraps MainLayout in main.jsx.
                />

                {/* Notifications - Accessible */}
                {notification && (
                    <div
                        role="alert"
                        aria-live="polite"
                        className="fixed top-24 right-4 z-[90] bg-white shadow-xl rounded-xl p-4 border-l-4 border-[#C05060] animate-bounce-in flex items-center gap-3"
                    >
                        <div className={`p-2 rounded-full ${notification.type === 'error' ? 'bg-red-100' : 'bg-green-100'}`}>
                            <CheckCircle className={`w-5 h-5 ${notification.type === 'error' ? 'text-red-600' : 'text-green-600'}`} aria-hidden="true" />
                        </div>
                        <span className="font-medium text-slate-700">{notification.message || notification}</span>
                    </div>
                )}

                {/* Cookie Banner */}
                <CookieBanner />

                {/* Chat Widget - AI Personal Stylist */}
                <ChatWidget />

                {/* Floating WhatsApp */}
                <FloatingWhatsApp />

                {/* Footer */}
                <Footer setSelectedCategory={setSelectedCategory} setActiveDrawer={openDrawer} setActiveModal={openModal} />

                {/* Vercel Analytics & Speed Insights */}
                <Analytics />
                <SpeedInsights />
            </div>
        </HelmetProvider>
    );
}







