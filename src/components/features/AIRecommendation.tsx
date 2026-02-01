import { useState, useEffect } from 'react';
import { CheckCircle2, Info, ShoppingBag, Plus } from 'lucide-react';
import { SizeRecommendation, FitType } from '../../services/sizeAI';
import { Product } from '../../services/ProductService';
import BodyMannequin from './BodyMannequin';
import { productsData } from '../../data/mockData';

interface AIRecommendationProps {
    recommendation: SizeRecommendation;
    onAddToCart: (size: string) => void;
    onViewModels: () => void;
    product?: Product;
    gender?: 'male' | 'female'; // Novo prop
}

export default function AIRecommendation({
    recommendation,
    onAddToCart,
    onViewModels,
    product,
    gender = 'female' // Default
}: AIRecommendationProps) {
    const { size, reason, fitMap } = recommendation;
    const [addedCrossSell, setAddedCrossSell] = useState(false);

    // Estado para o tamanho visualizado (permite ao usuário explorar outros tamanhos)
    const [viewSize, setViewSize] = useState<string>(recommendation.size);

    // Efeito para resetar quando a recomendação mudar
    useEffect(() => {
        if (recommendation.size) setViewSize(recommendation.size);
    }, [recommendation.size]);

    // Lógica de cross-sell dinâmica
    const getCrossSellProduct = () => {
        if (!product) return productsData.find(p => p.id !== 1); // Fallback

        const category = typeof product.category === 'string'
            ? product.category.toLowerCase()
            : Array.isArray(product.category)
                ? product.category[0]?.slug.toLowerCase()
                : 'lingerie';

        // Definir categoria alvo para Cross-Sell
        let targetCategory = '';
        if (gender === 'male') {
            // Lógica masculina
            if (category.includes('cueca')) targetCategory = 'meia';
            else targetCategory = 'cuecas';
        } else {
            // Lógica feminina
            if (category.includes('sutia') || category.includes('top')) targetCategory = 'calcinhas';
            else if (category.includes('calcinha')) targetCategory = 'sutiãs';
            else if (category.includes('meia')) targetCategory = 'calcinhas';
            else targetCategory = 'kits';
        }

        // Tentar encontrar produto na base mockada
        const recommendation = productsData.find(p => {
            const cat = typeof p.category === 'string' ? p.category.toLowerCase() : '';
            return cat.includes(targetCategory.toLowerCase());
        });

        if (recommendation) {
            return {
                name: recommendation.name,
                price: recommendation.price,
                image: Array.isArray(recommendation.image) ? recommendation.image[0] : recommendation.image,
                type: recommendation.category,
                id: recommendation.id
            };
        }

        return productsData[0];
    };

    const crossSell = getCrossSellProduct();

    const getFitLabel = (fit: FitType) => {
        switch (fit) {
            case 'tight': return 'Justo';
            case 'loose': return 'Largo';
            case 'perfect': return 'Ideal (Perfeito)';
            default: return '-';
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100 relative overflow-hidden">
            {/* Header com Resultado Principal */}
            <div className="text-center mb-8 relative z-10">
                <div className="inline-flex items-center gap-2 bg-lyvest-50 px-4 py-1.5 rounded-full text-lyvest-700 text-sm font-bold mb-3 border border-lyvest-100">
                    <CheckCircle2 className="w-4 h-4" />
                    Recomendação de IA
                </div>
                <h3 className="text-4xl font-black text-slate-800 mb-1">
                    Tamanho {size}
                </h3>
                <p className="text-slate-500 text-sm">{reason}</p>
            </div>

            {/* Visualização Interativa do Manequim */}
            {fitMap && (
                <div className="flex flex-col md:flex-row gap-8 items-center justify-center bg-slate-50 p-8 rounded-3xl border border-slate-100 mb-6">
                    {/* Coluna Visual (Manequim) */}
                    <div className="w-48 flex-shrink-0 relative">
                        <BodyMannequin
                            bust={gender === 'male' ? 100 : 90} // Ajuste base
                            waist={gender === 'male' ? 85 : 70}
                            hips={gender === 'male' ? 95 : 100}
                            viewMode="result"
                            gender={gender} // Passar gênero
                            fitResult={{
                                bust: fitMap[viewSize] === 'tight' ? 'tight' : fitMap[viewSize] === 'loose' ? 'loose' : 'perfect',
                                waist: fitMap[viewSize] as any,
                                hips: fitMap[viewSize] === 'tight' ? 'tight' : fitMap[viewSize] === 'loose' ? 'loose' : 'perfect'
                            }}
                        />

                        {/* Indicador de Tamanho Visualizado (Flutuante) */}
                        <div className="absolute top-0 right-0 bg-white shadow-md rounded-lg px-2 py-1 border border-slate-100">
                            <span className="text-xs font-bold text-slate-400 block mb-0.5">Vendo</span>
                            <span className="text-xl font-black text-slate-800 block leading-none text-center">{viewSize}</span>
                        </div>
                    </div>

                    {/* Coluna de Controle (Carrossel + Legenda) */}
                    <div className="flex-1 space-y-6 w-full">

                        {/* Seletor de Tamanhos (Carrossel) */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">
                                Experimente outros tamanhos:
                            </h4>
                            <div className="flex justify-between items-center gap-2">
                                {['PP', 'P', 'M', 'G', 'GG'].map((s) => {
                                    const fit = fitMap[s];
                                    if (!fit) return null;
                                    const isSelected = s === viewSize;
                                    const isRecommended = s === size;

                                    return (
                                        <button
                                            key={s}
                                            onClick={() => setViewSize(s)}
                                            className={`relative w-12 h-12 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${isSelected
                                                ? 'bg-slate-800 text-white shadow-lg scale-110 ring-2 ring-slate-800 ring-offset-2'
                                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:scale-105'
                                                }`}
                                        >
                                            {s}
                                            {isRecommended && (
                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" title="Recomendado" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Legenda Dinâmica */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-700 mb-2">
                                Detalhes do {viewSize}:
                            </h4>
                            <div className="space-y-2 bg-white/50 p-3 rounded-lg border border-slate-100">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500">Busto</span>
                                    <span className={`font-bold ${fitMap[viewSize] === 'tight' ? 'text-orange-500' : fitMap[viewSize] === 'loose' ? 'text-blue-500' : 'text-emerald-600'}`}>
                                        {getFitLabel(fitMap[viewSize])}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500">Cintura</span>
                                    <span className={`font-bold ${fitMap[viewSize] === 'tight' ? 'text-orange-500' : fitMap[viewSize] === 'loose' ? 'text-blue-500' : 'text-emerald-600'}`}>
                                        {getFitLabel(fitMap[viewSize])}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500">Quadril</span>
                                    <span className={`font-bold ${fitMap[viewSize] === 'tight' ? 'text-orange-500' : fitMap[viewSize] === 'loose' ? 'text-blue-500' : 'text-emerald-600'}`}>
                                        {getFitLabel(fitMap[viewSize])}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!fitMap && (
                <div className="bg-slate-50 p-4 rounded-lg text-center text-sm text-slate-500">
                    <Info className="w-4 h-4 mx-auto mb-2 text-slate-400" />
                    Não foi possível gerar análise detalhada de caimento.
                </div>
            )}

            {/* Cross-Sell */}
            {crossSell && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm animate-fade-in relative overflow-hidden mb-6">
                    <div className="absolute top-0 right-0 bg-lyvest-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                        COMBINA COM VOCÊ
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-lyvest-600" />
                        Complete o Look
                    </h3>
                    <div className="flex gap-4 items-center">
                        <img
                            src={crossSell.image as string}
                            alt={crossSell.name}
                            className="w-16 h-16 rounded-lg object-cover bg-slate-100"
                        />
                        <div className="flex-1">
                            <h4 className="text-sm font-medium text-slate-800">{crossSell.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm font-bold text-slate-900">
                                    R$ {crossSell.price.toFixed(2).replace('.', ',')}
                                </span>
                                <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    Tam: {size}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setAddedCrossSell(!addedCrossSell)}
                            className={`p-2 rounded-full transition-all ${addedCrossSell
                                ? 'bg-green-100 text-green-700'
                                : 'bg-lyvest-50 text-lyvest-700 hover:bg-lyvest-100'
                                }`}
                        >
                            {addedCrossSell ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            )}

            {/* Ações */}
            <div className="space-y-3">
                <button
                    onClick={() => onAddToCart(viewSize)}
                    className="w-full bg-lyvest-600 text-white py-4 rounded-xl font-semibold hover:bg-lyvest-700 transition-colors shadow-lg shadow-lyvest-200"
                >
                    {addedCrossSell
                        ? `Adicionar Kit ao Carrinho (Tam ${viewSize})`
                        : `Adicionar Tamanho ${viewSize} ao Carrinho`
                    }
                </button>

                <button
                    onClick={onViewModels}
                    className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                    Ver Modelos com Corpo Similar
                </button>
            </div>

            {/* Nota */}
            <div className="text-xs text-slate-500 text-center space-y-1 mt-6">
                <p>✨ Recomendação gerada por inteligência artificial</p>
                <p>📏 Baseada nas melhores práticas de moda íntima</p>
            </div>
        </div>
    );
}
