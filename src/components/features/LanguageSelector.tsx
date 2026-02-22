// src/components/features/LanguageSelector.tsx
'use client';
import { Globe, ChevronDown, Check } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

import { useI18n } from '../../hooks/useI18n';

interface LocaleInfo {
    name: string;
    flag: string;
}

const LOCALE_NAMES: Record<string, LocaleInfo> = {
    'pt-BR': { name: 'Português', flag: '🇧🇷' },
    'en-US': { name: 'English', flag: '🇺🇸' },
    'es-ES': { name: 'Español', flag: '🇪🇸' },
};

interface LanguageSelectorProps {
    className?: string;
}

function LanguageSelector({ className = '' }: LanguageSelectorProps) {
    const { locale, locales, changeLocale } = useI18n();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close on Escape press
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    const handleSelect = (newLocale: string) => {
        changeLocale(newLocale);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-200/50 transition-colors text-slate-600 text-xs font-bold"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label="Selecionar idioma"
            >
                <Globe className="w-4 h-4 text-slate-500" />
                <span className="uppercase">{locale.split('-')[1]}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform text-slate-400 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <ul
                    role="listbox"
                    className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50 min-w-[160px] animate-scale-up"
                >
                    {locales.map((loc: string) => {
                        const localeInfo = LOCALE_NAMES[loc];
                        const isSelected = loc === locale;

                        return (
                            <li key={loc}>
                                <button
                                    onClick={() => handleSelect(loc)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors ${isSelected ? 'bg-lyvest-100/30 text-lyvest-600' : 'text-slate-700'
                                        }`}
                                    role="option"
                                    aria-selected={isSelected}
                                >
                                    <span className="text-lg">{localeInfo?.flag}</span>
                                    <span className="flex-1 font-medium">{localeInfo?.name || loc}</span>
                                    {isSelected && <Check className="w-4 h-4 text-lyvest-500" />}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

export default React.memo(LanguageSelector);








