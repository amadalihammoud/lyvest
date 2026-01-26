// src/pages/__tests__/NotFoundPage.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotFoundPage from '../NotFoundPage';
import { I18nProvider } from '../../context/I18nContext';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const renderNotFoundPage = () => {
    return render(
        <BrowserRouter>
            <I18nProvider>
                <NotFoundPage />
            </I18nProvider>
        </BrowserRouter>
    );
};

describe('NotFoundPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders 404 title', () => {
        renderNotFoundPage();
        expect(screen.getByText(/404/)).toBeInTheDocument();
    });

    it('renders page not found message', () => {
        renderNotFoundPage();
        expect(screen.getByText(/Página não encontrada/i)).toBeInTheDocument();
    });

    it('renders description text', () => {
        renderNotFoundPage();
        expect(screen.getByText(/não existe ou foi movida/i)).toBeInTheDocument();
    });

    it('renders go home button', () => {
        renderNotFoundPage();
        expect(screen.getByText(/Voltar ao Início/i)).toBeInTheDocument();
    });

    it('renders go back button', () => {
        renderNotFoundPage();
        expect(screen.getByText(/Voltar/i)).toBeInTheDocument();
    });

    it('navigates to home when clicking go home button', () => {
        renderNotFoundPage();

        const homeButton = screen.getByText(/Voltar ao Início/i);
        fireEvent.click(homeButton);

        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('navigates back when clicking back button', () => {
        renderNotFoundPage();

        const backButton = screen.getByText(/Voltar/i);
        fireEvent.click(backButton);

        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
});







