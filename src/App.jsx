import React, { useState, useEffect } from 'react';
import { initDB } from './data/storage.js';
import Login from './components/Login.jsx';
import ColaboradorDashboard from './components/ColaboradorDashboard.jsx';
import Admin from './components/Admin.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let ativo = true;
    initDB().finally(() => {
      if (ativo) setReady(true);
    });
    const salvo = localStorage.getItem('ponto.session');
    if (salvo) {
      try {
        const s = JSON.parse(salvo);
        setUser(s);
      } catch {}
    }
    return () => {
      ativo = false;
    };
  }, []);

  const handleLogin = (emp) => {
    setUser(emp);
    localStorage.setItem('ponto.session', JSON.stringify(emp));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ponto.session');
  };

  if (!ready) {
    return (
      <div className="loading-page">
        <div className="loading-spinner" />
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Admin vai para painel administrativo, colaborador para painel próprio
  if (user.admin) {
    return <Admin onLogout={handleLogout} />;
  }

  return <ColaboradorDashboard emp={user} onLogout={handleLogout} />;
}
