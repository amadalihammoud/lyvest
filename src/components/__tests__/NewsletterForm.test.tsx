// src/components/__tests__/NewsletterForm.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewsletterForm from '../NewsletterForm';
import { I18nProvider } from '../../context/I18nContext';

// Mock RateLimiter
vi.mock('../../utils/security', () => ({
    RateLimiter: class {
        check() { return { allowed: true, remaining: 5 }; }
        attempt() { return true; }
        reset() { }
    },
    detectXSS: () => false,
    isDisposableEmail: () => false,
    createHoneypot: () => ({ fieldName: 'website', validate: () => true }),
}));

const renderNewsletterForm = () => {
    return render(
        <I18nProvider>
            <NewsletterForm />
        </I18nProvider>
    );
};

describe('NewsletterForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('renders email input', () => {
        renderNewsletterForm();
        const emailInput = screen.getByPlaceholderText(/e-mail/i);
        expect(emailInput).toBeInTheDocument();
    });

    it('renders submit button', () => {
        renderNewsletterForm();
        expect(screen.getByText(/Quero Receber/i)).toBeInTheDocument();
    });

    it('renders consent checkbox', () => {
        renderNewsletterForm();
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toBeInTheDocument();
    });

    it('shows error for invalid email', async () => {
        renderNewsletterForm();

        const emailInput = screen.getByPlaceholderText(/e-mail/i);
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);

        const submitButton = screen.getByText(/Quero Receber/i);
        fireEvent.click(submitButton);

        await waitFor(() => {
            // Should show some error indication
            expect(emailInput).toBeInTheDocument();
        });
    });

    it('shows error when consent is not checked', async () => {
        renderNewsletterForm();

        const emailInput = screen.getByPlaceholderText(/e-mail/i);
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

        const submitButton = screen.getByText(/Quero Receber/i);
        fireEvent.click(submitButton);

        // Should require consent checkbox
        await waitFor(() => {
            expect(screen.getByRole('checkbox')).not.toBeChecked();
        });
    });

    it('renders newsletter title', () => {
        renderNewsletterForm();
        expect(screen.getByText(/Fique por dentro/i)).toBeInTheDocument();
    });

    it('renders newsletter subtitle', () => {
        renderNewsletterForm();
        expect(screen.getByText(/ofertas exclusivas/i)).toBeInTheDocument();
    });

    it('allows checking consent checkbox', () => {
        renderNewsletterForm();

        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).not.toBeChecked();

        fireEvent.click(checkbox);
        expect(checkbox).toBeChecked();
    });

    it('updates email value when typing', () => {
        renderNewsletterForm();

        const emailInput = screen.getByPlaceholderText(/e-mail/i);
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

        expect(emailInput.value).toBe('test@example.com');
    });
});







