import React, { useState } from 'react';
import { updateEmpregado } from '../data/storage.js';

export default function DadosCadastrais({ emp, onDone }) {
  const [form, setForm] = useState({ ...emp });
  const [msg, setMsg] = useState('');

  const handle = async (e) => {
    e.preventDefault();
    try {
      await updateEmpregado(emp.id, form);
      setMsg('✅ Dados atualizados!');
      setTimeout(onDone, 1000);
    } catch (error) {
      setMsg(`❌ ${error.message}`);
    }
  };

  return (
    <div className="placeholder-page">
      <h2>👤 Dados Cadastrais</h2>
      <div className="card">
        {msg && <div className={msg.startsWith('✅') ? 'success-msg' : 'error-msg'}>{msg}</div>}
        <form onSubmit={handle}>
          <div className="form-group">
            <label>Nome Completo *</label>
            <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div className="form-group">
            <label>E-mail *</label>
            <input type="email" required value={form.email} readOnly />
          </div>
          <div className="form-group">
            <label>Telefone *</label>
            <input required value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </div>
          <div className="form-group">
            <label>CPF</label>
            <input value={form.cpf || ''} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Matrícula</label>
            <input value={form.matricula || ''} readOnly />
          </div>
          <div className="form-group">
            <label>Cargo</label>
            <input value={form.cargo || ''} onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onDone}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>
  );
}
