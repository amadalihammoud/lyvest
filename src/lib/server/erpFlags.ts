/**
 * Política de estoque na integração com o ERP (Bling).
 *
 * CONTEXTO — por que isto existe:
 * O ciclo com o Bling está aberto num só sentido. O fluxo Bling -> loja
 * (catálogo/estoque) funciona, mas o fluxo loja -> Bling (pedido) ainda não:
 * nada chama /api/erp/sync-order e BlingProvider.sendOrder lança exceção.
 * Logo, o saldo no Bling NUNCA reflete as vendas do site.
 *
 * Enquanto isso, tanto o webhook de estoque quanto o sync de catálogo gravavam
 * `products.stock` com o valor ABSOLUTO vindo do Bling. O resultado é que toda
 * sincronização apaga as baixas das vendas e reinfla o estoque:
 *
 *   produto com 3 peças -> 3 clientes compram (stock local = 0)
 *   -> chega um webhook de estoque -> stock volta a 3
 *   -> a loja vende mercadoria que não existe.
 *
 * Por isso o padrão é DESLIGADO: o banco da loja é a fonte da verdade do saldo
 * até que o envio de pedidos ao Bling esteja implementado. Ligar antes disso
 * reintroduz o overselling.
 *
 * Ligue com ERP_STOCK_AUTHORITATIVE=1 SOMENTE depois que o pedido pago passar a
 * ser sincronizado com o ERP (aí o saldo de lá já vem líquido das vendas).
 */
export function isErpStockAuthoritative(): boolean {
    const raw = (process.env.ERP_STOCK_AUTHORITATIVE ?? '').trim().toLowerCase();
    return raw === '1' || raw === 'true';
}
