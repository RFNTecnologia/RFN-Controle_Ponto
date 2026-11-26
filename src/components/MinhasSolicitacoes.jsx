import React, { useEffect, useState } from 'react';
import { carregarSolicitacoes, getSolicitacoes } from '../data/storage.js';

export default function MinhasSolicitacoes({ emp }) {
  const [itensCarregados, setLista] = useState(() => getSolicitacoes(emp.id));
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    carregarSolicitacoes(emp.id)
      .then((itens) => {
        if (ativo) setLista(itens);
      })
      .catch((error) => {
        if (ativo) setErro(error.message);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [emp.id]);

  return (
    <div className="placeholder-page">
      <h2>📬 Minhas Solicitações</h2>
      <div className="card">
        {erro && <div className="error-msg">{erro}</div>}
        {carregando ? (
          <p className="text-muted">Carregando solicitações...</p>
        ) : itensCarregados.length === 0 ? (
          <p className="text-muted">Nenhuma solicitação encontrada.</p>
        ) : (
          <table className="folha-tabela">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Data</th>
                <th>Detalhes</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {itensCarregados.map((s) => (
                <tr key={s.id}>
                  <td>{s.tipo}</td>
                  <td>{s.data ? new Date(`${s.data}T12:00:00`).toLocaleDateString('pt-BR') : '—'}</td>
                  <td>{s.tipo === 'Ajuste de Ponto'
                    ? `${s.tipoRegistro === 'entrada' ? 'Entrada' : 'Saída'} ${s.horario || ''} — ${s.motivo || ''}`
                    : s.motivo || '—'}</td>
                  <td>
                    <span className={`badge badge-${s.status === 'Aprovado' ? 'ok' : s.status === 'Rejeitado' ? 'danger' : 'warn'}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
