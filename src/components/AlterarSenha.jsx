import React, { useState } from 'react';
import { updatePassword } from '../data/auth.js';

export default function AlterarSenha({ onDone }) {
  const [senha, setSenha] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');

  const handle = async (e) => {
    e.preventDefault();
    if (!senha || senha.length < 8) return setMsg('A senha deve ter pelo menos 8 caracteres.');
    if (senha !== confirm) return setMsg('As senhas não coincidem.');
    try {
      await updatePassword(senha);
      setMsg('✅ Senha alterada com sucesso!');
      setSenha('');
      setConfirm('');
      setTimeout(onDone, 1000);
    } catch (error) {
      setMsg(`❌ ${error.message}`);
    }
  };

  return (
    <div className="placeholder-page">
      <h2>🔒 Alterar Senha</h2>
      <div className="card">
        {msg && <div className={msg.startsWith('✅') ? 'success-msg' : 'error-msg'}>{msg}</div>}
        <form onSubmit={handle}>
          <div className="form-group">
            <label>Nova Senha *</label>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={8} />
          </div>
          <div className="form-group">
            <label>Confirmar Nova Senha *</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onDone}>Cancelar</button>
            <button type="submit" className="btn-primary">Alterar Senha</button>
          </div>
        </form>
      </div>
    </div>
  );
}
