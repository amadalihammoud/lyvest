import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles } from 'lucide-react';
import { Product } from '../../services/ProductService';
import { BodyMeasurements, SizeRecommendation, calculateSize } from '../../services/sizeAI';
import { findSimilarModels } from '../../data/sizeGuide';
import SizeCalculator from './SizeCalculator';
import AIRecommendation from './AIRecommendation';
import ModelGallery from './ModelGallery';
import { getProductGender } from '../../utils/productUtils';

interface VirtualFittingProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product;
    onSizeSelected: (size: string) => void;
}

type Step = 'input' | 'recommendation' | 'models';

const STORAGE_KEY = 'lyvest_user_measurements';

// Simples sistema de analytics (pode ser expandido para GA4/Pixel)
const trackEvent = (eventName: string, data: any) => {
    console.log(`📊 [Analytics] ${eventName}:`, data);
    // Aqui seria: window.gtag('event', eventName, data);
};

export default function VirtualFitting({
    isOpen,
    onClose,
    product,
    onSizeSelected,
}: VirtualFittingProps) {
    const [step, setStep] = useState<Step>('input');
    const [isCalculating, setIsCalculating] = useState(false);
    const [recommendation, setRecommendation] = useState<SizeRecommendation | null>(null);
    const [measurements, setMeasurements] = useState<BodyMeasurements | null>(null);

    const productGender = getProductGender(product);

    // Carregar dados salvos
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setMeasurements(JSON.parse(saved));
            } catch (e) {
                console.error('Erro ao ler medidas salvas', e);
            }
        }
    }, []);

    const handleCalculate = async (userMeasurements: BodyMeasurements) => {
        setIsCalculating(true);
        setMeasurements(userMeasurements);

        // Salvar persistência
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userMeasurements));

        trackEvent('calculate_size', {
            measurements: userMeasurements,
            productId: product.id
        });

        try {
            // Simular delay mínimo para UX (mostrar loading)
            const [result] = await Promise.all([
                calculateSize(userMeasurements, product),
                new Promise((resolve) => setTimeout(resolve, 1000)),
            ]);

            setRecommendation(result);
            setStep('recommendation');
        } catch (error) {
            console.error('Erro ao calcular tamanho:', error);
        } finally {
            setIsCalculating(false);
        }
    };

    const handleAddToCart = (size: string) => {
        onSizeSelected(size);
        trackEvent('add_to_cart_recommendation', {
            size,
            productId: product.id
        });
        onClose();
    };

    const handleViewModels = () => {
        setStep('models');
        trackEvent('view_models', { productId: product.id });
    };

    const handleBack = () => {
        if (step === 'models') setStep('recommendation');
        else if (step === 'recommendation') setStep('input');
    };

    // Detectar gênero do produto
    // REMOVIDO: Usando getProductGender de productUtils agora

    // Get similar models if we have measurements
    const similarModels =
        measurements
            ? findSimilarModels(
                measurements.height,
                measurements.weight,
                measurements.bustType,
                measurements.hipType,
                productGender // Passar gênero detectado
            )
            : [];

    if (!isOpen) return null;

    const modalContent = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-lyvest-600" />
                            <h2 className="text-xl font-bold text-slate-900">
                                {step === 'input' && 'Calculadora de Tamanho'}
                                {step === 'recommendation' && 'Seu Tamanho Perfeito'}
                                {step === 'models' && 'Modelos Similares'}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                            aria-label="Fechar"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 mt-3 text-sm">
                        <button
                            onClick={() => setStep('input')}
                            className={`${step === 'input'
                                ? 'text-lyvest-600 font-medium'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Medidas
                        </button>
                        {recommendation && (
                            <>
                                <span className="text-slate-400">→</span>
                                <button
                                    onClick={() => setStep('recommendation')}
                                    className={`${step === 'recommendation'
                                        ? 'text-lyvest-600 font-medium'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    Resultado
                                </button>
                            </>
                        )}
                        {step === 'models' && (
                            <>
                                <span className="text-slate-400">→</span>
                                <span className="text-lyvest-600 font-medium">Modelos</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === 'input' && (
                        <div>
                            <div className="mb-6 text-center">
                                <p className="text-sm text-slate-600">
                                    Responda algumas perguntas e nossa IA vai recomendar o tamanho
                                    perfeito para você!
                                </p>
                            </div>
                            <SizeCalculator
                                onCalculate={handleCalculate}
                                isLoading={isCalculating}
                                initialMeasurements={measurements}
                                product={product}
                            />
                        </div>
                    )}

                    {step === 'recommendation' && recommendation && (
                        <AIRecommendation
                            recommendation={recommendation}
                            onAddToCart={handleAddToCart}
                            onViewModels={handleViewModels}
                            product={product}
                            gender={productGender}
                        />
                    )}

                    {step === 'models' && (
                        <div>
                            <ModelGallery models={similarModels} productId={product.id} />
                            <div className="mt-8 flex gap-3">
                                <button
                                    onClick={handleBack}
                                    className="flex-1 py-3 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={() => handleAddToCart(recommendation?.size || 'M')}
                                    className="flex-1 py-3 bg-lyvest-600 text-white rounded-xl font-bold hover:bg-lyvest-700 transition-colors shadow-lg shadow-lyvest-200"
                                >
                                    Comprar Agora
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
