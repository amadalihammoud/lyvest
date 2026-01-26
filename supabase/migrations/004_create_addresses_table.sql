-- Migration: Criar tabela de endereços
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de endereços
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient TEXT,
    street TEXT NOT NULL,
    number TEXT NOT NULL,
    complement TEXT,
    neighborhood TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca por usuário
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver seus próprios endereços
CREATE POLICY "Users can view own addresses" ON addresses
    FOR SELECT USING (auth.uid() = user_id);

-- Política: usuários só podem inserir endereços próprios
CREATE POLICY "Users can insert own addresses" ON addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: usuários só podem atualizar seus próprios endereços
CREATE POLICY "Users can update own addresses" ON addresses
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: usuários só podem deletar seus próprios endereços
CREATE POLICY "Users can delete own addresses" ON addresses
    FOR DELETE USING (auth.uid() = user_id);
