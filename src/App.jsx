import React, { useState, useEffect } from 'react';
import { loadAuthenticatedProfile, signOut } from './data/auth.js';
import { clearDB } from './data/storage.js';
import { supabase } from './data/supabase.js';
import Login from './components/Login.jsx';
import ColaboradorDashboard from './components/ColaboradorDashboard.jsx';
import Admin from './components/Admin.jsx';
import AlterarSenha from './components/AlterarSenha.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [erro, setErro] = useState('');
  const [recuperacaoSenha, setRecuperacaoSenha] = useState(
    window.location.hash.includes('type=recovery')
  );

  useEffect(() => {
    let ativo = true;
    clearDB();
    if (!supabase) {
      setErro('A conexão com o Supabase não foi configurada para este endereço.');
      setReady(true);
      return () => {
        ativo = false;
      };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setRecuperacaoSenha(true);
      if (event === 'SIGNED_OUT') {
        setUser(null);
        clearDB();
      }
    });

    supabase.auth.getSession()
      .then(async ({ data, error }) => {
        if (error) throw error;
        if (data.session) {
          const profile = await loadAuthenticatedProfile(data.session.user.id);
          if (ativo) setUser(profile);
        } else {
          clearDB();
        }
      })
      .catch((error) => {
        if (ativo) setErro(error.message || 'Não foi possível iniciar a sessão.');
      })
      .finally(() => {
        if (ativo) setReady(true);
      });

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (emp) => {
    setUser(emp);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
      setErro('');
    } catch (error) {
      setErro(error.message);
    }
  };

  if (!ready) {
    return (
      <div className="loading-page">
        <div className="loading-spinner" />
        <p>Carregando...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="loading-page">
        <p className="error-msg">{erro}</p>
        <button className="btn-primary" onClick={() => window.location.reload()}>Tentar novamente</button>
      </div>
    );
  }

  if (recuperacaoSenha) {
    return <AlterarSenha onDone={() => setRecuperacaoSenha(false)} />;
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
