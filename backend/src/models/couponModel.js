const pool = require('../config/db');

const CouponModel = {
  /**
   * Lista todos os cupons de um influencer
   */
  async findByInfluencerId(influencerId) {
    const result = await pool.query(
      `SELECT id, code, discount_percentage AS "discountPercentage",
              is_active AS "isActive", expires_at AS "expiresAt",
              (SELECT COUNT(*) FROM sales WHERE coupon_id = coupons.id) AS uses
       FROM coupons
       WHERE influencer_id = $1
       ORDER BY created_at DESC`,
      [influencerId]
    );
    return result.rows;
  },

  /**
   * Busca um cupom pelo código (usado para registrar vendas e validar no caixa)
   */
  async findByCode(code) {
    const result = await pool.query(
      `SELECT c.*, i.id AS influencer_id, i.name AS influencer_name, i.cashback_percentage
       FROM coupons c
       JOIN influencers i ON i.id = c.influencer_id
       WHERE UPPER(c.code) = UPPER($1) 
         AND c.is_active = true
         AND (c.expires_at IS NULL OR c.expires_at >= NOW())`,
      [code.trim()]
    );
    return result.rows[0] || null;
  },

  /**
   * Cria um novo cupom para um influencer
   */
  async create({ influencerId, code, discountPercentage, expiresAt }) {
    const result = await pool.query(
      `INSERT INTO coupons (influencer_id, code, discount_percentage, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id, code, discount_percentage AS "discountPercentage",
                 is_active AS "isActive", expires_at AS "expiresAt"`,
      [influencerId, code.toUpperCase(), discountPercentage, expiresAt || null]
    );
    return result.rows[0];
  },

  /**
   * Desativa um cupom (soft delete)
   */
  async deactivate(id) {
    const result = await pool.query(
      'UPDATE coupons SET is_active = false WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0] || null;
  },
};

module.exports = CouponModel;
