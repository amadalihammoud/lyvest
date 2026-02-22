import { X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Suspense, lazy } from 'react';

import { useCart } from '../../hooks/useCart';
import { useI18n } from '../../hooks/useI18n';
import { useModal } from '../../hooks/useModal';
import LoadingSpinner from '../ui/LoadingSpinner';

// Lazy load Clerk components to remove ~250KiB from initial bundle
const ClerkSignIn = dynamic(() => import('@clerk/nextjs').then(mod => ({ default: mod.SignIn })), { ssr: false, loading: () => <div className="flex justify-center py-12"><LoadingSpinner /></div> });
const ClerkSignUp = dynamic(() => import('@clerk/nextjs').then(mod => ({ default: mod.SignUp })), { ssr: false, loading: () => <div className="flex justify-center py-12"><LoadingSpinner /></div> });

// Import Modals (Keep small modals static or lazy? Small ones are fine static)
// const LoginModal = lazy(() => import('../modals/LoginModal')); // Replaced by Clerk
// const RegisterModal = lazy(() => import('../modals/RegisterModal')); // Replaced by Clerk
// const ForgotPasswordModal = lazy(() => import('../modals/ForgotPasswordModal')); // Missing
const ProductQuickView = lazy(() => import('../product/ProductQuickView'));
// const NewsletterModal = lazy(() => import('../modals/NewsletterModal')); // Missing
// const SizeGuideModal = lazy(() => import('../modals/SizeGuideModal')); // Missing
const ContactModal = lazy(() => import('../modals/ContactModal'));
const AboutModal = lazy(() => import('../modals/AboutModal'));
const PrivacyModal = lazy(() => import('../modals/PrivacyModal'));
const TermsModal = lazy(() => import('../modals/TermsModal'));
const ShippingModal = lazy(() => import('../modals/ShippingModal'));
const FaqModal = lazy(() => import('../modals/FaqModal'));
const AddedToCartModal = lazy(() => import('../modals/AddedToCartModal'));

// Lazy load large components
// ProductQuickView is already imported above
// const ForgotPasswordModal = lazy(() => import('../modals/ForgotPasswordModal')); // Missing
// const NewsletterModal = lazy(() => import('../modals/NewsletterModal')); // Missing
// const SizeGuideModal = lazy(() => import('../modals/SizeGuideModal')); // Missing

interface ModalManagerProps {
    onLoginSuccess: (user: any) => void;
}

export default function ModalManager({ onLoginSuccess }: ModalManagerProps) {
    const { activeModal, closeModal, modalData } = useModal();
    const { t } = useI18n();
    const { addToCart } = useCart();

    if (!activeModal) return null;

    const renderModalContent = () => {
        switch (activeModal) {
            case 'login':
                return (
                    <div className="flex justify-center py-8">
                        <ClerkSignIn
                            routing="hash"
                            appearance={{
                                elements: {
                                    rootBox: "mx-auto",
                                    card: "shadow-none border-none",
                                    footer: "hidden"
                                }
                            }}
                        />
                    </div>
                );
            case 'register':
                return (
                    <div className="flex justify-center py-8">
                        <ClerkSignUp
                            routing="hash"
                            appearance={{
                                elements: {
                                    rootBox: "mx-auto",
                                    card: "shadow-none border-none",
                                    footer: "hidden"
                                }
                            }}
                        />
                    </div>
                );
            case 'contact':
                return <ContactModal />;
            case 'about':
                return <AboutModal />;
            case 'privacy':
                return <PrivacyModal />;
            case 'terms':
            case 'returns':
                return <TermsModal />;
            case 'shipping':
                return <ShippingModal />;
            case 'faq':
                return <FaqModal />;
            case 'addedToCart':
                return <AddedToCartModal />;
            case 'quickview':
                return (
                    <ProductQuickView
                        product={modalData as any}
                        onClose={closeModal}
                        onAddToCart={(p) => addToCart(p as any)}
                    />
                );
            default:
                return null;
        }
    };

    // Special wrapper for Quick View (Product Details) to avoid standard modal wrapper if needed, 
    // OR just reuse the wrapper. ProductDetails usually has its own layout?
    // In MainLayout, ProductDetails was wrapped in a div with backdrop.
    // Here ModalManager wraps everything in a div with backdrop.
    // BUT ProductDetails might trigger its own styles.
    // MainLayout: <div className="fixed inset-0 ... bg-slate-900/40 backdrop-blur-sm ..."> <ProductDetails ... /> </div>
    // ModalManager: <div className="fixed inset-0 ... bg-slate-900/50 block ..."> <div className="bg-white ..."> {content} </div> </div>
    // ProductDetails implies it is a full card.
    // If I use the standard ModalManager wrapper (white rounded-3xl box), it might double wrap ProductDetails or constrain it.
    // ProductDetails usually expects to be THE card.
    // Let's check ProductDetails code if I can.
    // Assuming ProductDetails is a full component.
    // If activeModal is quickview, I might want a different wrapper or no wrapper (if ProductDetails handles it).
    // MainLayout had a wrapper around ProductDetails.
    // ModalManager has a wrapper around renderModalContent.
    // The wrapper in ModalManager is "max-w-md". QuickView usually needs "max-w-4xl" or similar.
    // I should adjust the wrapper width based on modal type.

    const isQuickView = activeModal === 'quickview';
    const isRegister = activeModal === 'register';
    const isAddedToCart = activeModal === 'addedToCart';
    const isDashboardModal = ['faq', 'shipping', 'terms', 'privacy', 'returns'].includes(activeModal);
    const isContentModal = ['about', 'contact'].includes(activeModal);

    let maxWidthClass = 'max-w-md';
    if (isQuickView) maxWidthClass = 'max-w-4xl';
    else if (isRegister) maxWidthClass = 'max-w-3xl';
    else if (isAddedToCart) maxWidthClass = 'max-w-lg';
    else if (isDashboardModal) maxWidthClass = 'max-w-[95vw] lg:max-w-6xl h-[85vh]'; // Fixed height for complex UIs
    else if (isContentModal) maxWidthClass = 'max-w-[95vw] lg:max-w-7xl'; // Auto height for simple content pages



    return (
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className={`bg-white rounded-3xl w-[95%] md:w-full ${maxWidthClass} max-h-[90vh] overflow-y-auto shadow-2xl relative animate-scale-up scrollbar-thin scrollbar-thumb-[#F5E6E8] scrollbar-track-transparent`}>
                <button onClick={closeModal} className="absolute top-4 right-4 z-50 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors cursor-pointer" aria-label={t('aria.closeModal')}>
                    <X className="w-5 h-5 text-slate-500" />
                </button>
                <Suspense fallback={<div className="flex justify-center items-center h-64"><LoadingSpinner /></div>}>
                    {renderModalContent()}
                </Suspense>
            </div>
        </div>
    );
}








