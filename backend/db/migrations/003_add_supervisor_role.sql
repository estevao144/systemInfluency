-- ============================================================
-- Migration 003 - Adiciona a role 'supervisor' na tabela users
-- ============================================================

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'supervisor', 'atendente', 'influencer'));
