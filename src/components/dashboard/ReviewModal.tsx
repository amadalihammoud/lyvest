'use client';

import { useState } from 'react';
import { X, Star, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useUser } from '@clerk/nextjs';
import { useI18n } from '../../hooks/useI18n';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    productName: string;
    productId?: string | number; // Opcional, se tiver
    orderId: string | number;
    productImage?: string;
}

export default function ReviewModal({ isOpen, onClose, productName, productId, orderId, productImage }: ReviewModalProps) {
    const { user } = useUser();
    const { t } = useI18n();

    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (rating === 0) {
            setError('Por favor, selecione uma nota de 1 a 5 estrelas.');
            return;
        }

        setIsSubmitting(true);

        try {
            if (isSupabaseConfigured() && user) {
                const { error: insertError } = await supabase
                    .from('reviews')
                    .insert({
                        user_id: user.id,
                        order_id: String(orderId),
                        product_name: productName,
                        product_id: typeof productId === 'string' && productId.includes('-') ? productId : null, // Só salva se for UUID válido
                        rating,
                        comment,
                        approved: true // Auto-aprovar por enquanto
                    });

                if (insertError) throw insertError;
            } else {
                // Mock simulation
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setRating(0);
                setComment('');
            }, 2000);
        } catch (err: any) {
            console.error('Erro ao avaliar:', err);
            setError('Erro ao enviar avaliação. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div
                className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl relative overflow-hidden animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-[#800020] px-8 py-6 text-white text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                    <h2 className="text-2xl font-bold mb-1">Avaliar Produto</h2>
                    <p className="text-white/80 text-sm">O que você achou desta compra?</p>
                </div>

                {success ? (
                    <div className="p-12 flex flex-col items-center text-center animate-fade-in">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-500">
                            <CheckCircle className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Avaliação Enviada!</h3>
                        <p className="text-slate-500">Obrigado por compartilhar sua opinião.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {/* Product Info */}
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            {productImage ? (
                                <img src={productImage} alt={productName} className="w-16 h-16 object-cover rounded-xl" />
                            ) : (
                                <div className="w-16 h-16 bg-slate-200 rounded-xl flex items-center justify-center">
                                    <Star className="w-6 h-6 text-slate-400" />
                                </div>
                            )}
                            <div>
                                <p className="font-bold text-slate-700 line-clamp-2 text-sm">{productName}</p>
                                <p className="text-xs text-slate-400 mt-1">Pedido #{orderId}</p>
                            </div>
                        </div>

                        {/* Star Rating */}
                        <div className="flex flex-col items-center gap-2">
                            <label className="text-sm font-bold text-slate-400 uppercase tracking-wide">Sua Nota</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        className="focus:outline-none transition-transform hover:scale-110"
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                    >
                                        <Star
                                            className={`w-10 h-10 ${star <= (hoverRating || rating)
                                                    ? 'fill-amber-400 text-amber-400'
                                                    : 'text-slate-200'
                                                } transition-colors duration-200`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="text-sm font-medium text-amber-500 h-5">
                                {rating === 5 && 'Adorei! 😍'}
                                {rating === 4 && 'Gostei muito 🙂'}
                                {rating === 3 && 'É bom 😐'}
                                {rating === 2 && 'Não gostei muito 😕'}
                                {rating === 1 && 'Odiei 😫'}
                            </p>
                        </div>

                        {/* Comment */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Comentário (opcional)</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Conte mais detalhes sobre o produto, tecido, caimento..."
                                className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:border-lyvest-500 focus:ring-4 focus:ring-[#F5E6E8]/30 outline-none transition-all min-h-[120px] resize-none text-slate-700 placeholder:text-slate-400"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-[#800020] text-white font-bold rounded-full hover:bg-[#600018] transition-all shadow-lg shadow-[#F5E6E8] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-1"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                'Enviar Avaliação'
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-2 text-slate-400 font-medium text-sm hover:text-slate-600 transition-colors"
                        >
                            Cancelar
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
