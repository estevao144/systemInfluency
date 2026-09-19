import React, { useState } from 'react';
import './Home.css';

export default function Home() {
  const [form, setForm] = useState({ name: '', instagram: '', city: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.name && form.instagram && form.city) {
      setSubmitted(true);
      // Aqui enviará para a API no futuro
    }
  };

  return (
    <div className="home-container" style={{ maxWidth: '700px', textAlign: 'center' }}>
      <h1 className="home-title" style={{ fontSize: '2.5rem', border: 'none', marginBottom: '0.5rem' }}>
        Seja uma Influenciadora Parceira
      </h1>
      <p style={{ color: '#a47c85', marginBottom: '2rem', fontSize: '1.1rem' }}>
        Cadastre-se para divulgar nossas peças, oferecer cupons exclusivos para seus seguidores e ganhar cashback para resgatar na loja!
      </p>

      {submitted ? (
        <div style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '2rem', borderRadius: '12px', border: '1px solid #c8e6c9' }}>
          <h2>Cadastro Recebido! 🎉</h2>
          <p>Nossa equipe vai analisar o seu perfil e entraremos em contato muito em breve.</p>
        </div>
      ) : (
        <form className="home-form" onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label>Nome Completo</label>
            <input 
              type="text" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
              placeholder="Ex: Maria Eduarda" 
              required 
            />
          </div>
          <div className="form-group">
            <label>Instagram</label>
            <input 
              type="text" 
              value={form.instagram} 
              onChange={e => setForm({...form, instagram: e.target.value})} 
              placeholder="Ex: @maria.eduarda" 
              required 
            />
          </div>
          <div className="form-group">
            <label>Cidade / Estado</label>
            <input 
              type="text" 
              value={form.city} 
              onChange={e => setForm({...form, city: e.target.value})} 
              placeholder="Ex: São Paulo, SP" 
              required 
            />
          </div>
          <button type="submit" className="submit-btn" style={{ width: '100%', marginTop: '1rem' }}>
            Enviar Solicitação
          </button>
        </form>
      )}
    </div>
  );
}
