const ProductModel = require('../models/productModel');
const SaleModel = require('../models/saleModel');

const AdminController = {
  /**
   * GET /api/admin/products
   * Lista todos os produtos do estoque
   */
  async listProducts(req, res) {
    try {
      const products = await ProductModel.findAll();
      return res.json(products);
    } catch (err) {
      console.error('Erro ao listar produtos:', err);
      return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  },

  /**
   * POST /api/admin/products
   * Cadastra uma nova peça no estoque (apenas admin)
   */
  async createProduct(req, res) {
    try {
      const { title, color, code, photoUrl, price, stock } = req.body;

      if (!title || !color || !code) {
        return res.status(400).json({ error: 'Título, cor e código são obrigatórios.' });
      }

      // Verifica se o código já existe
      const existing = await ProductModel.findByCode(code);
      if (existing) {
        return res.status(409).json({ error: `Código '${code}' já está cadastrado.` });
      }

      const product = await ProductModel.create({ title, color, code, photoUrl, price, stock });
      return res.status(201).json(product);
    } catch (err) {
      console.error('Erro ao criar produto:', err);
      return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  },

  /**
   * PUT /api/admin/products/:id
   * Atualiza dados de uma peça (apenas admin)
   */
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updated = await ProductModel.update(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Produto não encontrado.' });
      }
      return res.json(updated);
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
      return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  },

  /**
   * DELETE /api/admin/products/:id
   * Remove uma peça do estoque (apenas admin)
   */
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const deleted = await ProductModel.delete(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Produto não encontrado.' });
      }
      return res.json({ message: 'Produto removido com sucesso.' });
    } catch (err) {
      console.error('Erro ao remover produto:', err);
      return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  },

  /**
   * GET /api/admin/sales
   * Histórico geral de vendas do balcão para Admin e Supervisor
   */
  async listSales(req, res) {
    try {
      const sales = await SaleModel.findAll({ limit: 100 });
      return res.json(sales);
    } catch (err) {
      console.error('Erro ao listar vendas do balcão:', err);
      return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  },
};

module.exports = AdminController;
