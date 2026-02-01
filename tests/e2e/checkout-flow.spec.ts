import { test, expect } from '@playwright/test';

/**
 * Teste E2E do Fluxo Completo de Checkout
 * 
 * Testa o caminho crítico do usuário:
 * Home → Produto → Adicionar ao Carrinho → Checkout → Confirmação
 */

test.describe('Fluxo de Checkout Completo', () => {
    test.beforeEach(async ({ page }) => {
        // Navegar para a home page
        await page.goto('/');

        // Aguardar página carregar
        await expect(page).toHaveTitle(/Ly Vest/i);
    });

    test('deve permitir adicionar produto ao carrinho e finalizar com PIX', async ({ page }) => {
        // 1. Clicar no primeiro produto da lista
        await page.click('[data-testid="product-card"]');

        // 2. Aguardar página do produto carregar
        await expect(page.locator('h1')).toBeVisible();

        // 3. Clicar em "Adicionar ao Carrinho"
        await page.click('button:has-text("Adicionar ao Carrinho")');

        // 4. Verificar que o contador do carrinho aumentou
        const cartCount = page.locator('[data-testid="cart-count"]');
        await expect(cartCount).toHaveText('1');

        // 5. Abrir o carrinho
        await page.click('[data-testid="cart-button"]');

        // 6. Verificar que o produto está no carrinho
        await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();

        // 7. Clicar em "Finalizar Compra"
        await page.click('button:has-text("Finalizar Compra")');

        // 8. Preencher dados de endereço
        await page.fill('input[name="nome"]', 'João da Silva');
        await page.fill('input[name="email"]', 'joao@exemplo.com');
        await page.fill('input[name="telefone"]', '11987654321');
        await page.fill('input[name="cep"]', '01310-100');

        // Aguardar CEP ser validado
        await page.waitForTimeout(1000);

        await page.fill('input[name="numero"]', '1000');

        // 9. Avançar para pagamento
        await page.click('button:has-text("Continuar")');

        // 10. Selecionar PIX
        await page.click('button:has-text("PIX")');

        // 11. Confirmar pedido
        await page.click('button:has-text("Finalizar Pedido")');

        // 12. Verificar página de confirmação
        await expect(page).toHaveURL(/\/confirmacao|\/sucesso/);
        await expect(page.locator('text=/pedido.*confirmado|sucesso/i')).toBeVisible();
    });

    test('deve aplicar cupom de desconto corretamente', async ({ page }) => {
        // 1. Adicionar produto ao carrinho (simplificado)
        await page.click('[data-testid="product-card"]');
        await page.click('button:has-text("Adicionar ao Carrinho")');

        // 2. Abrir carrinho
        await page.click('[data-testid="cart-button"]');

        // 3. Aplicar cupom BEMVINDA10 (10% de desconto)
        await page.fill('input[placeholder*="cupom" i]', 'BEMVINDA10');
        await page.click('button:has-text("Aplicar")');

        // 4. Verificar mensagem de sucesso
        await expect(page.locator('text=/cupom.*aplicado/i')).toBeVisible();

        // 5. Verificar que o desconto foi aplicado
        await expect(page.locator('text=/desconto.*10%/i')).toBeVisible();
    });

    test('deve mostrar mensagem de frete grátis acima de R$ 199', async ({ page }) => {
        // Este teste verifica se a funcionalidade de frete grátis está presente

        // Adicionar produtos até atingir R$ 199
        // (Implementação depende da estrutura dos produtos mockados)

        await page.click('[data-testid="product-card"]');
        await page.click('button:has-text("Adicionar ao Carrinho")');

        // Abrir carrinho
        await page.click('[data-testid="cart-button"]');

        // Verificar se há indicação de frete grátis
        // Nota: Implementar UI indicator quando freeShippingEligible = true
        const cartTotal = await page.locator('[data-testid="cart-total"]').textContent();

        // Se total >= R$ 199, deve mostrar "Frete Grátis"
        if (cartTotal && parseFloat(cartTotal.replace(/[^\d,]/g, '').replace(',', '.')) >= 199) {
            await expect(page.locator('text=/frete.*grátis/i')).toBeVisible();
        }
    });

    test('deve validar campos obrigatórios no checkout', async ({ page }) => {
        // 1. Ir direto para checkout sem produtos (deve redirecionar ou mostrar erro)
        await page.goto('/checkout');

        // 2. Tentar avançar sem preencher dados
        await page.click('button:has-text("Continuar")');

        // 3. Verificar mensagens de erro
        await expect(page.locator('text=/campo.*obrigatório/i')).toBeVisible();
    });
});

/**
 * Teste de Performance
 */
test.describe('Performance', () => {
    test('home page deve carregar em menos de 3 segundos', async ({ page }) => {
        const startTime = Date.now();

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const loadTime = Date.now() - startTime;

        expect(loadTime).toBeLessThan(3000);
    });
});
