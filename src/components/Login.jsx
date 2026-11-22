import React, { useState } from 'react';
import {
  requestPasswordReset,
  signInWithEmail,
  signUpWithInvite,
} from '../data/auth.js';
import { LOGO_URL } from '../data/branding.js';

export default function Login({ onLogin }) {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [recuperar, setRecuperar] = useState(false);
  const [recLogin, setRecLogin] = useState('');
  const [recMsg, setRecMsg] = useState('');
  const [cadastrar, setCadastrar] = useState(false);
  const [cadSenha, setCadSenha] = useState('');
  const [cadConfirmacao, setCadConfirmacao] = useState('');
  const [cadMsg, setCadMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const emp = await signInWithEmail(login, senha);
      onLogin(emp);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  };

  const handleRecuperar = async (e) => {
    e.preventDefault();
    setRecMsg('');
    setErro('');
    try {
      await requestPasswordReset(recLogin);
      setRecMsg('Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.');
    } catch (error) {
      setRecMsg(error.message);
    }
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    setCadMsg('');
    if (cadSenha.length < 8) {
      setCadMsg('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (cadSenha !== cadConfirmacao) {
      setCadMsg('As senhas não coincidem.');
      return;
    }

    setCarregando(true);
    try {
      const result = await signUpWithInvite(login, cadSenha);
      if (result.confirmationRequired) {
        setCadMsg('Conta criada, se havia convite. Verifique seu e-mail para confirmar o cadastro.');
      } else {
        onLogin(result.profile);
      }
    } catch (error) {
      setCadMsg(error.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-page">
      {/* LADO ESQUERDO - Branding */}
      <div className="login-brand">
        <div className="login-brand-content">
          <div className="login-logo">
            <img src={LOGO_URL} alt="RFN Tecnologia" />
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
            <h2>{recuperar ? 'Recuperar senha' : cadastrar ? 'Primeiro acesso' : 'Bem-vindo de volta'}</h2>
            <p>
              {recuperar
                ? 'Enviaremos um link seguro para o seu e-mail.'
                : cadastrar
                  ? 'Use o e-mail autorizado pelo administrador.'
                  : 'Entre com suas credenciais para acessar o sistema.'}
            </p>
          </div>

          {!recuperar && !cadastrar && <form onSubmit={handleSubmit} className="login-form">
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
              <label htmlFor="login">E-mail</label>
              <div className="login-input-wrapper">
                <svg className="login-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="login"
                  type="email"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="nome@empresa.com"
                  required
                  autoFocus
                />
              </div>
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
            <button type="button" className="login-forgot" onClick={() => setCadastrar(true)}>Primeiro acesso? Criar conta com convite</button>
          </form>}

          {recuperar && (
            <form onSubmit={handleRecuperar} className="login-form login-recover">
              {recMsg && (
                <div className={`login-message ${recMsg.includes('Se o e-mail') ? 'ok' : 'error'}`}>
                  <span>{recMsg}</span>
                </div>
              )}

              <div className="login-field">
                <label htmlFor="rec-login">E-mail</label>
                <div className="login-input-wrapper">
                  <svg className="login-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    id="rec-login"
                    type="email"
                    value={recLogin}
                    onChange={(e) => setRecLogin(e.target.value)}
                    placeholder="nome@empresa.com"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setRecuperar(false); setRecMsg(''); }}>Voltar</button>
                <button type="submit" className="btn-primary">Enviar link</button>
              </div>
            </form>
          )}

          {cadastrar && (
            <form onSubmit={handleCadastro} className="login-form login-recover">
              {cadMsg && (
                <div className={`login-message ${cadMsg.startsWith('Conta criada') ? 'ok' : 'error'}`}>
                  <span>{cadMsg}</span>
                </div>
              )}
              <div className="login-field">
                <label htmlFor="signup-email">E-mail autorizado</label>
                <div className="login-input-wrapper">
                  <input
                    id="signup-email"
                    type="email"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="login-field">
                <label htmlFor="signup-password">Senha (mínimo 8 caracteres)</label>
                <input id="signup-password" type="password" value={cadSenha} onChange={(e) => setCadSenha(e.target.value)} minLength={8} required />
              </div>
              <div className="login-field">
                <label htmlFor="signup-confirm">Confirmar senha</label>
                <input id="signup-confirm" type="password" value={cadConfirmacao} onChange={(e) => setCadConfirmacao(e.target.value)} minLength={8} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setCadastrar(false); setCadMsg(''); }}>Voltar</button>
                <button type="submit" className="btn-primary" disabled={carregando}>Criar conta</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
