// src/components/__tests__/CookieBanner.test.jsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CookieBanner from '../CookieBanner';
import { I18nProvider } from '../../context/I18nContext';
import { ModalProvider } from '../../context/ModalContext';

const renderCookieBanner = () => {
    return render(
        <I18nProvider>
            <ModalProvider>
                <CookieBanner />
            </ModalProvider>
        </I18nProvider>
    );
};

describe('CookieBanner', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('renders cookie banner when no consent is stored', () => {
        renderCookieBanner();
        expect(screen.getByText(/cookies/i)).toBeInTheDocument();
    });

    it('does not render when consent is already given', () => {
        localStorage.setItem('cookie_consent', 'accepted');
        renderCookieBanner();
        expect(screen.queryByText(/cookies/i)).not.toBeInTheDocument();
    });

    it('renders accept button', () => {
        renderCookieBanner();
        expect(screen.getByText(/Aceitar Todos/i)).toBeInTheDocument();
    });

    it('renders reject button', () => {
        renderCookieBanner();
        expect(screen.getByText(/Recusar/i)).toBeInTheDocument();
    });

    it('hides banner when accept is clicked', () => {
        renderCookieBanner();

        const acceptButton = screen.getByText(/Aceitar Todos/i);
        fireEvent.click(acceptButton);

        expect(screen.queryByText(/Aceitar Todos/i)).not.toBeInTheDocument();
    });

    it('saves consent to localStorage when accepted', () => {
        renderCookieBanner();

        const acceptButton = screen.getByText(/Aceitar Todos/i);
        fireEvent.click(acceptButton);

        expect(localStorage.getItem('cookie_consent')).toBe('accepted');
    });

    it('hides banner when reject is clicked', () => {
        renderCookieBanner();

        const rejectButton = screen.getByText(/Recusar/i);
        fireEvent.click(rejectButton);

        expect(screen.queryByText(/Recusar/i)).not.toBeInTheDocument();
    });

    it('saves rejection to localStorage', () => {
        renderCookieBanner();

        const rejectButton = screen.getByText(/Recusar/i);
        fireEvent.click(rejectButton);

        expect(localStorage.getItem('cookie_consent')).toBe('rejected');
    });

    it('renders privacy policy link', () => {
        renderCookieBanner();
        expect(screen.getByText(/Política de Privacidade/i)).toBeInTheDocument();
    });
});







