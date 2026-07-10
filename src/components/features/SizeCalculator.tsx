import { Ruler, Weight } from 'lucide-react';
import React, { useState } from 'react';

import BodyMannequin from './BodyMannequin';
import { normalizeCategorySlug } from '../../data/sizeChart';
import { Product } from '../../services/ProductService';
import { BodyMeasurements } from '../../services/sizeAI';
import { getProductGender } from '../../utils/productUtils';

interface SizeCalculatorProps {
    onCalculate: (measurements: BodyMeasurements) => void;
    isLoading?: boolean;
    initialMeasurements?: BodyMeasurements | null;
    product: Product;
}

// Componente TunerInput FORA para evitar recriação
const TunerInput = React.memo(({ label, value, onChange, min, max }: {
    label: string;
    value: number;
    onChange: (val: number) => void;
    min: number;
    max: number;
}) => (
    <div className="mb-4">
        <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
            <span>{label}</span>
            <span className="text-lyvest-600">{Math.round(value)} cm</span>
        </label>
        <input
            type="range"
            min={min}
            max={max}
            step="1"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-1.5 bg-lyvest-100 rounded-lg appearance-none cursor-pointer accent-lyvest-600"
        />
    </div>
));

// Slug canônico da categoria: tenta a categoria e, se cair no genérico, o nome do
// produto (ex.: produto "Sutiã Renda" em categoria "Novidades" ainda vira 'sutia').
function resolveSizeSlug(product: Product) {
    const byCategory = normalizeCategorySlug(product.category);
    if (byCategory !== 'lingerie') return byCategory;
    return normalizeCategorySlug(product.name);
}

interface MeasurementTunersProps {
    shouldShowBustField: boolean;
    shouldShowUnderbustField: boolean;
    shouldShowWaistField: boolean;
    shouldShowHipField: boolean;
    shouldShowShoulderField: boolean;
    productGender: string;
    measurements: BodyMeasurements;
    onBust: (v: number) => void;
    onUnderbust: (v: number) => void;
    onWaist: (v: number) => void;
    onHips: (v: number) => void;
    onShoulder: (v: number) => void;
}

// Extraído para manter SizeCalculator com baixa complexidade (render idêntico).
function MeasurementTuners(p: MeasurementTunersProps) {
    return (
        <>
            {p.shouldShowBustField && (
                <TunerInput
                    label={p.productGender === 'male' ? 'Peito' : 'Tórax (Busto)'}
                    value={p.measurements.exactBust || 90}
                    onChange={p.onBust}
                    min={70} max={130}
                />
            )}
            {p.shouldShowUnderbustField && (
                <TunerInput
                    label="Baixo do Busto"
                    value={p.measurements.exactUnderBust || 75}
                    onChange={p.onUnderbust}
                    min={60} max={100}
                />
            )}
            {p.shouldShowWaistField && (
                <TunerInput
                    label="Cintura"
                    value={p.measurements.exactWaist || 70}
                    onChange={p.onWaist}
                    min={50} max={110}
                />
            )}
            {p.shouldShowHipField && (
                <TunerInput
                    label="Quadril"
                    value={p.measurements.exactHips || 100}
                    onChange={p.onHips}
                    min={80} max={140}
                />
            )}
            {p.shouldShowShoulderField && (
                <TunerInput
                    label="Largura dos Ombros"
                    value={p.measurements.shoulderWidth || 40}
                    onChange={p.onShoulder}
                    min={30} max={55}
                />
            )}
        </>
    );
}

export default function SizeCalculator({ onCalculate, isLoading, initialMeasurements, product }: SizeCalculatorProps) {
    const productGender = getProductGender(product);

    const slug = resolveSizeSlug(product);

    // Determinar quais campos mostrar baseado na categoria
    const shouldShowBustField = slug !== 'calcinha' && slug !== 'cueca'; // NÃO mostrar busto/peito para cuecas/calcinhas
    const shouldShowUnderbustField = slug === 'sutia'; // Mostrar APENAS para sutiãs
    const shouldShowWaistField = slug !== 'sutia'; // NÃO mostrar cintura para sutiãs
    const shouldShowHipField = slug !== 'sutia'; // NÃO mostrar quadril para sutiãs
    const shouldShowShoulderField = slug === 'pijama'; // Mostrar APENAS para pijamas

    const [measurements, setMeasurements] = useState<BodyMeasurements>(initialMeasurements || {
        height: 165,
        weight: 60,
        age: 30,
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

    // Handlers otimizados com useCallback para evitar re-renders
    const handleBustChange = React.useCallback((val: number) => {
        setMeasurements(prev => ({ ...prev, exactBust: val }));
    }, []);

    const handleWaistChange = React.useCallback((val: number) => {
        setMeasurements(prev => ({ ...prev, exactWaist: val }));
    }, []);

    const handleHipsChange = React.useCallback((val: number) => {
        setMeasurements(prev => ({ ...prev, exactHips: val }));
    }, []);

    const handleUnderbustChange = React.useCallback((val: number) => {
        setMeasurements(prev => ({ ...prev, exactUnderBust: val }));
    }, []);

    const handleShoulderChange = React.useCallback((val: number) => {
        setMeasurements(prev => ({ ...prev, shoulderWidth: val }));
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCalculate(measurements);
    };

    // Memoizar props do BodyMannequin para evitar re-renders pesados
    const mannequinProps = React.useMemo(() => ({
        bust: measurements.exactBust || 90,
        waist: measurements.exactWaist || 70,
        hips: measurements.exactHips || 100,
        gender: productGender
    }), [measurements.exactBust, measurements.exactWaist, measurements.exactHips, productGender]);

    return (
        <form onSubmit={handleSubmit} className="animate-fade-in">
            <div className="flex flex-col md:flex-row gap-8">
                {/* COLUNA ESQUERDA: MANEQUIM VISUAL */}
                <div className="w-full md:w-5/12">
                    <div className="sticky top-4">
                        <BodyMannequin {...mannequinProps} />
                        <p className="text-[10px] text-slate-400 text-center mt-3">
                            Visualização aproximada baseada nas suas medidas.
                        </p>
                    </div>
                </div>

                {/* COLUNA DIREITA: CONTROLES */}
                <div className="w-full md:w-7/12 space-y-6">

                    {/* 1. DADOS BÁSICOS */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Estrutura Corporal
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Altura */}
                            <div>
                                <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                                    <span className="flex items-center gap-1"><Ruler className="w-3 h-3" /> Altura</span>
                                    <span className="text-lyvest-600">{measurements.height} cm</span>
                                </label>
                                <input
                                    type="range"
                                    min="140"
                                    max="200"
                                    value={measurements.height}
                                    onChange={(e) => setMeasurements({ ...measurements, height: parseInt(e.target.value) })}
                                    className="w-full h-1.5 bg-lyvest-100 rounded-lg appearance-none cursor-pointer accent-lyvest-600"
                                />
                            </div>
                            {/* Peso */}
                            <div>
                                <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                                    <span className="flex items-center gap-1"><Weight className="w-3 h-3" /> Peso</span>
                                    <span className="text-lyvest-600">{measurements.weight} kg</span>
                                </label>
                                <input
                                    type="range"
                                    min="40"
                                    max="120"
                                    value={measurements.weight}
                                    onChange={(e) => setMeasurements({ ...measurements, weight: parseInt(e.target.value) })}
                                    className="w-full h-1.5 bg-lyvest-100 rounded-lg appearance-none cursor-pointer accent-lyvest-600"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 2. TUNER DE MEDIDAS (Corpo) */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-lyvest-500"></span>
                            Ajuste Fino
                        </h3>


                        <MeasurementTuners
                            shouldShowBustField={shouldShowBustField}
                            shouldShowUnderbustField={shouldShowUnderbustField}
                            shouldShowWaistField={shouldShowWaistField}
                            shouldShowHipField={shouldShowHipField}
                            shouldShowShoulderField={shouldShowShoulderField}
                            productGender={productGender}
                            measurements={measurements}
                            onBust={handleBustChange}
                            onUnderbust={handleUnderbustChange}
                            onWaist={handleWaistChange}
                            onHips={handleHipsChange}
                            onShoulder={handleShoulderChange}
                        />
                    </div>

                    {/* Preferência */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            Como você prefere?
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setMeasurements({ ...measurements, fitPreference: 'snug' })}
                                className={`py-2 px-3 rounded-lg border text-sm transition-all ${measurements.fitPreference === 'snug' ? 'border-lyvest-600 bg-lyvest-50 text-lyvest-700 font-bold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                Justinho
                            </button>
                            <button
                                type="button"
                                onClick={() => setMeasurements({ ...measurements, fitPreference: 'comfortable' })}
                                className={`py-2 px-3 rounded-lg border text-sm transition-all ${measurements.fitPreference === 'comfortable' ? 'border-lyvest-600 bg-lyvest-50 text-lyvest-700 font-bold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                Confortável
                            </button>
                        </div>
                    </div>

                    {/* Botão Submit */}
                    <div className="pt-4 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            {isLoading ? 'Calculando...' : 'Ver Meu Tamanho Ideal'}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}
