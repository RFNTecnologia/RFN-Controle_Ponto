import React, { useState } from 'react';
import { getEmpregados } from '../data/storage.js';

export default function Login({ onLogin }) {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [recuperar, setRecuperar] = useState(false);
  const [recLogin, setRecLogin] = useState('');
  const [recSenha, setRecSenha] = useState('');
  const [recMsg, setRecMsg] = useState('');

  const normalizar = (v) => (v || '').trim().toLowerCase();

  const handleSubmit = (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    setTimeout(() => {
      const termo = normalizar(login);
      const emp = getEmpregados().find((e) => {
        if (normalizar(e.matricula) === termo && e.senha === senha) return true;
        return (
          e.senha === senha &&
          (
            normalizar(e.email) === termo ||
            normalizar(e.telefone) === termo ||
            normalizar(e.cpf) === termo
          )
        );
      });

      if (emp) {
        if (!emp.ativo) {
          setErro('Usuário inativo. Contate o administrador.');
          setCarregando(false);
          return;
        }
        onLogin(emp);
      } else {
        setErro('Credenciais incorretas. Verifique e-mail/telefone/CPF/matrícula e senha.');
      }
      setCarregando(false);
    }, 600);
  };

  const handleRecuperar = (e) => {
    e.preventDefault();
    setRecMsg('');
    setErro('');
    const termo = normalizar(recLogin);
    if (!termo || !recSenha || recSenha.length < 4) {
      setRecMsg('Informe o acesso e uma nova senha (mínimo 4 caracteres).');
      return;
    }
    const lista = getEmpregados();
    const idx = lista.findIndex((emp) => {
      return (
        normalizar(emp.matricula) === termo ||
        normalizar(emp.email) === termo ||
        normalizar(emp.telefone) === termo ||
        normalizar(emp.cpf) === termo
      );
    });
    if (idx === -1) {
      setRecMsg('Usuário não encontrado. Verifique o dado informado.');
      return;
    }
    lista[idx] = { ...lista[idx], senha: recSenha };
    localStorage.setItem('ponto.empregados', JSON.stringify(lista));
    setRecMsg('Senha redefinida com sucesso! Faça login com a nova senha.');
    setRecLogin('');
    setRecSenha('');
    setTimeout(() => {
      setRecuperar(false);
      setRecMsg('');
    }, 2500);
  };

  return (
    <div className="login-page">
      {/* LADO ESQUERDO - Branding */}
      <div className="login-brand">
        <div className="login-brand-content">
          <div className="login-logo">
            <img src="/logo.png" alt="RFN Tecnologia" />
          </div>
          <h1 className="login-title">RFNTecnologia</h1>
          <p className="login-tagline">@ Desenvolvimento &amp; Soluções para Software @</p>
          <p className="login-subtitle">⏱️ PontoFácil - Sistema de Controle de Ponto</p>
        </div>
      </div>

      {/* LADO DIREITO - Formulário */}
      <div className="login-form-side">
        <div className="login-form-wrapper">
          <div className="login-form-header">
            <h2>Bem-vindo de volta</h2>
            <p>Entre com suas credenciais para acessar o sistema</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {erro && (
              <div className="login-error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{erro}</span>
              </div>
            )}

            <div className="login-field">
              <label htmlFor="login">Acesso</label>
              <div className="login-input-wrapper">
                <svg className="login-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="login"
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="E-mail, telefone, CPF ou matrícula"
                  required
                  autoFocus
                />
              </div>
              <span className="login-hint">Use e-mail, telefone, CPF ou matrícula</span>
            </div>

            <div className="login-field">
              <label htmlFor="senha">Senha</label>
              <div className="login-input-wrapper">
                <svg className="login-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button type="submit" className="login-submit" disabled={carregando}>
              {carregando ? (
                <>
                  <span className="login-spinner" />
                  Entrando...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Entrar no sistema
                </>
              )}
            </button>
            <button type="button" className="login-forgot" onClick={() => setRecuperar(true)}>Esqueci minha senha</button>
          </form>

          {recuperar && (
            <form onSubmit={handleRecuperar} className="login-form login-recover">
              {recMsg && (
                <div className={`login-message ${recMsg.includes('sucesso') ? 'ok' : 'error'}`}>
                  <span>{recMsg}</span>
                </div>
              )}

              <div className="login-field">
                <label htmlFor="rec-login">Acesso (e-mail, telefone, CPF ou matrícula)</label>
                <div className="login-input-wrapper">
                  <svg className="login-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    id="rec-login"
                    type="text"
                    value={recLogin}
                    onChange={(e) => setRecLogin(e.target.value)}
                    placeholder="Informe seu acesso"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="rec-senha">Nova senha</label>
                <div className="login-input-wrapper">
                  <svg className="login-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="rec-senha"
                    type="password"
                    value={recSenha}
                    onChange={(e) => setRecSenha(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    required
                    minLength={4}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setRecuperar(false); setRecMsg(''); }}>Voltar</button>
                <button type="submit" className="btn-primary">Redefinir senha</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
