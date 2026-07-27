/**
 * Tipos de rastreio de entrega.
 *
 * ESTE ARQUIVO ERA O "tipos centralizados" DA APLICAÇÃO, com 150 linhas
 * declarando Product, CartItem, ProductSpecs, FilterState, ColorOption,
 * DashboardUser e mais meia dúzia. Nenhum deles era importado por ninguém: cada
 * um tinha um gêmeo vivo declarado onde de fato é usado.
 *
 * O gêmeo do `Product` chegou a divergir de verdade — `variants` e
 * `hasVariants` foram adicionados ao de src/services/ProductService.ts (o que a
 * aplicação inteira usa) e este ficou para trás, descrevendo um produto que já
 * não existe. Duas definições do mesmo conceito não ficam iguais sozinhas: elas
 * divergem em silêncio até alguém importar a errada e passar uma tarde
 * entendendo por que o tamanho escolhido não chega ao checkout.
 *
 * Por isso aqui sobrou só o que tem uso real. As fontes da verdade são:
 *   Product / ProductVariant  ->  src/services/ProductService.ts
 *   CartItem                  ->  src/store/useCartStore.ts
 *   ProductSpecs              ->  src/data/products.ts
 *   FilterState               ->  src/components/product/FilterSidebar.tsx
 */

export interface TrackingHistory {
    status: string;
    date: string;
    label?: string;
    location?: string;
}

/**
 * ATENÇÃO: nada preenche isto com dado real hoje.
 *
 * `orders` não tem coluna de código de rastreio e não existe integração com
 * transportadora — DrawerTracking responde honestamente que não encontrou. O
 * tipo existe para quando houver integração; não o confunda com funcionalidade
 * pronta.
 */
export interface TrackingResult {
    status: string;
    date: string;
    location?: string;
    history?: TrackingHistory[];
}
