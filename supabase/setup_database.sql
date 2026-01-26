-- ==============================================================================
-- SCHEMA DO E-COMMERCE LY VEST
-- Execute este script no Editor SQL do Supabase para criar a estrutura completa.
-- ==============================================================================

-- 1. CONFIGURAÇÕES FINANCEIRAS (Taxas e Regras)
create table if not exists financial_configs (
  id uuid default gen_random_uuid() primary key,
  rule_key text not null unique, -- ex: 'credit_1x_fee'
  rule_value jsonb not null,     -- ex: { "percent": 4.99 }
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS (Segurança)
alter table financial_configs enable row level security;
-- Política: Apenas leitura pública (para o front calcular taxas)
create policy "Public Read Financial Configs" on financial_configs for select using (true);


-- 2. CATEGORIAS DE PRODUTOS
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table categories enable row level security;
create policy "Public Read Categories" on categories for select using (true);


-- 3. PRODUTOS (Sincronizados com Bling)
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  bling_id text unique,              -- ID original no Bling for sync
  name text not null,
  description text,
  price decimal(10,2) not null,
  promotional_price decimal(10,2),
  stock integer default 0,
  weight decimal(10,3),              -- Peso em Kg para frete
  dimensions jsonb,                  -- { "w": 10, "h": 5, "l": 15 }
  images text[],                     -- Array de URLs das fotos
  category_id uuid references categories(id),
  slug text unique,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table products enable row level security;
create policy "Public Read Products" on products for select using (true);


-- 4. PEDIDOS (Orders)
create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id), -- Link com usuário logado
  status text default 'pending',          -- pending, paid, shipped, delivered, cancelled
  total decimal(10,2) not null,
  payment_method text,                    -- credit, pix
  payment_id text,                        -- ID no Mercado Pago
  tracking_code text,                     -- Código de Rastreio (Melhor Envio)
  invoice_url text,                       -- Link da NFE (Bling)
  items jsonb not null,                   -- Snapshot dos itens comprados
  address_snapshot jsonb,                 -- Snapshot do endereço de entrega
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table orders enable row level security;

-- Política: Usuário só vê seus próprios pedidos
create policy "Users can view own orders" on orders 
  for select using (auth.uid() = user_id);

-- Política: Usuário pode criar pedidos (ao finalizar compra)
create policy "Users can create orders" on orders 
  for insert with check (auth.uid() = user_id);


-- 5. ADDRESSES (Endereços dos Clientes)
create table if not exists addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  recipient text not null,
  zip_code text not null,
  street text not null,
  number text not null,
  complement text,
  neighborhood text not null,
  city text not null,
  state text not null,
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table addresses enable row level security;
create policy "Users can manage own addresses" on addresses
  for all using (auth.uid() = user_id);


-- 6. FAVORITES (Lista de Desejos)
create table if not exists favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  product_id uuid references products(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id)
);

alter table favorites enable row level security;
create policy "Users can manage own favorites" on favorites
  for all using (auth.uid() = user_id);


-- DADOS INICIAIS (SEED)
-- Inserir categorias padrão
insert into categories (name, slug) values
('Lingerie', 'lingerie'),
('Sutiãs', 'sutias'),
('Calcinhas', 'calcinhas'),
('Pijamas', 'pijamas')
on conflict (slug) do nothing;

-- Inserir Regras Financeiras Padrão
insert into financial_configs (rule_key, rule_value, description) values
('fee_credit_1x', '{"percent": 4.99}', 'Taxa Mercado Pago Crédito à vista'),
('fee_credit_installments', '{"percent_base": 4.99, "percent_per_month": 1.5}', 'Taxa Mercado Pago Parcelado'),
('fee_pix', '{"percent": 0.99}', 'Taxa Mercado Pago PIX')
on conflict (rule_key) do nothing;
