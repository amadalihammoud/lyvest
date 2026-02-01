import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para testes E2E
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './tests/e2e',

    /* Timeout padrão para cada teste */
    timeout: 30 * 1000,

    /* Execute testes em paralelo */
    fullyParallel: true,

    /* Falhar build em CI se houverem testes com .only */
    forbidOnly: !!process.env.CI,

    /* Retry on CI apenas */
    retries: process.env.CI ? 2 : 0,

    /* Opt out of parallel tests on CI */
    workers: process.env.CI ? 1 : undefined,

    /* Reporter para usar */
    reporter: [
        ['html', { outputFolder: 'playwright-report' }],
        ['list']
    ],

    /* Configurações compartilhadas para todos os projetos */
    use: {
        /* URL base para usar em ações como `await page.goto('/')` */
        baseURL: 'http://localhost:5173',

        /* Coletar trace apenas on retry */
        trace: 'on-first-retry',

        /* Screenshots on failure */
        screenshot: 'only-on-failure',

        /* Video on failure */
        video: 'retain-on-failure',
    },

    /* Configurar projetos para diferentes browsers */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },

        // Descomentar para testar em outros browsers
        // {
        //   name: 'firefox',
        //   use: { ...devices['Desktop Firefox'] },
        // },

        // {
        //   name: 'webkit',
        //   use: { ...devices['Desktop Safari'] },
        // },

        /* Mobile viewports */
        // {
        //   name: 'Mobile Chrome',
        //   use: { ...devices['Pixel 5'] },
        // },
    ],

    /* Servidor de desenvolvimento */
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
});
