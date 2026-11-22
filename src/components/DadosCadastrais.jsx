import React, { useState, useEffect } from 'react';
import { getEmpregados, updateEmpregado } from '../data/storage.js';

export default function DadosCadastrais({ emp, onDone }) {
  const [form, setForm] = useState({ ...emp });
  const [msg, setMsg] = useState('');

  const handle = (e) => {
    e.preventDefault();
    updateEmpregado(emp.id, form);
    setMsg('✅ Dados atualizados!');
    setTimeout(onDone, 1000);
  };

  return (
    <div className="placeholder-page">
      <h2>👤 Dados Cadastrais</h2>
      <div className="card">
        {msg && <div className="success-msg">{msg}</div>}
        <form onSubmit={handle}>
          <div className="form-group">
            <label>Nome Completo *</label>
            <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div className="form-group">
            <label>E-mail *</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
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
            <input value={form.matricula || ''} onChange={(e) => setForm({ ...form, matricula: e.target.value })} />
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
