const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const AdminController = require('../controllers/adminController');

// GET /api/admin/products
// Todos os usuários autenticados podem ver o estoque
router.get(
  '/products',
  verifyToken,
  checkRole('admin', 'supervisor', 'atendente', 'influencer'),
  AdminController.listProducts
);

// POST /api/admin/products
// Apenas admin pode cadastrar novas peças
router.post(
  '/products',
  verifyToken,
  checkRole('admin'),
  AdminController.createProduct
);

// PUT /api/admin/products/:id
// Apenas admin pode editar peças
router.put(
  '/products/:id',
  verifyToken,
  checkRole('admin'),
  AdminController.updateProduct
);

// DELETE /api/admin/products/:id
// Apenas admin pode remover peças
router.delete(
  '/products/:id',
  verifyToken,
  checkRole('admin'),
  AdminController.deleteProduct
);

// GET /api/admin/sales
// Histórico geral de vendas acessível por admin e supervisor
router.get(
  '/sales',
  verifyToken,
  checkRole('admin', 'supervisor'),
  AdminController.listSales
);

module.exports = router;
