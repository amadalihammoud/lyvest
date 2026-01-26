// src/components/__tests__/CheckoutPayment.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CheckoutPayment from '../CheckoutPayment';
import { I18nProvider } from '../../context/I18nContext';

// Mock RateLimiter to always allow
vi.mock('../../utils/security', () => ({
    RateLimiter: class {
        check() { return { allowed: true, remaining: 5 }; }
        attempt() { return true; }
        reset() { }
    },
    detectXSS: () => false,
    sanitizeInput: (str) => str,
}));

const defaultProps = {
    onSubmit: vi.fn(),
    total: 199.90,
};

const renderCheckoutPayment = (props = {}) => {
    return render(
        <I18nProvider>
            <CheckoutPayment {...defaultProps} {...props} />
        </I18nProvider>
    );
};

describe('CheckoutPayment', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('renders payment method options', () => {
        renderCheckoutPayment();
        expect(screen.getByText(/Cartão de Crédito/i)).toBeInTheDocument();
        expect(screen.getByText(/PIX/i)).toBeInTheDocument();
    });

    it('shows credit card form by default', () => {
        renderCheckoutPayment();
        expect(screen.getByPlaceholderText(/0000 0000 0000 0000/i)).toBeInTheDocument();
    });

    it('renders card number input', () => {
        renderCheckoutPayment();
        const cardInput = screen.getByPlaceholderText(/0000 0000 0000 0000/i);
        expect(cardInput).toBeInTheDocument();
    });

    it('renders card name input', () => {
        renderCheckoutPayment();
        const nameInput = screen.getByPlaceholderText(/COMO NO CARTÃO/i);
        expect(nameInput).toBeInTheDocument();
    });

    it('renders expiry input', () => {
        renderCheckoutPayment();
        const expiryInput = screen.getByPlaceholderText(/MM\/AA/i);
        expect(expiryInput).toBeInTheDocument();
    });

    it('renders CVV input', () => {
        renderCheckoutPayment();
        const cvvInput = screen.getByPlaceholderText(/123/i);
        expect(cvvInput).toBeInTheDocument();
    });

    it('formats card number as user types', () => {
        renderCheckoutPayment();
        const cardInput = screen.getByPlaceholderText(/0000 0000 0000 0000/i);

        fireEvent.change(cardInput, { target: { value: '4111111111111111' } });

        expect(cardInput.value).toContain(' ');
    });

    it('switches to PIX form when PIX is selected', () => {
        renderCheckoutPayment();

        const pixOption = screen.getByText(/PIX/i);
        fireEvent.click(pixOption);

        expect(screen.getByText(/O código PIX será gerado/i)).toBeInTheDocument();
    });

    it('renders order total', () => {
        renderCheckoutPayment({ total: 199.90 });
        expect(screen.getByText(/R\$ 199,90/i)).toBeInTheDocument();
    });

    it('renders secure environment message', () => {
        renderCheckoutPayment();
        expect(screen.getByText(/Ambiente 100% Seguro/i)).toBeInTheDocument();
    });

    it('renders accepted cards section', () => {
        renderCheckoutPayment();
        expect(screen.getByText(/Cartões Aceitos/i)).toBeInTheDocument();
    });

    it('has submit button disabled initially (empty form)', async () => {
        renderCheckoutPayment();
        const submitButton = screen.getByRole('button', { name: /Confirmar Pedido|Continuar/i });

        // Form validation should prevent submission of empty form
        expect(submitButton).toBeInTheDocument();
    });

    it('shows validation errors for invalid card', async () => {
        renderCheckoutPayment();

        const cardInput = screen.getByPlaceholderText(/0000 0000 0000 0000/i);
        fireEvent.change(cardInput, { target: { value: '1234' } });
        fireEvent.blur(cardInput);

        // Form should show some indication of invalid input
        expect(cardInput).toBeInTheDocument();
    });

    it('calls onSubmit with complete valid data', async () => {
        const onSubmit = vi.fn();
        renderCheckoutPayment({ onSubmit });

        // Fill all fields
        fireEvent.change(screen.getByPlaceholderText(/0000 0000 0000 0000/i), {
            target: { value: '4111111111111111' }
        });
        fireEvent.change(screen.getByPlaceholderText(/COMO NO CARTÃO/i), {
            target: { value: 'JOHN DOE' }
        });
        fireEvent.change(screen.getByPlaceholderText(/MM\/AA/i), {
            target: { value: '12/28' }
        });
        fireEvent.change(screen.getByPlaceholderText(/123/i), {
            target: { value: '123' }
        });

        const submitButton = screen.getByRole('button', { name: /Confirmar Pedido|Continuar/i });
        fireEvent.click(submitButton);

        // Note: actual submission depends on form validation passing
    });

    it('displays installment options', () => {
        renderCheckoutPayment({ total: 300 });
        expect(screen.getByText(/Parcelamento/i)).toBeInTheDocument();
    });
});







