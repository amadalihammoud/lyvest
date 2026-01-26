// src/context/__tests__/I18nContext.test.jsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { I18nProvider, useI18n } from '../I18nContext';

// Test component to access context
function TestComponent() {
    const { t, locale, setLocale, formatCurrency, isRTL, getProductData } = useI18n();
    return (
        <div>
            <span data-testid="locale">{locale}</span>
            <span data-testid="translation">{t('nav.home')}</span>
            <span data-testid="currency">{formatCurrency(100)}</span>
            <span data-testid="rtl">{isRTL ? 'rtl' : 'ltr'}</span>
            <span data-testid="product">{getProductData(1, 'name')}</span>
            <button onClick={() => setLocale('en-US')}>Change to EN</button>
            <button onClick={() => setLocale('ar-SA')}>Change to AR</button>
        </div>
    );
}

describe('I18nContext', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    it('provides default locale (pt-BR)', () => {
        render(
            <I18nProvider>
                <TestComponent />
            </I18nProvider>
        );

        expect(screen.getByTestId('locale').textContent).toBe('pt-BR');
    });

    it('translates keys correctly for pt-BR', () => {
        render(
            <I18nProvider>
                <TestComponent />
            </I18nProvider>
        );

        expect(screen.getByTestId('translation').textContent).toBe('Início');
    });

    it('formats currency correctly for pt-BR (BRL)', () => {
        render(
            <I18nProvider>
                <TestComponent />
            </I18nProvider>
        );

        const currencyText = screen.getByTestId('currency').textContent;
        expect(currencyText).toContain('R$');
        expect(currencyText).toContain('100');
    });

    it('detects LTR for pt-BR', () => {
        render(
            <I18nProvider>
                <TestComponent />
            </I18nProvider>
        );

        expect(screen.getByTestId('rtl').textContent).toBe('ltr');
    });

    it('changes locale when setLocale is called', async () => {
        render(
            <I18nProvider>
                <TestComponent />
            </I18nProvider>
        );

        const changeButton = screen.getByText('Change to EN');
        await act(() => {
            changeButton.click();
        });

        expect(screen.getByTestId('locale').textContent).toBe('en-US');
        expect(screen.getByTestId('translation').textContent).toBe('Home');
    });

    it('detects RTL for Arabic locale', async () => {
        render(
            <I18nProvider>
                <TestComponent />
            </I18nProvider>
        );

        const changeButton = screen.getByText('Change to AR');
        await act(() => {
            changeButton.click();
        });

        expect(screen.getByTestId('rtl').textContent).toBe('rtl');
    });

    it('returns translated product data', () => {
        render(
            <I18nProvider>
                <TestComponent />
            </I18nProvider>
        );

        const productName = screen.getByTestId('product').textContent;
        expect(productName).toBeTruthy();
        expect(productName.length).toBeGreaterThan(0);
    });

    it('returns key when translation is missing', () => {
        function MissingKeyTest() {
            const { t } = useI18n();
            return <span data-testid="missing">{t('non.existent.key')}</span>;
        }

        render(
            <I18nProvider>
                <MissingKeyTest />
            </I18nProvider>
        );

        expect(screen.getByTestId('missing').textContent).toBe('non.existent.key');
    });

    it('persists locale to localStorage', async () => {
        render(
            <I18nProvider>
                <TestComponent />
            </I18nProvider>
        );

        const changeButton = screen.getByText('Change to EN');
        await act(() => {
            changeButton.click();
        });

        expect(localStorage.getItem('tutti_nino_locale')).toBe('en-US');
    });

    it('loads locale from localStorage on mount', () => {
        localStorage.setItem('tutti_nino_locale', 'es-ES');

        render(
            <I18nProvider>
                <TestComponent />
            </I18nProvider>
        );

        expect(screen.getByTestId('locale').textContent).toBe('es-ES');
    });
});







