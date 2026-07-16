-- Adicionar array de tamanhos na tabela de produtos
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT '{"P", "M", "G", "GG"}';

-- Adicionar tamanho selecionado nos itens do pedido
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS size TEXT;
