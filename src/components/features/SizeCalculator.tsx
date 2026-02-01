```
import React, { useState } from 'react';
import { Ruler, Weight, HelpCircle } from 'lucide-react';
import { BodyMeasurements } from '../../services/sizeAI';
import { Product } from '../../services/ProductService';

interface SizeCalculatorProps {
    onCalculate: (measurements: BodyMeasurements) => void;
    isLoading?: boolean;
    initialMeasurements?: BodyMeasurements | null;
    product: Product;
}

export default function SizeCalculator({ onCalculate, isLoading, initialMeasurements, product }: SizeCalculatorProps) {
    // Identificar categoria do produto para mostrar campos relevantes
    const getProductCategory = () => {
        const cat = typeof product.category === 'string'
            ? product.category.toLowerCase()
            : Array.isArray(product.category)
                ? product.category[0]?.slug
                : 'lingerie';

        if (cat?.includes('sutia') || cat?.includes('top')) return 'bra';
        if (cat?.includes('calcinha') || cat?.includes('cueca')) return 'panty';
        if (cat?.includes('meia')) return 'socks';
        if (cat?.includes('pijama') || cat?.includes('camisola') || cat?.includes('robe')) return 'sleepwear';
        return 'general';
    };

    const category = getProductCategory();

    const [measurements, setMeasurements] = useState<BodyMeasurements>(initialMeasurements || {
        height: 165,
        weight: 60,
        bustType: 'medium', // Default para satisfazer interface
        hipType: 'medium',  // Default para satisfazer interface
        fitPreference: 'comfortable',
        exactBust: 90,
        exactWaist: 70,
        exactHips: 100,
        // Novos campos
        exactUnderBust: 75,
        exactThigh: 55,
        exactCalf: 35,
        shoeSize: 36
    });

    // Atualizar estado se initialMeasurements mudar
    React.useEffect(() => {
        if (initialMeasurements) {
            setMeasurements(prev => ({ ...prev, ...initialMeasurements }));
        }
    }, [initialMeasurements]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCalculate(measurements);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* 1. DADOS BÁSICOS (ALTURA E PESO) - Sempre visíveis */}
            <div className="grid grid-cols-2 gap-4 animate-fade-in">
                <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                        <Ruler className="w-3.5 h-3.5" /> Altura: {measurements.height}cm
                    </label>
                    <input
                        type="range"
                        min="140"
                        max="200"
                        value={measurements.height}
                        onChange={(e) => setMeasurements({ ...measurements, height: parseInt(e.target.value) })}
                        className="w-full h-2 bg-lyvest-100 rounded-lg appearance-none cursor-pointer accent-lyvest-600"
                    />
                </div>
                <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-2">
                        <Weight className="w-3.5 h-3.5" /> Peso: {measurements.weight}kg
                    </label>
                    <input
                        type="range"
                        min="40"
                        max="120"
                        value={measurements.weight}
                        onChange={(e) => setMeasurements({ ...measurements, weight: parseInt(e.target.value) })}
                        className="w-full h-2 bg-lyvest-100 rounded-lg appearance-none cursor-pointer accent-lyvest-600"
                    />
                </div>
            </div>

            <div className="border-t border-slate-100 my-4"></div>

            {/* 2. MEDIDAS ESPECÍFICAS (DINÂMICO POR CATEGORIA) */}
            <div className="space-y-4 animate-fade-in">
                <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700 mb-4 flex gap-3">
                    <span className="text-xl">📏</span>
                    <p>
                        {category === 'bra' && "Para sutiãs, o segredo é a relação entre Busto e Tórax (abaixo do seio)."}
                        {category === 'panty' && "Para calcinhas, foque na medida do quadril (parte mais larga)."}
                        {category === 'socks' && "Para meias, a panturrilha é essencial para não apertar."}
                        {category === 'general' && "Use uma fita métrica para medir seu corpo para maior precisão."}
                    </p>
                </div>

                {/* Inputs para Sutiãs/Tops */}
                {(category === 'bra' || category === 'general' || category === 'sleepwear') && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Busto (cm)
                                <HelpCircle className="w-3 h-3 inline ml-1 text-slate-400" />
                            </label>
                            <input
                                type="number"
                                value={measurements.exactBust || ''}
                                onChange={(e) => setMeasurements({ ...measurements, exactBust: Number(e.target.value) })}
                                placeholder="Ex: 90"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-lyvest-500 outline-none"
                            />
                        </div>
                        {category === 'bra' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Sub-Busto/Tórax (cm)
                                </label>
                                <input
                                    type="number"
                                    value={measurements.exactUnderBust || ''}
                                    onChange={(e) => setMeasurements({ ...measurements, exactUnderBust: Number(e.target.value) })}
                                    placeholder="Ex: 80"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-lyvest-500 outline-none"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Inputs para Parte de Baixo */}
                {(category === 'panty' || category === 'general' || category === 'sleepwear') && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Cintura (Umbigo)
                            </label>
                            <input
                                type="number"
                                value={measurements.exactWaist || ''}
                                onChange={(e) => setMeasurements({ ...measurements, exactWaist: Number(e.target.value) })}
                                placeholder="Ex: 70"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-lyvest-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Quadril (cm)
                            </label>
                            <input
                                type="number"
                                value={measurements.exactHips || ''}
                                onChange={(e) => setMeasurements({ ...measurements, exactHips: Number(e.target.value) })}
                                placeholder="Ex: 100"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-lyvest-500 outline-none"
                            />
                        </div>
                    </div>
                )}

                {/* Input Específico para Calcinha (Coxa) */}
                {category === 'panty' && (
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Coxa (Opcional - para não enrolar)
                        </label>
                        <input
                            type="number"
                            value={measurements.exactThigh || ''}
                            onChange={(e) => setMeasurements({ ...measurements, exactThigh: Number(e.target.value) })}
                            placeholder="Ex: 55"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-lyvest-500 outline-none"
                        />
                    </div>
                )}

                {/* Inputs para Meias */}
                {category === 'socks' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Nº Calçado
                            </label>
                            <input
                                type="number"
                                value={measurements.shoeSize || ''}
                                onChange={(e) => setMeasurements({ ...measurements, shoeSize: Number(e.target.value) })}
                                placeholder="Ex: 36"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-lyvest-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Panturrilha (cm)
                            </label>
                            <input
                                type="number"
                                value={measurements.exactCalf || ''}
                                onChange={(e) => setMeasurements({ ...measurements, exactCalf: Number(e.target.value) })}
                                placeholder="Ex: 35"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-lyvest-500 outline-none"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Preferência de Ajuste (Comum) */}
            <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Preferência de Ajuste
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {(['snug', 'comfortable'] as const).map((pref) => (
                        <button
                            key={pref}
                            type="button"
                            onClick={() => setMeasurements({ ...measurements, fitPreference: pref })}
                            className={`px - 4 py - 3 rounded - lg text - sm font - medium transition - colors border - 2 ${
    measurements.fitPreference === pref
    ? 'bg-lyvest-600 text-white border-lyvest-600'
    : 'bg-white text-slate-700 border-slate-300 hover:border-lyvest-400 hover:bg-lyvest-50'
} `}
                        >
                            <div className="font-semibold">
                                {pref === 'snug' ? 'Mais Justo' : 'Confortável'}
                            </div>
                            <div className="text-xs opacity-80 mt-1">
                                {pref === 'snug' ? 'Efeito modelador' : 'Mais solto'}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Botão Submit */}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-lyvest-600 text-white py-4 rounded-xl font-semibold hover:bg-lyvest-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        O Especialista LyVest está analisando...
                    </span>
                ) : (
                    'Descobrir Meu Tamanho Ideal'
                )}
            </button>

            <p className="text-xs text-slate-500 text-center">
                💡 Baseado em modelagem técnica e dados de 20 anos de experiência
            </p>
        </form>
    );
}
