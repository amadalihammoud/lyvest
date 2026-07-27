import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Regressão dos três defeitos que travavam ou duplicavam o checkout.
 *
 * São de ESTADO DE COMPONENTE — nenhum teste de função pura os alcança, e os
 * três só aparecem em sequências de interação (falhar, clicar duas vezes,
 * estourar o limite). Por isso monta o componente de verdade.
 */

const createPaymentSession = vi.fn();

vi.mock('../../services/payment', () => ({
    paymentService: { createPaymentSession: (...a: unknown[]) => createPaymentSession(...a) },
}));

vi.mock('@clerk/nextjs', () => ({
    useUser: () => ({ user: { fullName: 'Maria Silva', primaryEmailAddress: { emailAddress: 'maria@x.com' } } }),
}));

vi.mock('../../hooks/useI18n', () => ({
    useI18n: () => ({
        // Devolve a própria chave: assim os botões têm nome acessível (o rótulo
        // ocioso não tem literal de reserva). Exceção para errors.rateLimit, onde
        // queremos exercitar a mensagem que o componente monta sozinho.
        t: (k: string) => (k === 'errors.rateLimit' ? '' : k),
        formatCurrency: (v: number) => `R$ ${v.toFixed(2)}`,
    }),
}));

vi.mock('../../store/useCartStore', () => ({
    useCart: () => ({
        cartItems: [{ id: 'p1', name: 'Sutiã', price: 149.9, qty: 1, image: '', category: 'x', variantId: 'v1' }],
        finalTotal: 149.9,
        couponCode: null,
    }),
}));

import CheckoutPayment from './CheckoutPayment';

const botaoPagar = () => screen.getByRole('button', { name: /checkout.buttons.confirm|common.processing/ });

beforeEach(() => {
    localStorage.clear();
    createPaymentSession.mockReset();
    vi.unstubAllEnvs();
});

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('PIX no fluxo legado', () => {
    /**
     * O BUG: setIsSubmitting(true) rodava e o caminho do PIX retornava sem
     * nunca voltar para false — não havia finally cobrindo esse ramo.
     *
     * A hipótese implícita era "o componente desmonta logo depois". É falsa:
     * CheckoutWizard.handlePaymentSubmit, ao falhar, mostra o erro e RETORNA
     * sem avançar de passo. O formulário continua montado e o botão ficava em
     * "Processando..." até o cliente recarregar a página — venda perdida com o
     * pedido a um clique de fechar.
     */
    it('reabilita o botão quando o pedido falha (não trava em Processando)', async () => {
        const user = userEvent.setup();
        // Falha como o wizard falha: resolve sem avançar de passo.
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        render(<CheckoutPayment onSubmit={onSubmit} total={149.9} />);
        await user.click(screen.getByRole('button', { name: 'checkout.payment.pix' }));
        await user.click(botaoPagar());

        expect(onSubmit).toHaveBeenCalledWith({ method: 'pix' });
        await waitFor(() => expect(botaoPagar()).toBeEnabled());
    });

    it('reabilita o botão mesmo quando o pedido lança', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockRejectedValue(new Error('sem estoque'));
        vi.spyOn(console, 'error').mockImplementation(() => {});

        render(<CheckoutPayment onSubmit={onSubmit} total={149.9} />);
        await user.click(screen.getByRole('button', { name: 'checkout.payment.pix' }));
        await user.click(botaoPagar());

        await waitFor(() => expect(botaoPagar()).toBeEnabled());
    });
});

describe('duplo clique no botão de pagar', () => {
    /**
     * HONESTIDADE SOBRE ESTE TESTE: ele passa TAMBÉM na versão com o bug.
     *
     * Enquanto a requisição está em voo, `disabled={isSubmitting}` já barra o
     * segundo clique — não era aí que estava o problema. Fica como regressão
     * de um invariante que hoje depende do atributo do botão: quem mexer no
     * estilo ou no disabled descobre aqui, não em produção.
     *
     * O bug de verdade é o teste seguinte.
     */
    it('não dispara segunda sessão enquanto a primeira está em voo', async () => {
        vi.stubEnv('NEXT_PUBLIC_PAYMENT_PROVIDER', 'asaas');
        const user = userEvent.setup();

        let liberar: (v: unknown) => void = () => {};
        createPaymentSession.mockImplementation(
            () => new Promise((res) => { liberar = res; })
        );

        render(<CheckoutPayment onSubmit={vi.fn()} total={149.9} />);
        const botao = botaoPagar();

        // Dois cliques antes da primeira resposta chegar.
        await user.click(botao);
        await user.click(botao);

        expect(createPaymentSession).toHaveBeenCalledTimes(1);
        liberar({ sessionId: 's1', checkoutUrl: 'https://pay.x/1', status: 'pending' });
    });

    /**
     * ESTE é o bug: window.location.href só AGENDA a navegação, e o `finally`
     * reabilitava o botão no mesmo tick. Ficava clicável durante as centenas de
     * milissegundos até o browser sair da página.
     *
     * Com o Asaas a rota cria o PEDIDO ANTES da sessão do gateway, então o
     * segundo clique gerava um segundo pedido pending, uma segunda baixa de
     * estoque e queimava cupom de uso único — por uma compra só.
     */
    it('mantém o botão travado durante o redirecionamento', async () => {
        vi.stubEnv('NEXT_PUBLIC_PAYMENT_PROVIDER', 'asaas');
        const user = userEvent.setup();
        createPaymentSession.mockResolvedValue({
            sessionId: 's1',
            checkoutUrl: 'https://pay.x/1',
            status: 'pending',
        });

        render(<CheckoutPayment onSubmit={vi.fn()} total={149.9} />);
        await user.click(botaoPagar());

        // Reabilitar aqui deixaria o botão clicável durante toda a navegação.
        await waitFor(() => expect(createPaymentSession).toHaveBeenCalled());
        expect(botaoPagar()).toBeDisabled();
    });
});

describe('limite de tentativas', () => {
    /**
     * O BUG: setRateLimitError(true) existia, setRateLimitError(false) não —
     * em nenhum lugar do componente. Como o botão era
     * disabled={isSubmitting || rateLimitError}, depois de 3 tentativas ele
     * morria enquanto a página vivesse, e a mensagem "aguarde N minutos"
     * virava impossível de cumprir: nenhum clique reavaliava o limitador.
     * Pior, o contador vive em localStorage e sobrevive ao reload.
     */
    it('o botão continua clicável depois de estourar o limite', async () => {
        vi.stubEnv('NEXT_PUBLIC_PAYMENT_PROVIDER', 'asaas');
        const user = userEvent.setup();
        createPaymentSession.mockResolvedValue({ sessionId: 's', status: 'success' });

        render(<CheckoutPayment onSubmit={vi.fn()} total={149.9} />);

        // O limitador permite 3 em 5 minutos; a quarta é bloqueada.
        for (let i = 0; i < 4; i++) {
            await user.click(botaoPagar());
            await waitFor(() => expect(botaoPagar()).toBeEnabled());
        }

        expect(screen.getByText(/aguarde/i)).toBeInTheDocument();
        // Quem decide se pode tentar é o limitador, a cada submit — não um
        // estado que ninguém nunca desliga.
        expect(botaoPagar()).toBeEnabled();
    });
});
