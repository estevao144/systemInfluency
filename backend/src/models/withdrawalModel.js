const pool = require('../config/db');

const WithdrawalModel = {
  /**
   * Cria uma solicitação de resgate
   */
  async create({ influencerId, amount }) {
    const result = await pool.query(
      `INSERT INTO withdrawals (influencer_id, amount, status)
       VALUES ($1, $2, 'PENDENTE')
       RETURNING id, influencer_id AS "influencerId", amount, status, requested_at AS "requestedAt"`,
      [influencerId, amount]
    );
    return result.rows[0];
  },

  /**
   * Busca resgate pendente ou agendado para o influencer
   */
  async findActiveByInfluencerId(influencerId) {
    const result = await pool.query(
      `SELECT id, influencer_id AS "influencerId", amount, status,
              scheduled_date AS "scheduledDate", scheduled_time AS "scheduledTime",
              requested_at AS "requestedAt"
       FROM withdrawals
       WHERE influencer_id = $1 AND status IN ('PENDENTE', 'AGENDADO')
       ORDER BY requested_at DESC
       LIMIT 1`,
      [influencerId]
    );
    return result.rows[0] || null;
  },

  /**
   * Lista todos os resgates com dados do influencer
   */
  async findAll() {
    const result = await pool.query(
      `SELECT w.id, w.amount, w.status,
              w.scheduled_date AS "scheduledDate",
              w.scheduled_time AS "scheduledTime",
              w.requested_at AS "requestedAt",
              i.id AS "influencerId", i.name AS "influencerName", i.instagram,
              u.email
       FROM withdrawals w
       JOIN influencers i ON i.id = w.influencer_id
       JOIN users u ON u.id = i.user_id
       ORDER BY w.requested_at DESC`
    );
    return result.rows;
  },

  /**
   * Atualiza agendamento de um resgate (Admin/Atendente)
   */
  async schedule(id, scheduledDate, scheduledTime) {
    const result = await pool.query(
      `UPDATE withdrawals
       SET status = 'AGENDADO',
           scheduled_date = $1,
           scheduled_time = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, influencer_id AS "influencerId", amount, status,
                 scheduled_date AS "scheduledDate", scheduled_time AS "scheduledTime"`,
      [scheduledDate, scheduledTime, id]
    );
    return result.rows[0] || null;
  },

  /**
   * Conclui ou cancela um resgate
   */
  async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE withdrawals
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, status, updated_at AS "updatedAt"`,
      [status, id]
    );
    return result.rows[0] || null;
  },
};

module.exports = WithdrawalModel;
