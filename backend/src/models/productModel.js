const pool = require('../config/db');

const ProductModel = {
  /**
   * Retorna todos os produtos ativos
   */
  async findAll() {
    const result = await pool.query(
      `SELECT id, title, color, code, photo_url AS "photoUrl", price, stock
       FROM products
       ORDER BY created_at DESC`
    );
    return result.rows;
  },

  /**
   * Busca produto pelo código (code é único)
   */
  async findByCode(code) {
    const result = await pool.query(
      'SELECT * FROM products WHERE code = $1',
      [code]
    );
    return result.rows[0] || null;
  },

  /**
   * Busca produto pelo ID
   */
  async findById(id) {
    const result = await pool.query(
      `SELECT id, title, color, code, photo_url AS "photoUrl", price, stock
       FROM products WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Cria um novo produto
   */
  async create({ title, color, code, photoUrl, price = 0, stock = 0 }) {
    const result = await pool.query(
      `INSERT INTO products (title, color, code, photo_url, price, stock)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, color, code, photo_url AS "photoUrl", price, stock`,
      [title, color, code, photoUrl || null, price, stock]
    );
    return result.rows[0];
  },

  /**
   * Atualiza campos de um produto
   */
  async update(id, { title, color, code, photoUrl, price, stock }) {
    const result = await pool.query(
      `UPDATE products
       SET title = COALESCE($1, title),
           color = COALESCE($2, color),
           code  = COALESCE($3, code),
           photo_url = COALESCE($4, photo_url),
           price = COALESCE($5, price),
           stock = COALESCE($6, stock)
       WHERE id = $7
       RETURNING id, title, color, code, photo_url AS "photoUrl", price, stock`,
      [title, color, code, photoUrl, price, stock, id]
    );
    return result.rows[0] || null;
  },

  /**
   * Remove um produto pelo ID
   */
  async delete(id) {
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0] || null;
  },
};

module.exports = ProductModel;
