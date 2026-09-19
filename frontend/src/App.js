import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import InfluencerDashboard from "./pages/InfluencerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Home from "./pages/Home";
import Login from "./pages/Login";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <div className="container" style={{ padding: "1rem" }}>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />

            {/* Rota do Admin, Supervisor e Atendente */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin', 'supervisor', 'atendente']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Rota do Influencer */}
            <Route
              path="/influencers"
              element={
                <ProtectedRoute allowedRoles={['influencer']}>
                  <InfluencerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Qualquer rota desconhecida → home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
