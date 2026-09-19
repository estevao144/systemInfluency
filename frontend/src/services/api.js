// Centraliza todas as chamadas HTTP ao backend
// Injeta automaticamente o token JWT se existir no localStorage

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:81';

function getToken() {
  return localStorage.getItem('token');
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${path}`, config);

  // Token expirado ou inválido → força logout
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro na requisição');
  }

  return data;
}

const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  put:    (path, body)  => request('PUT',    path, body),
  delete: (path)        => request('DELETE', path),

  // Auth
  login:    (email, password)       => request('POST', '/api/auth/login',    { email, password }),
  register: (email, password, role) => request('POST', '/api/auth/register', { email, password, role }),
  me:       ()                      => request('GET',  '/api/auth/me'),

  // Admin — Produtos
  getProducts:   ()     => request('GET',    '/api/admin/products'),
  createProduct: (data) => request('POST',   '/api/admin/products', data),
  updateProduct: (id, data) => request('PUT', `/api/admin/products/${id}`, data),
  deleteProduct: (id)   => request('DELETE', `/api/admin/products/${id}`),

  // Admin — Influencers
  getInfluencers:     ()     => request('GET',  '/api/influencer/list'),
  registerInfluencer: (data) => request('POST', '/api/influencer/register', data),
  scheduleWithdrawal: (id, data) => request('POST', `/api/influencer/withdraw/${id}/schedule`, data),

  // Admin — Vendas / Histórico
  getSales:           ()       => request('GET',  '/api/admin/sales'),

  // Influencer / PDV — Perfil e operações
  getMyProfile:      ()       => request('GET',  '/api/influencer/me'),
  getMySales:        ()       => request('GET',  '/api/influencer/my-sales'),
  generateCoupon:    (data)   => request('POST', '/api/influencer/generate-coupons', data),
  validateCoupon:    (code)   => request('GET',  `/api/influencer/coupon/${code}`),
  recordSale:        (data)   => request('POST', '/api/influencer/sale', data),
  requestWithdrawal: ()       => request('POST', '/api/influencer/withdraw'),
};

export default api;
