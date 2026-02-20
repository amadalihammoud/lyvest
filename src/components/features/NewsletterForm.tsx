// src/components/features/NewsletterForm.tsx
import React, { useState, useCallback } from 'react';
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { validateForm, newsletterSchema } from '../../utils/schemas';
import { RateLimiter, createHoneypot, detectXSS } from '../../utils/security';
import { useDebounce } from '../../hooks/useDebounce';
import { useI18n } from '../../hooks/useI18n';

// Rate limiter: 3 tentatives per minute
const newsletterLimiter = new RateLimiter('newsletter', 3, 60000);

// Honeypot anti-spam
import Honeypot from '../ui/Honeypot';
const honeypotFieldName = '_gotcha';

function NewsletterForm() {
    const { t } = useI18n();
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
        const result = validateForm(newsletterSchema, { email, consent });

        if (!result.success && result.errors) {
            setErrors(result.errors);
            return;
        }

        setStatus('loading');
        setErrors({});

        // Simulate submission
        await new Promise(resolve => setTimeout(resolve, 1000));

        setStatus('success');
        setEmail('');
        setConsent(false);

        // Reset after 5 seconds
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
            {/* Honeypot - invisible field for bots */}
            <Honeypot
                fieldName={honeypotFieldName}
                value={honeypotValue}
                onChange={(e) => setHoneypotValue(e.target.value)}
            />

            {/* Email Field */}
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

            {/* Consent Checkbox */}
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

            {/* Rate Limit Error */}
            {rateLimitError && errors.form && (
                <p className="text-sm text-[#F5E6E8]/300 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.form}
                </p>
            )}

            {/* Submit Button */}
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








