const UserModel = require('../models/userModel');
const InfluencerModel = require('../models/influencerModel');
const CouponModel = require('../models/couponModel');
const WithdrawalModel = require('../models/withdrawalModel');
const SaleModel = require('../models/saleModel');
const pool = require('../config/db');

// Regras de nível
const TIER = {
  level1: { minSales: 0,  maxSales: 49, commission: 8,  maxCouponDiscount: 10 },
  level2: { minSales: 50, maxSales: Infinity, commission: 10, maxCouponDiscount: 15 },
};

const CASHBACK_MIN_WITHDRAWAL = 300;

function getTier(salesCount) {
  return salesCount >= TIER.level2.minSales ? TIER.level2 : TIER.level1;
}

const InfluencerController = {
  /**
   * POST /api/influencer/register
   * Admin ou atendente pré-cadastra uma influenciadora:
   *  1. Cria a conta de usuário (role = 'influencer') com senha temporária
   *  2. Cria o perfil na tabela influencers
   */
  async registerInfluencer(req, res) {
    const client = await pool.connect();
    try {
      const { name, email, instagram, tiktok, youtube, phone, tempPassword } = req.body;

      if (!name || !email) {
        return res.status(400).json({ error: 'Nome e email são obrigatórios.' });
      }

      const password = tempPassword || 'mudar@123';
      if (password.length < 6) {
        return res.status(400).json({ error: 'A senha temporária deve ter no mínimo 6 caracteres.' });
      }

      // Verifica email duplicado
      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'Email já cadastrado.' });
      }

      await client.query('BEGIN');

      // Cria usuário
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await UserModel.create(email, passwordHash, 'influencer');

      // Cria perfil de influencer
      const influencer = await InfluencerModel.create({
        userId: user.id,
        name,
        instagram,
        tiktok,
        youtube,
        phone,
      });

      await client.query('COMMIT');

      return res.status(201).json({
        message: 'Influenciadora cadastrada com sucesso.',
        user: { id: user.id, email: user.email, role: user.role },
        influencer,
        tempPassword: password,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Erro ao registrar influencer:', err);
      return res.status(500).json({ error: 'Erro interno no servidor.' });
    } finally {
      client.release();
    }
  },

  /**
   * GET /api/influencer/me
   * Retorna perfil + métricas do influencer autenticado
   */
  async getMyProfile(req, res) {
    try {
      const profile = await InfluencerModel.findByUserId(req.user.id);
      if (!profile) {
        return res.status(404).json({ error: 'Perfil de influencer não encontrado.' });
      }

      const salesCount = await InfluencerModel.getSalesCount(profile.id);
      const totalEarned = await InfluencerModel.getTotalEarned(profile.id);
      const coupons = await CouponModel.findByInfluencerId(profile.id);
      const activeWithdrawal = await WithdrawalModel.findActiveByInfluencerId(profile.id);
      const tier = getTier(salesCount);

      return res.json({
        profile,
        stats: {
          salesCount,
          totalEarned,
          tier: salesCount >= TIER.level2.minSales ? 'Nível 2' : 'Nível 1',
          commission: tier.commission,
          maxCouponDiscount: tier.maxCouponDiscount,
          canWithdraw: totalEarned >= CASHBACK_MIN_WITHDRAWAL && !activeWithdrawal,
          amountToWithdraw: Math.max(0, CASHBACK_MIN_WITHDRAWAL - totalEarned),
          piecesToNextLevel: Math.max(0, TIER.level2.minSales - salesCount),
          activeWithdrawal,
        },
        coupons,
      });
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
      return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  },

  /**
   * POST /api/influencer/generate-coupons
   * Influencer cria um novo cupom respeitando o desconto máximo do seu nível
   */
  async generateCoupons(req, res) {
    try {
      const { code, discountPercentage, expiresAt } = req.body;

      if (!code || !discountPercentage) {
        return res.status(400).json({ error: 'Código e percentual de desconto são obrigatórios.' });
      }

      const discount = parseFloat(discountPercentage);
      if (isNaN(discount) || discount <= 0) {
        return res.status(400).json({ error: 'Percentual de desconto inválido.' });
      }

      // Busca perfil e nível atual
      const profile = await InfluencerModel.findByUserId(req.user.id);
      if (!profile) {
        return res.status(404).json({ error: 'Perfil de influencer não encontrado.' });
      }

      const salesCount = await InfluencerModel.getSalesCount(profile.id);
      const tier = getTier(salesCount);

      if (discount > tier.maxCouponDiscount) {
        return res.status(400).json({
          error: `Desconto máximo permitido para o seu nível é de ${tier.maxCouponDiscount}%.`,
        });
      }

      const coupon = await CouponModel.create({
        influencerId: profile.id,
        code,
        discountPercentage: discount,
        expiresAt,
      });

      return res.status(201).json({ message: 'Cupom criado com sucesso.', coupon });
    } catch (err) {
      // Viola unique constraint do código
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Código de cupom já está em uso.' });
      }
      console.error('Erro ao gerar cupom:', err);
      return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  },

  /**
   * GET /api/influencer/coupon/:code
   * Valida um cupom no caixa antes de fechar a venda
   */
  async validateCoupon(req, res) {
    try {
      const { code } = req.params;
      const coupon = await CouponModel.findByCode(code);
      if (!coupon) {
        return res.status(404).json({ error: 'Cupom não encontrado ou expirado.' });
      }

      return res.json({
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discountPercentage: coupon.discount_percentage,
          influencerId: coupon.influencer_id,
          influencerName: coupon.influencer_name,
        },
      });
    } catch (err) {
      console.error('Erro ao validar cupom:', err);
      return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  },

  /**
   * POST /api/influencer/sale
   * Registra uma venda usando um cupom no caixa.
   * Decrementa o estoque do produto e calcula o cashback da influenciadora.
   */
  async recordSale(req, res) {
    const client = await pool.connect();
    try {
      const { couponCode, productId, quantity = 1, totalValue } = req.body;

      if (!couponCode || !productId || !totalValue) {
        return res.status(400).json({
          error: 'couponCode, productId e totalValue são obrigatórios.',
        });
      }

      const numQuantity = parseInt(quantity, 10);
      if (isNaN(numQuantity) || numQuantity <= 0) {
        return res.status(400).json({ error: 'Quantidade inválida.' });
      }

      const coupon = await CouponModel.findByCode(couponCode);
      if (!coupon) {
        return res.status(404).json({ error: 'Cupom inválido, inativo ou expirado.' });
      }

      await client.query('BEGIN');

      // Verifica e atualiza estoque do produto se houver controle
      const prodRes = await client.query('SELECT id, title, stock, price FROM products WHERE id = $1 FOR UPDATE', [productId]);
      if (prodRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Produto não encontrado.' });
      }

      const product = prodRes.rows[0];
      if (product.stock !== null && product.stock !== undefined && product.stock >= numQuantity) {
        await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [numQuantity, productId]);
      }

      // Calcula comissão pelo nível da influenciadora dona do cupom
      const salesCount = await InfluencerModel.getSalesCount(coupon.influencer_id);
      const tier = getTier(salesCount);
      const cashbackValue = parseFloat(totalValue) * (tier.commission / 100);

      const saleRes = await client.query(
        `INSERT INTO sales (coupon_id, product_id, quantity, total_value, cashback_value)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [coupon.id, productId, numQuantity, totalValue, cashbackValue.toFixed(2)]
      );

      await client.query('COMMIT');

      return res.status(201).json({
        message: 'Venda registrada com sucesso no caixa!',
        sale: saleRes.rows[0],
        influencerName: coupon.influencer_name,
        cashbackGenerated: cashbackValue.toFixed(2),
        commissionRate: tier.commission,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Erro ao registrar venda:', err);
      return res.status(500).json({ error: 'Erro interno no servidor.' });
    } finally {
      client.release();
    }
  },

  /**
   * GET /api/influencer/list
   * Admin e atendente podem listar todas as influenciadoras com estatísticas
   */
  async listInfluencers(req, res) {
    try {
      const influencers = await InfluencerModel.findAllWithStats();
      return res.json(influencers);
    } catch (err) {
      console.error('Erro ao listar influenciadoras:', err);
      return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  },

  /**
   * POST /api/influencer/withdraw
   * Influencer solicita o resgate do cashback acumulado (mínimo de R$ 300)
   */
  async requestWithdrawal(req, res) {
    try {
      const profile = await InfluencerModel.findByUserId(req.user.id);
      if (!profile) {
        return res.status(404).json({ error: 'Perfil de influencer não encontrado.' });
      }

      // Verifica se já tem pedido em andamento
      const activeWithdrawal = await WithdrawalModel.findActiveByInfluencerId(profile.id);
      if (activeWithdrawal) {
        return res.status(400).json({
          error: `Você já possui um pedido de retirada em status '${activeWithdrawal.status}'.`,
        });
      }

      const totalEarned = await InfluencerModel.getTotalEarned(profile.id);
      if (totalEarned < CASHBACK_MIN_WITHDRAWAL) {
        return res.status(400).json({
          error: `O saldo mínimo para resgate é de R$ ${CASHBACK_MIN_WITHDRAWAL},00. Seu saldo atual é R$ ${totalEarned.toFixed(2)}.`,
        });
      }

      const withdrawal = await WithdrawalModel.create({
        influencerId: profile.id,
        amount: totalEarned,
      });

      return res.status(201).json({
        message: 'Solicitação de retirada de cashback enviada com sucesso! Aguarde o agendamento da loja.',
        withdrawal,
      });
    } catch (err) {
      console.error('Erro ao solicitar retirada:', err);
      return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  },

  /**
   * POST /api/influencer/withdraw/:id/schedule
   * Admin e atendente agendam data e hora para a retirada do cashback
   */
  async scheduleWithdrawal(req, res) {
    try {
      const { id } = req.params;
      const { scheduledDate, scheduledTime } = req.body;

      if (!scheduledDate || !scheduledTime) {
        return res.status(400).json({ error: 'Data e horário de retirada são obrigatórios.' });
      }

      const updated = await WithdrawalModel.schedule(id, scheduledDate, scheduledTime);
      if (!updated) {
        return res.status(404).json({ error: 'Solicitação de retirada não encontrada.' });
      }

      return res.json({
        message: 'Retirada agendada com sucesso.',
        withdrawal: updated,
      });
    } catch (err) {
      console.error('Erro ao agendar retirada:', err);
      return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  },

  /**
   * GET /api/influencer/my-sales
   * Retorna o extrato detalhado de vendas geradas pelos cupons da influenciadora
   */
  async getMySales(req, res) {
    try {
      const profile = await InfluencerModel.findByUserId(req.user.id);
      if (!profile) {
        return res.status(404).json({ error: 'Perfil de influencer não encontrado.' });
      }

      const sales = await SaleModel.findByInfluencerId(profile.id);
      return res.json(sales);
    } catch (err) {
      console.error('Erro ao buscar extrato de vendas:', err);
      return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  },
};

module.exports = InfluencerController;
