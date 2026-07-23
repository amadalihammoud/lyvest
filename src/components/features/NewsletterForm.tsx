// src/components/features/NewsletterForm.tsx
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
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
            <div className="flex items-center gap-3 p-4 bg-white/95 rounded-xl">
                <CheckCircle className="w-6 h-6 text-lyvest-500 flex-shrink-0" />
                <div className="text-left">
                    <p className="font-bold text-lyvest-500">{t('newsletter.success')}</p>
                    <p className="text-sm text-lyvest-siena">{t('newsletter.successMessage')}</p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="w-full" noValidate>
            {/* Honeypot - invisible field for bots */}
            <Honeypot
                fieldName={honeypotFieldName}
                value={honeypotValue}
                onChange={(e) => setHoneypotValue(e.target.value)}
            />

            {/* Name + Email + Submit — inline row on desktop, stacked on mobile */}
            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 100))}
                    placeholder={t('newsletter.namePlaceholder')}
                    className="w-full sm:w-48 px-5 py-3 rounded-full border-0 text-lyvest-black placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lyvest-terracota transition-all"
                    disabled={status === 'loading'}
                />

                <div className="relative flex-1">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value.slice(0, 100))}
                        placeholder={t('newsletter.placeholder')}
                        className={`w-full px-5 py-3 rounded-full border-0 text-lyvest-black placeholder:text-slate-400 focus:outline-none focus:ring-2 ${errors.email ? 'ring-2 ring-red-300' : 'focus:ring-lyvest-terracota'
                            } transition-all`}
                        disabled={status === 'loading'}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                    {status === 'loading' && (
                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-lyvest-500 animate-spin" />
                    )}
                </div>

                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="flex items-center justify-center gap-2 px-8 py-3 bg-lyvest-cream text-lyvest-500 font-bold uppercase tracking-wide text-sm rounded-full hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                    {status === 'loading' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <Send className="w-4 h-4 hidden sm:inline" />
                            {t('newsletter.button')}
                        </>
                    )}
                </button>
            </div>

            {errors.email && (
                <p id="email-error" className="mt-2 text-sm text-lyvest-mist flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {t(errors.email)}
                </p>
            )}

            {/* Consent Checkbox */}
            <label className="mt-3 flex items-start gap-2 cursor-pointer group">
                <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-white/40 text-lyvest-terracota focus:ring-lyvest-terracota"
                    disabled={status === 'loading'}
                />
                <span className="text-xs text-white/80 group-hover:text-white">
                    {t('newsletter.consent')}
                </span>
            </label>
            {errors.consent && (
                <p className="mt-1 text-sm text-lyvest-mist flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {t(errors.consent)}
                </p>
            )}

            {/* Rate Limit Error */}
            {rateLimitError && errors.form && (
                <p className="mt-2 text-sm text-lyvest-mist flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.form}
                </p>
            )}
        </form>
    );
}

export default React.memo(NewsletterForm);
