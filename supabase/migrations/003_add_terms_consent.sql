-- Migration: Adicionar coluna terms_accepted_at para log de consentimento LGPD
-- Execute este script no SQL Editor do Supabase

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE;

-- Comentário: Esta coluna armazena quando o usuário aceitou os termos de uso,
-- conforme exigido pela LGPD para comprovação de consentimento.
