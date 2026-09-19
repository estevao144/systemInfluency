import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protege uma rota exigindo autenticação e role adequada.
 *
 * @param {string[]} allowedRoles - Roles que podem acessar a rota
 * @param {JSX.Element} children  - Componente a renderizar se autorizado
 *
 * Comportamento:
 *  - Não logado              → redireciona para /login
 *  - Logado mas role errada  → redireciona para a rota correta da role
 *  - Autorizado              → renderiza children normalmente
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, user, loading } = useAuth();

  // Aguarda a restauração da sessão do localStorage
  if (loading) return null;

  // Não autenticado → login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role não permitida → redireciona para a área certa
  if (!allowedRoles.includes(user.role)) {
    if (user.role === 'influencer') return <Navigate to="/influencers" replace />;
    if (user.role === 'admin' || user.role === 'atendente') return <Navigate to="/admin" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
