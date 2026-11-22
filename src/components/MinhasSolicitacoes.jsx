import React, { useState } from 'react';

export default function MinhasSolicitacoes({ emp }) {
  const [lista, setLista] = useState([
    { id: 1, tipo: 'Ajuste de Ponto', data: '2025-01-15', status: 'Pendente' },
    { id: 2, tipo: 'Justificativa', data: '2025-01-10', status: 'Aprovado' },
  ]);

  return (
    <div className="placeholder-page">
      <h2>📬 Minhas Solicitações</h2>
      <div className="card">
        {lista.length === 0 ? (
          <p className="text-muted">Nenhuma solicitação encontrada.</p>
        ) : (
          <table className="folha-tabela">
            <thead>
              <tr>
                <th>#</th>
                <th>Tipo</th>
                <th>Data</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.tipo}</td>
                  <td>{new Date(s.data).toLocaleDateString('pt-BR')}</td>
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
