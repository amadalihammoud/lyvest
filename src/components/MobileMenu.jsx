import React from 'react';
import { useI18n } from '../hooks/useI18n';
import LanguageSelector from './LanguageSelector';
import { X, Search, ChevronRight, User } from 'lucide-react';
import { mainMenu } from '../data/mockData';

export default function MobileMenu({
    isOpen,
    onClose,
    searchQuery,
    setSearchQuery,
    handleMenuClick,
    onOpenLogin,
    isLoggedIn,
    user,
    navigateToDashboard
}) {
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
            <div className="absolute top-0 left-0 h-full w-[65%] max-w-[280px] bg-white shadow-2xl pt-5 pb-6 pl-3 pr-4 flex flex-col overflow-y-auto overscroll-y-contain scroll-smooth safe-top safe-bottom">
                <div className="flex items-center justify-start mt-6 mb-6 w-full gap-4">
                    <div className="flex items-center">
                        {/* Login Button / User Profile Replaces "Menu" Text */}
                        {isLoggedIn ? (
                            <button
                                onClick={() => { onClose(); navigateToDashboard(); }}
                                className="flex items-center gap-2 px-4 py-1.5 bg-[#800020] hover:bg-[#600018] text-white rounded-full transition-colors shadow-sm"
                            >
                                <img
                                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=random`}
                                    alt={user?.name}
                                    className="w-5 h-5 rounded-full object-cover border border-white/20"
                                />
                                <span className="text-xs font-bold truncate max-w-[80px]">{user?.name}</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => { onClose(); onOpenLogin(); }}
                                className="flex items-center gap-2 pr-4 py-1.5 bg-[#800020] text-white rounded-full font-bold shadow-sm hover:bg-[#600018] active:scale-95 transition-all text-xs whitespace-nowrap"
                            >
                                <div className="pl-3 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    {t('nav.login') || 'Entrar'}
                                </div>
                            </button>
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

                {/* Search Row - Solo */}
                <div className="mb-8 w-full">
                    <div className="relative flex items-center bg-white rounded-full border border-slate-300 h-[38px] focus-within:ring-1 focus-within:ring-slate-400">
                        <Search className="w-4 h-4 text-slate-800 absolute left-3" />
                        <div className="w-px h-4 bg-slate-100 absolute left-9"></div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value.slice(0, 50))}
                            placeholder=""
                            className="flex-1 bg-transparent border-none focus:outline-none text-sm pl-12 pr-4"
                        />
                    </div>
                </div>
                {/* Navigation */}
                <nav className="space-y-0.5 text-base font-medium text-slate-600 flex-1 w-full mt-6" role="navigation" aria-label="Mobile menu navigation">
                    {mainMenu.map((item, index) => (
                        <button key={index} onClick={() => handleMenuClick(item)} className="flex w-full items-center justify-between hover:text-lyvest-500 py-4 border-b border-slate-50 last:border-0 text-left transition-colors touch-target group">
                            <span className="text-left font-medium text-[16px] leading-none whitespace-nowrap">{t(item.translationKey) || item.label}</span>
                            <ChevronRight className={`w-3.5 h-3.5 text-slate-300 group-hover:text-lyvest-500 transition-transform flex-shrink-0 ${t('direction') === 'rtl' ? 'rotate-180' : ''}`} />
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );
}







