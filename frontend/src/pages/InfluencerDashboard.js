import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './InfluencerDashboard.css';

const CASHBACK_MIN = 300;
const LEVEL2_MIN   = 50;

export default function InfluencerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('painel');

  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  // Dados vindos da API
  const [profile, setProfile]     = useState(null);
  const [stats, setStats]         = useState(null);
  const [coupons, setCoupons]     = useState([]);
  const [products, setProducts]   = useState([]);
  const [mySales, setMySales]     = useState([]);
  const [loadingMySales, setLoadingMySales] = useState(false);

  // Form de criação de cupom
  const [newCouponCode, setNewCouponCode]         = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState('');
  const [creatingCoupon, setCreatingCoupon]       = useState(false);

  const showError   = (msg) => { setError(msg);   setSuccess(''); };
  const showSuccess = (msg) => { setSuccess(msg); setError('');   };

  // ─── Carrega perfil + métricas + cupons ──────────────────────────────────
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getMyProfile();
      setProfile(data.profile);
      setStats(data.stats);
      setCoupons(data.coupons);
    } catch (err) {
      showError('Erro ao carregar perfil: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Carrega extrato de vendas ───────────────────────────────────────────
  const fetchMySales = useCallback(async () => {
    setLoadingMySales(true);
    try {
      const data = await api.getMySales();
      setMySales(data);
    } catch (err) {
      showError('Erro ao carregar extrato de vendas: ' + err.message);
    } finally {
      setLoadingMySales(false);
    }
  }, []);

  // ─── Carrega estoque ─────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      showError('Erro ao carregar estoque: ' + err.message);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchMySales();
  }, [fetchProfile, fetchMySales]);
  useEffect(() => { if (activeTab === 'estoque') fetchProducts(); }, [activeTab, fetchProducts]);

  // ─── Criar cupom ─────────────────────────────────────────────────────────
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setError('');
    const discountVal = parseInt(newCouponDiscount, 10);
    if (!newCouponCode || !discountVal) return;

    if (stats && discountVal > stats.maxCouponDiscount) {
      showError(`O desconto máximo permitido para o seu nível é de ${stats.maxCouponDiscount}%.`);
      return;
    }

    setCreatingCoupon(true);
    try {
      const result = await api.generateCoupon({
        code: newCouponCode,
        discountPercentage: discountVal,
      });
      setCoupons(prev => [result.coupon, ...prev]);
      setNewCouponCode('');
      setNewCouponDiscount('');
      showSuccess('Cupom criado com sucesso!');
    } catch (err) {
      showError(err.message);
    } finally {
      setCreatingCoupon(false);
    }
  };

  // ─── Resgate de Cashback ──────────────────────────────────────────────────
  const handleRequestWithdrawal = async () => {
    if (!window.confirm(`Deseja solicitar o resgate de R$ ${parseFloat(totalEarned).toFixed(2).replace('.', ',')}?`)) {
      return;
    }
    setError('');
    try {
      const res = await api.requestWithdrawal();
      showSuccess(res.message || 'Solicitação de retirada enviada com sucesso!');
      fetchProfile();
    } catch (err) {
      showError(err.message);
    }
  };

  // ─── WhatsApp ────────────────────────────────────────────────────────────
  const handleWhatsAppRequest = (productTitle) => {
    const adminPhone = process.env.REACT_APP_ADMIN_PHONE || '5511999999999';
    const name = profile?.name || user?.email || 'Influenciadora';
    const message = encodeURIComponent(
      `Olá, sou a influenciadora ${name} e preciso de ajuda com a peça: ${productTitle}. Poderia me orientar?`
    );
    window.open(`https://wa.me/${adminPhone}?text=${message}`, '_blank');
  };

  // ─── Estados derivados ───────────────────────────────────────────────────
  const isLevel2        = stats ? stats.salesCount >= LEVEL2_MIN : false;
  const progressPercent = isLevel2 ? 100 : ((stats?.salesCount || 0) / LEVEL2_MIN) * 100;
  const maxDiscount     = stats?.maxCouponDiscount || 10;
  const totalEarned     = stats?.totalEarned || 0;
  const canWithdraw     = totalEarned >= CASHBACK_MIN;

  // ─── Loading e erros iniciais ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className='influencer-container'>
        <p style={{ color: '#a47c85', textAlign: 'center', marginTop: '3rem' }}>Carregando seu painel...</p>
      </div>
    );
  }

  if (!profile && !loading) {
    return (
      <div className='influencer-container'>
        <div style={{ backgroundColor: '#fdecea', color: '#c0392b', padding: '1rem', borderRadius: '8px' }}>
          Perfil de influencer não encontrado. Entre em contato com o administrador.
        </div>
      </div>
    );
  }

  return (
    <div className='influencer-container'>
      <header className='dash-header'>
        <h2>Olá, {profile?.name || user?.email}! ✨</h2>
        <p>Acompanhe seu desempenho e crie novos cupons para suas seguidoras.</p>
      </header>

      {error   && <div style={{ backgroundColor: '#fdecea', color: '#c0392b', border: '1px solid #f1948a', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
      {success && <div style={{ backgroundColor: '#eafaf1', color: '#1e8449', border: '1px solid #82e0aa', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.9rem' }}>{success}</div>}

      <div className='tabs' style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', borderBottom: '2px solid #f2d5dc', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('painel')}
          style={{ background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: '600', color: activeTab === 'painel' ? '#8c5663' : '#a47c85', cursor: 'pointer', borderBottom: activeTab === 'painel' ? '3px solid #b76e79' : 'none' }}
        >
          Meu Painel
        </button>
        <button
          onClick={() => setActiveTab('estoque')}
          style={{ background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: '600', color: activeTab === 'estoque' ? '#8c5663' : '#a47c85', cursor: 'pointer', borderBottom: activeTab === 'estoque' ? '3px solid #b76e79' : 'none' }}
        >
          Ver Estoque
        </button>
      </div>

      {/* ── Aba Meu Painel ──────────────────────────────────────────────── */}
      {activeTab === 'painel' && (
        <>
          <div className='stats-grid'>
            <div className='stat-card'>
              <h3>Peças Vendidas</h3>
              <div className='stat-value'>{stats?.salesCount ?? 0}</div>
            </div>
            <div className='stat-card'>
              <h3>Sua Comissão Atual</h3>
              <div className='stat-value'>{stats?.commission ?? 8}%</div>
              <p className='stat-desc'>Cashback por venda</p>
            </div>
            <div className='stat-card highlight'>
              <h3>Ganhos Acumulados</h3>
              <div className='stat-value'>
                R$ {parseFloat(totalEarned).toFixed(2).replace('.', ',')}
              </div>
              <div className='withdrawal-section'>
                {stats?.activeWithdrawal ? (
                  <div style={{ marginTop: '0.5rem' }}>
                    <span
                      className='badge'
                      style={{
                        backgroundColor: stats.activeWithdrawal.status === 'AGENDADO' ? '#2e7d32' : '#d97706',
                        color: '#fff',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '6px',
                        display: 'inline-block',
                        fontSize: '0.85rem',
                      }}
                    >
                      {stats.activeWithdrawal.status === 'AGENDADO'
                        ? `Retirada Agendada: ${stats.activeWithdrawal.scheduledDate} às ${stats.activeWithdrawal.scheduledTime}`
                        : 'Retirada Pendente de Agendamento'}
                    </span>
                  </div>
                ) : canWithdraw ? (
                  <button className='btn-withdraw active' onClick={handleRequestWithdrawal}>
                    Resgatar Cashback
                  </button>
                ) : (
                  <>
                    <button className='btn-withdraw disabled' disabled>Resgate Bloqueado</button>
                    <p className='stat-desc' style={{ color: '#d9534f', fontSize: '0.8rem', marginTop: '5px' }}>
                      *Mínimo de R$ 300,00. Faltam R$ {(CASHBACK_MIN - totalEarned).toFixed(2).replace('.', ',')}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className='level-card'>
            <div className='level-header'>
              <h3>{isLevel2 ? '🏆 Nível 2 Alcançado!' : '⭐ Nível 1'}</h3>
              <span>Desconto Máximo liberado: <strong>{maxDiscount}%</strong></span>
            </div>
            {!isLevel2 && (
              <>
                <div className='progress-bar-bg'>
                  <div className='progress-bar-fill' style={{ width: `${progressPercent}%` }} />
                </div>
                <p className='level-hint'>
                  Faltam <strong>{stats?.piecesToNextLevel ?? LEVEL2_MIN} peças</strong> para o Nível 2 (10% de comissão e cupons de até 15%!).
                </p>
              </>
            )}
          </div>

          <div className='dashboard-content'>
            <div className='create-coupon-section'>
              <h3 className='section-title'>Criar Novo Cupom</h3>
              <form className='coupon-form' onSubmit={handleCreateCoupon}>
                <div className='form-group'>
                  <label>Código do Cupom</label>
                  <input
                    type='text'
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value)}
                    placeholder='Ex: ANAFIT'
                    required
                  />
                </div>
                <div className='form-group'>
                  <label>Desconto (%)</label>
                  <input
                    type='number'
                    value={newCouponDiscount}
                    onChange={(e) => setNewCouponDiscount(e.target.value)}
                    placeholder={`Máx: ${maxDiscount}%`}
                    max={maxDiscount}
                    min='1'
                    required
                  />
                </div>
                <button type='submit' className='btn-primary' disabled={creatingCoupon}>
                  {creatingCoupon ? 'Gerando...' : 'Gerar Cupom'}
                </button>
              </form>
            </div>

            <div className='my-coupons-section'>
              <h3 className='section-title'>Meus Cupons Ativos</h3>
              <div className='coupons-list'>
                {coupons.filter(c => c.isActive).map((coupon) => (
                  <div key={coupon.id} className='coupon-card'>
                    <div className='coupon-code'>{coupon.code}</div>
                    <div className='coupon-details'>
                      <span>Desconto: <strong>{coupon.discountPercentage}%</strong></span>
                      <span>Usos: <strong>{coupon.uses ?? 0}</strong></span>
                    </div>
                  </div>
                ))}
                {coupons.filter(c => c.isActive).length === 0 && (
                  <p style={{ color: '#a47c85' }}>Nenhum cupom ativo. Crie seu primeiro cupom!</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Extrato Detalhado de Vendas ─────────────────────────────── */}
          <div style={{ marginTop: '2.5rem' }}>
            <h3 className='section-title' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🧾 Extrato de Vendas com Seus Cupons</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '400', color: '#724852' }}>
                {mySales.length} {mySales.length === 1 ? 'venda registrada' : 'vendas registradas'}
              </span>
            </h3>

            {loadingMySales ? (
              <p style={{ color: '#a47c85' }}>Carregando extrato de vendas...</p>
            ) : mySales.length > 0 ? (
              <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #f2d5dc', padding: '0.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f2d5dc', color: '#8c5663' }}>
                      <th style={{ padding: '0.75rem' }}>Data</th>
                      <th style={{ padding: '0.75rem' }}>Peça Vendida</th>
                      <th style={{ padding: '0.75rem' }}>Código</th>
                      <th style={{ padding: '0.75rem' }}>Cupom</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Qtd</th>
                      <th style={{ padding: '0.75rem' }}>Valor da Peça</th>
                      <th style={{ padding: '0.75rem', color: '#2e7d32' }}>Seu Cashback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mySales.map((sale) => (
                      <tr key={sale.id} style={{ borderBottom: '1px solid #fdf2f4' }}>
                        <td style={{ padding: '0.75rem', color: '#724852', fontSize: '0.85rem' }}>{sale.saleDate}</td>
                        <td style={{ padding: '0.75rem', color: '#5c3c43', fontWeight: '600' }}>
                          {sale.productTitle} <span style={{ fontWeight: '400', color: '#a47c85' }}>({sale.productColor})</span>
                        </td>
                        <td style={{ padding: '0.75rem' }}><span style={{ backgroundColor: '#f5f5f5', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>{sale.productCode}</span></td>
                        <td style={{ padding: '0.75rem', color: '#8c5663', fontWeight: '700' }}>{sale.couponCode}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>{sale.quantity}</td>
                        <td style={{ padding: '0.75rem' }}>R$ {parseFloat(sale.totalValue).toFixed(2).replace('.', ',')}</td>
                        <td style={{ padding: '0.75rem', color: '#2e7d32', fontWeight: '700' }}>
                          + R$ {parseFloat(sale.cashbackValue).toFixed(2).replace('.', ',')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: '#a47c85', fontStyle: 'italic' }}>
                Nenhuma venda registrada ainda. Compartilhe seus cupons nas suas redes para começar a faturar!
              </p>
            )}
          </div>
        </>
      )}

      {/* ── Aba Ver Estoque ──────────────────────────────────────────────── */}
      {activeTab === 'estoque' && (
        <div>
          <h3 className='section-title'>Estoque Disponível</h3>
          <p style={{ color: '#724852', marginBottom: '1.5rem' }}>
            Confira as peças disponíveis para criar campanhas. Precisou de algo? Chame o admin no WhatsApp.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {products.map(prod => (
              <div key={prod.id} style={{ backgroundColor: '#fff', border: '1px solid #f2d5dc', borderRadius: '8px', padding: '1rem', textAlign: 'center', boxShadow: '0 4px 6px rgba(212, 163, 179, 0.1)' }}>
                <img
                  src={prod.photoUrl || 'https://via.placeholder.com/250x180?text=Sem+Foto'}
                  alt={prod.title}
                  style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '6px', marginBottom: '1rem' }}
                />
                <h4 style={{ color: '#8c5663', marginBottom: '0.5rem' }}>{prod.title}</h4>
                <p style={{ color: '#724852', marginBottom: '1rem' }}>Cor: {prod.color}</p>
                <button
                  onClick={() => handleWhatsAppRequest(prod.title)}
                  style={{ backgroundColor: '#25D366', color: '#fff', border: 'none', padding: '0.6rem', width: '100%', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  💬 Preciso de Ajuda
                </button>
              </div>
            ))}
            {products.length === 0 && (
              <p style={{ color: '#a47c85' }}>O estoque ainda não foi atualizado pelo Admin.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
