// src/components/__tests__/DrawerFavorites.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DrawerFavorites from '../DrawerFavorites';
import { FavoritesProvider } from '../../context/FavoritesContext';
import { I18nProvider } from '../../context/I18nContext';

const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
};

const renderDrawerFavorites = (props = {}) => {
    return render(
        <BrowserRouter>
            <I18nProvider>
                <FavoritesProvider>
                    <DrawerFavorites {...defaultProps} {...props} />
                </FavoritesProvider>
            </I18nProvider>
        </BrowserRouter>
    );
};

describe('DrawerFavorites', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('renders drawer when open', () => {
        renderDrawerFavorites({ isOpen: true });
        expect(screen.getByText(/Meus Favoritos/i)).toBeInTheDocument();
    });

    it('does not render content when closed', () => {
        renderDrawerFavorites({ isOpen: false });
        const drawer = screen.queryByText(/Meus Favoritos/i);
        expect(drawer).not.toBeInTheDocument();
    });

    it('shows empty favorites message when no items', () => {
        renderDrawerFavorites({ isOpen: true });
        expect(screen.getByText(/Nenhum favorito ainda/i)).toBeInTheDocument();
    });

    it('renders close button', () => {
        renderDrawerFavorites({ isOpen: true });
        const closeButton = screen.getByLabelText(/fechar/i);
        expect(closeButton).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();
        renderDrawerFavorites({ isOpen: true, onClose });

        const closeButton = screen.getByLabelText(/fechar/i);
        fireEvent.click(closeButton);

        expect(onClose).toHaveBeenCalled();
    });

    it('shows heart emoji tip when empty', () => {
        renderDrawerFavorites({ isOpen: true });
        expect(screen.getByText(/❤️/)).toBeInTheDocument();
    });
});







