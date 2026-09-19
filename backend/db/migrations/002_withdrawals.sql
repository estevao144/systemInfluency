-- ============================================================
-- Migration 002 - Adiciona tabela de resgates de cashback (withdrawals)
-- ============================================================

CREATE TABLE IF NOT EXISTS withdrawals (
  id              SERIAL PRIMARY KEY,
  influencer_id   INTEGER NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  amount          DECIMAL(10,2) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'AGENDADO', 'CONCLUIDO', 'CANCELADO')),
  scheduled_date  DATE,
  scheduled_time  TIME,
  notes           TEXT,
  requested_at    TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_influencer_id ON withdrawals(influencer_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
