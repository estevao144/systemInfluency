import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isSupervisor = user?.role === 'supervisor';
  const canViewOverview = isAdmin || isSupervisor;

  const [activeTab, setActiveTab] = useState('venda'); // Inicia em Venda/Caixa para praticidade no balcão
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  // Estoque State
  const [products, setProducts] = useState([]);
  const [productForm, setProductForm] = useState({ title: '', color: '', code: '', photoUrl: '' });
  const [loadingProducts, setLoadingProducts] = useState(false);

  // PDV / Caixa State
  const [saleForm, setSaleForm] = useState({
    productId: '',
    couponCode: '',
    quantity: 1,
    totalValue: '',
  });
  const [validatedCoupon, setValidatedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [recordingSale, setRecordingSale] = useState(false);

  // Influenciadoras State (carregado da API)
  const [influencers, setInfluencers] = useState([]);
  const [loadingInfluencers, setLoadingInfluencers] = useState(false);
  const [influencerForm, setInfluencerForm] = useState({
    name: '', email: '', instagram: '', phone: '', tempPassword: '',
  });

  // Modal State
  const [selectedInfluencer, setSelectedInfluencer] = useState(null);
  const [scheduleData, setScheduleData] = useState({ date: '', time: '' });

  // ─── Utilitário de mensagens ───────────────────────────────────────────────
  const showError   = (msg) => { setError(msg);   setSuccess(''); };
  const showSuccess = (msg) => { setSuccess(msg); setError('');   };
  const clearMsg    = ()    => { setError('');    setSuccess(''); };

  // ─── Produtos ─────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      showError('Erro ao carregar produtos: ' + err.message);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProductForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    clearMsg();
    if (!productForm.title || !productForm.color || !productForm.code) {
      showError('Preencha título, cor e código.');
      return;
    }
    try {
      const newProduct = await api.createProduct(productForm);
      setProducts(prev => [newProduct, ...prev]);
      setProductForm({ title: '', color: '', code: '', photoUrl: '' });
      showSuccess('Produto cadastrado com sucesso!');
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Remover este produto do estoque?')) return;
    clearMsg();
    try {
      await api.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      showSuccess('Produto removido.');
    } catch (err) {
      showError(err.message);
    }
  };

  // ─── Influenciadoras ──────────────────────────────────────────────────────
  const fetchInfluencers = useCallback(async () => {
    setLoadingInfluencers(true);
    try {
      const data = await api.getInfluencers();
      setInfluencers(data);
    } catch (err) {
      showError('Erro ao carregar influenciadoras: ' + err.message);
    } finally {
      setLoadingInfluencers(false);
    }
  }, []);

  // ─── Histórico de Vendas (Admin e Supervisor) ─────────────────────────────
  const [salesHistory, setSalesHistory] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);

  const fetchSales = useCallback(async () => {
    setLoadingSales(true);
    try {
      const data = await api.getSales();
      setSalesHistory(data);
    } catch (err) {
      showError('Erro ao carregar histórico de vendas: ' + err.message);
    } finally {
      setLoadingSales(false);
    }
  }, []);

  useEffect(() => {
    if (canViewOverview) {
      fetchInfluencers();
      fetchSales();
    }
  }, [canViewOverview, fetchInfluencers, fetchSales]);

  const handleInfluencerChange = (e) => {
    const { name, value } = e.target;
    setInfluencerForm(prev => ({ ...prev, [name]: value }));
  };

  const handleInfluencerSubmit = async (e) => {
    e.preventDefault();
    clearMsg();
    if (!influencerForm.name || !influencerForm.email) {
      showError('Nome e email são obrigatórios.');
      return;
    }
    try {
      const result = await api.registerInfluencer(influencerForm);
      // Adiciona à lista local com dados básicos retornados
      setInfluencers(prev => [
        ...prev,
        {
          id: result.influencer.id,
          name: result.influencer.name,
          instagram: result.influencer.instagram || '—',
          coupon_count: 0,
          total_sales: 0,
          total_earned: 0,
          cashbackStatus: null,
          email: result.user.email,
        },
      ]);
      setInfluencerForm({ name: '', email: '', instagram: '', phone: '', tempPassword: '' });
      showSuccess(`Influenciadora cadastrada! Senha temporária: ${result.tempPassword}`);
    } catch (err) {
      showError(err.message);
    }
  };

  const getTierInfo = (totalSales) => {
    const sales = parseInt(totalSales, 10) || 0;
    const isLevel2 = sales >= 50;
    return {
      level:       isLevel2 ? 'Nível 2' : 'Nível 1',
      commission:  isLevel2 ? '10%'     : '8%',
      maxDiscount: isLevel2 ? '15%'     : '10%',
    };
  };

  const openScheduleModal = (influencer) => {
    setSelectedInfluencer(influencer);
    setScheduleData({ date: '', time: '' });
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    clearMsg();
    if (scheduleData.date && scheduleData.time && selectedInfluencer) {
      try {
        if (selectedInfluencer.withdrawal_id) {
          await api.scheduleWithdrawal(selectedInfluencer.withdrawal_id, {
            scheduledDate: scheduleData.date,
            scheduledTime: scheduleData.time,
          });
        }
        setInfluencers(prev =>
          prev.map(inf =>
            inf.id === selectedInfluencer.id
              ? {
                  ...inf,
                  cashback_status: 'AGENDADO',
                  scheduled_date: scheduleData.date,
                  scheduled_time: scheduleData.time,
                }
              : inf
          )
        );
        setSelectedInfluencer(null);
        showSuccess('Retirada agendada com sucesso!');
      } catch (err) {
        showError('Erro ao agendar retirada: ' + err.message);
      }
    }
  };

  // ─── PDV / Registro de Vendas ──────────────────────────────────────────
  const handleSaleChange = (e) => {
    const { name, value } = e.target;
    setSaleForm(prev => ({ ...prev, [name]: value }));
    if (name === 'couponCode') {
      setValidatedCoupon(null); // Reseta validação ao alterar cupom
    }
  };

  const handleValidateCoupon = async () => {
    if (!saleForm.couponCode.trim()) {
      showError('Informe o código do cupom para validar.');
      return;
    }
    clearMsg();
    setValidatingCoupon(true);
    try {
      const res = await api.validateCoupon(saleForm.couponCode.trim());
      setValidatedCoupon(res.coupon);
      showSuccess(`Cupom válido! Desconto de ${res.coupon.discountPercentage}% da influencer ${res.coupon.influencerName}.`);
    } catch (err) {
      setValidatedCoupon(null);
      showError('Cupom inválido: ' + err.message);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRecordSaleSubmit = async (e) => {
    e.preventDefault();
    clearMsg();

    if (!saleForm.productId) {
      showError('Selecione uma peça do estoque.');
      return;
    }
    if (!saleForm.couponCode.trim()) {
      showError('Informe o cupom utilizado pela cliente.');
      return;
    }
    if (!saleForm.totalValue || parseFloat(saleForm.totalValue) <= 0) {
      showError('Informe um valor de venda válido.');
      return;
    }

    setRecordingSale(true);
    try {
      const payload = {
        couponCode: saleForm.couponCode.trim(),
        productId: parseInt(saleForm.productId, 10),
        quantity: parseInt(saleForm.quantity, 10) || 1,
        totalValue: parseFloat(saleForm.totalValue),
      };
      const res = await api.recordSale(payload);
      showSuccess(`Venda registrada! Cashback de R$ ${res.cashbackGenerated} gerado para ${res.influencerName} (${res.commissionRate}% de comissão).`);
      
      // Limpa formulário
      setSaleForm({ productId: '', couponCode: '', quantity: 1, totalValue: '' });
      setValidatedCoupon(null);

      // Atualiza listas de produtos e influenciadoras se tiver acesso
      fetchProducts();
      if (canViewOverview) fetchInfluencers();
    } catch (err) {
      showError('Erro ao registrar venda: ' + err.message);
    } finally {
      setRecordingSale(false);
    }
  };

  return (
    <div className='admin-container'>
      {/* Saudação com role */}
      <div style={{ marginBottom: '1rem', color: '#724852', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>Logado como <strong>{user?.email}</strong></span>
        <span style={{
          fontSize: '0.75rem',
          backgroundColor: isAdmin ? '#fef3c7' : isSupervisor ? '#ede9fe' : '#e0f2fe',
          color: isAdmin ? '#92400e' : isSupervisor ? '#6d28d9' : '#0369a1',
          padding: '0.15rem 0.6rem',
          borderRadius: '999px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          {isAdmin ? '👑 Administrador' : isSupervisor ? '⭐ Supervisor' : '👤 Atendente'}
        </span>
      </div>

      {/* Mensagens de feedback */}
      {error   && <div className='msg-error'>{error}</div>}
      {success && <div className='msg-success'>{success}</div>}

      <div className='tabs'>
        <button className={`tab-btn ${activeTab === 'venda' ? 'active' : ''}`} onClick={() => { setActiveTab('venda'); clearMsg(); }}>
          🛒 Registrar Venda (Caixa)
        </button>
        <button className={`tab-btn ${activeTab === 'estoque' ? 'active' : ''}`} onClick={() => { setActiveTab('estoque'); clearMsg(); }}>
          📦 Estoque
        </button>
        <button className={`tab-btn ${activeTab === 'cadastro-influencer' ? 'active' : ''}`} onClick={() => { setActiveTab('cadastro-influencer'); clearMsg(); }}>
          ➕ Cadastrar Influencer
        </button>
        {canViewOverview && (
          <>
            <button className={`tab-btn ${activeTab === 'visao-geral' ? 'active' : ''}`} onClick={() => { setActiveTab('visao-geral'); clearMsg(); }}>
              📊 Visão Geral
            </button>
            <button className={`tab-btn ${activeTab === 'historico-vendas' ? 'active' : ''}`} onClick={() => { setActiveTab('historico-vendas'); clearMsg(); fetchSales(); }}>
              🧾 Histórico de Vendas
            </button>
          </>
        )}
      </div>

      {/* ── Aba PDV / Registrar Venda (Caixa) ────────────────────────────── */}
      {activeTab === 'venda' && (
        <div className='tab-content'>
          <h2 className='admin-title'>Registrar Venda no Caixa</h2>
          <p style={{ color: '#724852', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Informe a peça vendida e o cupom de desconto apresentado pela cliente no balcão para aplicar o benefício e computar o cashback da influenciadora.
          </p>

          <form className='admin-form' onSubmit={handleRecordSaleSubmit}>
            <div className='form-row'>
              <div className='form-group'>
                <label htmlFor='productId'>Peça / Produto do Estoque</label>
                <select
                  id='productId'
                  name='productId'
                  value={saleForm.productId}
                  onChange={handleSaleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid #e2c0c9',
                    backgroundColor: '#fff',
                    color: '#5c3c43',
                    fontSize: '0.95rem'
                  }}
                >
                  <option value=''>Selecione uma peça...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.title} ({p.color}) {p.stock !== null ? `[Estoque: ${p.stock}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className='form-group'>
                <label htmlFor='quantity'>Quantidade</label>
                <input
                  type='number'
                  id='quantity'
                  name='quantity'
                  min='1'
                  value={saleForm.quantity}
                  onChange={handleSaleChange}
                  required
                />
              </div>
            </div>

            <div className='form-row'>
              <div className='form-group'>
                <label htmlFor='couponCode'>Cupom da Influenciadora</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type='text'
                    id='couponCode'
                    name='couponCode'
                    placeholder='Ex: ANA10'
                    value={saleForm.couponCode}
                    onChange={handleSaleChange}
                    required
                    style={{ textTransform: 'uppercase', flex: 1 }}
                  />
                  <button
                    type='button'
                    onClick={handleValidateCoupon}
                    disabled={validatingCoupon}
                    style={{
                      padding: '0 1rem',
                      backgroundColor: '#b76e79',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.85rem'
                    }}
                  >
                    {validatingCoupon ? 'Checando...' : 'Validar'}
                  </button>
                </div>
                {validatedCoupon && (
                  <div style={{ marginTop: '0.4rem', color: '#15803d', fontSize: '0.85rem', fontWeight: '600' }}>
                    ✓ Cupom {validatedCoupon.code} de {validatedCoupon.influencerName} ({validatedCoupon.discountPercentage}% OFF)
                  </div>
                )}
              </div>

              <div className='form-group'>
                <label htmlFor='totalValue'>Valor Total da Venda (R$)</label>
                <input
                  type='number'
                  step='0.01'
                  id='totalValue'
                  name='totalValue'
                  placeholder='Ex: 189.90'
                  value={saleForm.totalValue}
                  onChange={handleSaleChange}
                  required
                />
              </div>
            </div>

            <button
              type='submit'
              className='submit-btn'
              disabled={recordingSale}
              style={{ backgroundColor: '#2e7d32', width: '100%', marginTop: '0.5rem' }}
            >
              {recordingSale ? 'Gravando Venda...' : '✓ Confirmar e Finalizar Venda'}
            </button>
          </form>
        </div>
      )}

      {/* ── Aba Estoque ─────────────────────────────────────────────────── */}
      {activeTab === 'estoque' && (
        <div className='tab-content'>
          <h2 className='admin-title'>Cadastro de Peças</h2>
          <form className='admin-form' onSubmit={handleProductSubmit}>
            <div className='form-row'>
              <div className='form-group'>
                <label htmlFor='code'>Código (Loja Física)</label>
                <input type='text' id='code' name='code' value={productForm.code} onChange={handleProductChange} placeholder='Ex: C1234' required />
              </div>
              <div className='form-group'>
                <label htmlFor='title'>Título da Peça</label>
                <input type='text' id='title' name='title' value={productForm.title} onChange={handleProductChange} placeholder='Ex: Legging Empina Bumbum' required />
              </div>
            </div>
            <div className='form-row'>
              <div className='form-group'>
                <label htmlFor='color'>Cor</label>
                <input type='text' id='color' name='color' value={productForm.color} onChange={handleProductChange} placeholder='Ex: Rosa Choque' required />
              </div>
              <div className='form-group'>
                <label htmlFor='photoUrl'>URL da Foto</label>
                <input type='text' id='photoUrl' name='photoUrl' value={productForm.photoUrl} onChange={handleProductChange} placeholder='https://...' />
              </div>
            </div>
            <button type='submit' className='submit-btn'>Salvar no Estoque</button>
          </form>

          <h2 className='admin-title'>Estoque Atual</h2>
          {loadingProducts ? (
            <p style={{ color: '#a47c85' }}>Carregando...</p>
          ) : (
            <div className='table-wrapper'>
              <table className='admin-table'>
                <thead>
                  <tr>
                    <th>Foto</th><th>Código</th><th>Título</th><th>Cor</th>
                    {isAdmin && <th>Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {products.map((prod) => (
                    <tr key={prod.id}>
                      <td>
                        <img
                          src={prod.photoUrl || 'https://via.placeholder.com/50'}
                          alt={prod.title}
                          className='product-thumb'
                        />
                      </td>
                      <td><strong>{prod.code}</strong></td>
                      <td>{prod.title}</td>
                      <td>{prod.color}</td>
                      {isAdmin && (
                        <td>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', fontSize: '1rem' }}
                            title='Remover produto'
                          >
                            🗑️
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan={isAdmin ? 5 : 4} className='empty-state'>Nenhum produto cadastrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Aba Cadastro de Influencer ───────────────────────────────────── */}
      {activeTab === 'cadastro-influencer' && (
        <div className='tab-content'>
          <h2 className='admin-title'>Cadastrar Influenciadora</h2>
          <form className='admin-form' onSubmit={handleInfluencerSubmit}>
            <div className='form-row'>
              <div className='form-group'>
                <label htmlFor='name'>Nome Completo</label>
                <input type='text' id='name' name='name' value={influencerForm.name} onChange={handleInfluencerChange} placeholder='Ex: Maria Eduarda' required />
              </div>
              <div className='form-group'>
                <label htmlFor='email'>Email</label>
                <input type='email' id='email' name='email' value={influencerForm.email} onChange={handleInfluencerChange} placeholder='Ex: maria@email.com' required />
              </div>
            </div>
            <div className='form-row'>
              <div className='form-group'>
                <label htmlFor='instagram'>Instagram</label>
                <input type='text' id='instagram' name='instagram' value={influencerForm.instagram} onChange={handleInfluencerChange} placeholder='@maria.eduarda' />
              </div>
              <div className='form-group'>
                <label htmlFor='phone'>Telefone</label>
                <input type='text' id='phone' name='phone' value={influencerForm.phone} onChange={handleInfluencerChange} placeholder='(11) 9 9999-9999' />
              </div>
            </div>
            <div className='form-row'>
              <div className='form-group'>
                <label htmlFor='tempPassword'>Senha Temporária <span style={{ fontWeight: 400, fontSize: '0.8rem' }}>(padrão: mudar@123)</span></label>
                <input type='text' id='tempPassword' name='tempPassword' value={influencerForm.tempPassword} onChange={handleInfluencerChange} placeholder='mínimo 6 caracteres' />
              </div>
            </div>
            <button type='submit' className='submit-btn'>Cadastrar Influenciadora</button>
          </form>
        </div>
      )}

      {/* ── Aba Visão Geral (admin e supervisor) ────────────────────────── */}
      {activeTab === 'visao-geral' && canViewOverview && (
        <div className='tab-content'>
          <h2 className='admin-title'>Visão Geral das Influenciadoras</h2>
          {loadingInfluencers ? (
            <p style={{ color: '#a47c85' }}>Carregando...</p>
          ) : (
            <div className='table-wrapper'>
              <table className='admin-table'>
                <thead>
                  <tr>
                    <th>Influenciadora</th>
                    <th>Instagram</th>
                    <th>Vendas</th>
                    <th>Ganhos Acumulados</th>
                    <th>Nível Atual</th>
                    <th>Comissão</th>
                    <th>Desconto Máx (Cupom)</th>
                    <th>Status de Cashback</th>
                  </tr>
                </thead>
                <tbody>
                  {influencers.map((inf) => {
                    const tierInfo = getTierInfo(inf.total_sales);
                    const earned = parseFloat(inf.total_earned) || 0;
                    return (
                      <tr key={inf.id}>
                        <td><strong>{inf.name}</strong></td>
                        <td>{inf.instagram || '—'}</td>
                        <td>{inf.total_sales} peças</td>
                        <td>R$ {earned.toFixed(2).replace('.', ',')}</td>
                        <td>
                          <span className={`badge ${tierInfo.level === 'Nível 2' ? 'badge-gold' : 'badge-silver'}`}>
                            {tierInfo.level}
                          </span>
                        </td>
                        <td>{tierInfo.commission}</td>
                        <td>{tierInfo.maxDiscount}</td>
                        <td>
                          {inf.cashback_status === 'PENDENTE' ? (
                            <button
                              className='badge badge-gold'
                              style={{ backgroundColor: '#b76e79', color: '#fff', borderColor: '#8c5663', cursor: 'pointer' }}
                              onClick={() => openScheduleModal(inf)}
                            >
                              Pedido Pendente
                            </button>
                          ) : inf.cashback_status === 'AGENDADO' ? (
                            <span className='badge' style={{ backgroundColor: '#2e7d32', color: '#fff', borderColor: '#1b5e20' }}>
                              Agendado ({inf.scheduled_date} às {inf.scheduled_time})
                            </span>
                          ) : (
                            <span style={{ color: '#a47c85', fontSize: '0.9rem' }}>Nenhum pedido</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {influencers.length === 0 && (
                    <tr>
                      <td colSpan='8' className='empty-state'>
                        Nenhuma influenciadora cadastrada. Use a aba "Cadastrar Influencer" para adicionar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Aba Histórico de Vendas / Auditoria (admin e supervisor) ────── */}
      {activeTab === 'historico-vendas' && canViewOverview && (
        <div className='tab-content'>
          <h2 className='admin-title'>Histórico e Auditoria de Vendas no Caixa</h2>
          <p style={{ color: '#724852', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Registro de todas as compras fechadas com cupons de desconto no balcão e comissões geradas.
          </p>
          {loadingSales ? (
            <p style={{ color: '#a47c85' }}>Carregando histórico de vendas...</p>
          ) : (
            <div className='table-wrapper'>
              <table className='admin-table'>
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Peça</th>
                    <th>Código</th>
                    <th>Qtd</th>
                    <th>Cupom Usado</th>
                    <th>Influenciadora</th>
                    <th>Valor Venda</th>
                    <th>Cashback Gerado</th>
                  </tr>
                </thead>
                <tbody>
                  {salesHistory.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontSize: '0.85rem' }}>{s.saleDate}</td>
                      <td><strong>{s.productTitle}</strong> ({s.productColor})</td>
                      <td><span className='badge badge-silver'>{s.productCode}</span></td>
                      <td style={{ textAlign: 'center' }}>{s.quantity}</td>
                      <td>
                        <span style={{ fontWeight: '700', color: '#8c5663', letterSpacing: '0.05em' }}>
                          {s.couponCode}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#a47c85', marginLeft: '0.3rem' }}>
                          ({s.discountPercentage}% OFF)
                        </span>
                      </td>
                      <td>{s.influencerName}</td>
                      <td>R$ {parseFloat(s.totalValue).toFixed(2).replace('.', ',')}</td>
                      <td style={{ color: '#2e7d32', fontWeight: '700' }}>
                        + R$ {parseFloat(s.cashbackValue).toFixed(2).replace('.', ',')}
                      </td>
                    </tr>
                  ))}
                  {salesHistory.length === 0 && (
                    <tr>
                      <td colSpan='8' className='empty-state'>
                        Nenhuma venda registrada até o momento. Use a aba "Registrar Venda (Caixa)" para lançar compras.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de Agendamento */}
      {selectedInfluencer && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <h3 style={{ color: '#8c5663', marginBottom: '1rem' }}>Agendar Retirada</h3>
            <p style={{ marginBottom: '1.5rem', color: '#724852' }}>
              Influenciadora: <strong>{selectedInfluencer.name}</strong><br />
              Valor Acumulado: <strong>R$ {parseFloat(selectedInfluencer.total_earned || 0).toFixed(2).replace('.', ',')}</strong>
            </p>
            <form onSubmit={handleScheduleSubmit}>
              <div className='form-group' style={{ marginBottom: '1rem' }}>
                <label>Data da Retirada</label>
                <input type='date' value={scheduleData.date} onChange={(e) => setScheduleData(prev => ({ ...prev, date: e.target.value }))} required />
              </div>
              <div className='form-group' style={{ marginBottom: '1.5rem' }}>
                <label>Horário</label>
                <input type='time' value={scheduleData.time} onChange={(e) => setScheduleData(prev => ({ ...prev, time: e.target.value }))} required />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type='submit' className='submit-btn' style={{ flex: 1, margin: 0, backgroundColor: '#2e7d32' }}>Confirmar</button>
                <button type='button' className='submit-btn' style={{ flex: 1, margin: 0, backgroundColor: '#a47c85' }} onClick={() => setSelectedInfluencer(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
