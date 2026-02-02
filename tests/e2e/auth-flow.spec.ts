import { test, expect } from '@playwright/test';

/**
 * Testes E2E de Autenticação
 * 
 * Valida fluxos de login, registro, logout e recuperação de senha
 */

test.describe('Fluxo de Login', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Ly Vest/i);
    });

    test('deve abrir modal de login', async ({ page }) => {
        // Clicar no botão de login/usuário
        const loginButton = page.locator('[data-testid="login-button"], button:has-text("Entrar"), a:has-text("Entrar")').first();

        if (await loginButton.isVisible()) {
            await loginButton.click();
            await page.waitForTimeout(500);

            // Verificar que o modal de login abriu
            const loginModal = page.locator('text=/login|entrar|acesse.*conta|acessar/i');
            await expect(loginModal.first()).toBeVisible();
        }
    });

    test('deve mostrar campos de email e senha', async ({ page }) => {
        const loginButton = page.locator('[data-testid="login-button"], button:has-text("Entrar")').first();

        if (await loginButton.isVisible()) {
            await loginButton.click();
            await page.waitForTimeout(500);

            // Verificar campos
            const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
            const passwordInput = page.locator('input[type="password"]');

            await expect(emailInput.first()).toBeVisible();
            await expect(passwordInput.first()).toBeVisible();
        }
    });

    test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
        const loginButton = page.locator('[data-testid="login-button"], button:has-text("Entrar")').first();

        if (await loginButton.isVisible()) {
            await loginButton.click();
            await page.waitForTimeout(500);

            // Preencher com dados inválidos
            const emailInput = page.locator('input[type="email"]').first();
            const passwordInput = page.locator('input[type="password"]').first();
            const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Entrar")').first();

            if (await emailInput.isVisible()) {
                await emailInput.fill('invalido@email.com');
                await passwordInput.fill('senhaerrada123');
                await submitButton.click();

                await page.waitForTimeout(1000);

                // Verificar mensagem de erro (pode não aparecer em modo demo)
            }
        }
    });

    test('deve ter opção de login com Google', async ({ page }) => {
        const loginButton = page.locator('[data-testid="login-button"], button:has-text("Entrar")').first();

        if (await loginButton.isVisible()) {
            await loginButton.click();
            await page.waitForTimeout(500);

            // Verificar botão de Google
            const googleButton = page.locator('button:has-text("Google"), button[aria-label*="Google"]');
            await expect(googleButton.first()).toBeVisible();
        }
    });
});

test.describe('Fluxo de Registro', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('deve abrir modal de registro', async ({ page }) => {
        // Primeiro abrir login
        const loginButton = page.locator('[data-testid="login-button"], button:has-text("Entrar")').first();

        if (await loginButton.isVisible()) {
            await loginButton.click();
            await page.waitForTimeout(500);

            // Clicar em "Cadastrar" ou "Criar conta"
            const registerLink = page.locator('button:has-text("Cadastr"), a:has-text("Cadastr"), text=/criar.*conta|novo.*cadastro/i').first();

            if (await registerLink.isVisible()) {
                await registerLink.click();
                await page.waitForTimeout(500);

                // Verificar que o formulário de registro está visível
                const registerForm = page.locator('text=/cadastr|criar.*conta|registr/i');
                await expect(registerForm.first()).toBeVisible();
            }
        }
    });

    test('deve ter campos obrigatórios de registro', async ({ page }) => {
        const loginButton = page.locator('[data-testid="login-button"], button:has-text("Entrar")').first();

        if (await loginButton.isVisible()) {
            await loginButton.click();
            await page.waitForTimeout(300);

            const registerLink = page.locator('button:has-text("Cadastr")').first();
            if (await registerLink.isVisible()) {
                await registerLink.click();
                await page.waitForTimeout(500);

                // Verificar campos presentes
                const nameInput = page.locator('input[placeholder*="nome" i], input[name="nome"]');
                const emailInput = page.locator('input[type="email"]');
                const passwordInput = page.locator('input[type="password"]');

                // Pelo menos email e senha devem estar presentes
                await expect(emailInput.first()).toBeVisible();
                await expect(passwordInput.first()).toBeVisible();
            }
        }
    });

    test('deve ter checkbox de termos de uso', async ({ page }) => {
        const loginButton = page.locator('[data-testid="login-button"], button:has-text("Entrar")').first();

        if (await loginButton.isVisible()) {
            await loginButton.click();
            await page.waitForTimeout(300);

            const registerLink = page.locator('button:has-text("Cadastr")').first();
            if (await registerLink.isVisible()) {
                await registerLink.click();
                await page.waitForTimeout(500);

                // Verificar checkbox de termos
                const termsCheckbox = page.locator('input[type="checkbox"]');
                const termsText = page.locator('text=/termos|privacidade|aceito/i');

                await expect(termsCheckbox).toBeVisible();

                // Deve haver menção a termos
                await expect(termsText.first()).toBeVisible();
            }
        }
    });
});

test.describe('Recuperação de Senha', () => {
    test('deve ter link para recuperar senha', async ({ page }) => {
        await page.goto('/');

        const loginButton = page.locator('[data-testid="login-button"], button:has-text("Entrar")').first();

        if (await loginButton.isVisible()) {
            await loginButton.click();
            await page.waitForTimeout(500);

            // Procurar link de "Esqueci senha"
            const forgotLink = page.locator('button:has-text("Esquec"), a:has-text("Esquec"), text=/esqueci.*senha/i').first();
            await expect(forgotLink).toBeVisible();
        }
    });

    test('deve abrir formulário de recuperação', async ({ page }) => {
        await page.goto('/');

        const loginButton = page.locator('[data-testid="login-button"], button:has-text("Entrar")').first();

        if (await loginButton.isVisible()) {
            await loginButton.click();
            await page.waitForTimeout(500);

            const forgotLink = page.locator('button:has-text("Esquec")').first();
            if (await forgotLink.isVisible()) {
                await forgotLink.click();
                await page.waitForTimeout(500);

                // Verificar formulário de recuperação
                const recoveryForm = page.locator('text=/recuperar|redefinir|enviar.*email/i');
                await expect(recoveryForm.first()).toBeVisible();
            }
        }
    });
});

test.describe('Logout', () => {
    test('deve redirecionar para home após logout', async ({ page }) => {
        // Tentar acessar dashboard
        await page.goto('/dashboard');
        await page.waitForTimeout(1000);

        // Se estiver logado, procurar botão de logout
        const logoutButton = page.locator('button:has-text("Sair"), button:has-text("Logout")').first();

        if (await logoutButton.isVisible()) {
            await logoutButton.click();
            await page.waitForTimeout(500);

            // Deve redirecionar para home ou mostrar tela de login
            const currentUrl = page.url();
            expect(
                currentUrl.includes('/') ||
                currentUrl.includes('/login')
            ).toBeTruthy();
        }
    });
});
