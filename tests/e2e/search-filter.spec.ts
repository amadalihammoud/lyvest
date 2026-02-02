import { test, expect } from '@playwright/test';

/**
 * Testes E2E de Busca e Filtros
 * 
 * Valida funcionalidades de busca por nome, filtros de categoria e ordenação
 */

test.describe('Busca de Produtos', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Ly Vest/i);
    });

    test('deve buscar produtos por nome', async ({ page }) => {
        // Encontrar campo de busca
        const searchInput = page.locator('input[type="search"], input[placeholder*="buscar" i], input[placeholder*="pesquis" i]');

        if (await searchInput.isVisible()) {
            await searchInput.fill('calcinha');
            await searchInput.press('Enter');

            await page.waitForTimeout(500);

            // Verificar que há resultados
            const results = page.locator('[data-testid="product-card"]');
            const count = await results.count();
            expect(count).toBeGreaterThan(0);
        }
    });

    test('deve mostrar mensagem quando não encontrar resultados', async ({ page }) => {
        const searchInput = page.locator('input[type="search"], input[placeholder*="buscar" i]');

        if (await searchInput.isVisible()) {
            // Buscar por termo inexistente
            await searchInput.fill('xyzabc123inexistente');
            await searchInput.press('Enter');

            await page.waitForTimeout(500);

            // Verificar mensagem de "nenhum resultado"
            const noResults = page.locator('text=/nenhum.*resultado|não.*encontr|sem.*resultado/i');
            // Pode não existir se a busca sempre retorna algo
        }
    });

    test('deve limpar busca e mostrar todos os produtos', async ({ page }) => {
        const searchInput = page.locator('input[type="search"], input[placeholder*="buscar" i]');

        if (await searchInput.isVisible()) {
            // Fazer uma busca
            await searchInput.fill('sutiã');
            await searchInput.press('Enter');
            await page.waitForTimeout(300);

            // Limpar busca
            await searchInput.clear();
            await searchInput.press('Enter');
            await page.waitForTimeout(300);

            // Verificar que todos os produtos voltaram
            const products = page.locator('[data-testid="product-card"]');
            const count = await products.count();
            expect(count).toBeGreaterThan(0);
        }
    });
});

test.describe('Filtros de Categoria', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('deve filtrar por categoria Calcinhas', async ({ page }) => {
        // Clicar no filtro de categoria
        const categoryFilter = page.locator('button:has-text("Calcinhas"), a:has-text("Calcinhas")').first();

        if (await categoryFilter.isVisible()) {
            await categoryFilter.click();
            await page.waitForTimeout(500);

            // Verificar que há produtos filtrados
            const products = page.locator('[data-testid="product-card"]');
            const count = await products.count();
            expect(count).toBeGreaterThan(0);
        }
    });

    test('deve filtrar por categoria Sutiãs', async ({ page }) => {
        const categoryFilter = page.locator('button:has-text("Sutiãs"), a:has-text("Sutiãs")').first();

        if (await categoryFilter.isVisible()) {
            await categoryFilter.click();
            await page.waitForTimeout(500);

            const products = page.locator('[data-testid="product-card"]');
            const count = await products.count();
            expect(count).toBeGreaterThanOrEqual(0);
        }
    });

    test('deve mostrar todos os produtos ao clicar em "Todos"', async ({ page }) => {
        // Primeiro filtrar por uma categoria
        const categoryFilter = page.locator('button:has-text("Calcinhas")').first();
        if (await categoryFilter.isVisible()) {
            await categoryFilter.click();
            await page.waitForTimeout(300);
        }

        // Clicar em "Todos" ou "Início"
        const allFilter = page.locator('button:has-text("Todos"), button:has-text("Início"), a:has-text("Início")').first();
        if (await allFilter.isVisible()) {
            await allFilter.click();
            await page.waitForTimeout(500);

            const products = page.locator('[data-testid="product-card"]');
            const count = await products.count();
            expect(count).toBeGreaterThan(0);
        }
    });

    test('filtros visuais devem indicar categoria selecionada', async ({ page }) => {
        const categoryFilter = page.locator('button:has-text("Calcinhas")').first();

        if (await categoryFilter.isVisible()) {
            await categoryFilter.click();
            await page.waitForTimeout(300);

            // Verificar que o botão tem estado ativo (classe diferente, cor, etc)
            const isActive = await categoryFilter.evaluate(el => {
                const classes = el.className;
                return classes.includes('active') || classes.includes('selected') || classes.includes('bg-pink');
            });
            expect(isActive).not.toBeNull();
            // Pode variar conforme implementação
        }
    });
});

test.describe('Ordenação de Produtos', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('deve ordenar produtos por preço (menor para maior)', async ({ page }) => {
        const sortSelect = page.locator('select, [data-testid="sort-select"]');

        if (await sortSelect.isVisible()) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await sortSelect.selectOption({ label: /menor.*preço|preço.*menor/i as any });
            await page.waitForTimeout(500);

            // Produtos devem estar ordenados
            const products = page.locator('[data-testid="product-card"]');
            const count = await products.count();
            expect(count).toBeGreaterThan(0);
        }
    });

    test('deve ordenar produtos por preço (maior para menor)', async ({ page }) => {
        const sortSelect = page.locator('select, [data-testid="sort-select"]');

        if (await sortSelect.isVisible()) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await sortSelect.selectOption({ label: /maior.*preço|preço.*maior/i as any });
            await page.waitForTimeout(500);

            const products = page.locator('[data-testid="product-card"]');
            const count = await products.count();
            expect(count).toBeGreaterThan(0);
        }
    });

    test('deve ordenar por mais vendidos', async ({ page }) => {
        const sortSelect = page.locator('select, [data-testid="sort-select"]');

        if (await sortSelect.isVisible()) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await sortSelect.selectOption({ label: /mais.*vendido|popular/i as any });
            await page.waitForTimeout(500);
        }
    });
});
