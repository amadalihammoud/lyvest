-- Migration: Adicionar coluna gender na tabela profiles
-- Execute este script no SQL Editor do Supabase

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
