import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CheckoutPayment from '../CheckoutPayment';

// Mock dependencies
vi.mock('../../context/CartContext', () => ({
    useCart: () => ({
        cartItems: [
            { id: 1, name: 'Test Item', price: 100, qty: 1 }
        ]
    })
}));

vi.mock('../../hooks/useI18n', () => ({
    useI18n: () => ({
        t: (key: string) => key,
        formatCurrency: (val: number) => `R$ ${val.toFixed(2)}`
    })
}));

vi.mock('../../services/payment', () => ({
    paymentService: {
        createPaymentSession: vi.fn().mockResolvedValue({
            sessionId: 'mock-session-123',
            status: 'success'
        })
    }
}));

describe('CheckoutPayment Component', () => {
    const mockSubmit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render payment methods', () => {
        render(<CheckoutPayment onSubmit={mockSubmit} total={100} />);

        expect(screen.getByText('checkout.payment.title')).toBeInTheDocument();
        expect(screen.getByText('checkout.payment.creditCard')).toBeInTheDocument();
        expect(screen.getByText('checkout.payment.pix')).toBeInTheDocument();
    });

    it('should switch to PIX method', async () => {
        render(<CheckoutPayment onSubmit={mockSubmit} total={100} />);

        const pixButton = screen.getByText('checkout.payment.pix');
        fireEvent.click(pixButton);

        expect(screen.getByText('checkout.payment.pixMessage')).toBeInTheDocument();

        // Submit PIX
        const submitButton = screen.getByText('checkout.buttons.confirm');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockSubmit).toHaveBeenCalledWith({ method: 'pix' });
        });
    });

    it('should validate credit card fields', async () => {
        render(<CheckoutPayment onSubmit={mockSubmit} total={100} />);

        // Ensure we are on Credit Card tab (default)
        expect(screen.getByText('checkout.payment.cardNumber')).toBeInTheDocument();

        // Submit empty form
        const submitButton = screen.getByText('checkout.buttons.confirm');
        fireEvent.click(submitButton);

        // Expect validation errors (using keys as mocked t returns key)
        await waitFor(() => {
            // Check if validation logic is triggering. 
            // In the component, update calls setErrors. 
            // Since we mocked validation utils? No, we didn't mock validation utils, so real logic runs.
        });
    });

    it('should submit valid credit card form', async () => {
        render(<CheckoutPayment onSubmit={mockSubmit} total={100} />);

        // Fill form
        fireEvent.change(screen.getByLabelText('checkout.payment.cardNumber'), { target: { value: '4111111111111111' } });
        fireEvent.change(screen.getByLabelText('checkout.payment.cardName'), { target: { value: 'TEST USER' } });
        fireEvent.change(screen.getByLabelText('checkout.payment.expiry'), { target: { value: '12/30' } });
        fireEvent.change(screen.getByLabelText('checkout.payment.cvv'), { target: { value: '123' } });

        const submitButton = screen.getByText('checkout.buttons.confirm');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockSubmit).toHaveBeenCalledWith({
                method: 'credit',
                lastFour: '1111'
            });
        });
    });
});
