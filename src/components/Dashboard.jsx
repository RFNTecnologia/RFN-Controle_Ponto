import React, { useState } from 'react';
import BaterPonto from './BaterPonto.jsx';
import Folha from './Folha.jsx';
import { CONFIG } from '../data/config.js';
import { getRegistros, getEmpregados } from '../data/storage.js';
import { ehFeriado, ehDomingo, ehSabado } from '../data/feriados.js';
import { calcularMes, minutosParaHoras } from '../utils/calculos.js';

export default function Dashboard({ emp, onLogout, isAdmin, onGoAdmin }) {
  const [showBaterPonto, setShowBaterPonto] = useState(false);
  const [view, setView] = useState('dashboard'); // dashboard | folha | historico

  const hoje = new Date().toISOString().slice(0, 10);
  const mesAno = new Date().toISOString().slice(0, 7);
  const stats = calcularMes(emp.id, mesAno);

  const ultimoReg = getRegistros()
    .filter((r) => r.idEmpregado === emp.id)
    .sort((a, b) => b.dataHora.localeCompare(a.dataHora))[0];

  const statusHoje = stats.dados[hoje];
  const ferHoje = ehFeriado(hoje);
  const domHoje = ehDomingo(hoje);

  const semanaAtual = getRegistros()
    .filter((r) => r.idEmpregado === emp.id)
    .filter((r) => {
      const d = new Date(r.dataHora);
      const now = new Date();
      const ini = new Date(now);
      ini.setDate(now.getDate() - now.getDay()); // domingo
      const fim = new Date(ini);
      fim.setDate(ini.getDate() + 7);
      return d >= ini && d < fim;
    });

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img className="sidebar-logo" src="/logo.png" alt="RFN Tecnologia" />
          <h2>PontoFácil</h2>
          <span className="empresa">{CONFIG.empresa}</span>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
            🏠 Painel
          </button>
          <button className={`nav-item ${view === 'folha' ? 'active' : ''}`} onClick={() => setView('folha')}>
            📋 Folha de Ponto
          </button>
          <button className={`nav-item ${view === 'historico' ? 'active' : ''}`} onClick={() => setView('historico')}>
            📝 Histórico
          </button>
          {isAdmin && (
            <button className="nav-item" onClick={onGoAdmin}>
              ⚙️ Administração
            </button>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{emp.nome[0]}</div>
            <div>
              <div className="user-name">{emp.nome}</div>
              <div className="user-meta">{emp.email}</div>
              <div className="user-meta">{emp.telefone}</div>
              <div className="user-role">{emp.admin ? 'Administrador' : emp.cargo}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={onLogout}>Sair</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main">
        {view === 'dashboard' && (
          <div className="dashboard">
            <div className="page-header">
              <h1>Olá, {emp.nome.split(' ')[0]}! 👋</h1>
              <p className="subtitle">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Status do dia */}
            <div className="card status-card">
              <h3>📅 Status de Hoje</h3>
              {domHoje || ferHoje ? (
                <div className="status-holiday">
                  {domHoje && '🔴 Hoje é domingo - Descanso'}
                  {ferHoje && !domHoje && `🔴 Feriado: ${ferHoje.nome}`}
                  <p className="text-muted">Não é necessário bater ponto hoje.</p>
                </div>
              ) : (
                <>
                  {statusHoje?.tipo === 'ok' || statusHoje?.tipo === 'sem_saida' ? (
                    <div className="status-ok">
                      <div className="status-badge ok">
                        {statusHoje.registros?.filter((r) => r.tipo === 'entrada').length > 0 ? '🟢 Entrada registrada' : ''}
                        {statusHoje.registros?.filter((r) => r.tipo === 'saida').length > 0 ? ' | 🔴 Saída registrada' : ''}
                      </div>
                      <p className="text-muted">Horas hoje: {minutosParaHoras(statusHoje.minutos || 0)}</p>
                    </div>
                  ) : statusHoje?.tipo === 'falta' ? (
                    <div className="status-falta">
                      <div className="status-badge danger">⚠️ Falta não justificada</div>
                    </div>
                  ) : statusHoje?.tipo === 'justificado' ? (
                    <div className="status-just">
                      <div className="status-badge warn">📝 Justificado</div>
                    </div>
                  ) : (
                    <div className="status-pending">
                      <p>Você ainda não bateu ponto hoje.</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Botão de bater ponto */}
            {!domHoje && !ferHoje && (
              <button className="btn-bater-ponto" onClick={() => setShowBaterPonto(true)}>
                <span className="bater-icon">⏱️</span>
                <span className="bater-text">Bater Ponto</span>
              </button>
            )}

            {/* Cards de resumo */}
            <div className="stats-row">
              <div className="stat-mini">
                <span className="mini-label">Saldo do Mês</span>
                <span className={`mini-value ${stats.saldoMin >= 0 ? 'ok' : 'danger'}`}>{minutosParaHoras(stats.saldoMin)}</span>
              </div>
              <div className="stat-mini">
                <span className="mini-label">Horas Trabalhadas</span>
                <span className="mini-value">{minutosParaHoras(stats.totalMinTrab)}</span>
              </div>
              <div className="stat-mini">
                <span className="mini-label">Faltas</span>
                <span className={`mini-value ${stats.diasFalta > 0 ? 'danger' : ''}`}>{stats.diasFalta}</span>
              </div>
              <div className="stat-mini">
                <span className="mini-label">Justificados</span>
                <span className="mini-value">{stats.diasJust}</span>
              </div>
            </div>

            {/* Ações rápidas */}
            <div className="acoes-rapidas">
              <button className="action-card" onClick={() => setView('folha')}>
                <span className="action-icon">📋</span>
                <span>Ver Folha de Ponto</span>
              </button>
              <button className="action-card" onClick={() => setView('historico')}>
                <span className="action-icon">📝</span>
                <span>Histórico</span>
              </button>
            </div>

            {/* Último registro */}
            {ultimoReg && (
              <div className="card">
                <h3>🕐 Último Registro</h3>
                <p>{new Date(ultimoReg.dataHora).toLocaleString('pt-BR')} — {ultimoReg.tipo === 'entrada' ? 'Entrada' : ultimoReg.tipo === 'saida' ? 'Saída' : 'Justificativa'}</p>
              </div>
            )}
          </div>
        )}

        {view === 'folha' && <Folha empId={emp.id} />}

        {view === 'historico' && (
          <div className="historico-container">
            <h2>📝 Histórico de Registros</h2>
            <Historial empId={emp.id} />
          </div>
        )}
      </main>

      {showBaterPonto && <BaterPonto emp={emp} onClose={() => setShowBaterPonto(false)} />}
    </div>
  );
}

function Historial({ empId }) {
  const registros = getRegistros()
    .filter((r) => r.idEmpregado === empId)
    .sort((a, b) => b.dataHora.localeCompare(a.dataHora));

  if (registros.length === 0) {
    return <p className="text-muted">Nenhum registro encontrado.</p>;
  }

  return (
    <table className="folha-tabela">
      <thead>
        <tr>
          <th>Data</th>
          <th>Hora</th>
          <th>Tipo</th>
          <th>Localização</th>
          <th>Justificativa</th>
          <th>Foto</th>
        </tr>
      </thead>
      <tbody>
        {registros.map((r) => {
          const data = r.dataHora.split('T')[0];
          const hora = new Date(r.dataHora).toLocaleTimeString('pt-BR');
          return (
            <tr key={r.id}>
              <td>{new Date(data).toLocaleDateString('pt-BR')}</td>
              <td>{hora}</td>
              <td>
                <span className={`badge badge-${r.tipo === 'entrada' ? 'ok' : r.tipo === 'saida' ? 'danger' : 'warn'}`}>
                  {r.tipo === 'entrada' ? 'Entrada' : r.tipo === 'saida' ? 'Saída' : r.justificativa || 'Justificativa'}
                </span>
              </td>
              <td>{r.localizacao ? `${r.localizacao.lat.toFixed(4)}, ${r.localizacao.lng.toFixed(4)}` : '—'}</td>
              <td>{r.justificativa || '—'}</td>
              <td>
                {r.foto && <img src={r.foto} className="mini-foto" alt="foto" />}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
