// src/components/NewsletterForm.jsx
import React, { useState, useCallback } from 'react';
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { newsletterSchema, validateForm } from '../../utils/validation';
import { RateLimiter, createHoneypot, detectXSS } from '../../utils/security';
import { useDebounce } from '../../hooks/useDebounce';
import { useI18n } from '../../hooks/useI18n';

// Rate limiter: 3 tentativas por minuto
const newsletterLimiter = new RateLimiter('newsletter', 3, 60000);

// Honeypot anti-spam
const honeypot = createHoneypot();

function NewsletterForm() {
    const { t } = useI18n();
    const [email, setEmail] = useState('');
    const [consent, setConsent] = useState(false);
    const [honeypotValue, setHoneypotValue] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [errors, setErrors] = useState({});
    const [rateLimitError, setRateLimitError] = useState(false);

    // Debounce do email para validaÃ§Ã£o em tempo real
    const debouncedEmail = useDebounce(email, 500);

    // ValidaÃ§Ã£o em tempo real do email
    React.useEffect(() => {
        if (debouncedEmail) {
            const result = validateForm(newsletterSchema.pick({ email: true }), { email: debouncedEmail });
            if (!result.success) {
                setErrors(prev => ({ ...prev, email: result.errors?.email }));
            } else {
                setErrors(prev => ({ ...prev, email: undefined }));
            }
        }
    }, [debouncedEmail]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        // Check honeypot (anti-bot)
        if (!honeypot.validate(honeypotValue)) {
            // Silently fail for bots
            setStatus('success');
            return;
        }

        // Check rate limit
        if (!newsletterLimiter.attempt()) {
            setRateLimitError(true);
            setStatus('error');
            setErrors({ form: t('errors.rateLimit') });
            return;
        }

        // Check XSS
        if (detectXSS(email)) {
            setErrors({ email: t('errors.invalidCharacters') });
            return;
        }

        // Validate form
        const result = validateForm(newsletterSchema, { email, consent });

        if (!result.success) {
            setErrors(result.errors);
            return;
        }

        setStatus('loading');
        setErrors({});

        // Simular envio
        await new Promise(resolve => setTimeout(resolve, 1000));

        setStatus('success');
        setEmail('');
        setConsent(false);

        // Reset apÃ³s 5 segundos
        setTimeout(() => setStatus('idle'), 5000);
    }, [email, consent, honeypotValue, t]);

    if (status === 'success') {
        return (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                <div>
                    <p className="font-bold text-green-700">{t('newsletter.success')}</p>
                    <p className="text-sm text-green-600">{t('newsletter.successMessage')}</p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Honeypot - campo invisÃ­vel para bots */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
                <label htmlFor={honeypot.fieldName}>{honeypot.fieldName}</label>
                <input
                    type="text"
                    id={honeypot.fieldName}
                    name={honeypot.fieldName}
                    value={honeypotValue}
                    onChange={(e) => setHoneypotValue(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                />
            </div>

            {/* Campo de Email */}
            <div>
                <div className="relative">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value.slice(0, 100))}
                        placeholder={t('newsletter.placeholder')}
                        className={`w-full px-4 py-3 rounded-xl border ${errors.email
                            ? 'border-red-300 focus:ring-red-200'
                            : 'border-slate-200 focus:ring-[#F5E6E8]'
                            } focus:outline-none focus:ring-2 transition-all`}
                        disabled={status === 'loading'}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                    {status === 'loading' && (
                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C05060] animate-spin" />
                    )}
                </div>
                {errors.email && (
                    <p id="email-error" className="mt-1 text-sm text-[#F5E6E8]/300 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {t(errors.email)}
                    </p>
                )}
            </div>

            {/* Checkbox de Consentimento */}
            <label className="flex items-start gap-3 cursor-pointer group">
                <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded border-slate-300 text-lyvest-500 focus:ring-[#F5E6E8]"
                    disabled={status === 'loading'}
                />
                <span className={`text-sm ${errors.consent ? 'text-[#F5E6E8]/300' : 'text-slate-600'} group-hover:text-slate-800`}>
                    {t('newsletter.consent')}
                </span>
            </label>
            {errors.consent && (
                <p className="text-sm text-[#F5E6E8]/300 flex items-center gap-1 -mt-2">
                    <AlertCircle className="w-4 h-4" />
                    {t(errors.consent)}
                </p>
            )}

            {/* Erro de Rate Limit */}
            {rateLimitError && errors.form && (
                <p className="text-sm text-[#F5E6E8]/300 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.form}
                </p>
            )}

            {/* BotÃ£o de Envio */}
            <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-lyvest-500 to-lyvest-500 text-white font-bold rounded-full hover:brightness-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {status === 'loading' ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t('common.processing')}
                    </>
                ) : (
                    <>
                        <Send className="w-5 h-5" />
                        {t('newsletter.button')}
                    </>
                )}
            </button>
        </form>
    );
}

export default React.memo(NewsletterForm);








