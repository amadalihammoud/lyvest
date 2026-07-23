// src/components/features/NewsletterForm.tsx
import { User, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { useDebounce } from '../../hooks/useDebounce';
import { useI18n } from '../../hooks/useI18n';
import { validateForm, newsletterSchema } from '../../utils/schemas';
import { RateLimiter, detectXSS } from '../../utils/security';
import Honeypot from '../ui/Honeypot';

// Rate limiter: 3 tentatives per minute
const newsletterLimiter = new RateLimiter('newsletter', 3, 60000);

// Honeypot anti-spam
const honeypotFieldName = '_gotcha';

function NewsletterForm() {
    const { t } = useI18n();
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [consent, setConsent] = useState<boolean>(false);
    const [honeypotValue, setHoneypotValue] = useState<string>('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});
    const [rateLimitError, setRateLimitError] = useState<boolean>(false);

    // Debounce for real-time validation
    const debouncedEmail = useDebounce(email, 500);

    // Real-time validation
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

        // Check honeypot (anti-bot)
        if (honeypotValue) {
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
        const result = validateForm(newsletterSchema, { name, email, consent });

        if (!result.success && result.errors) {
            setErrors(result.errors);
            return;
        }

        setStatus('loading');
        setErrors({});

        // Simulate submission
        await new Promise(resolve => setTimeout(resolve, 1000));

        setStatus('success');
        setName('');
        setEmail('');
        setConsent(false);

        // Reset after 5 seconds
        setTimeout(() => setStatus('idle'), 5000);
    }, [name, email, consent, honeypotValue, t]);

    if (status === 'success') {
        return (
            <div className="flex items-center justify-center gap-3 p-4 bg-white/95 rounded-full text-center max-w-md mx-auto shadow-md">
                <CheckCircle className="w-6 h-6 text-lyvest-500 flex-shrink-0" />
                <div className="text-left">
                    <p className="font-bold text-lyvest-500">{t('newsletter.success')}</p>
                    <p className="text-xs text-slate-600">{t('newsletter.successMessage')}</p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center lg:items-end" noValidate>
            {/* Honeypot - invisible field for bots */}
            <Honeypot
                fieldName={honeypotFieldName}
                value={honeypotValue}
                onChange={(e) => setHoneypotValue(e.target.value)}
            />

            {/* Name + Email + Submit — inline row on desktop (lg), stacked column on mobile */}
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-3 w-full max-w-md lg:max-w-none items-center">
                {/* Input 1: Nome com Ícone de Usuário */}
                <div className="relative w-full lg:w-48 xl:w-56">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value.slice(0, 100))}
                        placeholder={t('newsletter.namePlaceholder')}
                        className="w-full pl-12 pr-5 py-3.5 rounded-full border-0 text-lyvest-black placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lyvest-terracota transition-all shadow-sm text-sm"
                        disabled={status === 'loading'}
                    />
                </div>

                {/* Input 2: Email com Ícone de Envelope */}
                <div className="relative w-full lg:w-64 xl:w-72">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value.slice(0, 100))}
                        placeholder={t('newsletter.placeholder')}
                        className={`w-full pl-12 pr-5 py-3.5 rounded-full border-0 text-lyvest-black placeholder:text-slate-400 focus:outline-none focus:ring-2 text-sm ${
                            errors.email ? 'ring-2 ring-red-300' : 'focus:ring-lyvest-terracota'
                        } transition-all shadow-sm`}
                        disabled={status === 'loading'}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                    {status === 'loading' && (
                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-lyvest-500 animate-spin" />
                    )}
                </div>

                {/* Botão de envio — Creme com texto Carmim negrito */}
                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full lg:w-auto px-8 py-3.5 bg-[#F5EDE8] hover:bg-white text-[#7D2121] font-bold uppercase tracking-wider text-sm sm:text-base rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm hover:shadow-md"
                >
                    {status === 'loading' ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                        t('newsletter.button')
                    )}
                </button>
            </div>

            {errors.email && (
                <p id="email-error" className="mt-2 text-xs sm:text-sm text-lyvest-mist flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {t(errors.email)}
                </p>
            )}

            {/* Checkbox de Consentimento */}
            <label className="mt-4 lg:mt-2.5 flex items-center justify-center lg:justify-start gap-2.5 cursor-pointer group w-full max-w-md lg:max-w-none">
                <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="w-4 h-4 rounded border-white/60 bg-transparent text-lyvest-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#7D2121]"
                    disabled={status === 'loading'}
                />
                <span className="text-xs sm:text-sm text-white/90 group-hover:text-white transition-colors select-none text-center lg:text-left">
                    {t('newsletter.consent')}
                </span>
            </label>

            {errors.consent && (
                <p className="mt-1 text-xs sm:text-sm text-lyvest-mist flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {t(errors.consent)}
                </p>
            )}

            {/* Rate Limit Error */}
            {rateLimitError && errors.form && (
                <p className="mt-2 text-xs sm:text-sm text-lyvest-mist flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.form}
                </p>
            )}
        </form>
    );
}

export default React.memo(NewsletterForm);
