import { z } from 'zod';
import { isValidCreditCard } from './validation';

// Schema de endereço para checkout
export const addressSchema = z.object({
    name: z.string().min(3, 'errors.nameMin').max(100),
    document: z.string().min(11, 'errors.documentInvalid').max(18),
    phone: z.string().min(10, 'errors.phoneInvalid').max(15),
    cep: z.string().length(8, 'errors.cepInvalid'),
    street: z.string().min(3, 'errors.streetMin').max(200),
    number: z.string().min(1, 'errors.numberRequired').max(20),
    complement: z.string().max(100).optional(),
    neighborhood: z.string().min(2, 'errors.neighborhoodMin').max(100),
    city: z.string().min(2, 'errors.cityMin').max(100),
    state: z.string().length(2, 'errors.stateInvalid'),
});

// Schema de newsletter
export const newsletterSchema = z.object({
    email: z.string().email('errors.emailInvalid'),
    consent: z.literal(true, { errorMap: () => ({ message: 'errors.consentRequired' }) }),
});

// Schema de login
export const loginSchema = z.object({
    email: z.string().email('errors.emailInvalid'),
    password: z.string().min(6, 'errors.passwordMin'),
});

// Schema de registro
export const registerSchema = z.object({
    name: z.string().min(3, 'errors.nameMin'),
    email: z.string().email('errors.emailInvalid'),
    password: z.string().min(8, 'errors.passwordMin'),
    confirmPassword: z.string(),
    terms: z.literal(true),
}).refine(data => data.password === data.confirmPassword, {
    message: 'errors.passwordMatch',
    path: ['confirmPassword'],
});

// Schema de pagamento
export const paymentSchema = z.object({
    cardNumber: z.string().min(13, 'errors.cardInvalid').max(19).refine(isValidCreditCard, 'errors.cardInvalid'),
    cardName: z.string().min(3, 'errors.nameMin'),
    expiry: z.string().length(5, 'errors.expiryInvalid').refine((val) => {
        const [month, year] = val.split('/').map(Number);
        if (!month || !year || month < 1 || month > 12) return false;

        const now = new Date();
        const currentYear = parseInt(now.getFullYear().toString().slice(-2));
        const currentMonth = now.getMonth() + 1;

        if (year < currentYear) return false;
        if (year === currentYear && month < currentMonth) return false;

        return true;
    }, 'errors.expiryInvalid'),
    cvv: z.string().min(3, 'errors.cvvInvalid').max(4),
});

/**
 * Valida dados com schema Zod
 */
export function validateForm<T extends z.ZodSchema>(
    schema: T,
    data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string | undefined> } {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors: Record<string, string | undefined> = {};
    result.error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
    });

    return { success: false, errors };
}
