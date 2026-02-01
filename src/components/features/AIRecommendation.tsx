import { CheckCircle2, TrendingUp, Info } from 'lucide-react';
import { SizeRecommendation } from '../../services/sizeAI';

interface AIRecommendationProps {
    recommendation: SizeRecommendation;
    onAddToCart: (size: string) => void;
    onViewModels: () => void;
}

export default function AIRecommendation({
    recommendation,
    onAddToCart,
    onViewModels,
}: AIRecommendationProps) {
    const { size, confidence, reason, alternativeSize } = recommendation;

    // Converter confiança para percentual
    const confidencePercent = Math.round(confidence * 100);

    // Cor baseada em confiança
    const getConfidenceColor = () => {
        if (confidence >= 0.9) return 'text-green-600 bg-green-50';
        if (confidence >= 0.8) return 'text-blue-600 bg-blue-50';
        return 'text-orange-600 bg-orange-50';
    };

    return (
        <div className="space-y-6">
            {/* Tamanho Recomendado */}
            <div className="text-center">
                <div className="inline-flex items-center gap-2 text-green-600 mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="text-sm font-medium">Tamanho Perfeito Encontrado!</span>
                </div>

                <div className="bg-gradient-to-br from-lyvest-50 to-lyvest-100 rounded-2xl p-8 mb-4">
                    <div className="text-sm text-lyvest-700 font-medium mb-2">
                        Seu tamanho ideal é:
                    </div>
                    <div className="text-7xl font-bold text-lyvest-900 tracking-tight">
                        {size}
                    </div>
                </div>

                {/* Confiança */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getConfidenceColor()}`}>
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                        {confidencePercent}% de certeza
                    </span>
                </div>
            </div>

            {/* Explicação da IA */}
            <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <div className="text-sm font-medium text-slate-900 mb-1">
                            Por que este tamanho?
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            {reason}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tamanho Alternativo */}
            {alternativeSize && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="text-sm text-blue-900 font-medium mb-1">
                        💡 Dica Personalizada
                    </div>
                    <p className="text-sm text-blue-700">
                        Se preferir um ajuste diferente, considere também o tamanho{' '}
                        <strong>{alternativeSize}</strong>.
                    </p>
                </div>
            )}

            {/* Ações */}
            <div className="space-y-3">
                <button
                    onClick={() => onAddToCart(size)}
                    className="w-full bg-lyvest-600 text-white py-4 rounded-xl font-semibold hover:bg-lyvest-700 transition-colors"
                >
                    Adicionar Tamanho {size} ao Carrinho
                </button>

                <button
                    onClick={onViewModels}
                    className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                    Ver Modelos com Corpo Similar
                </button>
            </div>

            {/* Nota */}
            <div className="text-xs text-slate-500 text-center space-y-1">
                <p>✨ Recomendação gerada por inteligência artificial</p>
                <p>📏 Baseada nas melhores práticas de moda íntima</p>
            </div>
        </div>
    );
}
