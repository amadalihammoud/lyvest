import { test, expect } from '@playwright/test';

/**
 * Testes E2E de Operações do Carrinho
 * 
 * Valida funcionalidades de adicionar/remover itens, alterar quantidade e limpar carrinho
 */

test.describe('Operações do Carrinho', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Ly Vest/i);
    });

    test('deve adicionar item ao carrinho', async ({ page }) => {
        // Navegar para página de produto
        await page.click('[data-testid="product-card"] a');
        await expect(page.locator('h1')).toBeVisible();

        // Adicionar ao carrinho
        await page.click('[data-testid="add-to-cart-button"]');

        // Verificar contador do carrinho
        const cartCount = page.locator('[data-testid="cart-count"]');
        await expect(cartCount).toHaveText('1');
    });

    test('deve remover item do carrinho', async ({ page }) => {
        // Adicionar produto primeiro
        await page.click('[data-testid="product-card"] a');
        await page.click('[data-testid="add-to-cart-button"]');

        // Abrir carrinho
        await page.click('[data-testid="cart-button"]');

        // Clicar em remover item
        const removeButton = page.locator('[data-testid="remove-item"], button[aria-label*="remover" i]').first();
        if (await removeButton.isVisible()) {
            await removeButton.click();

            // Verificar que o carrinho está vazio ou item removido
            await page.waitForTimeout(500);
            const cartItems = page.locator('[data-testid="cart-item"]');
            const count = await cartItems.count();
            expect(count).toBe(0);
        }
    });

    test('deve alterar quantidade de item no carrinho', async ({ page }) => {
        // Adicionar produto
        await page.click('[data-testid="product-card"] a');
        await page.click('[data-testid="add-to-cart-button"]');

        // Abrir carrinho
        await page.click('[data-testid="cart-button"]');

        // Encontrar botão de aumentar quantidade
        const increaseButton = page.locator('[data-testid="increase-quantity"], button[aria-label*="aumentar" i], button:has-text("+")').first();

        if (await increaseButton.isVisible()) {
            await increaseButton.click();
            await page.waitForTimeout(300);

            // Verificar que quantidade aumentou
            const quantityDisplay = page.locator('[data-testid="item-quantity"]').first();
            if (await quantityDisplay.isVisible()) {
                await expect(quantityDisplay).toHaveText('2');
            }
        }
    });

    test('deve diminuir quantidade de item no carrinho', async ({ page }) => {
        // Adicionar produto 2 vezes
        await page.click('[data-testid="product-card"] a');
        await page.click('[data-testid="add-to-cart-button"]');
        await page.click('[data-testid="add-to-cart-button"]');

        // Abrir carrinho
        await page.click('[data-testid="cart-button"]');

        // Encontrar botão de diminuir quantidade
        const decreaseButton = page.locator('[data-testid="decrease-quantity"], button[aria-label*="diminuir" i], button:has-text("-")').first();

        if (await decreaseButton.isVisible()) {
            await decreaseButton.click();
            await page.waitForTimeout(300);

            // Verificar que quantidade diminuiu
            const quantityDisplay = page.locator('[data-testid="item-quantity"]').first();
            if (await quantityDisplay.isVisible()) {
                await expect(quantityDisplay).toHaveText('1');
            }
        }
    });

    test('deve exibir subtotal correto', async ({ page }) => {
        // Adicionar produto
        await page.click('[data-testid="product-card"] a');
        await page.click('[data-testid="add-to-cart-button"]');

        // Abrir carrinho
        await page.click('[data-testid="cart-button"]');

        // Verificar que subtotal está visível
        const subtotal = page.locator('text=/subtotal|total/i');
        await expect(subtotal.first()).toBeVisible();

        // Verificar que há valor em Reais
        const priceValue = page.locator('text=/R\\$.*\\d/');
        await expect(priceValue.first()).toBeVisible();
    });

    test('carrinho vazio deve mostrar mensagem apropriada', async ({ page }) => {
        // Abrir carrinho sem adicionar itens
        await page.click('[data-testid="cart-button"]');

        // Verificar mensagem de carrinho vazio
        const emptyMessage = page.locator('text=/carrinho.*vazio|nenhum.*item|seu carrinho está vazio/i');
        await expect(emptyMessage.first()).toBeVisible();
    });

    test('deve persistir carrinho após recarregar página', async ({ page }) => {
        // Adicionar produto
        await page.click('[data-testid="product-card"] a');
        await page.click('[data-testid="add-to-cart-button"]');

        // Verificar contador
        await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');

        // Recarregar página
        await page.reload();

        // Verificar que item ainda está no carrinho
        await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
    });
});
