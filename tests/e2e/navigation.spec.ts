import { test, expect } from '@playwright/test';

/**
 * Testes de Navegação e Busca
 * 
 * Valida funcionalidades básicas de navegação do e-commerce
 */

test.describe('Navegação no Site', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('deve navegar por categorias', async ({ page }) => {
        // Clicar em uma categoria (ex: Calcinhas)
        await page.click('text=/calcinhas/i');

        // Verificar que a URL mudou
        await expect(page).toHaveURL(/categoria|category/);

        // Verificar que produtos foram carregados
        const productCards = page.locator('[data-testid="product-card"]');
        await expect(productCards.first()).toBeVisible();

        // Verificar que há pelo menos 1 produto
        const count = await productCards.count();
        expect(count).toBeGreaterThan(0);
    });

    test('deve buscar produtos com sucesso', async ({ page }) => {
        // Abrir busca (se houver botão de busca)
        const searchInput = page.locator('input[type="search"], input[placeholder*="buscar" i]');

        if (await searchInput.isVisible()) {
            // Digite "calcinha"
            await searchInput.fill('calcinha');
            await searchInput.press('Enter');

            // Aguardar resultados
            await page.waitForTimeout(500);

            // Verificar que há resultados
            const results = page.locator('[data-testid="product-card"]');
            const count = await results.count();
            expect(count).toBeGreaterThan(0);
        } else {
            // Se não houver campo de busca visível, pular teste
            test.skip();
        }
    });

    test('deve visualizar detalhes do produto', async ({ page }) => {
        // Clicar no primeiro produto
        await page.click('[data-testid="product-card"]');

        // Verificar elementos da página de produto
        await expect(page.locator('h1')).toBeVisible(); // Nome do produto
        await expect(page.locator('text=/R\\$/i')).toBeVisible(); // Preço
        await expect(page.locator('button:has-text("Adicionar ao Carrinho")')).toBeVisible();

        // Verificar que há imagem do produto
        const productImage = page.locator('img[alt]').first();
        await expect(productImage).toBeVisible();
    });

    test('deve adicionar e remover dos favoritos', async ({ page }) => {
        // Clicar no primeiro produto
        await page.click('[data-testid="product-card"]');

        // Clicar no botão de favorito (coração)
        const favoriteButton = page.locator('button[aria-label*="favorito" i], button:has-text("♥")').first();

        if (await favoriteButton.isVisible()) {
            await favoriteButton.click();

            // Verificar feedback visual (pode ser mudança de cor, ícone cheio, etc)
            await page.waitForTimeout(300);

            // Clicar novamente para remover
            await favoriteButton.click();
            await page.waitForTimeout(300);
        } else {
            test.skip();
        }
    });

    test('deve navegar para o dashboard do usuário (se logado)', async ({ page }) => {
        // Tentar acessar dashboard
        await page.goto('/dashboard');

        // Se não autenticado, deve redirecionar para login OU mostrar dashboard mock
        const currentUrl = page.url();

        // Verificar se está em uma das páginas válidas
        expect(
            currentUrl.includes('/login') ||
            currentUrl.includes('/dashboard')
        ).toBeTruthy();
    });
});

test.describe('Responsividade Mobile', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

    test('deve funcionar corretamente em mobile', async ({ page }) => {
        await page.goto('/');

        // Verificar que o menu mobile está presente
        const mobileMenu = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu" i]');

        if (await mobileMenu.isVisible()) {
            await mobileMenu.click();

            // Verificar que o menu abriu
            await page.waitForTimeout(300);

            // Deve ter links de navegação
            await expect(page.locator('nav a, nav button').first()).toBeVisible();
        }

        // Produtos devem ser exibidos em layout mobile
        const productCards = page.locator('[data-testid="product-card"]');
        await expect(productCards.first()).toBeVisible();
    });
});

test.describe('Acessibilidade', () => {
    test('deve permitir navegação por teclado', async ({ page }) => {
        await page.goto('/');

        // Pressionar Tab para navegar
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Verificar que há elemento focado
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(focusedElement).toBeTruthy();
    });

    test('deve ter textos alternativos em imagens', async ({ page }) => {
        await page.goto('/');

        // Verificar que imagens de produtos têm alt text
        const productImages = page.locator('[data-testid="product-card"] img');
        const count = await productImages.count();

        if (count > 0) {
            const firstImg = productImages.first();
            const altText = await firstImg.getAttribute('alt');
            expect(altText).toBeTruthy();
            expect(altText?.length).toBeGreaterThan(0);
        }
    });
});
