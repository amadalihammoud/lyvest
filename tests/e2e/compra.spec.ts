import { expect, test } from '@playwright/test';

/**
 * Fumaça do caminho de compra: vitrine → PDP → escolher tamanho → carrinho.
 *
 * POR QUE ISTO EXISTE
 *
 * O projeto tem 215 testes e, até este arquivo, NENHUM provava que um cliente
 * consegue chegar ao carrinho. Cada teste unitário verifica uma peça — o preço,
 * o seletor, o payload — e nenhum verifica que as peças estão LIGADAS. A ligação
 * é exatamente onde moraram os bugs desta semana: o `variantId` que o Zod
 * descartava em silêncio, o botão que travava em "Processando...", a grade que
 * virava clone na vitrine.
 *
 * POR QUE OS SELETORES SÃO PAPÉIS E TEXTOS, NÃO data-testid
 *
 * `next.config.ts` liga `reactRemoveProperties` em produção: o build APAGA todo
 * data-testid. Um E2E baseado neles só rodaria contra o servidor de
 * desenvolvimento — ou seja, contra um artefato que ninguém usa. Aqui os
 * seletores são os mesmos que um leitor de tela enxerga, então o teste falha
 * quando o produto quebra para gente de verdade, e não quando alguém renomeia
 * um atributo.
 *
 * O QUE NÃO COBRE, E POR QUÊ
 *
 * Sem DATABASE_URL o catálogo cai no mock (src/data/products.ts), que tem
 * `sizes` mas NÃO tem variantes. Então isto cobre o seletor de tamanho legado,
 * não a grade vinda do Bling. É proposital: o CI não tem — nem deve ter —
 * credencial do banco de produção, e um E2E preso a dado mutável de produção
 * falha por motivo errado. A grade segue coberta por teste unitário e por
 * conferência direta no banco.
 *
 * Checkout e pagamento também ficam de fora: exigem sessão do Clerk.
 */

/** O card inteiro é um link para a PDP. */
const primeiroProduto = (page: import('@playwright/test').Page) =>
    page.locator('a[href^="/produto/"]').first();

/** Nome acessível: "Carrinho com N itens" (pt-BR, chave aria.cartCount). */
const carrinho = (page: import('@playwright/test').Page) =>
    page.getByRole('button', { name: /^Carrinho com/ });

test.describe('caminho de compra', () => {
    test('a vitrine mostra produtos e leva à página do produto', async ({ page }) => {
        await page.goto('/');

        const card = primeiroProduto(page);
        await expect(card).toBeVisible();

        await card.click();
        await expect(page).toHaveURL(/\/produto\//);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('a PDP exige tamanho antes de comprar', async ({ page }) => {
        await page.goto('/');
        await primeiroProduto(page).click();
        await expect(page).toHaveURL(/\/produto\//);

        // Comprar sem escolher. Antes era um alert() bloqueante, invisível para
        // leitor de tela; agora é uma mensagem com role="alert" ao lado do
        // seletor — e o carrinho NÃO pode ter sido tocado.
        await page.getByRole('button', { name: 'Comprar' }).first().click();

        // Texto específico, não getByRole('alert') solto: em modo dev o overlay
        // de erros do Next também é role=alert e casaria primeiro.
        await expect(page.getByText(/selecione um tamanho/i)).toBeVisible();
        await expect(carrinho(page)).toHaveAccessibleName(/com 0 itens/);
    });

    test('escolher tamanho e comprar coloca o item no carrinho', async ({ page }) => {
        await page.goto('/');
        await primeiroProduto(page).click();

        await page.getByRole('group', { name: /tamanho/i }).getByRole('button').first().click();
        await page.getByRole('button', { name: 'Comprar' }).first().click();

        await expect(carrinho(page)).toHaveAccessibleName(/com 1 iten?s/);
    });

    test('o carrinho sobrevive ao recarregar a página', async ({ page }) => {
        await page.goto('/');
        await primeiroProduto(page).click();
        await page.getByRole('group', { name: /tamanho/i }).getByRole('button').first().click();
        await page.getByRole('button', { name: 'Comprar' }).first().click();
        await expect(carrinho(page)).toHaveAccessibleName(/com 1 iten?s/);

        // O carrinho vem do localStorage e cada item é REVALIDADO na releitura;
        // item que não passa é descartado em silêncio. Sem este teste, um erro
        // de validação apareceria como "carrinho vazio" sem ninguém notar.
        await page.reload();
        await expect(carrinho(page)).toHaveAccessibleName(/com 1 iten?s/);
    });
});
