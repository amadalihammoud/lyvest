import { useRouter } from 'next/navigation';
import React, { Suspense, lazy } from 'react';

import { productsData } from '../../data/products';
import { useCart } from '../../hooks/useCart';
import { useFavorites } from '../../hooks/useFavorites';
import { useI18n } from '../../hooks/useI18n';
import { useModal } from '../../hooks/useModal';

// Lazy load drawers
// Lazy load drawers
const DrawerCart = lazy(() => import('./DrawerCart'));
const DrawerFavorites = lazy(() => import('./DrawerFavorites'));
const DrawerTracking = lazy(() => import('./DrawerTracking'));
export default function DrawerManager() {
    const {
        activeDrawer,
        closeDrawer,
        trackingCode,
        setTrackingCode,
        trackingResult,
        setTrackingResult,
        showNotification
    } = useModal();

    const { cartItems, removeFromCart, addToCart } = useCart();
    const { favorites, toggleFavorite } = useFavorites();
    const { isRTL } = useI18n();
    const router = useRouter();

    const handleCheckout = () => {
        closeDrawer();
        router.push('/checkout');
    };

    const [headerHeight, setHeaderHeight] = React.useState(0);

    React.useEffect(() => {
        // Only measure header height when drawer opens (no scroll listener = no forced reflow)
        const header = document.querySelector('header');
        if (header) {
            setHeaderHeight(header.offsetHeight);
        }

        const handleResize = () => {
            const h = document.querySelector('header');
            if (h) setHeaderHeight(h.offsetHeight);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [activeDrawer]);

    if (!activeDrawer) return null;

    return (
        <div
            className="fixed inset-0 z-40 transition-[top] duration-75 ease-out"
            style={{ top: `${headerHeight}px`, height: `calc(100vh - ${headerHeight}px)` }}
        >
            {activeDrawer && (
                <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={closeDrawer} onKeyDown={(e) => e.key === 'Escape' && closeDrawer()} role="button" tabIndex={0} aria-label="Fechar painel" />
            )}
            <div
                className={`absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 transform ${activeDrawer ? 'translate-x-0' : 'translate-x-full'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${activeDrawer}-title`}
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-lyvest-100 border-t-[#800020] rounded-full animate-spin" /></div>}>
                    {activeDrawer === 'cart' && (
                        <DrawerCart
                            isOpen={true}
                            onClose={closeDrawer}
                            cartItems={cartItems}
                            onRemoveFromCart={removeFromCart}
                            onCheckout={handleCheckout}
                        />
                    )}
                    {activeDrawer === 'favorites' && (
                        <DrawerFavorites
                            isOpen={true}
                            onClose={closeDrawer}
                            favoriteProducts={productsData.filter((p) => favorites.includes(p.id))}
                            onAddToCart={(p) => addToCart({
                                id: p.id,
                                name: p.name,
                                price: p.price,
                                image: p.image,
                                category: typeof p.category === 'string'
                                    ? p.category
                                    : Array.isArray(p.category)
                                        ? p.category[0]?.name || 'Geral'
                                        : p.category?.name || 'Geral'
                            })}
                            onToggleFavorite={toggleFavorite}
                            setNotification={(msg) => showNotification(msg, 'success')}
                        />
                    )}
                    {activeDrawer === 'tracking' && (
                        <DrawerTracking
                            isOpen={true}
                            onClose={closeDrawer}
                            trackingCode={trackingCode || ''}
                            setTrackingCode={setTrackingCode}
                            trackingResult={trackingResult as any}
                            setTrackingResult={setTrackingResult}
                        />
                    )}
                </Suspense>
            </div>
        </div>
    );
}








