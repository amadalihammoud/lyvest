'use client';
import { useState, useEffect, useTransition, ChangeEvent, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Menu, Search, PackageSearch, Heart, ShoppingBag, ChevronDown, X } from 'lucide-react';
import { mainMenu, productsData } from '../../data/mockData';
import { useDebounce } from '../../hooks/useDebounce';
import LanguageSelector from '../features/LanguageSelector';
import { useI18n } from '../../hooks/useI18n';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useModal } from '../../context/ModalContext';
import dynamic from 'next/dynamic';
const MobileMenu = dynamic(() => import('./MobileMenu'), { ssr: false });

// Lazy-load auth UI — defers entire Clerk SDK (~200KB) from critical path
const HeaderAuth = dynamic(() => import('./HeaderAuth'), { ssr: false });

import { useShop } from '../../context/ShopContext';
import { useAuthModal } from '@/store/useAuthModal';
import { useShopNavigation } from '../../hooks/useShopNavigation';

// Lightweight XSS check — replaces heavy security.ts import (DOMPurify ~17KB)
const hasXSS = (v: string) => /<script|javascript:|on\w+=|<iframe/i.test(v);

// Props are now optional - Header manages its own state internally
interface HeaderProps {
    // Kept for backwards compatibility but not required
}

interface User {
    name?: string;
    email?: string;
    imageUrl?: string; // Clerk property
    [key: string]: any;
}

interface MenuItem {
    label: string;
    translationKey: string;
    action: string;
    category?: string;
    subcategories?: MenuItem[];
}

export default function Header(_props?: HeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { t } = useI18n();
    const { cartCount } = useCart();
    const { favorites } = useFavorites();
    const { openDrawer, closeDrawer, openModal } = useModal();
    const { onOpen } = useAuthModal();

    const { selectedCategory, setSelectedCategory } = useShop();
    const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');
    const { handleMenuClick } = useShopNavigation();

    // Internal state for mobile menu
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Internal navigation function
    const navigateToDashboard = () => router.push('/dashboard');

    const menuItems = mainMenu as MenuItem[];

    interface MockProduct {
        id: number;
        name: string;
        category: string;
        price: number;
        image: string;
    }
    const safeProducts = productsData as MockProduct[];


    // Debounce da busca APENAS para navegação/URL
    const debouncedSearch = useDebounce(searchQuery, 500);

    // Atualizar URL quando o termo debounced mudar
    useEffect(() => {
        if (debouncedSearch) {
            router.push(`/?busca=${encodeURIComponent(debouncedSearch)}`);
        } else if (searchQuery === '' && searchParams?.has('busca')) {
            // Se limpou a busca, volta para home limpa
            router.push('/');
        }
    }, [debouncedSearch, router, searchQuery, searchParams]);

    const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.slice(0, 50);
        if (hasXSS(value)) {
            setSearchQuery('');
            return;
        }
        setSearchQuery(value);
    };

    const handleLogoClick = () => {
        setSelectedCategory("Todos");
        setSearchQuery("");
        router.push('/');
    };

    const isCheckout = pathname === '/checkout';

    return (
        <header className="sticky top-0 z-50 bg-white transition-all shadow-sm" role="banner" dir="ltr">
            <div className="container mx-auto px-4 py-2 lg:py-4">
                <a href="#main-content" className="sr-only focus:not-sr-only bg-white text-lyvest-500 px-4 py-2 absolute z-[100] top-0 left-0 shadow-md">
                    {t('a11y.skipToContent') || 'Pular para o conteúdo principal'}
                </a>
                <div className="flex items-center justify-between gap-4">

                    {/* Logo e Menu Mobile */}
                    <div className="flex items-center gap-4 mr-12 lg:mr-24">
                        <button
                            onClick={() => {
                                setIsMobileMenuOpen(prev => !prev);
                                if (!isMobileMenuOpen) {
                                    closeDrawer();
                                }
                            }}
                            className="lg:hidden p-3 hover:bg-slate-100 rounded-full text-slate-600 transition-colors touch-target"
                            aria-label={t('aria.openMenu')}
                        >
                            <Menu className="w-7 h-7" />
                        </button>
                        <Link
                            href="/"
                            aria-label="Ly Vest Home"
                            onClick={handleLogoClick}
                        >
                            <Image
                                src="/lyvest-red-logo.webp"
                                alt="Ly Vest Logo"
                                width={166}
                                height={64}
                                className="h-16 md:h-12 w-auto object-contain transition-transform duration-300 hover:scale-105"
                                priority
                            />
                        </Link>
                    </div>

                    {/* Barra de Busca Inteligente */}
                    <div className="hidden lg:flex flex-1 max-w-xs lg:max-w-sm xl:max-w-lg relative mx-4 lg:mx-8 group z-50">
                        <div className="relative w-full">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearch}
                                placeholder={t('common.search')}
                                aria-label={t('common.search')}
                                maxLength={50}
                                className="w-full pl-12 pr-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F5E6E8] focus:border-lyvest-200 transition-all text-sm placeholder:text-slate-400 group-hover:bg-white"
                            />
                            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors text-lyvest-500" />
                            {searchQuery && (
                                <button
                                    onClick={() => { setSearchQuery(''); router.push('/'); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-slate-200 rounded-full hover:bg-slate-300"
                                    aria-label={t('aria.clearSearch')}
                                >
                                    <X className="w-4 h-4 text-slate-500" />
                                </button>
                            )}
                        </div>

                        {/* Autocomplete Dropdown */}
                        {searchQuery.length > 2 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in">
                                {safeProducts
                                    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .slice(0, 5)
                                    .map((product) => (
                                        <Link
                                            key={product.id}
                                            href={`/produto/${product.name.toLowerCase().replace(/ /g, '-')}`}
                                            onClick={() => setSearchQuery('')}
                                            className="flex items-center gap-4 p-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                                        >
                                            <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 relative">
                                                <Image
                                                    src={product.image}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="48px"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-800 text-sm truncate">{product.name}</p>
                                                <p className="text-xs text-slate-500 truncate">{product.category}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold text-lyvest-500 text-sm">
                                                    R$ {product.price.toFixed(2).replace('.', ',')}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                {safeProducts.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                    <div className="p-4 text-center text-slate-500 text-sm">
                                        Nenhum produto encontrado.
                                    </div>
                                )}
                                {safeProducts.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 && (
                                    <button
                                        onClick={() => router.push(`/?busca=${encodeURIComponent(searchQuery)}`)}
                                        className="w-full p-3 bg-slate-50 text-lyvest-600 text-sm font-bold hover:bg-lyvest-50 transition-colors text-center"
                                    >
                                        Ver todos os resultados
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Ações (Direita) */}
                    <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">

                        {/* Rastreio */}
                        <button
                            onClick={() => { openDrawer('tracking'); setIsMobileMenuOpen(false); }}
                            className="p-2 sm:p-2.5 hover:bg-lyvest-100/30 rounded-full transition-colors text-lyvest-500 hover:text-lyvest-600 touch-target"
                            title={t('nav.tracking')}
                            aria-label={t('aria.trackOrder')}
                        >
                            <PackageSearch className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>

                        {/* Favoritos */}
                        <button
                            onClick={() => { openDrawer('favorites'); setIsMobileMenuOpen(false); }}
                            className="relative p-2 sm:p-2.5 rounded-full transition-colors touch-target hover:bg-lyvest-100/30 text-lyvest-500 hover:text-lyvest-600"
                            title={t('nav.favorites')}
                            aria-label={t('aria.favoritesCount', { count: favorites.length })}
                        >
                            <Heart className={`w-5 h-5 sm:w-6 sm:h-6 ${favorites.length > 0 ? 'fill-lyvest-500 text-lyvest-500' : ''}`} />
                            {favorites.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-lyvest-500 text-white text-[10px] sm:text-xs font-bold w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full shadow-sm">
                                    {favorites.length}
                                </span>
                            )}
                        </button>

                        {/* Carrinho */}
                        <button
                            data-testid="cart-button"
                            onClick={() => { openDrawer('cart'); setIsMobileMenuOpen(false); }}
                            className="relative p-2 sm:p-3 hover:bg-lyvest-100/30 rounded-full transition-colors group touch-target"
                            title={t('nav.cart')}
                            aria-label={t('aria.cartCount', { count: cartCount })}
                        >
                            <ShoppingBag className="w-5 h-5 sm:w-7 sm:h-7 text-lyvest-500 group-hover:text-lyvest-600 transition-colors" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-lyvest-500 text-white text-[10px] sm:text-xs font-bold w-4 h-4 sm:w-6 sm:h-6 flex items-center justify-center rounded-full shadow-sm animate-pulse">
                                    {cartCount}
                                </span>
                            )}
                        </button>

                        {/* Auth UI: lazy-loaded to keep Clerk SDK off critical path */}
                        <Suspense fallback={
                            <div className="hidden lg:block">
                                <button
                                    onClick={() => onOpen()}
                                    className="inline-block bg-lyvest-500 hover:bg-lyvest-600 text-white font-bold py-2 px-6 rounded-full transition-colors shadow-md active:scale-95 text-center cursor-pointer"
                                >
                                    {t('nav.login')}
                                </button>
                            </div>
                        }>
                            <HeaderAuth
                                onOpen={() => onOpen()}
                                navigateToDashboard={navigateToDashboard}
                                loginLabel={t('nav.login')}
                            />
                        </Suspense>

                        {/* Seletor de Idioma (Desktop) */}
                        <div className="hidden lg:flex items-center gap-2">
                            <LanguageSelector />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MENU PRINCIPAL (Barra de Categorias) --- */}
            {!isCheckout && (
                <div className="hidden lg:block bg-lyvest-500" dir="ltr">
                    <div className="container mx-auto px-4">
                        <nav aria-label={t('aria.mainMenu') || "Menu principal"}>
                            <ul className="flex items-center justify-center gap-4 lg:gap-6 xl:gap-10 text-sm font-bold text-white py-2 tracking-wide">
                                {menuItems.map((item, index) => (
                                    <li key={index} className="group relative cursor-pointer">
                                        <button
                                            onClick={() => handleMenuClick(item)}
                                            className={`flex items-center gap-1.5 hover:text-[#FFE4E1] transition-colors py-1 uppercase text-xs sm:text-sm
                                                ${selectedCategory === item.category ? 'text-[#FFE4E1]' : ''}`}
                                            aria-current={selectedCategory === item.category ? 'page' : undefined}
                                        >
                                            {t(item.translationKey) || item.label}
                                            {item.subcategories && item.subcategories.length > 0 && (
                                                <ChevronDown className="w-3.5 h-3.5 text-white group-hover:text-[#FFE4E1] transition-colors" />
                                            )}
                                        </button>
                                        {/* Active/Hover Line */}
                                        <span className={`absolute bottom-0 left-0 h-0.5 bg-[#FFE4E1] transition-all duration-300 ${selectedCategory === item.category ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>
                </div>
            )}
            {/* Mobile Menu Overlay */}
            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                onOpenLogin={() => {
                    onOpen();
                }}
                navigateToDashboard={navigateToDashboard}
            />
        </header>
    );
}
