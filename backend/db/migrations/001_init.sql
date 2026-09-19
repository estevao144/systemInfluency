-- ============================================================
-- Migration 001 - Estrutura inicial do systemInfluency
-- ============================================================

-- Tabela de usuários (autenticação)
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role        VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'influencer', 'atendente')),
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Tabela de influenciadores (perfil)
CREATE TABLE IF NOT EXISTS influencers (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name                VARCHAR(255) NOT NULL,
  instagram           VARCHAR(255),
  tiktok              VARCHAR(255),
  youtube             VARCHAR(255),
  phone               VARCHAR(20),
  status              VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  cashback_percentage DECIMAL(5,2) DEFAULT 0.00,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS products (
  id        SERIAL PRIMARY KEY,
  title     VARCHAR(255) NOT NULL,
  color     VARCHAR(100),
  code      VARCHAR(100) UNIQUE NOT NULL,
  photo_url VARCHAR(500),
  price     DECIMAL(10,2) DEFAULT 0.00,
  stock     INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de cupons
CREATE TABLE IF NOT EXISTS coupons (
  id                  SERIAL PRIMARY KEY,
  influencer_id       INTEGER REFERENCES influencers(id) ON DELETE CASCADE,
  code                VARCHAR(50) UNIQUE NOT NULL,
  discount_percentage DECIMAL(5,2) NOT NULL,
  is_active           BOOLEAN DEFAULT true,
  expires_at          TIMESTAMP,
  created_at          TIMESTAMP DEFAULT NOW()
);

-- Tabela de vendas
CREATE TABLE IF NOT EXISTS sales (
  id             SERIAL PRIMARY KEY,
  coupon_id      INTEGER REFERENCES coupons(id),
  product_id     INTEGER REFERENCES products(id),
  quantity       INTEGER NOT NULL DEFAULT 1,
  total_value    DECIMAL(10,2) NOT NULL,
  cashback_value DECIMAL(10,2) NOT NULL,
  sale_date      TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_influencers_user_id ON influencers(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_influencer_id ON coupons(influencer_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_sales_coupon_id ON sales(coupon_id);

-- Usuário admin padrão (senha: admin123 - TROCAR EM PRODUÇÃO)
-- Hash bcrypt de 'admin123'
INSERT INTO users (email, password_hash, role)
VALUES ('admin@systeminfluency.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (email) DO NOTHING;
