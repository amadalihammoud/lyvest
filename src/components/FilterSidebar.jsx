import React, { useState, useLayoutEffect } from 'react';
import { X, Filter, ChevronDown, ChevronUp, Check } from 'lucide-react';
import Button from './ui/Button';

export default function FilterSidebar({
    filters,
    setFilters,
    isOpen,
    onClose,
    availableColors = [],
    availableSizes = [],
    priceRange = { min: 0, max: 1000 },
    variant = 'desktop' // 'desktop' (responsive sidebar) or 'mobile' (dropdown panel)
}) {
    const [mobileTop, setMobileTop] = useState('225px');

    // "iOS-proof" Scroll Lock & Dynamic Positioning
    useLayoutEffect(() => {
        if (isOpen && variant === 'mobile') {
            // 1. Calculate precise initial position
            const toolbar = document.getElementById('category-toolbar') || document.querySelector('.sticky');
            if (toolbar) {
                const rect = toolbar.getBoundingClientRect();
                // Ensure we never go above a sensible minimum (e.g. header height) if something is weird
                const safeTop = Math.max(rect.bottom, 0);
                // eslint-disable-next-line
                setMobileTop(`${safeTop}px`);
            }

            // 2. Lock Body (Standard + iOS Polyfill)
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';

            return () => {
                // 3. Unlock and Restore
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.style.overflow = '';
                window.scrollTo(0, scrollY);
            };
        }
    }, [isOpen, variant]);
    const [expandedSections, setExpandedSections] = useState({
        price: true,
        size: true,
        color: true
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleMinPriceChange = (e) => {
        let value = parseInt(e.target.value);
        if (isNaN(value)) value = 0;
        setFilters(prev => ({
            ...prev,
            minPrice: value
        }));
    };

    const handleMaxPriceChange = (e) => {
        let value = parseInt(e.target.value);
        if (isNaN(value)) value = priceRange.max;
        setFilters(prev => ({
            ...prev,
            maxPrice: value
        }));
    };

    const handleSizeToggle = (size) => {
        setFilters(prev => {
            const currentSizes = prev.sizes || [];
            if (currentSizes.includes(size)) {
                return { ...prev, sizes: currentSizes.filter(s => s !== size) };
            } else {
                return { ...prev, sizes: [...currentSizes, size] };
            }
        });
    };

    const handleColorToggle = (colorName) => {
        setFilters(prev => {
            const currentColors = prev.colors || [];
            if (currentColors.includes(colorName)) {
                return { ...prev, colors: currentColors.filter(c => c !== colorName) };
            } else {
                return { ...prev, colors: [...currentColors, colorName] };
            }
        });
    };

    const clearFilters = () => {
        setFilters(prev => ({
            ...prev,
            minPrice: 0,
            maxPrice: priceRange.max,
            sizes: [],
            colors: []
        }));
    };

    // Mobile Drawer - Slide from LEFT, positioned below header + toolbar
    if (variant === 'mobile') {
        return (
            // SEM OVERLAY - apenas o sidebar, sem escurecer nada
            <aside
                className={`
                    fixed left-0 w-80 max-w-[85vw] bg-white z-50 shadow-2xl 
                    transform transition-transform duration-300 ease-in-out overflow-y-auto
                    lg:hidden border-r border-slate-200
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
                style={{
                    top: mobileTop,
                    height: `calc(100vh - ${mobileTop})`
                }}
            >
                <div className="p-5">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Filter className="w-5 h-5 text-lyvest-500" />
                            Filtros
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-5">
                        {/* Preço */}
                        <div className="border-b border-slate-100 pb-4">
                            <button onClick={() => toggleSection('price')} className="flex items-center justify-between w-full mb-3 text-slate-800 font-semibold text-sm">
                                <span>Faixa de Preço</span>
                                {expandedSections.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            {expandedSections.price && (
                                <div className="px-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex-1">
                                            <label htmlFor="mobile-min-price" className="text-[10px] text-slate-500 font-medium mb-1 block">Mínimo</label>
                                            <input id="mobile-min-price" type="number" min={0} max={filters.maxPrice} value={filters.minPrice || ''} placeholder={priceRange.min} onChange={handleMinPriceChange} className="w-full h-8 px-2 border border-slate-200 rounded-md text-sm" />
                                        </div>
                                        <span className="text-slate-300 mt-3">-</span>
                                        <div className="flex-1">
                                            <label htmlFor="mobile-max-price" className="text-[10px] text-slate-500 font-medium mb-1 block">Máximo</label>
                                            <input id="mobile-max-price" type="number" min={filters.minPrice} max={priceRange.max} value={filters.maxPrice || ''} placeholder={priceRange.max} onChange={handleMaxPriceChange} className="w-full h-8 px-2 border border-slate-200 rounded-md text-sm" />
                                        </div>
                                    </div>
                                    <input type="range" min={0} max={priceRange.max} value={filters.maxPrice || priceRange.max} onChange={handleMaxPriceChange} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-lyvest-500" />
                                </div>
                            )}
                        </div>

                        {/* Tamanhos */}
                        <div className="border-b border-slate-100 pb-4">
                            <button onClick={() => toggleSection('size')} className="flex items-center justify-between w-full mb-3 text-slate-800 font-semibold text-sm">
                                <span>Tamanhos</span>
                                {expandedSections.size ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            {expandedSections.size && (
                                <div className="grid grid-cols-4 gap-2">
                                    {availableSizes.map(size => (
                                        <button key={size} onClick={() => handleSizeToggle(size)} className={`h-9 rounded-md text-xs font-bold border ${filters.sizes?.includes(size) ? 'bg-lyvest-500 text-white border-lyvest-500' : 'bg-white text-slate-600 border-slate-200'}`}>{size}</button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Cores */}
                        <div className="border-b border-slate-100 pb-4">
                            <button onClick={() => toggleSection('color')} className="flex items-center justify-between w-full mb-3 text-slate-800 font-semibold text-sm">
                                <span>Cores</span>
                                {expandedSections.color ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            {expandedSections.color && (
                                <div className="flex flex-wrap gap-2">
                                    {availableColors.map(color => (
                                        <button
                                            key={color.name}
                                            onClick={() => handleColorToggle(color.name)}
                                            className={`w-8 h-8 rounded-full border-2 transition-all relative ${filters.colors?.includes(color.name) ? 'border-lyvest-500 ring-2 ring-lyvest-100' : 'border-slate-200'}`}
                                            style={{ backgroundColor: color.hex }}
                                            title={color.name}
                                        >
                                            {filters.colors?.includes(color.name) && (
                                                <span className={`absolute inset-0 flex items-center justify-center ${['#FFFFFF', '#F5D0C5', '#f3e8ff'].includes(color.hex) ? 'text-slate-800' : 'text-white'}`}>
                                                    <Check size={14} strokeWidth={3} />
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Botão Limpar */}
                        <Button
                            onClick={clearFilters}
                            variant="outline"
                            fullWidth
                            className="border-slate-300 text-slate-600 hover:bg-slate-50 text-sm h-10"
                        >
                            Limpar Filtros
                        </Button>
                    </div>
                </div>
            </aside>
        );
    }

    // Default DESKTOP / SIDEBAR variant logic
    return (
        <>
            {/* Overlay REMOVIDO - causava escurecimento no mobile porque ambas instâncias compartilham isOpen */}

            {/* Sidebar Content */}
            <aside
                className={`
                    fixed top-[129px] right-0 h-[calc(100vh-129px)] w-80 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto
                    lg:static lg:transform-none lg:w-64 lg:shadow-none lg:border-r lg:border-slate-100 lg:h-[calc(100vh-80px)] lg:sticky lg:top-24 lg:z-30
                    ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
                    ${variant === 'desktop' ? 'hidden lg:block' : 'hidden'} 
                `}
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Filter className="w-5 h-5 text-lyvest-500" />
                            Filtros
                        </h2>
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 hover:bg-slate-100 rounded-full text-slate-500"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Preço */}
                    <div className="mb-6 border-b border-slate-100 pb-6">
                        <button
                            onClick={() => toggleSection('price')}
                            className="flex items-center justify-between w-full mb-4 text-slate-800 font-semibold"
                        >
                            <span>Faixa de Preço</span>
                            {expandedSections.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {expandedSections.price && (
                            <div className="px-1">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="flex-1">
                                        <label htmlFor="min-price-input" className="text-xs text-slate-500 font-medium mb-1 block">Mínimo (R$)</label>
                                        <input
                                            id="min-price-input"
                                            type="number"
                                            min={0}
                                            max={filters.maxPrice}
                                            value={filters.minPrice || ''}
                                            placeholder={priceRange.min}
                                            onChange={handleMinPriceChange}
                                            className="w-full h-9 px-2 border border-slate-200 rounded-lg text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                                        />
                                    </div>
                                    <span className="text-slate-300 mt-4">-</span>
                                    <div className="flex-1">
                                        <label htmlFor="max-price-input" className="text-xs text-slate-500 font-medium mb-1 block">Máximo (R$)</label>
                                        <input
                                            id="max-price-input"
                                            type="number"
                                            min={filters.minPrice}
                                            max={priceRange.max}
                                            value={filters.maxPrice || ''}
                                            placeholder={priceRange.max}
                                            onChange={handleMaxPriceChange}
                                            className="w-full h-9 px-2 border border-slate-200 rounded-lg text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                                        />
                                    </div>
                                </div>

                                <input
                                    type="range"
                                    min={0}
                                    max={priceRange.max}
                                    value={filters.maxPrice || priceRange.max}
                                    onChange={handleMaxPriceChange}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-lyvest-500"
                                />
                                <div className="flex justify-between text-xs text-slate-400 mt-1">
                                    <span>R$ 0</span>
                                    <span>R$ {priceRange.max}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tamanhos */}
                    <div className="mb-6 border-b border-slate-100 pb-6">
                        <button
                            onClick={() => toggleSection('size')}
                            className="flex items-center justify-between w-full mb-4 text-slate-800 font-semibold"
                        >
                            <span>Tamanhos</span>
                            {expandedSections.size ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {expandedSections.size && (
                            <div className="grid grid-cols-4 gap-2">
                                {availableSizes.map(size => (
                                    <button
                                        key={size}
                                        onClick={() => handleSizeToggle(size)}
                                        className={`
                                            h-10 rounded-lg text-sm font-bold border transition-all
                                            ${filters.sizes?.includes(size)
                                                ? 'bg-lyvest-500 text-white border-lyvest-500 shadow-md transform scale-105'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-lyvest-300 hover:text-lyvest-600'}
                                        `}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Cores */}
                    <div className="mb-8">
                        <button
                            onClick={() => toggleSection('color')}
                            className="flex items-center justify-between w-full mb-4 text-slate-800 font-semibold"
                        >
                            <span>Cores</span>
                            {expandedSections.color ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {expandedSections.color && (
                            <div className="flex flex-wrap gap-3">
                                {availableColors.map(color => (
                                    <button
                                        key={color.name}
                                        onClick={() => handleColorToggle(color.name)}
                                        className={`
                                            w-8 h-8 rounded-full border-2 transition-all relative group
                                            ${filters.colors?.includes(color.name)
                                                ? 'border-lyvest-500 ring-2 ring-lyvest-100 scale-110'
                                                : 'border-slate-200 hover:border-lyvest-300'}
                                        `}
                                        style={{ backgroundColor: color.hex }}
                                        title={color.name}
                                    >
                                        {/* Tooltip simples */}
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                            {color.name}
                                        </span>

                                        {/* Checkmark se selecionado */}
                                        {filters.colors?.includes(color.name) && (
                                            <span className={`
                                                absolute inset-0 flex items-center justify-center 
                                                ${['#FFFFFF', '#F5D0C5', '#f3e8ff'].includes(color.hex) ? 'text-slate-800' : 'text-white'}
                                            `}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Botão Limpar */}
                    <Button
                        onClick={clearFilters}
                        variant="outline"
                        fullWidth
                        className="border-slate-300 text-slate-600 hover:bg-slate-50"
                    >
                        Limpar Filtros
                    </Button>
                </div>
            </aside>
        </>
    );
}
