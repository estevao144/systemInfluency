import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const ROLE_LABELS = {
  admin:      { label: 'Admin',      color: '#7c3aed', bg: '#ede9fe' },
  atendente:  { label: 'Atendente',  color: '#0369a1', bg: '#e0f2fe' },
  influencer: { label: 'Influencer', color: '#b76e79', bg: '#fce7f3' },
};

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleInfo = user ? ROLE_LABELS[user.role] : null;

  return (
    <header className="header">
      <NavLink to="/" className="header__logo">Cashback Influencer</NavLink>

      <ul className="header__nav">
        {!isAuthenticated ? (
          <>
            <li>
              <NavLink to="/" end className="header__link">Home</NavLink>
            </li>
            <li>
              <NavLink to="/login" className="header__button" style={{ textDecoration: 'none' }}>
                Fazer Login
              </NavLink>
            </li>
          </>
        ) : (
          <>
            {/* Badge de role */}
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {roleInfo && (
                <span style={{
                  fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.6rem',
                  borderRadius: '999px', backgroundColor: roleInfo.bg, color: roleInfo.color,
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                  {roleInfo.label}
                </span>
              )}
              <span style={{ color: '#374151', fontWeight: '500', fontSize: '0.9rem' }}>
                {user.email}
              </span>
            </li>

            {/* Link para o dashboard correto */}
            <li>
              {user.role === 'influencer' ? (
                <NavLink to="/influencers" className="header__link">Meu Painel</NavLink>
              ) : (
                <NavLink to="/admin" className="header__link">Painel Admin</NavLink>
              )}
            </li>

            {/* Botão de logout */}
            <li>
              <button
                onClick={handleLogout}
                className="header__button"
                style={{ backgroundColor: '#fee2e2', color: '#b91c1c', cursor: 'pointer' }}
              >
                Sair
              </button>
            </li>
          </>
        )}
      </ul>
    </header>
  );
}
