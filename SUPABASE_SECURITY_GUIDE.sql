-- 🛡️ LY VEST SECURITY PROTOCOL (Run this in Supabase SQL Editor)

-- 1. ENABLE RLS ON ALL TABLES (Default Deny All)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. PRODUCTS POLICY (Public Read, Admin Write)
-- Permitir que qualquer um (anon) veja produtos ativos
CREATE POLICY "Public Products Access" 
ON public.products 
FOR SELECT 
USING (active = true);

-- Apenas usuarios com role 'service_role' ou 'admin' podem editar (ex: dashboard administrativo)
-- (Isso geralmente é gerenciado pela Service Key em Edge Functions, mas se usar Auth Admin):
CREATE POLICY "Admin Manage Products" 
ON public.products 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');


-- 3. ORDERS POLICY (Private Data)
-- Usuario so pode ver seus proprios pedidos
CREATE POLICY "User View Own Orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

-- Usuario pode criar pedidos para si mesmo
CREATE POLICY "User Create Orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Ninguem pode deletar ou alterar pedidos diretamente (apenas via Backend/Edge Functions)


-- 4. PROFILES POLICY (User Data)
-- Usuario pode ver seu proprio perfil
CREATE POLICY "User View Own Profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Usuario pode editar seu proprio perfil
CREATE POLICY "User Update Own Profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);


-- 5. FUNCTION: VALIDATE PRICE (Server-Side Validation Concept)
-- Exemplo de função PL/pgSQL para validar preço no banco antes de inserir pedido
/*
CREATE OR REPLACE FUNCTION validate_order_total()
RETURNS TRIGGER AS $$
DECLARE
    calculated_total numeric;
BEGIN
    -- Logica complexa de recalcular o total baseada nos itens
    -- (Geralmente feito em Edge Functions JS, mas possivel em SQL)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
*/
