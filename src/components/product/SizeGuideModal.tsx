import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface SizeGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
    category?: string;
}

export default function SizeGuideModal({ isOpen, onClose, category = 'lingerie' }: SizeGuideModalProps) {
    if (!isOpen) return null;

    // Tabelas de medidas por categoria
    const sizeGuides = {
        lingerie: {
            title: 'Guia de Tamanhos - Lingerie',
            columns: ['Tamanho', 'Busto (cm)', 'Cintura (cm)', 'Quadril (cm)'],
            rows: [
                ['PP', '78-82', '58-62', '84-88'],
                ['P', '83-87', '63-67', '89-93'],
                ['M', '88-92', '68-72', '94-98'],
                ['G', '93-97', '73-77', '99-103'],
                ['GG', '98-102', '78-82', '104-108'],
                ['XG', '103-107', '83-87', '109-113']
            ]
        },
        sutia: {
            title: 'Guia de Tamanhos - Sutiãs',
            columns: ['Tamanho', 'Busto (cm)', 'Baixo Busto (cm)', 'Numeração'],
            rows: [
                ['PP', '78-82', '63-67', '38-40'],
                ['P', '83-87', '68-72', '40-42'],
                ['M', '88-92', '73-77', '42-44'],
                ['G', '93-97', '78-82', '44-46'],
                ['GG', '98-102', '83-87', '46-48']
            ]
        },
        pijamas: {
            title: 'Guia de Tamanhos - Pijamas',
            columns: ['Tamanho', 'Busto/Tórax (cm)', 'Cintura (cm)', 'Quadril (cm)', 'Ombros (cm)'],
            rows: [
                ['PP', '78-82', '58-62', '84-88', '35-37'],
                ['P', '83-87', '63-67', '89-93', '38-40'],
                ['M', '88-92', '68-72', '94-98', '41-43'],
                ['G', '93-97', '73-77', '99-103', '44-46'],
                ['GG', '98-102', '78-82', '104-108', '47-49']
            ]
        },
        meias: {
            title: 'Guia de Tamanhos - Meias e Sapatilhas',
            columns: ['Tamanho', 'Calçado (BR)', 'Comprimento do Pé (cm)'],
            rows: [
                ['PP', '33-35', '21-22'],
                ['P', '36-38', '23-24'],
                ['M', '39-40', '25-26'],
                ['G', '41-42', '27-28'],
                ['GG', '43-44', '29-30']
            ]
        }
    };

    const currentGuide = sizeGuides[category as keyof typeof sizeGuides] || sizeGuides.lingerie;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
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
