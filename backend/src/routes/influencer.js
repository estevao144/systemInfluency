const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const {
  registerInfluencer,
  getMyProfile,
  generateCoupons,
  recordSale,
  listInfluencers,
  requestWithdrawal,
  scheduleWithdrawal,
  validateCoupon,
  getMySales,
} = require('../controllers/influencerController');

// GET /api/influencer/coupon/:code
// Admin, supervisor e atendente validam cupom no balcão/caixa
router.get(
  '/coupon/:code',
  verifyToken,
  checkRole('admin', 'supervisor', 'atendente'),
  validateCoupon
);

// GET /api/influencer/list
// Admin, supervisor e atendente podem listar as influenciadoras
router.get(
  '/list',
  verifyToken,
  checkRole('admin', 'supervisor', 'atendente'),
  listInfluencers
);

// POST /api/influencer/register
// Admin, supervisor e atendente podem pré-cadastrar influenciadoras
router.post(
  '/register',
  verifyToken,
  checkRole('admin', 'supervisor', 'atendente'),
  registerInfluencer
);

// GET /api/influencer/me
// Apenas o próprio influencer acessa seu perfil
router.get(
  '/me',
  verifyToken,
  checkRole('influencer'),
  getMyProfile
);

// POST /api/influencer/generate-coupons
// Apenas influencer cria seus próprios cupons
router.post(
  '/generate-coupons',
  verifyToken,
  checkRole('influencer'),
  generateCoupons
);

// POST /api/influencer/sale
// Supervisor, atendente ou admin podem registrar uma venda no caixa
router.post(
  '/sale',
  verifyToken,
  checkRole('admin', 'supervisor', 'atendente', 'influencer'),
  recordSale
);

// POST /api/influencer/withdraw
// Influencer solicita resgate do cashback
router.post(
  '/withdraw',
  verifyToken,
  checkRole('influencer'),
  requestWithdrawal
);

// POST /api/influencer/withdraw/:id/schedule
// Admin e supervisor agendam data e horário da retirada
router.post(
  '/withdraw/:id/schedule',
  verifyToken,
  checkRole('admin', 'supervisor'),
  scheduleWithdrawal
);

// GET /api/influencer/my-sales
// Apenas a influenciadora consulta o extrato das suas vendas
router.get(
  '/my-sales',
  verifyToken,
  checkRole('influencer'),
  getMySales
);

module.exports = router;
