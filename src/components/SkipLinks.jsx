// src/components/SkipLinks.jsx
import React from 'react';
import { useI18n } from '../hooks/useI18n';

/**
 * Skip Links para acessibilidade
 * Permite usuários de teclado/leitores de tela pular para seções importantes
 * 
 * Destinos disponíveis:
 * - Conteúdo principal (#main-content)
 * - Produtos (#products-grid)
 * - Busca (#search-input)
 * - Footer (#footer)
 */
export default function SkipLinks() {
    const { t } = useI18n();

    const links = [
        {
            href: '#main-content',
            label: t('skipLinks.mainContent') || 'Pular para o conteúdo principal',
            color: 'bg-lyvest-500 focus:ring-offset-[#800020]'
        },
        {
            href: '#products-grid',
            label: t('skipLinks.products') || 'Ir para produtos',
            color: 'bg-sky-500 focus:ring-offset-sky-500'
        },
        {
            href: '#footer',
            label: t('skipLinks.footer') || 'Ir para o rodapé',
            color: 'bg-slate-700 focus:ring-offset-slate-700'
        },
    ];

    return (
        <nav
            aria-label={t('skipLinks.navigation') || 'Links de navegação rápida'}
            className="sr-only focus-within:not-sr-only"
        >
            <ul className="flex">
                {links.map((link, index) => (
                    <li key={link.href}>
                        <a
                            href={link.href}
                            className={`fixed top-0 z-[100] ${link.color} text-white px-4 py-2 font-bold rounded-br-lg transform -translate-y-full focus:translate-y-0 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2`}
                            style={{ left: `${index * 200}px` }}
                        >
                            {link.label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}







