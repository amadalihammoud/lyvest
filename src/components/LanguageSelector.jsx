// src/components/LanguageSelector.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useI18n } from '../hooks/useI18n';

const LOCALE_NAMES = {
    'pt-BR': { name: 'Português', flag: '🇧🇷' },
    'en-US': { name: 'English', flag: '🇺🇸' },
    'es-ES': { name: 'Español', flag: '🇪🇸' },
};

function LanguageSelector({ className = '' }) {
    const { locale, locales, changeLocale } = useI18n();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Fechar ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fechar ao pressionar Escape
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    const currentLocale = LOCALE_NAMES[locale] || LOCALE_NAMES['pt-BR'];

    const handleSelect = (newLocale) => {
        changeLocale(newLocale);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 text-sm font-medium"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label="Selecionar idioma"
            >
                <Globe className="w-4 h-4" />
                <span>{currentLocale.flag}</span>
                <span className="hidden sm:inline">{currentLocale.name}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <ul
                    role="listbox"
                    className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50 min-w-[160px] animate-scale-up"
                >
                    {locales.map((loc) => {
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
                                    <span className="text-lg">{localeInfo.flag}</span>
                                    <span className="flex-1 font-medium">{localeInfo.name}</span>
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







