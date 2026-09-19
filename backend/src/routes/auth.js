const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// POST /api/auth/register - Criar novo usuário
router.post('/register', AuthController.register);

// POST /api/auth/login - Autenticar e receber JWT
router.post('/login', AuthController.login);

// GET /api/auth/me - Dados do usuário logado (rota protegida)
router.get('/me', verifyToken, AuthController.me);

module.exports = router;
