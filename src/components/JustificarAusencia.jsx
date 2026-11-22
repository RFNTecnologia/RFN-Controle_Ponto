import React, { useState } from 'react';
import { getRegistros, addRegistro, getEmpregados } from '../data/storage.js';
import { ehFeriado, ehDomingo } from '../data/feriados.js';

export default function JustificarAusencia({ emp, onDone }) {
  const [form, setForm] = useState({ data: '', motivo: '', foto: null });
  const [msg, setMsg] = useState('');

  const handle = (e) => {
    e.preventDefault();
    const data = form.data;
    if (!data) return setMsg('Selecione a data.');
    if (ehDomingo(data) || ehFeriado(data)) return setMsg('Domingos e feriados não precisam de justificativa.');
    addRegistro({
      idEmpregado: emp.id,
      tipo: 'justificativa',
      dataHora: `${data}T12:00:00`,
      localizacao: null,
      foto: form.foto,
      justificativa: form.motivo,
    });
    setMsg('✅ Justificativa enviada com sucesso!');
    setForm({ data: '', motivo: '', foto: null });
    setTimeout(onDone, 1200);
  };

  return (
    <div className="placeholder-page">
      <h2>📄 Justificar Ausência</h2>
      <div className="card">
        {msg && <div className={msg.includes('✅') ? 'success-msg' : 'error-msg'}>{msg}</div>}
        <form onSubmit={handle}>
          <div className="form-group">
            <label>Data da Ausência *</label>
            <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Motivo *</label>
            <textarea value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Descreva o motivo da ausência..." required />
          </div>
          <div className="form-group">
            <label>Foto do Anexo (opcional)</label>
            <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, foto: e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : null })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onDone}>Cancelar</button>
            <button type="submit" className="btn-primary">Enviar Justificativa</button>
          </div>
        </form>
      </div>
    </div>
  );
}
