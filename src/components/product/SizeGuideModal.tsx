import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

import { CategorySlug, SizeChartRow, formatRange, getSizeChart } from '../../data/sizeChart';

interface SizeGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Categoria em qualquer formato ("Sutiãs", slug, objeto do Supabase) — normalizada internamente. */
    category?: unknown;
}

const GUIDE_TITLES: Record<CategorySlug, string> = {
    sutia: 'Guia de Tamanhos - Sutiãs',
    calcinha: 'Guia de Tamanhos - Calcinhas',
    cueca: 'Guia de Tamanhos - Cuecas',
    conjunto: 'Guia de Tamanhos - Conjuntos',
    bodysuit: 'Guia de Tamanhos - Bodysuits',
    pijama: 'Guia de Tamanhos - Pijamas',
    meia: 'Guia de Tamanhos - Meias e Sapatilhas',
    lingerie: 'Guia de Tamanhos - Lingerie',
};

// Colunas exibidas por medida disponível (ordem fixa de exibição)
const COLUMN_DEFS: { key: keyof SizeChartRow; label: string }[] = [
    { key: 'bust', label: 'Busto (cm)' },
    { key: 'underbust', label: 'Baixo Busto (cm)' },
    { key: 'waist', label: 'Cintura (cm)' },
    { key: 'hip', label: 'Quadril (cm)' },
    { key: 'shoulders', label: 'Ombros (cm)' },
    { key: 'shoeBR', label: 'Calçado (BR)' },
    { key: 'footCm', label: 'Comprimento do Pé (cm)' },
    { key: 'braNumber', label: 'Numeração' },
];

// Monta título/colunas/linhas a partir da fonte única de medidas (sizeChart.ts)
function buildGuide(category: unknown): { title: string; columns: string[]; rows: string[][] } {
    const { slug, rows } = getSizeChart(category);
    const activeCols = COLUMN_DEFS.filter((col) => rows.some((row) => row[col.key] !== undefined));
    return {
        title: GUIDE_TITLES[slug],
        columns: ['Tamanho', ...activeCols.map((c) => c.label)],
        rows: rows.map((row) => [
            row.size,
            ...activeCols.map((col) => {
                const value = row[col.key];
                return typeof value === 'string' ? value : formatRange(value as { min: number; max: number } | undefined);
            }),
        ]),
    };
}

export default function SizeGuideModal({ isOpen, onClose, category = 'lingerie' }: SizeGuideModalProps) {
    if (!isOpen) return null;

    const currentGuide = buildGuide(category);

    const modalContent = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 animate-fade-in"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
            role="button"
            tabIndex={0}
            aria-label="Fechar"
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                    <h2 className="text-2xl font-bold text-lyvest-600">{currentGuide.title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Dicas */}
                    <div className="bg-lyvest-50 border border-lyvest-200 rounded-lg p-4 mb-6">
                        <h3 className="font-bold text-lyvest-700 mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Como medir
                        </h3>
                        <ul className="text-sm text-slate-600 space-y-1">
                            <li>• Use uma fita métrica flexível</li>
                            <li>• Meça sobre a pele ou roupa fina</li>
                            <li>• Mantenha a fita reta e paralela ao chão</li>
                            <li>• Não aperte demais a fita</li>
                        </ul>
                    </div>

                    {/* Tabela */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-lyvest-600 text-white">
                                    {currentGuide.columns.map((col, idx) => (
                                        <th key={idx} className="px-4 py-3 text-left font-bold text-sm uppercase tracking-wider">
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {currentGuide.rows.map((row, rowIdx) => (
                                    <tr
                                        key={rowIdx}
                                        className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                                    >
                                        {row.map((cell, cellIdx) => (
                                            <td
                                                key={cellIdx}
                                                className={`px-4 py-3 ${cellIdx === 0 ? 'font-bold text-lyvest-600' : 'text-slate-700'}`}
                                            >
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-sm text-slate-600">
                            <strong>Dúvidas?</strong> Entre em contato com nossa equipe pelo WhatsApp ou use o <strong>Provador Virtual com IA</strong> para descobrir seu tamanho ideal automaticamente! ✨
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
