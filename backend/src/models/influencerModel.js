const pool = require('../config/db');

const InfluencerModel = {
  /**
   * Cria o perfil de influencer vinculado a um user_id existente
   */
  async create({ userId, name, instagram, tiktok, youtube, phone }) {
    const result = await pool.query(
      `INSERT INTO influencers (user_id, name, instagram, tiktok, youtube, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, name, instagram || null, tiktok || null, youtube || null, phone || null]
    );
    return result.rows[0];
  },

  /**
   * Busca o perfil do influencer pelo user_id (vínculo com a tabela users)
   */
  async findByUserId(userId) {
    const result = await pool.query(
      `SELECT i.*, u.email
       FROM influencers i
       JOIN users u ON u.id = i.user_id
       WHERE i.user_id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  },

  /**
   * Busca perfil pelo ID da tabela influencers
   */
  async findById(id) {
    const result = await pool.query(
      'SELECT * FROM influencers WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Lista todos os influencers com métricas de vendas, cupons e status de cashback
   */
  async findAllWithStats() {
    const result = await pool.query(
      `SELECT
         i.id, i.name, i.instagram, i.status, i.cashback_percentage,
         u.email,
         COUNT(DISTINCT c.id)                          AS coupon_count,
         COALESCE(SUM(s.quantity), 0)                  AS total_sales,
         COALESCE(SUM(s.cashback_value), 0)            AS total_earned,
         w.id                                          AS withdrawal_id,
         w.status                                      AS cashback_status,
         TO_CHAR(w.scheduled_date, 'YYYY-MM-DD')       AS scheduled_date,
         TO_CHAR(w.scheduled_time, 'HH24:MI')          AS scheduled_time
       FROM influencers i
       JOIN users u ON u.id = i.user_id
       LEFT JOIN coupons c ON c.influencer_id = i.id
       LEFT JOIN sales   s ON s.coupon_id = c.id
       LEFT JOIN LATERAL (
         SELECT id, status, scheduled_date, scheduled_time
         FROM withdrawals
         WHERE influencer_id = i.id AND status IN ('PENDENTE', 'AGENDADO')
         ORDER BY requested_at DESC
         LIMIT 1
       ) w ON true
       GROUP BY i.id, u.email, w.id, w.status, w.scheduled_date, w.scheduled_time
       ORDER BY i.name`
    );
    return result.rows;
  },

  /**
   * Calcula o total ganho (cashback acumulado) de um influencer
   */
  async getTotalEarned(influencerId) {
    const result = await pool.query(
      `SELECT COALESCE(SUM(s.cashback_value), 0) AS total_earned
       FROM sales s
       JOIN coupons c ON c.id = s.coupon_id
       WHERE c.influencer_id = $1`,
      [influencerId]
    );
    return parseFloat(result.rows[0].total_earned);
  },

  /**
   * Conta o total de peças vendidas por um influencer
   */
  async getSalesCount(influencerId) {
    const result = await pool.query(
      `SELECT COALESCE(SUM(s.quantity), 0) AS total_pieces
       FROM sales s
       JOIN coupons c ON c.id = s.coupon_id
       WHERE c.influencer_id = $1`,
      [influencerId]
    );
    return parseInt(result.rows[0].total_pieces, 10);
  },
};

module.exports = InfluencerModel;
