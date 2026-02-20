'use client';
import { useState, ChangeEvent, FormEvent } from 'react';
import { CreditCard, QrCode, AlertCircle, Lock } from 'lucide-react';
import { formatCardNumber } from '../../utils/validation';
import { paymentSchema, validateForm } from '../../utils/schemas';
import { RateLimiter, detectXSS } from '../../utils/security';
import { paymentService } from '../../services/payment';
import { useI18n } from '../../hooks/useI18n';
import { useCart } from '../../context/CartContext';
// import { useAuth } from '../../context/AuthContext'; // Removed
import { useUser } from '@clerk/nextjs';

// Define types based on our validation schema
type PaymentFormData = {
    cardNumber: string;
    cardName: string;
    expiry: string;
    cvv: string;
    installments: string;
};

// Interface for component props
interface CheckoutPaymentProps {
    onSubmit: (data: { method: 'credit' | 'pix'; lastFour?: string }) => void;
    total: number;
}

// Interface for payment session response
interface PaymentSession {
    sessionId: string;
    checkoutUrl?: string; // Optional because mock/direct might not have it
    status: string;
    [key: string]: unknown;
}

// Interface for validation errors
type ValidationErrors = Record<string, string | undefined>;

// Rate limiter for checkout (3 attempts per 5 minutes)
const checkoutLimiter = new RateLimiter('checkout', 3, 300000);

export default function CheckoutPayment({ onSubmit, total }: CheckoutPaymentProps) {
    const { t, formatCurrency } = useI18n();
    const { cartItems, finalTotal } = useCart();
    const { user } = useUser();
    // Use finalTotal from context if available (it handles discounts), otherwise fallback to prop
    const displayTotal = finalTotal !== undefined ? finalTotal : total;
    const [method, setMethod] = useState<'credit' | 'pix'>('credit');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [rateLimitError, setRateLimitError] = useState(false);

    // Form state
    const [formData, setFormData] = useState<PaymentFormData>({
        cardNumber: '',
        cardName: '',
        expiry: '',
        cvv: '',
        installments: '1'
    });

    // Format card number while typing
    const handleCardNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 16);
        setFormData(prev => ({ ...prev, cardNumber: value }));
        // Clear error
        if (errors.cardNumber) {
            setErrors(prev => ({ ...prev, cardNumber: undefined }));
        }
    };

    // Format expiry date while typing
    const handleExpiryChange = (e: ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '').slice(0, 4);
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        }
        setFormData(prev => ({ ...prev, expiry: value }));
        if (errors.expiry) {
            setErrors(prev => ({ ...prev, expiry: undefined }));
        }
    };

    // Generic handler for other fields
    const handleInputChange = (field: keyof PaymentFormData) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.value;

        // Check for XSS
        if (detectXSS(value)) {
            setErrors(prev => ({ ...prev, [field]: t('errors.invalidCharacters') || 'Caracteres invÃ¡lidos' }));
            return;
        }

        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Check rate limiting
        const { allowed, resetIn } = checkoutLimiter.check();
        if (!allowed) {
            const minutes = Math.ceil(resetIn / 60000);
            setRateLimitError(true);
            setErrors({ _form: t('errors.rateLimit') || `Muitas tentativas. Aguarde ${minutes} minuto(s).` });
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        // If PIX, no card validation needed
        if (method === 'pix') {
            checkoutLimiter.attempt();
            onSubmit({ method: 'pix' });
            return;
        }

        // Validate card data
        const validation = validateForm(paymentSchema, {
            cardNumber: formData.cardNumber,
            cardName: formData.cardName,
            expiry: formData.expiry,
            cvv: formData.cvv
        });

        if (!validation.success) {
            setErrors(validation.errors as ValidationErrors);
            setIsSubmitting(false);
            return;
        }

        // Register attempt
        checkoutLimiter.attempt();

        // Process payment
        try {
            if (method === 'credit') {
                // Call Payment Service
                // Cast the response to PaymentSession
                const session = await paymentService.createPaymentSession({
                    customer: {
                        firstName: formData.cardName.split(' ')[0],
                        lastName: formData.cardName.split(' ').slice(1).join(' '),
                        email: user?.primaryEmailAddress?.emailAddress || 'checkout@lyvest.com.br',
                    },
                    items: cartItems.map(item => ({
                        id: item.id,
                        quantity: item.qty,
                        price: item.price // Ensuring price is passed if needed
                    })),
                    // Adding total for completeness, though service might calc it
                    total: displayTotal,
                    currency: 'BRL',
                    orderId: `LV-${Date.now()}`
                }) as unknown as PaymentSession;

                if (session && session.checkoutUrl) {
                    window.location.href = session.checkoutUrl;
                } else if (session && session.status === 'success') {
                    // Direct success (e.g. mock without redirect)
                    onSubmit({
                        method: 'credit',
                        lastFour: formData.cardNumber.slice(-4)
                    });
                } else {
                    throw new Error('URL de pagamento detalhada nÃ£o gerada');
                }
            }
        } catch (err) {
            console.error(err);
            setErrors({ _form: 'Erro ao processar pagamento. Tente novamente.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate-fade-in space-y-4">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-lyvest-500" /> {t('checkout.payment.title')}
            </h2>

            {/* Rate limit error */}
            {rateLimitError && (
                <div className="bg-lyvest-100/30 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{errors._form}</span>
                </div>
            )}

            {/* General form error */}
            {errors._form && !rateLimitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{errors._form}</span>
                </div>
            )}

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={() => setMethod('credit')}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all text-sm sm:text-base ${method === 'credit' ? 'border-lyvest-500 bg-lyvest-50 text-lyvest-600' : 'border-slate-100 bg-white text-slate-400 hover:border-lyvest-100'} `}
                >
                    <CreditCard className="w-5 h-5" />
                    <span>{t('checkout.payment.creditCard') || 'CartÃ£o de CrÃ©dito'}</span>
                </button>
                <button
                    type="button"
                    onClick={() => setMethod('pix')}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all text-sm sm:text-base ${method === 'pix' ? 'border-green-500 bg-green-50 text-green-600' : 'border-slate-100 bg-white text-slate-400 hover:border-green-200'} `}
                >
                    <QrCode className="w-5 h-5" />
                    <span>{t('checkout.payment.pix') || 'PIX'}</span>
                </button>
            </div>

            {method === 'credit' && (
                <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 animate-slide-up">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-slate-500">{t('checkout.payment.acceptedCards') || 'CartÃµes Aceitos'}</span>
                        <div className="flex gap-2">
                            <div className="w-8 h-5 bg-gradient-to-r from-blue-600 to-blue-800 rounded text-[6px] text-white flex items-center justify-center font-bold">VISA</div>
                            <div className="w-8 h-5 bg-gradient-to-r from-[#F5E6E8]/300 to-yellow-500 rounded text-[6px] text-white flex items-center justify-center font-bold">MC</div>
                            <div className="w-8 h-5 bg-gradient-to-r from-green-600 to-teal-600 rounded text-[6px] text-white flex items-center justify-center font-bold">ELO</div>
                        </div>
                    </div>

                    {/* Card Number */}
                    <div>
                        <label htmlFor="cardNumber" className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">
                            {t('checkout.payment.cardNumber')}
                        </label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                id="cardNumber"
                                type="text"
                                inputMode="numeric"
                                autoComplete="cc-number"
                                placeholder="0000 0000 0000 0000"
                                value={formatCardNumber(formData.cardNumber)}
                                onChange={handleCardNumberChange}
                                maxLength={19}
                                className={`w-full pl-10 pr-4 py-3 rounded-xl border ${errors.cardNumber ? 'border-red-400 bg-lyvest-100/30' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-[#E8C4C8] transition-all font-mono text-slate-700`}
                            />
                        </div>
                        {errors.cardNumber && (
                            <p className="text-[#F5E6E8]/300 text-xs mt-1">{t(errors.cardNumber)}</p>
                        )}
                    </div>

                    {/* Card Name */}
                    <div>
                        <label htmlFor="cardName" className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">
                            {t('checkout.payment.cardName')}
                        </label>
                        <input
                            id="cardName"
                            type="text"
                            autoComplete="cc-name"
                            placeholder={t('checkout.payment.cardNamePlaceholder') || 'COMO NO CARTÃƒO'}
                            value={formData.cardName}
                            onChange={handleInputChange('cardName')}
                            maxLength={100}
                            className={`w-full px-4 py-3 rounded-xl border ${errors.cardName ? 'border-red-400 bg-lyvest-100/30' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-[#E8C4C8] transition-all font-medium text-slate-700 uppercase`}
                        />
                        {errors.cardName && (
                            <p className="text-[#F5E6E8]/300 text-xs mt-1">{t(errors.cardName)}</p>
                        )}
                    </div>

                    {/* Expiry + CVV + Installments */}
                    <div className="grid grid-cols-2 sm:grid-cols-12 gap-4">
                        <div className="col-span-1 sm:col-span-3">
                            <label htmlFor="expiry" className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">
                                {t('checkout.payment.expiry')}
                            </label>
                            <input
                                id="expiry"
                                type="text"
                                inputMode="numeric"
                                autoComplete="cc-exp"
                                placeholder="MM/AA"
                                value={formData.expiry}
                                onChange={handleExpiryChange}
                                maxLength={5}
                                className={`w-full px-4 py-3 rounded-xl border ${errors.expiry ? 'border-red-400 bg-lyvest-100/30' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-[#E8C4C8] transition-all font-mono text-slate-700 text-center`}
                            />
                            {errors.expiry && (
                                <p className="text-[#F5E6E8]/300 text-xs mt-1">{t(errors.expiry)}</p>
                            )}
                        </div>
                        <div className="col-span-1 sm:col-span-3">
                            <label htmlFor="cvv" className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">
                                {t('checkout.payment.cvv')}
                            </label>
                            <input
                                id="cvv"
                                type="text"
                                inputMode="numeric"
                                autoComplete="cc-csc"
                                placeholder="123"
                                value={formData.cvv}
                                onChange={handleInputChange('cvv')}
                                maxLength={4}
                                className={`w-full px-4 py-3 rounded-xl border ${errors.cvv ? 'border-red-400 bg-lyvest-100/30' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-[#E8C4C8] transition-all font-mono text-slate-700 text-center`}
                            />
                            {errors.cvv && (
                                <p className="text-[#F5E6E8]/300 text-xs mt-1">{t(errors.cvv)}</p>
                            )}
                        </div>
                        <div className="col-span-2 sm:col-span-6">
                            <label htmlFor="installments" className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">
                                {t('checkout.payment.installments') || 'Parcelamento'}
                            </label>
                            <div className="relative">
                                <select
                                    id="installments"
                                    value={formData.installments}
                                    onChange={handleInputChange('installments')}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E8C4C8] transition-all font-medium text-slate-700 appearance-none bg-white"
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1)
                                        .filter(qty => displayTotal / qty >= 5) // Minimum installment R$ 5,00
                                        .map(qty => (
                                            <option key={qty} value={qty}>
                                                {qty}x de {formatCurrency(displayTotal / qty)} {qty === 1 ? 'Ã  vista' : 'sem juros'}
                                            </option>
                                        ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            )}

            {method === 'pix' && (
                <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center animate-slide-up">
                    <QrCode className="w-32 h-32 mx-auto text-green-600 mb-4 opacity-80" />
                    <p className="text-sm text-green-800 font-medium mb-2">{t('checkout.payment.pixMessage') || 'O cÃ³digo PIX serÃ¡ gerado na prÃ³xima etapa.'}</p>
                    <p className="text-xs text-green-600">{t('checkout.payment.pixSecure') || 'AprovaÃ§Ã£o imediata e mais seguranÃ§a.'}</p>
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={isSubmitting || rateLimitError} // Removed unnecessary boolean check
                className="w-full py-4 bg-lyvest-500 text-white font-bold rounded-xl hover:bg-lyvest-600 transition-all shadow-lg hover:glare-effect flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t('common.processing') || 'Processando...'}
                    </>
                ) : (
                    <>
                        <Lock className="w-4 h-4" /> {t('checkout.buttons.confirm')}
                    </>
                )}
            </button>

            <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> {t('checkout.payment.secure') || 'Ambiente 100% Seguro â€¢ Seus dados sÃ£o criptografados'}
            </p>
        </div>
    );
}








