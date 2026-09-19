import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Se já estiver logado, redireciona para a área correta
  if (isAuthenticated && user) {
    if (user.role === 'influencer') return <Navigate to="/influencers" replace />;
    return <Navigate to="/admin" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      // Redireciona baseado na role real do servidor
      if (loggedUser.role === 'influencer') {
        navigate('/influencers');
      } else {
        navigate('/admin'); // admin e atendente
      }
    } catch (err) {
      setError(err.message || 'Credenciais inválidas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '400px', margin: '4rem auto', backgroundColor: '#fff',
      padding: '2rem', borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(212, 163, 179, 0.15)', border: '1px solid #f2d5dc'
    }}>
      <h2 style={{ textAlign: 'center', color: '#8c5663', marginBottom: '1.5rem' }}>
        Fazer Login
      </h2>

      {error && (
        <div style={{
          backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
          padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1rem',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ color: '#724852', fontWeight: '500' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Seu email..."
            style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #dcb5bf' }}
            required
            disabled={loading}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ color: '#724852', fontWeight: '500' }}>Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha..."
            style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #dcb5bf' }}
            required
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.8rem', marginTop: '1rem',
            backgroundColor: loading ? '#d4a0a9' : '#b76e79',
            color: '#fff', border: 'none', borderRadius: '6px',
            fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
