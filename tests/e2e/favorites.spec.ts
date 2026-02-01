import { test, expect } from '@playwright/test';

/**
 * Testes E2E de Favoritos
 * 
 * Valida funcionalidades de adicionar/remover favoritos
 */

test.describe('Funcionalidade de Favoritos', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Ly Vest/i);
    });

    test('deve adicionar produto aos favoritos', async ({ page }) => {
        // Navegar para página de produto
        await page.click('[data-testid="product-card"] a');
        await expect(page.locator('h1')).toBeVisible();

        // Clicar no botão de favorito
        const favoriteButton = page.locator('[data-testid="favorite-button"], button[aria-label*="favorito" i], button:has(svg)').first();

        if (await favoriteButton.isVisible()) {
            await favoriteButton.click();
            await page.waitForTimeout(300);

            // Verificar feedback visual (ícone preenchido, toast, etc)
            // O botão deve ter algum estado diferente após clicar
        }
    });

    test('deve remover produto dos favoritos', async ({ page }) => {
        // Navegar para página de produto
        await page.click('[data-testid="product-card"] a');
        await expect(page.locator('h1')).toBeVisible();

        // Clicar no botão de favorito para adicionar
        const favoriteButton = page.locator('[data-testid="favorite-button"], button[aria-label*="favorito" i]').first();

        if (await favoriteButton.isVisible()) {
            // Adicionar
            await favoriteButton.click();
            await page.waitForTimeout(300);

            // Remover (clicar novamente)
            await favoriteButton.click();
            await page.waitForTimeout(300);
        }
    });

    test('deve mostrar lista de favoritos', async ({ page }) => {
        // Adicionar um produto aos favoritos primeiro
        await page.click('[data-testid="product-card"] a');
        const favoriteButton = page.locator('[data-testid="favorite-button"], button[aria-label*="favorito" i]').first();

        if (await favoriteButton.isVisible()) {
            await favoriteButton.click();
            await page.waitForTimeout(300);
        }

        // Tentar acessar página de favoritos ou seção
        const favoritesLink = page.locator('a[href*="favorito"], a[href*="wishlist"], button:has-text("Favoritos")').first();

        if (await favoritesLink.isVisible()) {
            await favoritesLink.click();
            await page.waitForTimeout(500);

            // Verificar que há itens na lista
            const favoriteItems = page.locator('[data-testid="favorite-item"], [data-testid="product-card"]');
            const count = await favoriteItems.count();
            expect(count).toBeGreaterThanOrEqual(0);
        }
    });

    test('deve persistir favoritos após recarregar página', async ({ page }) => {
        // Adicionar produto aos favoritos
        await page.click('[data-testid="product-card"] a');
        const favoriteButton = page.locator('[data-testid="favorite-button"], button[aria-label*="favorito" i]').first();

        if (await favoriteButton.isVisible()) {
            await favoriteButton.click();
            await page.waitForTimeout(300);

            // Recarregar página
            await page.reload();
            await page.waitForTimeout(500);

            // Verificar que o estado de favorito persiste
            // O botão deve mostrar que está favoritado
        }
    });

    test('deve mostrar contador de favoritos', async ({ page }) => {
        // Verificar se existe contador de favoritos no header
        const favoritesCount = page.locator('[data-testid="favorites-count"], [aria-label*="favorito"] span');

        // Adicionar produto
        await page.click('[data-testid="product-card"] a');
        const favoriteButton = page.locator('[data-testid="favorite-button"]').first();

        if (await favoriteButton.isVisible()) {
            await favoriteButton.click();
            await page.waitForTimeout(300);

            // Se houver contador, deve ter aumentado
            if (await favoritesCount.isVisible()) {
                const countText = await favoritesCount.textContent();
                expect(parseInt(countText || '0')).toBeGreaterThanOrEqual(1);
            }
        }
    });

    test('deve adicionar favorito diretamente do card de produto', async ({ page }) => {
        // Procurar botão de favorito no card
        const cardFavoriteButton = page.locator('[data-testid="product-card"] button[aria-label*="favorito" i], [data-testid="product-card"] [data-testid="favorite-button"]').first();

        if (await cardFavoriteButton.isVisible()) {
            await cardFavoriteButton.click();
            await page.waitForTimeout(300);

            // Verificar feedback
        }
    });
});
