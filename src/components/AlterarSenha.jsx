import React, { useState } from 'react';
import { getEmpregados } from '../data/storage.js';

export default function AlterarSenha({ emp, onDone }) {
  const [senha, setSenha] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');

  const handle = (e) => {
    e.preventDefault();
    if (!senha || senha.length < 4) return setMsg('A senha deve ter pelo menos 4 caracteres.');
    if (senha !== confirm) return setMsg('As senhas não coincidem.');
    const empregados = getEmpregados();
    const idx = empregados.findIndex((x) => x.id === emp.id);
    if (idx >= 0) {
      empregados[idx].senha = senha;
      localStorage.setItem('ponto_facil_db', JSON.stringify({ empregados: empregados, registros: JSON.parse(localStorage.getItem('ponto_facil_db') || '{"registros":[]}').registros, feriadosCustom: JSON.parse(localStorage.getItem('ponto_facil_db') || '{"feriadosCustom":[]}').feriadosCustom }));
    }
    setMsg('✅ Senha alterada com sucesso!');
    setSenha('');
    setConfirm('');
    setTimeout(onDone, 1000);
  };

  return (
    <div className="placeholder-page">
      <h2>🔒 Alterar Senha</h2>
      <div className="card">
        {msg && <div className={msg.includes('✅') ? 'success-msg' : 'error-msg'}>{msg}</div>}
        <form onSubmit={handle}>
          <div className="form-group">
            <label>Nova Senha *</label>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={4} />
          </div>
          <div className="form-group">
            <label>Confirmar Nova Senha *</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={4} />
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
