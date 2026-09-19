const pool = require('../config/db');

const SaleModel = {
  /**
   * Lista histórico completo de vendas para Admin e Supervisor
   */
  async findAll({ limit = 50 } = {}) {
    const result = await pool.query(
      `SELECT
         s.id,
         s.quantity,
         s.total_value AS "totalValue",
         s.cashback_value AS "cashbackValue",
         TO_CHAR(s.sale_date, 'DD/MM/YYYY HH24:MI') AS "saleDate",
         p.id AS "productId",
         p.title AS "productTitle",
         p.code AS "productCode",
         p.color AS "productColor",
         c.code AS "couponCode",
         c.discount_percentage AS "discountPercentage",
         i.id AS "influencerId",
         i.name AS "influencerName"
       FROM sales s
       JOIN products p ON p.id = s.product_id
       JOIN coupons c ON c.id = s.coupon_id
       JOIN influencers i ON i.id = c.influencer_id
       ORDER BY s.sale_date DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  },

  /**
   * Lista extrato de vendas vinculadas aos cupons de uma influenciadora
   */
  async findByInfluencerId(influencerId, { limit = 50 } = {}) {
    const result = await pool.query(
      `SELECT
         s.id,
         s.quantity,
         s.total_value AS "totalValue",
         s.cashback_value AS "cashbackValue",
         TO_CHAR(s.sale_date, 'DD/MM/YYYY HH24:MI') AS "saleDate",
         p.title AS "productTitle",
         p.code AS "productCode",
         p.color AS "productColor",
         c.code AS "couponCode"
       FROM sales s
       JOIN products p ON p.id = s.product_id
       JOIN coupons c ON c.id = s.coupon_id
       WHERE c.influencer_id = $1
       ORDER BY s.sale_date DESC
       LIMIT $2`,
      [influencerId, limit]
    );
    return result.rows;
  },
};

module.exports = SaleModel;
