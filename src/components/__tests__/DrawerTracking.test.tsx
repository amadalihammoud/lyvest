// src/components/__tests__/DrawerTracking.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DrawerTracking from '../layout/DrawerTracking';
import { I18nProvider } from '../../context/I18nContext';

const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    trackingCode: '',
    setTrackingCode: vi.fn(),
    trackingResult: null,
    setTrackingResult: vi.fn(),
};

const renderDrawerTracking = (props = {}) => {
    return render(
        <I18nProvider>
            <DrawerTracking {...defaultProps} {...props} />
        </I18nProvider>
    );
};

describe('DrawerTracking', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders drawer when open', () => {
        renderDrawerTracking({ isOpen: true });
        expect(screen.getByText(/Rastrear Pedido/i)).toBeInTheDocument();
    });

    it('does not render content when closed', () => {
        renderDrawerTracking({ isOpen: false });
        const drawer = screen.queryByText(/Rastrear Pedido/i);
        expect(drawer).not.toBeInTheDocument();
    });

    it('renders tracking code input', () => {
        renderDrawerTracking({ isOpen: true });
        const input = screen.getByPlaceholderText(/código/i);
        expect(input).toBeInTheDocument();
    });

    it('renders search button', () => {
        renderDrawerTracking({ isOpen: true });
        expect(screen.getByText(/Rastrear/i)).toBeInTheDocument();
    });

    it('calls setTrackingCode when typing', () => {
        const setTrackingCode = vi.fn();
        renderDrawerTracking({ isOpen: true, setTrackingCode });

        const input = screen.getByPlaceholderText(/código/i);
        fireEvent.change(input, { target: { value: 'ABC123' } });

        expect(setTrackingCode).toHaveBeenCalledWith('ABC123');
    });

    it('displays tracking result when provided', () => {
        const mockResult = {
            status: 'Em Trânsito',
            steps: [
                { date: '2026-01-10', description: 'Pedido recebido' },
                { date: '2026-01-12', description: 'Em transporte' },
            ]
        };

        renderDrawerTracking({
            isOpen: true,
            trackingResult: mockResult,
            trackingCode: 'ABC123'
        });

        expect(screen.getByText(/Em Trânsito/i)).toBeInTheDocument();
    });

    it('renders close button', () => {
        renderDrawerTracking({ isOpen: true });
        const closeButton = screen.getByLabelText(/fechar/i);
        expect(closeButton).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();
        renderDrawerTracking({ isOpen: true, onClose });

        const closeButton = screen.getByLabelText(/fechar/i);
        fireEvent.click(closeButton);

        expect(onClose).toHaveBeenCalled();
    });
});







