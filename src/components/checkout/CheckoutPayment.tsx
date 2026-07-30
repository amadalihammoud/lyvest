'use client';
import { useUser } from '@clerk/nextjs';
import { CreditCard, QrCode, AlertCircle, Lock, Copy, Check } from 'lucide-react';
import { useEffect, useRef, useState, ChangeEvent, FormEvent } from 'react';

import { useI18n } from '../../hooks/useI18n';
import { paymentService } from '../../services/payment';
import { useCart } from '../../store/useCartStore';
import {
    buildPaymentCustomer,
    buildRateLimitMessage,
    buildSessionItems,
    resolveSessionOutcome,
} from '../../utils/checkoutPayment';
import { paymentSchema, validateForm } from '../../utils/schemas';
import { RateLimiter, detectXSS } from '../../utils/security';
import { formatCardNumber } from '../../utils/validation';

type PaymentFormData = {
    cardNumber: string;
    cardName: string;
    expiry: string;
    cvv: string;
    installments: string;
};

interface CheckoutPaymentProps {
    onSubmit: (data: { method: 'credit' | 'pix'; lastFour?: string }) => void | Promise<void>;
    total: number;
    shipping?: Record<string, unknown>;
}

interface PaymentSession {
    sessionId: string;
    checkoutUrl?: string;
    status: string;
    mode?: string;
    qrCode?: string;
    pixCopyPaste?: string;
    orderId?: string;
    expiresAt?: string;
    [key: string]: unknown;
}

type ValidationErrors = Record<string, string | undefined>;

type TFn = (key: string) => string;

const checkoutLimiter = new RateLimiter('checkout', 3, 300000);

function allowLocalCardForm(): boolean {
    if (process.env.NODE_ENV === 'production') return false;
    if (process.env.NEXT_PUBLIC_PAYMENT_PROVIDER === 'asaas') return false;
    return true;
}

function isHostedCheckout(): boolean {
    return process.env.NEXT_PUBLIC_PAYMENT_PROVIDER === 'asaas';
}

interface CreditCardFormProps {
    t: TFn;
    formatCurrency: (value: number) => string;
    formData: PaymentFormData;
    errors: ValidationErrors;
    displayTotal: number;
    handleSubmit: (e: FormEvent) => void;
    handleCardNumberChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleExpiryChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleInputChange: (field: keyof PaymentFormData) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

function CreditCardForm({
    t,
    formatCurrency,
    formData,
    errors,
    displayTotal,
    handleSubmit,
    handleCardNumberChange,
    handleExpiryChange,
    handleInputChange,
}: CreditCardFormProps) {
    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 animate-slide-up"
        >
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-slate-500">
                    {t('checkout.payment.acceptedCards') || 'Cartões Aceitos'}
                </span>
                <div className="flex gap-2">
                    <div className="w-8 h-5 bg-gradient-to-r from-blue-600 to-blue-800 rounded text-[6px] text-white flex items-center justify-center font-bold">
                        VISA
                    </div>
                    <div className="w-8 h-5 bg-gradient-to-r from-[#F5E6E8]/300 to-yellow-500 rounded text-[6px] text-white flex items-center justify-center font-bold">
                        MC
                    </div>
                    <div className="w-8 h-5 bg-gradient-to-r from-green-600 to-teal-600 rounded text-[6px] text-white flex items-center justify-center font-bold">
                        ELO
                    </div>
                </div>
            </div>

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
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                            errors.cardNumber ? 'border-red-400 bg-lyvest-100/30' : 'border-slate-200'
                        } focus:outline-none focus:ring-2 focus:ring-[#E8C4C8] transition-all font-mono text-slate-700`}
                    />
                </div>
                {errors.cardNumber && <p className="text-[#F5E6E8]/300 text-xs mt-1">{t(errors.cardNumber)}</p>}
            </div>

            <div>
                <label htmlFor="cardName" className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">
                    {t('checkout.payment.cardName')}
                </label>
                <input
                    id="cardName"
                    type="text"
                    autoComplete="cc-name"
                    placeholder={t('checkout.payment.cardNamePlaceholder') || 'COMO NO CARTÃO'}
                    value={formData.cardName}
                    onChange={handleInputChange('cardName')}
                    maxLength={100}
                    className={`w-full px-4 py-3 rounded-xl border ${
                        errors.cardName ? 'border-red-400 bg-lyvest-100/30' : 'border-slate-200'
                    } focus:outline-none focus:ring-2 focus:ring-[#E8C4C8] transition-all font-medium text-slate-700 uppercase`}
                />
                {errors.cardName && <p className="text-[#F5E6E8]/300 text-xs mt-1">{t(errors.cardName)}</p>}
            </div>

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
                        className={`w-full px-4 py-3 rounded-xl border ${
                            errors.expiry ? 'border-red-400 bg-lyvest-100/30' : 'border-slate-200'
                        } focus:outline-none focus:ring-2 focus:ring-[#E8C4C8] transition-all font-mono text-slate-700 text-center`}
                    />
                    {errors.expiry && <p className="text-[#F5E6E8]/300 text-xs mt-1">{t(errors.expiry)}</p>}
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
                        className={`w-full px-4 py-3 rounded-xl border ${
                            errors.cvv ? 'border-red-400 bg-lyvest-100/30' : 'border-slate-200'
                        } focus:outline-none focus:ring-2 focus:ring-[#E8C4C8] transition-all font-mono text-slate-700 text-center`}
                    />
                    {errors.cvv && <p className="text-[#F5E6E8]/300 text-xs mt-1">{t(errors.cvv)}</p>}
                </div>
                <div className="col-span-2 sm:col-span-6">
                    <label htmlFor="installments" className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">
                        {t('checkout.payment.installments') || 'Parcelamento'}
                    </label>
                    <select
                        id="installments"
                        value={formData.installments}
                        onChange={handleInputChange('installments')}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E8C4C8] transition-all font-medium text-slate-700 appearance-none bg-white"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1)
                            .filter((qty) => qty === 1 || displayTotal / qty >= 20)
                            .map((qty) => (
                                <option key={qty} value={qty}>
                                    {qty}x de {formatCurrency(displayTotal / qty)}{' '}
                                    {qty === 1 ? 'à vista' : 'sem juros'}
                                </option>
                            ))}
                    </select>
                </div>
            </div>
        </form>
    );
}

function PixOnSitePanel({
    qrCode,
    pixCopyPaste,
    waiting,
    onCopy,
    copied,
}: {
    qrCode: string;
    pixCopyPaste: string;
    waiting: boolean;
    onCopy: () => void;
    copied: boolean;
}) {
    const src = qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`;
    return (
        <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center animate-slide-up space-y-4">
            <p className="text-sm text-green-800 font-medium">
                Escaneie o QR Code no app do seu banco ou use o Pix Copia e Cola
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="QR Code Pix" className="w-48 h-48 mx-auto bg-white p-2 rounded-xl shadow-sm" />
            <div className="flex gap-2">
                <input
                    readOnly
                    value={pixCopyPaste}
                    className="flex-1 text-xs font-mono px-3 py-2 rounded-xl border border-green-200 bg-white text-slate-700 truncate"
                />
                <button
                    type="button"
                    onClick={onCopy}
                    className="px-3 py-2 rounded-xl bg-green-600 text-white text-sm font-bold flex items-center gap-1 hover:bg-green-700"
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado' : 'Copiar'}
                </button>
            </div>
            {waiting && (
                <p className="text-xs text-green-700 flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                    Aguardando confirmação do pagamento…
                </p>
            )}
        </div>
    );
}

function PixPanel({ t }: { t: TFn }) {
    return (
        <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center animate-slide-up">
            <QrCode className="w-32 h-32 mx-auto text-green-600 mb-4 opacity-80" />
            <p className="text-sm text-green-800 font-medium mb-2">
                {t('checkout.payment.pixMessage') || 'O código PIX será gerado ao confirmar.'}
            </p>
            <p className="text-xs text-green-600">
                {t('checkout.payment.pixSecure') || 'Você permanece neste site. Aprovação imediata.'}
            </p>
        </div>
    );
}

function SubmitButton({
    t,
    isSubmitting,
    handleSubmit,
    hidden,
}: {
    t: TFn;
    isSubmitting: boolean;
    handleSubmit: (e: FormEvent) => void;
    hidden?: boolean;
}) {
    if (hidden) return null;
    return (
        <button
            onClick={handleSubmit}
            disabled={isSubmitting}
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
    );
}

export default function CheckoutPayment({ onSubmit, total, shipping }: CheckoutPaymentProps) {
    const hosted = isHostedCheckout();
    const localCard = allowLocalCardForm();
    const { t, formatCurrency } = useI18n();
    const { cartItems, finalTotal, couponCode } = useCart();
    const { user } = useUser();
    const displayTotal = finalTotal !== undefined ? finalTotal : total;
    const [method, setMethod] = useState<'credit' | 'pix'>('pix');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [rateLimitError, setRateLimitError] = useState(false);
    const submittingRef = useRef(false);

    const [pixQr, setPixQr] = useState<{ qrCode: string; pixCopyPaste: string; orderId?: string } | null>(
        null
    );
    const [copied, setCopied] = useState(false);
    const [waitingPix, setWaitingPix] = useState(false);

    const [formData, setFormData] = useState<PaymentFormData>({
        cardNumber: '',
        cardName: '',
        expiry: '',
        cvv: '',
        installments: '1',
    });

    // Polling: quando o webhook marca o pedido, avança o wizard
    useEffect(() => {
        if (!pixQr?.orderId || !waitingPix) return;

        let cancelled = false;
        const tick = async () => {
            try {
                const res = await fetch(`/api/payment/status?orderId=${encodeURIComponent(pixQr.orderId!)}`);
                if (!res.ok) return;
                const data = (await res.json()) as { paid?: boolean; status?: string };
                if (!cancelled && data.paid) {
                    setWaitingPix(false);
                    await onSubmit({ method: 'pix' });
                }
            } catch {
                /* ignore transient */
            }
        };

        tick();
        const id = window.setInterval(tick, 3000);
        return () => {
            cancelled = true;
            window.clearInterval(id);
        };
    }, [pixQr?.orderId, waitingPix, onSubmit]);

    const handleCardNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 16);
        setFormData((prev) => ({ ...prev, cardNumber: value }));
        if (errors.cardNumber) setErrors((prev) => ({ ...prev, cardNumber: undefined }));
    };

    const handleExpiryChange = (e: ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '').slice(0, 4);
        if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
        setFormData((prev) => ({ ...prev, expiry: value }));
        if (errors.expiry) setErrors((prev) => ({ ...prev, expiry: undefined }));
    };

    const handleInputChange =
        (field: keyof PaymentFormData) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const value = e.target.value;
            if (detectXSS(value)) {
                setErrors((prev) => ({
                    ...prev,
                    [field]: t('errors.invalidCharacters') || 'Caracteres inválidos',
                }));
                return;
            }
            setFormData((prev) => ({ ...prev, [field]: value }));
            if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
        };

    const handleCopyPix = async () => {
        if (!pixQr?.pixCopyPaste) return;
        try {
            await navigator.clipboard.writeText(pixQr.pixCopyPaste);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            /* ignore */
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (submittingRef.current) return;
        if (pixQr) return; // já gerou QR

        const { allowed, resetIn } = checkoutLimiter.check();
        if (!allowed) {
            setRateLimitError(true);
            setErrors({ _form: buildRateLimitMessage(t('errors.rateLimit'), resetIn) });
            return;
        }

        setRateLimitError(false);

        let redirecionando = false;

        submittingRef.current = true;
        setIsSubmitting(true);
        setErrors({});

        try {
            // Validação de cartão só no mock/dev
            if (localCard && method === 'credit') {
                const validation = validateForm(paymentSchema, {
                    cardNumber: formData.cardNumber,
                    cardName: formData.cardName,
                    expiry: formData.expiry,
                    cvv: formData.cvv,
                });

                if (!validation.success) {
                    setErrors(validation.errors as ValidationErrors);
                    return;
                }
            }

            checkoutLimiter.attempt();

            const session = (await paymentService.createPaymentSession({
                customer: buildPaymentCustomer(formData.cardName, user),
                items: buildSessionItems(cartItems),
                couponCode: couponCode || undefined,
                paymentMethod: method,
                shipping,
                total: displayTotal,
                currency: 'BRL',
                orderId: `LV-${Date.now()}`,
            })) as unknown as PaymentSession;

            const outcome = resolveSessionOutcome(session);

            if (outcome.kind === 'pix') {
                setPixQr({
                    qrCode: outcome.qrCode,
                    pixCopyPaste: outcome.pixCopyPaste,
                    orderId: outcome.orderId || session.orderId,
                });
                setWaitingPix(true);
                return;
            }

            if (outcome.kind === 'redirect') {
                redirecionando = true;
                window.location.href = outcome.url;
                return;
            }

            await onSubmit({
                method,
                lastFour: localCard && method === 'credit' ? formData.cardNumber.slice(-4) : undefined,
            });
        } catch (err) {
            console.error(err);
            setErrors({ _form: 'Erro ao processar pagamento. Tente novamente.' });
        } finally {
            if (!redirecionando) {
                submittingRef.current = false;
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="animate-fade-in space-y-4">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-lyvest-500" /> {t('checkout.payment.title')}
            </h2>

            {rateLimitError && (
                <div className="bg-lyvest-100/30 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{errors._form}</span>
                </div>
            )}

            {errors._form && !rateLimitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{errors._form}</span>
                </div>
            )}

            {!pixQr && (
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setMethod('credit')}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all text-sm sm:text-base ${
                            method === 'credit'
                                ? 'border-lyvest-500 bg-lyvest-50 text-lyvest-600'
                                : 'border-slate-100 bg-white text-slate-400 hover:border-lyvest-100'
                        } `}
                    >
                        <CreditCard className="w-5 h-5" />
                        <span>{t('checkout.payment.creditCard') || 'Cartão de Crédito'}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMethod('pix')}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all text-sm sm:text-base ${
                            method === 'pix'
                                ? 'border-green-500 bg-green-50 text-green-600'
                                : 'border-slate-100 bg-white text-slate-400 hover:border-green-200'
                        } `}
                    >
                        <QrCode className="w-5 h-5" />
                        <span>{t('checkout.payment.pix') || 'PIX'}</span>
                    </button>
                </div>
            )}

            {method === 'credit' && localCard && !pixQr && (
                <CreditCardForm
                    t={t}
                    formatCurrency={formatCurrency}
                    formData={formData}
                    errors={errors}
                    displayTotal={displayTotal}
                    handleSubmit={handleSubmit}
                    handleCardNumberChange={handleCardNumberChange}
                    handleExpiryChange={handleExpiryChange}
                    handleInputChange={handleInputChange}
                />
            )}

            {method === 'pix' && !pixQr && <PixPanel t={t} />}

            {pixQr && (
                <PixOnSitePanel
                    qrCode={pixQr.qrCode}
                    pixCopyPaste={pixQr.pixCopyPaste}
                    waiting={waitingPix}
                    onCopy={handleCopyPix}
                    copied={copied}
                />
            )}

            {method === 'credit' && !localCard && !pixQr && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm text-slate-600 flex items-start gap-3">
                    <Lock className="w-5 h-5 text-lyvest-500 mt-0.5" />
                    <div>
                        <p className="font-bold text-slate-700 mb-1">Pagamento no ambiente seguro</p>
                        <p>
                            {hosted
                                ? 'No cartão, você será redirecionado ao Asaas (até 6x). No Pix, o QR fica nesta página — sem sair da loja.'
                                : 'O pagamento será concluído no ambiente seguro do gateway.'}
                        </p>
                    </div>
                </div>
            )}

            <SubmitButton t={t} isSubmitting={isSubmitting} handleSubmit={handleSubmit} hidden={Boolean(pixQr)} />

            <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" />{' '}
                {t('checkout.payment.secure') || 'Ambiente 100% Seguro • Seus dados são criptografados'}
            </p>
        </div>
    );
}
