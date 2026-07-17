'use client';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

import CheckoutAddress, { AddressFormData } from './CheckoutAddress';
import CheckoutSummary from './CheckoutSummary';
import { useCart } from '../../hooks/useCart';
import { useI18n } from '../../hooks/useI18n';
import { logger } from '../../utils/logger';

const CheckoutPayment = dynamic(() => import('./CheckoutPayment'), { ssr: false });
const OrderConfirmation = dynamic(() => import('./OrderConfirmation'), { ssr: false });

interface CheckoutWizardProps {
    onBack: () => void;
    onComplete: () => void;
}

// Indicador de etapas do checkout — extraído para manter CheckoutWizard com baixa complexidade.
function StepIndicator({ step, t }: { step: number; t: (key: string) => string }) {
    return (
        <div className="flex items-center justify-center">
            {/* Step 1 - Address */}
            <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= 1 ? 'bg-lyvest-500 text-white shadow-lg shadow-[#F5E6E8]' : 'bg-slate-200 text-slate-500'}`}>
                    {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
                </div>
                <span className={`text-xs mt-2 font-medium ${step >= 1 ? 'text-lyvest-600' : 'text-slate-400'}`}>
                    {t('checkout.steps.address')}
                </span>
            </div>

            {/* Line 1-2 */}
            <div className={`w-16 sm:w-24 h-1 mx-2 rounded-full transition-all ${step >= 2 ? 'bg-lyvest-500' : 'bg-slate-200'}`}></div>

            {/* Step 2 - Payment */}
            <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= 2 ? 'bg-lyvest-500 text-white shadow-lg shadow-[#F5E6E8]' : 'bg-slate-200 text-slate-500'}`}>
                    {step > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
                </div>
                <span className={`text-xs mt-2 font-medium ${step >= 2 ? 'text-lyvest-600' : 'text-slate-400'}`}>
                    {t('checkout.steps.payment')}
                </span>
            </div>

            {/* Line 2-3 */}
            <div className={`w-16 sm:w-24 h-1 mx-2 rounded-full transition-all ${step >= 3 ? 'bg-green-500' : 'bg-slate-200'}`}></div>

            {/* Step 3 - Confirmation */}
            <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= 3 ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-slate-200 text-slate-500'}`}>
                    <CheckCircle className="w-5 h-5" />
                </div>
                <span className={`text-xs mt-2 font-medium ${step >= 3 ? 'text-green-600' : 'text-slate-400'}`}>
                    {t('checkout.steps.confirmation')}
                </span>
            </div>
        </div>
    );
}

export default function CheckoutWizard({ onBack, onComplete }: CheckoutWizardProps) {
    const { t, isRTL } = useI18n();
    const { cartItems, cartTotal, couponCode, clearCart } = useCart();
    const { user } = useUser();
    const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Success
    const [addressData, setAddressData] = useState<AddressFormData | undefined>(undefined);
    const [orderNumber, setOrderNumber] = useState<string | null>(null);
    const [orderError, setOrderError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const status = params.get('status');
            const orderId = params.get('order');
            if (status === 'success') {
                setOrderNumber(orderId ? orderId.slice(0, 8).toUpperCase() : 'SUCESSO');
                clearCart();
                setStep(3);
            }
        }
    }, [clearCart]);

    const handleAddressSubmit = (data: AddressFormData) => {
        setAddressData(data);
        setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const advanceToSuccess = (orderId: string) => {
        setOrderNumber(orderId);
        clearCart();
        setStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Persiste o pedido no servidor (baixa de estoque + total autoritativo) para usuário
    // logado com Supabase configurado. Se a persistência falhar (ex.: sem estoque), NÃO
    // fingimos sucesso — o cliente volta a ver o erro. Convidado/mock mantém o fluxo simulado.
    const handlePaymentSubmit = async (data: unknown) => {
        setOrderError(null);
        const method = (data as { method?: 'credit' | 'pix' })?.method;

        if (user) {
            try {
                const res = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        items: cartItems.map((i) => ({ id: String(i.id), quantity: i.qty })),
                        couponCode: couponCode || undefined,
                        paymentMethod: method,
                        shipping: addressData ? { ...addressData } : undefined,
                    }),
                });
                const payload = await res.json().catch(() => ({}));
                if (!res.ok) {
                    setOrderError(payload?.message || 'Não foi possível concluir o pedido.');
                    return;
                }
                const orderId = String(payload?.data?.orderId ?? '').slice(0, 8).toUpperCase();
                advanceToSuccess(orderId || Math.floor(Math.random() * 1000000).toString().padStart(6, '0'));
                return;
            } catch (err) {
                logger.error('Falha ao persistir pedido:', err);
                setOrderError('Falha de conexão ao finalizar o pedido. Tente novamente.');
                return;
            }
        }

        // Convidado / ambiente sem Supabase: fluxo simulado (sem persistência).
        advanceToSuccess(Math.floor(Math.random() * 1000000).toString().padStart(6, '0'));
    };

    if (cartItems.length === 0 && step !== 3) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h2 className="text-xl font-bold text-slate-800 mb-4">{t('cart.empty')} :(</h2>
                <button onClick={onBack} className="text-lyvest-500 font-bold hover:underline">
                    {t('cart.continueShopping')}
                </button>
            </div>
        );
    }

    if (step === 3) {
        return <OrderConfirmation orderNumber={orderNumber} onContinueShopping={onComplete} />;
    }

    return (
        <div className="bg-slate-50 pb-8">
            {/* Header Checkout */}
            <header className="bg-white shadow-sm sticky top-0 z-30">
                <div className="container mx-auto px-4 py-3 relative">
                    {/* Back Button */}
                    <button
                        onClick={step === 1 ? onBack : () => setStep(step - 1)}
                        className="hidden md:flex items-center gap-2 text-slate-500 hover:text-lyvest-500 font-medium transition-colors md:absolute md:left-4 md:top-1/2 md:-translate-y-1/2 z-10"
                    >
                        <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                        <span className="hidden md:inline">{t('checkout.buttons.back')}</span>
                        <span className="md:hidden">{t('common.back') || 'Voltar'}</span>
                    </button>

                    {/* Step Indicator */}
                    <StepIndicator step={step} t={t} />
                </div>
            </header>

            <div className="container mx-auto px-4 max-w-6xl py-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-7 bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col order-2 lg:order-1">
                        {step === 1 && <CheckoutAddress onSubmit={handleAddressSubmit} initialData={addressData} />}
                        {step === 2 && (
                            <>
                                {orderError && (
                                    <div className="mb-4 py-3 px-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                                        {orderError}
                                    </div>
                                )}
                                <CheckoutPayment onSubmit={handlePaymentSubmit} total={cartTotal} shipping={addressData ? { ...addressData } : undefined} />
                            </>
                        )}
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-5 flex flex-col order-1 lg:order-2">
                        <CheckoutSummary cartItems={cartItems} total={cartTotal} />
                    </div>
                </div>
            </div>
        </div>
    );
}
