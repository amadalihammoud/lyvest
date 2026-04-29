// src/components/features/NewsletterForm.tsx
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { useDebounce } from '../../hooks/useDebounce';
import { useI18n } from '../../hooks/useI18n';
import { validateForm, newsletterSchema } from '../../utils/schemas';
import { RateLimiter, detectXSS } from '../../utils/security';

import Honeypot from '../ui/Honeypot';

const newsletterLimiter = new RateLimiter('newsletter', 3, 60000);
const honeypotFieldName = '_gotcha';

function NewsletterForm() {
    const { t } = useI18n();
    const [email, setEmail] = useState<string>('');
    const [consent, setConsent] = useState<boolean>(false);
    const [honeypotValue, setHoneypotValue] = useState<string>('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});
    const [rateLimitError, setRateLimitError] = useState<boolean>(false);

    const debouncedEmail = useDebounce(email, 500);

    React.useEffect(() => {
        if (debouncedEmail) {
            const result = validateForm(newsletterSchema.pick({ email: true }), { email: debouncedEmail });
            if (!result.success && result.errors) {
                setErrors(prev => ({ ...prev, email: result.errors?.email }));
            } else {
                setErrors(prev => ({ ...prev, email: undefined }));
            }
        }
    }, [debouncedEmail]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (honeypotValue) {
            setStatus('success');
            return;
        }

        if (!newsletterLimiter.attempt()) {
            setRateLimitError(true);
            setStatus('error');
            setErrors({ form: t('errors.rateLimit') });
            return;
        }

        if (detectXSS(email)) {
            setErrors({ email: t('errors.invalidCharacters') });
            return;
        }

        const result = validateForm(newsletterSchema, { email, consent });

        if (!result.success && result.errors) {
            setErrors(result.errors);
            return;
        }

        setStatus('loading');
        setErrors({});

        await new Promise(resolve => setTimeout(resolve, 1000));

        setStatus('success');
        setEmail('');
        setConsent(false);

        setTimeout(() => setStatus('idle'), 8000);
    }, [email, consent, honeypotValue, t]);

    if (status === 'success') {
        return (
            <div className="flex flex-col items-center gap-4 p-6 bg-background/5 border border-background/15 backdrop-blur-sm">
                <CheckCircle className="w-10 h-10 text-primary flex-shrink-0" strokeWidth={1.5} />
                <div className="text-center">
                    <p className="font-serif text-2xl text-background mb-1">Bem-vinda à Lyvest.</p>
                    <p className="text-sm text-background/70 mb-4">Confira seu e-mail para o cupom de boas-vindas.</p>
                    <div className="inline-flex items-center gap-3 px-4 py-2 border border-primary/40 bg-primary/10">
                        <span className="text-[10px] tracking-[0.3em] uppercase text-primary/80">Seu cupom</span>
                        <span className="font-mono text-base font-bold text-primary">LYVEST10</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5 max-w-md mx-auto" noValidate>
            <Honeypot
                fieldName={honeypotFieldName}
                value={honeypotValue}
                onChange={(e) => setHoneypotValue(e.target.value)}
            />

            {/* Campo Email + Botão integrados num input editorial */}
            <div className="relative">
                <div className={`flex items-stretch border-b ${errors.email ? 'border-red-400' : 'border-background/30 focus-within:border-primary'} transition-colors`}>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value.slice(0, 100))}
                        placeholder="seu@email.com"
                        className="flex-1 bg-transparent px-1 py-3 text-background placeholder:text-background/40 focus:outline-none"
                        disabled={status === 'loading'}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="flex items-center justify-center gap-2 px-5 py-2 text-xs font-medium tracking-[0.2em] uppercase text-background hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Inscrever-se"
                    >
                        {status === 'loading' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                Inscrever
                                <Send className="w-3.5 h-3.5" aria-hidden="true" />
                            </>
                        )}
                    </button>
                </div>
                {errors.email && (
                    <p id="email-error" className="mt-2 text-xs text-red-300 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        {t(errors.email)}
                    </p>
                )}
            </div>

            {/* Consent — minimalista */}
            <label className="flex items-start gap-3 cursor-pointer text-left">
                <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-primary cursor-pointer"
                    disabled={status === 'loading'}
                />
                <span className={`text-xs leading-relaxed ${errors.consent ? 'text-red-300' : 'text-background/60'}`}>
                    {t('newsletter.consent')}
                </span>
            </label>
            {errors.consent && (
                <p className="text-xs text-red-300 flex items-center gap-1.5 -mt-3">
                    <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    {t(errors.consent)}
                </p>
            )}

            {rateLimitError && errors.form && (
                <p className="text-xs text-red-300 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    {errors.form}
                </p>
            )}
        </form>
    );
}

export default React.memo(NewsletterForm);
