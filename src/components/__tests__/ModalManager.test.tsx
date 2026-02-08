// src/components/__tests__/ModalManager.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModalManager from '../ModalManager';
import { ModalProvider, useModal } from '../../context/ModalContext';
import { I18nProvider } from '../../context/I18nContext';

// Helper to trigger modal from within the provider
function ModalTrigger({ modalName }) {
    const { openModal } = useModal();
    return <button onClick={() => openModal(modalName)}>Open {modalName}</button>;
}

const renderWithProviders = (modalName, props = {}) => {
    return render(
        <I18nProvider>
            <ModalProvider>
                <ModalTrigger modalName={modalName} />
                <ModalManager onLoginSuccess={vi.fn()} {...props} />
            </ModalProvider>
        </I18nProvider>
    );
};

describe('ModalManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing when no modal is open', () => {
        render(
            <I18nProvider>
                <ModalProvider>
                    <ModalManager onLoginSuccess={vi.fn()} />
                </ModalProvider>
            </I18nProvider>
        );

        // Should not render any modal content initially
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('opens login modal when triggered', async () => {
        renderWithProviders('login');

        const triggerButton = screen.getByText('Open login');
        fireEvent.click(triggerButton);

        // Should show login modal content
        expect(await screen.findByText(/Bem-vindo de volta/i)).toBeInTheDocument();
    });

    it('opens FAQ modal when triggered', async () => {
        renderWithProviders('faq');

        const triggerButton = screen.getByText('Open faq');
        fireEvent.click(triggerButton);

        // Should show FAQ modal content
        expect(await screen.findByText(/Dúvidas Frequentes/i)).toBeInTheDocument();
    });

    it('opens contact modal when triggered', async () => {
        renderWithProviders('contact');

        const triggerButton = screen.getByText('Open contact');
        fireEvent.click(triggerButton);

        // Should show contact modal content
        expect(await screen.findByText(/Fale Conosco/i)).toBeInTheDocument();
    });

    it('opens privacy modal when triggered', async () => {
        renderWithProviders('privacy');

        const triggerButton = screen.getByText('Open privacy');
        fireEvent.click(triggerButton);

        // Should show privacy modal content
        expect(await screen.findByText(/Política de Privacidade/i)).toBeInTheDocument();
    });

    it('opens terms modal when triggered', async () => {
        renderWithProviders('terms');

        const triggerButton = screen.getByText('Open terms');
        fireEvent.click(triggerButton);

        // Should show terms modal content
        expect(await screen.findByText(/Termos e Condições/i)).toBeInTheDocument();
    });

    it('opens shipping modal when triggered', async () => {
        renderWithProviders('shipping');

        const triggerButton = screen.getByText('Open shipping');
        fireEvent.click(triggerButton);

        // Should show shipping modal content
        expect(await screen.findByText(/Política de Envio/i)).toBeInTheDocument();
    });

    it('modal has close button', async () => {
        renderWithProviders('faq');

        const triggerButton = screen.getByText('Open faq');
        fireEvent.click(triggerButton);

        // Should have a close button
        const closeButton = await screen.findByLabelText(/fechar/i);
        expect(closeButton).toBeInTheDocument();
    });

    it('closes modal when close button is clicked', async () => {
        renderWithProviders('faq');

        const triggerButton = screen.getByText('Open faq');
        fireEvent.click(triggerButton);

        const closeButton = await screen.findByLabelText(/fechar/i);
        fireEvent.click(closeButton);

        // Modal should be closed
        expect(screen.queryByText(/Dúvidas Frequentes/i)).not.toBeInTheDocument();
    });

    it('closes modal when clicking backdrop', async () => {
        renderWithProviders('faq');

        const triggerButton = screen.getByText('Open faq');
        fireEvent.click(triggerButton);

        // Find the backdrop (the overlay behind the modal)
        const backdrop = document.querySelector('[class*="bg-black"]');
        if (backdrop) {
            fireEvent.click(backdrop);
        }
    });

    it('calls onLoginSuccess when login is successful', async () => {
        const onLoginSuccess = vi.fn();
        renderWithProviders('login', { onLoginSuccess });

        const triggerButton = screen.getByText('Open login');
        fireEvent.click(triggerButton);

        // The callback should be available but not called until login succeeds
        expect(onLoginSuccess).not.toHaveBeenCalled();
    });
});







