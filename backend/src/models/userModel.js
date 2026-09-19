const pool = require('../config/db');

const UserModel = {
  /**
   * Busca um usuário pelo email
   */
  async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    return result.rows[0] || null;
  },

  /**
   * Busca um usuário pelo ID
   */
  async findById(id) {
    const result = await pool.query(
      'SELECT id, email, role, is_active, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Cria um novo usuário
   */
  async create(email, passwordHash, role) {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, email, role, created_at`,
      [email, passwordHash, role]
    );
    return result.rows[0];
  },

  /**
   * Atualiza a senha de um usuário
   */
  async updatePassword(id, newPasswordHash) {
    const result = await pool.query(
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, role, updated_at`,
      [newPasswordHash, id]
    );
    return result.rows[0] || null;
  },

  /**
   * Atualiza o status ativo/inativo de um usuário
   */
  async updateStatus(id, isActive) {
    const result = await pool.query(
      `UPDATE users
       SET is_active = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, role, is_active, updated_at`,
      [isActive, id]
    );
    return result.rows[0] || null;
  },
};

module.exports = UserModel;
