'use client';
import { useUser } from '@clerk/nextjs';
import { CreditCard, QrCode, AlertCircle, Lock } from 'lucide-react';
import { useRef, useState, ChangeEvent, FormEvent } from 'react';

import { useI18n } from '../../hooks/useI18n';
import { paymentService } from '../../services/payment';
import { useCart } from '../../store/useCartStore';
import { buildPaymentCustomer, buildRateLimitMessage, buildSessionItems, resolveSessionOutcome } from '../../utils/checkoutPayment';
import { paymentSchema, validateForm } from '../../utils/schemas';
import { RateLimiter, detectXSS } from '../../utils/security';
import { formatCardNumber } from '../../utils/validation';

// import { useAuth } from '../../context/AuthContext'; // Removed

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
    /**
     * Pode devolver Promise: o wizard persiste o pedido antes de avancar, e
     * este componente PRECISA esperar — se o pedido falha, o wizard nao troca
     * de passo e o formulario continua montado.
     */
    onSubmit: (data: { method: 'credit' | 'pix'; lastFour?: string }) => void | Promise<void>;
    total: number;
    /** Endereço de entrega coletado no passo anterior (enviado ao servidor no fluxo hospedado). */
    shipping?: Record<string, unknown>;
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

type TFn = (key: string) => string;

// Rate limiter for checkout (3 attempts per 5 minutes)
const checkoutLimiter = new RateLimiter('checkout', 3, 300000);

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

// Formulário de cartão de crédito — extraído para manter CheckoutPayment com baixa complexidade.
function CreditCardForm({
    t, formatCurrency, formData, errors, displayTotal,
    handleSubmit, handleCardNumberChange, handleExpiryChange, handleInputChange,
}: CreditCardFormProps) {
    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 animate-slide-up">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-slate-500">{t('checkout.payment.acceptedCards') || 'Cartões Aceitos'}</span>
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
                    placeholder={t('checkout.payment.cardNamePlaceholder') || 'COMO NO CARTÃO'}
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
                                .filter(qty => qty === 1 || displayTotal / qty >= 20) // Mínimo R$ 20 por parcela, exceto 1x
                                .map(qty => (
                                    <option key={qty} value={qty}>
                                        {qty}x de {formatCurrency(displayTotal / qty)} {qty === 1 ? 'à vista' : 'sem juros'}
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
    );
}

// Painel PIX — extraído para reduzir complexidade.
function PixPanel({ t }: { t: TFn }) {
    return (
        <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center animate-slide-up">
            <QrCode className="w-32 h-32 mx-auto text-green-600 mb-4 opacity-80" />
            <p className="text-sm text-green-800 font-medium mb-2">{t('checkout.payment.pixMessage') || 'O código PIX será gerado na próxima etapa.'}</p>
            <p className="text-xs text-green-600">{t('checkout.payment.pixSecure') || 'Aprovação imediata e mais segurança.'}</p>
        </div>
    );
}

// Botão de confirmar pagamento — extraído para reduzir complexidade.
function SubmitButton({ t, isSubmitting, handleSubmit }: {
    t: TFn;
    isSubmitting: boolean;
    handleSubmit: (e: FormEvent) => void;
}) {
    return (
        <button
            onClick={handleSubmit}
            // So isSubmitting. Antes tinha `|| rateLimitError`, e como nada nunca punha
            // esse estado de volta em false, o botao morria depois de 3 tentativas:
            // a propria mensagem ("aguarde N minutos") virava impossivel de cumprir,
            // porque nenhum clique reavaliava o limitador. Quem decide se pode
            // tentar e o checkoutLimiter, a cada submit.
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
    // Checkout hospedado (Asaas): cartão/Pix/boleto acontecem na página do gateway —
    // nenhum dado de cartão é coletado neste formulário (PCI fora do escopo do app).
    const isHostedCheckout = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER === 'asaas';
    const { t, formatCurrency } = useI18n();
    const { cartItems, finalTotal, couponCode } = useCart();
    const { user } = useUser();
    // Use finalTotal from context if available (it handles discounts), otherwise fallback to prop
    const displayTotal = finalTotal !== undefined ? finalTotal : total;
    const [method, setMethod] = useState<'credit' | 'pix'>('credit');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [rateLimitError, setRateLimitError] = useState(false);
    // Espelho sincrono de isSubmitting: setState nao vale como trava de reentrada.
    const submittingRef = useRef(false);

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
            setErrors(prev => ({ ...prev, [field]: t('errors.invalidCharacters') || 'Caracteres inválidos' }));
            return;
        }

        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Trava de reentrada em REF, não em state.
        //
        // `setIsSubmitting` é assíncrono: entre o primeiro clique e o React
        // re-renderizar o botão como disabled existe uma janela real, e dois
        // cliques rápidos leem o mesmo `false`. Com o Asaas isso custa caro — o
        // segundo POST cria um SEGUNDO pedido pending, baixa estoque de novo e
        // queima cupom de uso único. Ref é síncrona e fecha a janela.
        if (submittingRef.current) return;

        const { allowed, resetIn } = checkoutLimiter.check();
        if (!allowed) {
            setRateLimitError(true);
            setErrors({ _form: buildRateLimitMessage(t('errors.rateLimit'), resetIn) });
            return;
        }

        // O limitador liberou agora, então um bloqueio anterior não vale mais.
        setRateLimitError(false);

        // Quando true, o browser JÁ está saindo da página: reabilitar o botão
        // aqui só o deixaria clicável durante a navegação.
        let redirecionando = false;

        submittingRef.current = true;
        setIsSubmitting(true);
        setErrors({});

        try {
            // Fluxo legado (mock): PIX resolve direto no wizard, sem gateway.
            //
            // O `await` não é decorativo: onSubmit é async e, quando o pedido
            // falha (sem estoque, rede fora), o wizard mostra o erro e NÃO
            // avança de passo — este componente continua montado. Sem esperar,
            // o `finally` rodaria antes da falha e o botão ficaria travado em
            // "Processando..." até o cliente recarregar a página.
            if (method === 'pix' && !isHostedCheckout) {
                checkoutLimiter.attempt();
                await onSubmit({ method: 'pix' });
                return;
            }

            // Validação de cartão: apenas no fluxo legado (no hospedado o cartão
            // é digitado na página segura do gateway, nunca aqui).
            if (!isHostedCheckout) {
                const validation = validateForm(paymentSchema, {
                    cardNumber: formData.cardNumber,
                    cardName: formData.cardName,
                    expiry: formData.expiry,
                    cvv: formData.cvv
                });

                if (!validation.success) {
                    setErrors(validation.errors as ValidationErrors);
                    return;
                }
            }

            checkoutLimiter.attempt();

            const session = await paymentService.createPaymentSession({
                customer: buildPaymentCustomer(formData.cardName, user),
                items: buildSessionItems(cartItems),
                // Envia apenas o CÓDIGO do cupom; o servidor revalida e recomputa o total.
                // O `total` do cliente é meramente informativo (o backend o ignora).
                couponCode: couponCode || undefined,
                paymentMethod: method,
                shipping,
                total: displayTotal,
                currency: 'BRL',
                orderId: `LV-${Date.now()}`
            }) as unknown as PaymentSession;

            const outcome = resolveSessionOutcome(session);
            if (outcome.kind === 'redirect') {
                redirecionando = true;
                window.location.href = outcome.url;
                return;
            }

            // Sucesso direto (ex.: mock sem redirecionamento). `method`, não o
            // literal 'credit': no fluxo hospedado o PIX não retorna cedo, e
            // registrar um PIX como cartão corromperia a conciliação.
            await onSubmit({ method, lastFour: formData.cardNumber.slice(-4) });
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
                    <span>{t('checkout.payment.creditCard') || 'Cartão de Crédito'}</span>
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

            {method === 'credit' && !isHostedCheckout && (
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

            {method === 'pix' && <PixPanel t={t} />}

            {method === 'credit' && isHostedCheckout && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm text-slate-600 flex items-start gap-3">
                    <Lock className="w-5 h-5 text-lyvest-500 mt-0.5" />
                    <div>
                        <p className="font-bold text-slate-700 mb-1">Pagamento no ambiente seguro do Asaas</p>
                        <p>Você será redirecionado para concluir com cartão (até 6x), Pix ou boleto. Nenhum dado do seu cartão passa pela LyVest.</p>
                    </div>
                </div>
            )}

            <SubmitButton
                t={t}
                isSubmitting={isSubmitting}
                handleSubmit={handleSubmit}
            />

            <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> {t('checkout.payment.secure') || 'Ambiente 100% Seguro • Seus dados são criptografados'}
            </p>
        </div>
    );
}
