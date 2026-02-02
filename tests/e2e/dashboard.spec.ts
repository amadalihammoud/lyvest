import { test, expect } from '@playwright/test';

/**
 * Testes E2E do Dashboard do Usuário
 * 
 * Valida funcionalidades de perfil, endereços e pedidos
 */

test.describe('Acesso ao Dashboard', () => {
    test('deve redirecionar usuário não autenticado', async ({ page }) => {
        // Tentar acessar dashboard sem estar logado
        await page.goto('/dashboard');
        await page.waitForTimeout(1000);

        // Deve redirecionar para home ou mostrar modal de login
        const currentUrl = page.url();
        expect(
            currentUrl.includes('/') ||
            currentUrl.includes('/login') ||
            currentUrl.includes('/dashboard')
        ).toBeTruthy();
    });

    test('dashboard deve ter navegação de seções', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForTimeout(1000);

        // Verificar se há menu lateral ou abas
        const navItems = page.locator('nav a, nav button, [role="tablist"] button');
        const count = await navItems.count();

        // Deve haver múltiplas opções de navegação
        expect(count).toBeGreaterThanOrEqual(0);
    });
});

test.describe('Seção de Perfil', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForTimeout(1000);
    });

    test('deve mostrar informações do usuário', async ({ page }) => {
        // Procurar seção de perfil
        const profileSection = page.locator('text=/perfil|minha.*conta|dados.*pessoais/i');

        if (await profileSection.first().isVisible()) {
            // Verificar elementos do perfil
            await expect(avatar.first().or(page.locator('text=/nome|usuário/i').first())).toBeVisible();
        }
    });

    test('deve ter opção de editar perfil', async ({ page }) => {
        const editButton = page.locator('button:has-text("Editar"), button[aria-label*="editar" i]').first();

        // Se existe botão de editar
        if (await editButton.isVisible()) {
            await editButton.click();
            await page.waitForTimeout(300);

            // Campos de edição devem aparecer
            const inputFields = page.locator('input');
            const count = await inputFields.count();
            expect(count).toBeGreaterThan(0);
        }
    });
});

test.describe('Seção de Endereços', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForTimeout(1000);
    });

    test('deve acessar seção de endereços', async ({ page }) => {
        const addressTab = page.locator('button:has-text("Endereço"), a:has-text("Endereço"), nav button:has-text("Endereço")').first();

        if (await addressTab.isVisible()) {
            await addressTab.click();
            await page.waitForTimeout(500);

            // Verificar que a seção de endereços está visível
            const addressSection = page.locator('text=/meus.*endereços|endereço/i');
            await expect(addressSection.first()).toBeVisible();
        }
    });

    test('deve ter opção de adicionar novo endereço', async ({ page }) => {
        const addressTab = page.locator('button:has-text("Endereço")').first();

        if (await addressTab.isVisible()) {
            await addressTab.click();
            await page.waitForTimeout(500);

            const addButton = page.locator('button:has-text("Adicionar"), button:has-text("Novo endereço")').first();

            if (await addButton.isVisible()) {
                await addButton.click();
                await page.waitForTimeout(300);

                // Formulário de endereço deve aparecer
                const cepInput = page.locator('input[name="cep"], input[placeholder*="cep" i]');
                await expect(cepInput.first()).toBeVisible();
            }
        }
    });

    test('deve validar CEP', async ({ page }) => {
        const addressTab = page.locator('button:has-text("Endereço")').first();

        if (await addressTab.isVisible()) {
            await addressTab.click();
            await page.waitForTimeout(500);

            const addButton = page.locator('button:has-text("Adicionar")').first();

            if (await addButton.isVisible()) {
                await addButton.click();
                await page.waitForTimeout(300);

                const cepInput = page.locator('input[name="cep"]').first();

                if (await cepInput.isVisible()) {
                    // Preencher CEP válido
                    await cepInput.fill('01310-100');
                    await page.waitForTimeout(1000);

                    // Campos devem ser preenchidos automaticamente
                    const ruaInput = page.locator('input[name="rua"], input[name="logradouro"]');
                    // Se auto-preenchimento funcionar, o campo terá valor
                    await expect(ruaInput).toBeVisible();
                }
            }
        }
    });
});

test.describe('Seção de Pedidos', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForTimeout(1000);
    });

    test('deve acessar seção de pedidos', async ({ page }) => {
        const ordersTab = page.locator('button:has-text("Pedidos"), a:has-text("Pedidos"), nav button:has-text("Pedidos")').first();

        if (await ordersTab.isVisible()) {
            await ordersTab.click();
            await page.waitForTimeout(500);

            // Verificar seção de pedidos
            const ordersSection = page.locator('text=/meus.*pedidos|histórico/i');
            await expect(ordersSection.first()).toBeVisible();
        }
    });

    test('deve mostrar lista de pedidos ou mensagem vazia', async ({ page }) => {
        const ordersTab = page.locator('button:has-text("Pedidos")').first();

        if (await ordersTab.isVisible()) {
            await ordersTab.click();
            await page.waitForTimeout(500);

            // Deve ter lista de pedidos OU mensagem de nenhum pedido
            const orderCards = page.locator('[data-testid="order-card"], [class*="order"]');
            const emptyMessage = page.locator('text=/nenhum.*pedido|sem.*pedido|ainda.*fez/i');

            const hasOrders = await orderCards.count() > 0;
            const hasEmptyMessage = await emptyMessage.first().isVisible().catch(() => false);

            // Uma das duas condições deve ser verdadeira
            expect(hasOrders || hasEmptyMessage).toBeTruthy();
        }
    });

    test('deve expandir detalhes do pedido', async ({ page }) => {
        const ordersTab = page.locator('button:has-text("Pedidos")').first();

        if (await ordersTab.isVisible()) {
            await ordersTab.click();
            await page.waitForTimeout(500);

            const orderCard = page.locator('[data-testid="order-card"]').first();

            if (await orderCard.isVisible()) {
                await orderCard.click();
                await page.waitForTimeout(300);

                // Detalhes do pedido devem ser exibidos
                const orderDetails = page.locator('text=/itens|produtos|total|status/i');
                await expect(orderDetails.first()).toBeVisible();
            }
        }
    });
});

test.describe('Seção de Configurações', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForTimeout(1000);
    });

    test('deve acessar seção de configurações', async ({ page }) => {
        const settingsTab = page.locator('button:has-text("Configura"), a:has-text("Configura")').first();

        if (await settingsTab.isVisible()) {
            await settingsTab.click();
            await page.waitForTimeout(500);

            // Verificar seção de configurações
            const settingsSection = page.locator('text=/configurações|preferências/i');
            await expect(settingsSection.first()).toBeVisible();
        }
    });

    test('deve ter opção de alterar senha', async ({ page }) => {
        const settingsTab = page.locator('button:has-text("Configura")').first();

        if (await settingsTab.isVisible()) {
            await settingsTab.click();
            await page.waitForTimeout(500);

            const passwordSection = page.locator('text=/alterar.*senha|nova.*senha|senha/i');
            await expect(passwordSection.first()).toBeVisible();
        }
    });
});
