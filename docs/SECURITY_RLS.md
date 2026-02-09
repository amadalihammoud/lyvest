# Guia de Segurança RLS - Supabase

Este guia explica como configurar Row Level Security (RLS) para proteger os dados do Ly Vest no Supabase.

## O que é RLS?
RLS (Row Level Security) garante que cada usuário só acesse seus próprios dados, mesmo que alguém descubra sua chave `anon`.

## Configuração Básica

### 1. Habilitar RLS em todas as tabelas
```sql
-- Execute no SQL Editor do Supabase
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
```

### 2. Políticas de Exemplo

#### Tabela: orders (Pedidos)
```sql
-- Usuário só vê seus próprios pedidos
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id);

-- Usuário pode criar pedidos para si mesmo
CREATE POLICY "Users can create own orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### Tabela: cart_items (Carrinho)
```sql
-- Usuário gerencia apenas seu próprio carrinho
CREATE POLICY "Users manage own cart"
ON cart_items FOR ALL
USING (auth.uid() = user_id);
```

#### Tabela: favorites (Favoritos)
```sql
-- Usuário gerencia apenas seus favoritos
CREATE POLICY "Users manage own favorites"
ON favorites FOR ALL
USING (auth.uid() = user_id);
```

#### Tabela: products (Produtos - Leitura Pública)
```sql
-- Todos podem ver produtos (não precisa de auth)
CREATE POLICY "Anyone can view products"
ON products FOR SELECT
USING (true);

-- Apenas admins podem modificar (via service_role)
-- Não criar política de INSERT/UPDATE para anon key
```

## Verificação
Para testar se as políticas estão funcionando:
1. Faça login como usuário A
2. Tente acessar dados do usuário B
3. Deve retornar array vazio, não erro

## Referências
- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
