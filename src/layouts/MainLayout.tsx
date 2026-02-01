import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { useModal } from '../hooks/useModal';

// Components
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import AnnouncementBar from '../components/layout/AnnouncementBar';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import MobileMenu from '../components/layout/MobileMenu';

export default function MainLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    // We still need these hooks to pass context to Outlet (for now)
    // In a future refactor, pages should use hooks directly.
    const { openDrawer, setTrackingCode, openModal } = useModal();
    const { user, isAuthenticated: isLoggedIn } = useAuth();
    const { searchQuery, setSearchQuery, selectedCategory, setSelectedCategory } = useShop();

    // Local UI state
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="font-sans text-slate-700 bg-slate-50 min-h-screen selection:bg-lyvest-100 selection:text-purple-900 relative safe-top">

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
                {/* ErrorBoundary for content crashes */}
                <ErrorBoundary>
                    <Outlet context={{
                        user,
                        isLoggedIn,
                        setActiveDrawer: openDrawer,
                        setTrackingCode,
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
                onOpenLogin={() => {
                    openModal('login');
                    setIsMobileMenuOpen(false);
                }}
                navigateToDashboard={() => navigate('/dashboard')}
            />

            {/* Footer */}
            <Footer setActiveModal={openModal} />
        </div>
    );
}

