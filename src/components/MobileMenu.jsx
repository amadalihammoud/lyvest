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
            <div className="absolute top-0 left-0 h-full w-4/5 max-w-sm bg-white shadow-2xl py-4 px-2 flex flex-col overflow-y-auto overscroll-y-contain scroll-smooth safe-top safe-bottom">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        {/* Login Button / User Profile Replaces "Menu" Text */}
                        {isLoggedIn ? (
                            <button
                                onClick={() => { onClose(); navigateToDashboard(); }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-200 transition-colors"
                            >
                                <img
                                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=random`}
                                    alt={user?.name}
                                    className="w-6 h-6 rounded-full object-cover"
                                />
                                <span className="text-sm font-bold text-slate-700 truncate max-w-[100px]">{user?.name}</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => { onClose(); onOpenLogin(); }}
                                className="flex items-center gap-2 px-4 py-2 bg-lyvest-500 text-white rounded-full font-bold shadow-sm hover:bg-lyvest-600 active:scale-95 transition-all text-xs"
                            >
                                <User className="w-4 h-4" />
                                {t('nav.login') || 'Entrar'}
                            </button>
                        )}

                        <div className="w-px h-6 bg-slate-200 mx-1"></div> {/* Separator */}
                        <LanguageSelector />
                    </div>
                    <button onClick={onClose} className="p-1.5 touch-target bg-slate-50 rounded-full hover:bg-slate-100" aria-label={t('aria.closeMenu')}><X className="w-4 h-4 text-slate-500" /></button>
                </div>

                {/* Search - Margin top adjusted since previous login block is gone */}
                <div className="relative mb-6 mt-2">
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value.slice(0, 50))} placeholder={t('common.search')} className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F5E6E8] focus:border-lyvest-200 transition-all" />
                    <Search className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 ${searchQuery ? 'text-lyvest-500' : 'text-slate-400'}`} />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-slate-200 rounded-full" aria-label={t('aria.clearSearch')}><X className="w-4 h-4 text-slate-500" /></button>
                    )}
                </div>
                {/* Navigation */}
                <nav className="space-y-1 text-base font-medium text-slate-600 flex-1" role="navigation" aria-label="Mobile menu navigation">
                    {mainMenu.map((item, index) => (
                        <button key={index} onClick={() => handleMenuClick(item)} className="flex w-full items-center justify-between hover:text-lyvest-500 py-2.5 px-0 border-b border-slate-50 last:border-0 text-left rounded-lg hover:bg-lyvest-100/30 transition-colors touch-target">
                            {t(item.translationKey) || item.label} <ChevronRight className={`w-4 h-4 text-slate-300 ${t('direction') === 'rtl' ? 'rotate-180' : ''}`} />
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );
}







