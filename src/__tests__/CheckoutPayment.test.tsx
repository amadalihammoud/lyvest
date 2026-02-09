import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CheckoutPayment from '../components/checkout/CheckoutPayment';

// Mock useI18n
vi.mock('../hooks/useI18n', () => ({
    useI18n: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'checkout.creditCard': 'Cartão de Crédito',
                'checkout.pix': 'PIX',
                'checkout.pixDiscount': '5% de desconto',
                'checkout.pay': 'Pagar R$',
            };
            return translations[key] || key;
        },
        formatCurrency: (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`,
    }),
}));

describe('CheckoutPayment', () => {
    const mockOnSubmit = vi.fn();
    const defaultProps = {
        onSubmit: mockOnSubmit,
        total: 100.00
    };

    it('renders all payment methods', () => {
        render(<CheckoutPayment {...defaultProps} />);
        expect(screen.getByText('Cartão de Crédito')).toBeInTheDocument();
        expect(screen.getByText('PIX')).toBeInTheDocument();
    });

    it('validates credit card inputs', async () => {
        const user = userEvent.setup();
        render(<CheckoutPayment {...defaultProps} />);

        const submitBtn = screen.getByText(/Pagar R\$ 100,00/i);
        await user.click(submitBtn);

        expect(screen.getByPlaceholderText('0000 0000 0000 0000')).toBeInvalid();
    });

    it('formats credit card number correctly', async () => {
        const user = userEvent.setup();
        render(<CheckoutPayment {...defaultProps} />);

        const input = screen.getByPlaceholderText('0000 0000 0000 0000') as HTMLInputElement;
        await user.type(input, '4111111111111111');

        expect(input.value).toBe('4111 1111 1111 1111');
    });

    it('switches to PIX payment', async () => {
        const user = userEvent.setup();
        render(<CheckoutPayment {...defaultProps} />);

        await user.click(screen.getByText('PIX'));
        expect(screen.getByText('5% de desconto')).toBeInTheDocument();
        expect(screen.queryByPlaceholderText('0000 0000 0000 0000')).not.toBeInTheDocument();
    });

    it('submits valid credit card data', async () => {
        const user = userEvent.setup();
        render(<CheckoutPayment {...defaultProps} />);

        // Fill form
        await user.type(screen.getByPlaceholderText('0000 0000 0000 0000'), '4111111111111111');
        await user.type(screen.getByPlaceholderText('MM/AA'), '12/30');
        await user.type(screen.getByPlaceholderText('123'), '123');
        await user.type(screen.getByPlaceholderText('Nome como no cartão'), 'JOHN DOE');
        await user.type(screen.getByPlaceholderText('000.000.000-00'), '123.456.789-00');

        const submitBtn = screen.getByText(/Pagar R\$ 100,00/i);
        await user.click(submitBtn);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
                method: 'credit_card',
                cardName: 'JOHN DOE'
            }));
        });
    });
});
