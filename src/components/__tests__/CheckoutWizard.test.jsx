import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CheckoutWizard from '../CheckoutWizard';
import { I18nProvider } from '../../context/I18nContext';
import * as useCartModule from '../../hooks/useCart';

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock useCart
vi.mock('../../hooks/useCart', () => ({
    useCart: vi.fn()
}));

const MockProviders = ({ children }) => {
    return (
        <I18nProvider>
            {children}
        </I18nProvider>
    )
}

describe('CheckoutWizard', () => {
    beforeEach(() => {
        // Setup default mock return
        vi.mocked(useCartModule.useCart).mockReturnValue({
            cartItems: [{ id: 1, name: 'Product 1', price: 10, qty: 1 }],
            cartTotal: 10,
            clearCart: vi.fn(),
            addToCart: vi.fn(),
            removeFromCart: vi.fn(),
            updateQty: vi.fn()
        });
    });

    it('renders the first step (Address) initially', () => {
        render(
            <MockProviders>
                <CheckoutWizard onBack={() => { }} onComplete={() => { }} />
            </MockProviders>
        );

        expect(screen.getByText(/Address|Entrega/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/ZIP Code|CEP/i)).toBeInTheDocument();
    });

    it('navigates to next step after filling address', async () => {
        const user = userEvent.setup();
        render(
            <MockProviders>
                <CheckoutWizard onBack={() => { }} onComplete={() => { }} />
            </MockProviders>
        );

        // Fill Required Fields
        const nameInput = screen.getByPlaceholderText(/Full Name|Nome Completo/i);
        const phoneInput = screen.getByPlaceholderText(/Phone|Telefone/i);
        const cepInput = screen.getByPlaceholderText(/ZIP Code|CEP/i);
        const streetInput = screen.getByPlaceholderText(/Street|Rua/i);
        const numberInput = screen.getByPlaceholderText(/Number|Número/i);
        const neighInput = screen.getByPlaceholderText(/Neighborhood|Bairro/i);
        const cityInput = screen.getByPlaceholderText(/City|Cidade/i);
        const stateInput = screen.getByPlaceholderText(/State|Estado/i);

        await user.type(nameInput, 'John Doe');
        await user.type(phoneInput, '(11) 98765-4321');
        await user.type(cepInput, '12345-678');
        await user.type(streetInput, 'Rua Teste');
        await user.type(numberInput, '123');
        await user.type(neighInput, 'Centro');
        await user.type(cityInput, 'São Paulo');
        await user.type(stateInput, 'SP');

        const nextButton = screen.getByText(/Continue|Próximo|Ir para/i);
        await user.click(nextButton);

        await waitFor(() => {
            expect(screen.getByText(/Payment|Pagamento/i)).toBeInTheDocument();
        }, { timeout: 3000 });
    });
});







