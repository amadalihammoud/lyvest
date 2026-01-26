// src/components/__tests__/CheckoutAddress.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CheckoutAddress from '../CheckoutAddress';
import { I18nProvider } from '../../context/I18nContext';

const defaultProps = {
    onSubmit: vi.fn(),
    initialData: null,
};

const renderCheckoutAddress = (props = {}) => {
    return render(
        <I18nProvider>
            <CheckoutAddress {...defaultProps} {...props} />
        </I18nProvider>
    );
};

describe('CheckoutAddress', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders address form title', () => {
        renderCheckoutAddress();
        expect(screen.getByText(/Endereço de Entrega/i)).toBeInTheDocument();
    });

    it('renders name input', () => {
        renderCheckoutAddress();
        expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument();
    });

    it('renders CEP input', () => {
        renderCheckoutAddress();
        expect(screen.getByLabelText(/CEP/i)).toBeInTheDocument();
    });

    it('renders street input', () => {
        renderCheckoutAddress();
        expect(screen.getByLabelText(/Rua/i)).toBeInTheDocument();
    });

    it('renders city input', () => {
        renderCheckoutAddress();
        expect(screen.getByLabelText(/Cidade/i)).toBeInTheDocument();
    });

    it('renders state select', () => {
        renderCheckoutAddress();
        expect(screen.getByLabelText(/Estado/i)).toBeInTheDocument();
    });

    it('renders phone input', () => {
        renderCheckoutAddress();
        expect(screen.getByLabelText(/Telefone/i)).toBeInTheDocument();
    });

    it('renders continue button', () => {
        renderCheckoutAddress();
        expect(screen.getByText(/Continuar/i)).toBeInTheDocument();
    });

    it('populates form with initial data', () => {
        const initialData = {
            fullName: 'John Doe',
            cep: '01310100',
            street: 'Av. Paulista',
            number: '1000',
            city: 'São Paulo',
            state: 'SP',
            phone: '11999999999',
        };

        renderCheckoutAddress({ initialData });

        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });

    it('validates required fields', async () => {
        renderCheckoutAddress();

        const submitButton = screen.getByText(/Continuar/i);
        fireEvent.click(submitButton);

        // Should show validation errors
        await waitFor(() => {
            expect(screen.queryByText(/obrigatório/i) || screen.queryByText(/required/i)).toBeTruthy();
        });
    });
});







