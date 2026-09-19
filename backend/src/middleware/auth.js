const jwt = require('jsonwebtoken');

/**
 * Middleware: verifica se o token JWT é válido
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

/**
 * Middleware: verifica se o usuário tem uma das roles permitidas
 * 
 * Hierarquia de permissões:
 *  - admin      → acesso total
 *  - atendente  → cadastros, mas NÃO vê valores de venda e cashback
 *  - influencer → somente acesso ao próprio perfil/cupons/vendas
 * 
 * @param {...string} roles - Roles permitidas para a rota
 */
const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Acesso negado. Apenas [${roles.join(', ')}] podem acessar esta rota.`,
      });
    }

    next();
  };
};

module.exports = { verifyToken, checkRole };
