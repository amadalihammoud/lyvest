import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '../../hooks/useI18n';
import LanguageSelector from '../features/LanguageSelector';
import { X, Search, ChevronRight, User } from 'lucide-react';
import { mainMenu } from '../../data/siteData';

import { useShop } from '../../context/ShopContext';
import { useUser, useClerk } from '@clerk/nextjs';
import { useAuthModal } from '@/store/useAuthModal';
import { useShopNavigation } from '../../hooks/useShopNavigation';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenLogin: () => void;
    navigateToDashboard: () => void;
}

export default function MobileMenu({
    isOpen,
    onClose,
    onOpenLogin,
    navigateToDashboard
}: MobileMenuProps) {
    const router = useRouter(); // Initialize router
    const { user, isSignedIn } = useUser();
    const { onOpen } = useAuthModal();

    // Get Clerk object safely
    const clerk = useClerk();
    // Force cast to any to avoid TS errors if types are outdated, 
    // but try to use safe access pattern
    const safeClerk = clerk as any;

    const isLoggedIn = isSignedIn;

    // Helper to get user name
    const userName = user?.fullName || user?.firstName || 'Usuário';
    const userAvatar = user?.imageUrl;
    const { searchQuery, setSearchQuery } = useShop();
    const { handleMenuClick: baseHandleMenuClick } = useShopNavigation();

    // Wrap handleMenuClick to close menu
    const handleMenuClick = (item: any) => {
        baseHandleMenuClick(item);
        onClose();
    };

    const { t } = useI18n();

    const [headerHeight, setHeaderHeight] = React.useState(0);

    React.useEffect(() => {
        const updateHeight = () => {
            const header = document.querySelector('header');
            if (header) {
                setHeaderHeight(header.getBoundingClientRect().bottom);
            }
        };

        updateHeight();
        window.addEventListener('scroll', updateHeight);
        window.addEventListener('resize', updateHeight);

        return () => {
            window.removeEventListener('scroll', updateHeight);
            window.removeEventListener('resize', updateHeight);
        };
    }, []);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-40 lg:hidden transition-[top] duration-75 ease-out"
            style={{ top: `${headerHeight}px`, height: `calc(100vh - ${headerHeight}px)` }}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
        >
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} onKeyDown={(e) => e.key === 'Escape' && onClose()} role="button" tabIndex={0} aria-label="Fechar menu" />
            <div className="absolute top-0 left-0 h-full w-[65%] max-w-[280px] bg-white shadow-2xl pt-5 pb-6 pl-0 pr-4 flex flex-col overflow-y-auto overscroll-y-contain scroll-smooth safe-top safe-bottom">
                <div className="flex items-center justify-start mt-6 mb-6 w-full gap-4 pl-2">
                    <div className="flex items-center">
                        {/* Login Button / User Profile Replaces "Menu" Text */}
                        {isLoggedIn ? (
                            <button
                                onClick={() => { onClose(); navigateToDashboard(); }}
                                className="flex items-center gap-2 px-4 py-1.5 bg-[#800020] hover:bg-[#600018] text-white rounded-full transition-colors shadow-sm"
                            >
                                <img
                                    src={userAvatar}
                                    alt={userName}
                                    className="w-5 h-5 rounded-full object-cover border border-white/20"
                                />
                                <span className="text-xs font-bold truncate max-w-[80px]">{userName}</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 pr-4 py-1.5 bg-[#800020] text-white rounded-full font-bold shadow-sm hover:bg-[#600018] active:scale-95 transition-all text-xs whitespace-nowrap cursor-pointer">
                                <button onClick={() => { onClose(); onOpen(); }} className="flex items-center gap-2 pl-3 w-full h-full">
                                    <User className="w-4 h-4" />
                                    {t('nav.login') || 'Entrar'}
                                </button>
                            </div>
                        )}

                        <div className="w-px h-6 bg-slate-200 mx-2"></div> {/* Separator */}
                        <LanguageSelector />
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center flex-shrink-0"
                        aria-label={t('aria.closeMenu')}
                    >
                        <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                </div>

                <div className="mb-4 w-full pl-3">
                    <div className="relative flex items-center bg-white rounded-full border border-slate-300 h-[38px] focus-within:border-slate-500 transition-colors">
                        <Search className="w-4 h-4 text-slate-800 absolute left-3" />
                        <div className="w-px h-4 bg-slate-100 absolute left-9"></div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value.slice(0, 50))}
                            placeholder=""
                            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:!outline-none text-sm pl-12 pr-4 shadow-none appearance-none"
                            style={{ boxShadow: 'none' }} // Force removal of any shadow rings
                        />
                    </div>
                </div>
                {/* Navigation */}
                <nav className="space-y-0.5 text-base font-medium text-slate-600 flex-1 w-full mt-3 pl-6" role="navigation" aria-label="Mobile menu navigation">
                    {mainMenu.map((item, index) => (
                        <button key={index} onClick={() => handleMenuClick(item)} className="flex w-full items-center justify-start hover:text-lyvest-500 py-4 border-b border-slate-50 last:border-0 text-left transition-colors touch-target group">
                            <span className="text-left font-medium text-[16px] leading-none whitespace-nowrap flex-1">{t(item.translationKey) || item.label}</span>
                            <ChevronRight className={`w-3.5 h-3.5 text-slate-300 group-hover:text-lyvest-500 transition-transform flex-shrink-0 ${t('direction') === 'rtl' ? 'rotate-180' : ''}`} />
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );
}
