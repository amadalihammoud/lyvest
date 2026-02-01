import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles } from 'lucide-react';
import { Product } from '../../services/ProductService';
import { BodyMeasurements, SizeRecommendation, calculateSize } from '../../services/sizeAI';
import { findSimilarModels } from '../../data/sizeGuide';
import SizeCalculator from './SizeCalculator';
import AIRecommendation from './AIRecommendation';
import ModelGallery from './ModelGallery';

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

    // Carregar medidas salvas ao abrir
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setMeasurements(parsed);
            } catch (e) {
                console.error('Erro ao carregar medidas:', e);
            }
        }
    }, []);

    // Tracking ao abrir
    useEffect(() => {
        if (isOpen) {
            trackEvent('view_fitting_room', { productId: product.id, productName: product.name });
        }
    }, [isOpen]);

    if (!isOpen) return null;

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

            trackEvent('view_recommendation', {
                recommendedSize: result.size,
                confidence: result.confidence
            });
        } catch (error) {
            console.error('Erro ao calcular tamanho:', error);
            alert('Erro ao calcular tamanho. Tente novamente.');
        } finally {
            setIsCalculating(false);
        }
    };

    const handleAddToCart = (size: string) => {
        trackEvent('add_to_cart_from_fitting', {
            size,
            productId: product.id,
            recommendation: recommendation?.size
        });

        // Pequeno delay para garantir tracking antes de fechar (opcional, mas bom pra analytics)
        setTimeout(() => {
            onSizeSelected(size);
            onClose();
        }, 100);
    };

    const handleViewModels = () => {
        trackEvent('view_similar_models', { productId: product.id });
        setStep('models');
    };

    const handleBack = () => {
        if (step === 'models') {
            setStep('recommendation');
        } else if (step === 'recommendation') {
            setStep('input');
        }
    };

    // Get similar models if we have measurements
    const similarModels =
        measurements
            ? findSimilarModels(
                measurements.height,
                measurements.weight,
                measurements.bustType,
                measurements.hipType
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
                            />
                        </div>
                    )}

                    {step === 'recommendation' && recommendation && (
                        <AIRecommendation
                            recommendation={recommendation}
                            onAddToCart={handleAddToCart}
                            onViewModels={handleViewModels}
                            product={product}
                        />
                    )}

                    {step === 'models' && (
                        <div>
                            <ModelGallery models={similarModels} productId={product.id} />

                            <div className="mt-6">
                                <button
                                    onClick={handleBack}
                                    className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                                >
                                    Voltar para Recomendação
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
