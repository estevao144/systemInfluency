const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '8h';

const AuthController = {
  /**
   * POST /api/auth/register
   * Regras:
   *   - Sem token: só pode criar conta 'influencer' (auto-registro público)
   *   - Com token de 'admin': pode criar qualquer role (admin, atendente, influencer)
   *   - Com token de outra role: não pode criar contas privilegiadas
   */
  async register(req, res) {
    try {
      const { email, password, role } = req.body;

      // Validação básica
      if (!email || !password || !role) {
        return res.status(400).json({ error: 'Email, senha e role são obrigatórios.' });
      }

      const validRoles = ['admin', 'supervisor', 'atendente', 'influencer'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: `Role inválida. Use: ${validRoles.join(', ')}` });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
      }

      // --- Verificação de permissão por role ---
      // Roles privilegiadas exigem um admin autenticado para serem criadas
      const restrictedRoles = ['admin', 'supervisor', 'atendente'];
      if (restrictedRoles.includes(role)) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
          return res.status(403).json({
            error: 'Apenas um administrador autenticado pode criar contas com privilégios (admin, supervisor ou atendente).',
          });
        }

        let decoded;
        try {
          decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
          return res.status(401).json({ error: 'Token inválido ou expirado.' });
        }

        if (decoded.role !== 'admin') {
          return res.status(403).json({
            error: 'Apenas administradores podem criar contas de admin ou atendente.',
          });
        }
      }
      // ----------------------------------------

      // Verificar se email já existe
      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'Email já cadastrado.' });
      }

      // Hash da senha
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Criar usuário
      const user = await UserModel.create(email, passwordHash, role);

      // Gerar token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );

      return res.status(201).json({
        message: 'Usuário criado com sucesso.',
        token,
        user: { id: user.id, email: user.email, role: user.role },
      });
    } catch (err) {
      console.error('Erro no register:', err);
      return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  },

  /**
   * POST /api/auth/login
   * Valida credenciais e retorna JWT.
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
      }

      // Buscar usuário
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      // Verificar senha
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      // Gerar token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );

      return res.status(200).json({
        message: 'Login realizado com sucesso.',
        token,
        user: { id: user.id, email: user.email, role: user.role },
      });
    } catch (err) {
      console.error('Erro no login:', err);
      return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  },

  /**
   * GET /api/auth/me
   * Retorna dados do usuário autenticado.
   */
  async me(req, res) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      return res.json({ user });
    } catch (err) {
      console.error('Erro no me:', err);
      return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  },
};

module.exports = AuthController;
