import React, { useState } from 'react';
import { addSolicitacao } from '../data/storage.js';
import { ehFeriado, ehDomingo } from '../data/feriados.js';
import { dataLocalISO } from '../utils/datas.js';

export default function JustificarAusencia({ emp, onDone }) {
  const [form, setForm] = useState({ data: '', motivo: '', foto: null });
  const [msg, setMsg] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    const data = form.data;
    if (!data) return setMsg('Selecione a data.');
    if (data > dataLocalISO()) return setMsg('A data da ausência não pode ser futura.');
    if (ehDomingo(data) || ehFeriado(data)) return setMsg('Domingos e feriados não precisam de justificativa.');
    setEnviando(true);
    try {
      let foto = null;
      if (form.foto) {
        if (form.foto.size > 5 * 1024 * 1024) {
          throw new Error('O anexo deve ter no máximo 5 MB.');
        }
        foto = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Não foi possível ler o anexo.'));
          reader.readAsDataURL(form.foto);
        });
      }
      await addSolicitacao(emp.id, {
        tipo: 'Justificativa',
        data,
        motivo: form.motivo.trim(),
        foto,
      });
      setMsg('✅ Justificativa enviada para análise do RH.');
      setForm({ data: '', motivo: '', foto: null });
    } catch (error) {
      setMsg(`❌ ${error.message}`);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="placeholder-page">
      <h2>📄 Justificar Ausência</h2>
      <div className="card">
        {msg && <div className={msg.includes('✅') ? 'success-msg' : 'error-msg'}>{msg}</div>}
        <form onSubmit={handle}>
          <div className="form-group">
            <label>Data da Ausência *</label>
            <input type="date" max={dataLocalISO()} value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Motivo *</label>
            <textarea value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Descreva o motivo da ausência..." required />
          </div>
          <div className="form-group">
            <label>Foto do Anexo (opcional)</label>
            <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, foto: e.target.files[0] || null })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onDone}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={enviando}>{enviando ? 'Enviando...' : 'Enviar Justificativa'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
