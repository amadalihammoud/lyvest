// src/components/__tests__/Footer.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Footer from '../Footer';
import { I18nProvider } from '../../context/I18nContext';

const defaultProps = {
    setSelectedCategory: vi.fn(),
    setActiveDrawer: vi.fn(),
    setActiveModal: vi.fn(),
};

const renderFooter = (props = {}) => {
    return render(
        <I18nProvider>
            <Footer {...defaultProps} {...props} />
        </I18nProvider>
    );
};

describe('Footer', () => {
    it('renders logo', () => {
        renderFooter();
        const logo = screen.getByAltText('Tutti & Nino');
        expect(logo).toBeInTheDocument();
    });

    it('renders company information', () => {
        renderFooter();
        expect(screen.getByText(/Tutti & Nino Papelaria LTDA/)).toBeInTheDocument();
        expect(screen.getByText(/45.123.456\/0001-89/)).toBeInTheDocument();
        expect(screen.getByText(/contato@tuttinino.com.br/)).toBeInTheDocument();
    });

    it('renders help section links', () => {
        renderFooter();
        expect(screen.getByText(/Política de Envio/i)).toBeInTheDocument();
        expect(screen.getByText(/Trocas e Devoluções/i)).toBeInTheDocument();
        expect(screen.getByText(/Dúvidas Frequentes/i)).toBeInTheDocument();
    });

    it('opens shipping modal when clicking shipping link', () => {
        const setActiveModal = vi.fn();
        renderFooter({ setActiveModal });

        const shippingButton = screen.getByText(/Política de Envio/i);
        fireEvent.click(shippingButton);

        expect(setActiveModal).toHaveBeenCalledWith('shipping');
    });

    it('opens FAQ modal when clicking FAQ link', () => {
        const setActiveModal = vi.fn();
        renderFooter({ setActiveModal });

        const faqButton = screen.getByText(/Dúvidas Frequentes/i);
        fireEvent.click(faqButton);

        expect(setActiveModal).toHaveBeenCalledWith('faq');
    });

    it('opens privacy modal when clicking privacy link', () => {
        const setActiveModal = vi.fn();
        renderFooter({ setActiveModal });

        const privacyButton = screen.getByText(/Privacidade/i);
        fireEvent.click(privacyButton);

        expect(setActiveModal).toHaveBeenCalledWith('privacy');
    });

    it('opens contact modal when clicking contact link', () => {
        const setActiveModal = vi.fn();
        renderFooter({ setActiveModal });

        const contactButton = screen.getByText(/Contato/i);
        fireEvent.click(contactButton);

        expect(setActiveModal).toHaveBeenCalledWith('contact');
    });

    it('opens terms modal when clicking terms link', () => {
        const setActiveModal = vi.fn();
        renderFooter({ setActiveModal });

        const termsButton = screen.getByText(/Termos de Uso/i);
        fireEvent.click(termsButton);

        expect(setActiveModal).toHaveBeenCalledWith('terms');
    });

    it('renders payment method icons', () => {
        renderFooter();
        expect(screen.getByAltText('Visa')).toBeInTheDocument();
        expect(screen.getByAltText('Pix')).toBeInTheDocument();
    });

    it('renders social media links', () => {
        renderFooter();
        expect(screen.getByLabelText('Instagram')).toBeInTheDocument();
        expect(screen.getByLabelText('Facebook')).toBeInTheDocument();
        expect(screen.getByLabelText('X')).toBeInTheDocument();
    });

    it('renders copyright text', () => {
        renderFooter();
        expect(screen.getByText(/© 2026 Tutti & Nino/i)).toBeInTheDocument();
    });

    it('social links have correct attributes', () => {
        renderFooter();
        const instagramLink = screen.getByLabelText('Instagram');

        expect(instagramLink).toHaveAttribute('href', 'https://instagram.com');
        expect(instagramLink).toHaveAttribute('target', '_blank');
        expect(instagramLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
});







