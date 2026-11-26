import React from 'react';
import { getConfig } from '../data/config.js';

export default function Configuracoes() {
  const CONFIG = getConfig();
  return (
    <div className="placeholder-page">
      <h2>⚙️ Configurações</h2>
      <div className="card config-card">
        <div className="config-item">
          <label>Empresa</label>
          <span>{CONFIG.empresa}</span>
        </div>
        <div className="config-item">
          <label>Jornada Diária</label>
          <span>{CONFIG.jornadaDiariaMinutos / 60}h</span>
        </div>
        <div className="config-item">
          <label>Horário de Entrada</label>
          <span>{CONFIG.entrada}</span>
        </div>
        <div className="config-item">
          <label>Horário de Saída</label>
          <span>{CONFIG.saida}</span>
        </div>
        <div className="config-item">
          <label>Intervalo de Almoço</label>
          <span>{CONFIG.inicioAlmoco} às {CONFIG.fimAlmoco}</span>
        </div>
        <div className="config-item">
          <label>Tolerância</label>
          <span>{CONFIG.toleranciaMinutos} minutos</span>
        </div>
      </div>
      <p className="text-muted">* Para alterações, edite o arquivo <code>src/data/config.js</code>.</p>
    </div>
  );
}
