import React, { useState, useMemo } from 'react';
import { CONFIG } from '../data/config.js';
import { calcularMes, minutosParaHM } from '../utils/calculos.js';
import { getEmpregados, getRegistros } from '../data/storage.js';
import { ehFeriado, ehDomingo, ehSabado } from '../data/feriados.js';
import { exportarCSV } from './Admin.jsx';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function Folha({ empId, mesAno }) {
  const [mesAnoAtual, setMesAnoAtual] = useState(
    mesAno || new Date().toISOString().slice(0, 7)
  );
  const emp = getEmpregados().find((e) => e.id === empId);
  const stats = useMemo(() => calcularMes(empId, mesAnoAtual), [empId, mesAnoAtual]);

  const [ano, mes] = mesAnoAtual.split('-').map(Number);
  const dias = useMemo(() => {
    const ultimo = new Date(ano, mes, 0).getDate();
    const lista = [];
    for (let d = 1; d <= ultimo; d++) {
      const iso = `${ano}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const wd = new Date(`${iso}T12:00:00`).getDay();
      const info = stats.dados[iso];
      lista.push({ iso, dia: d, wd, ...info });
    }
    return lista;
  }, [ano, mes, stats]);

  const proximoMes = () => {
    const d = new Date(ano, mes, 1);
    d.setMonth(d.getMonth() + 1);
    setMesAnoAtual(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const mesAnterior = () => {
    const d = new Date(ano, mes, 1);
    d.setMonth(d.getMonth() - 1);
    setMesAnoAtual(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const nomeMes = MESES[mes - 1];

  return (
    <div className="folha-professional">
      {/* ===== HEADER ===== */}
      <div className="fp-header">
        <div className="fp-header-left">
          <img className="fp-logo" src="/logo.png" alt="RFN Tecnologia" />
          <div>
            <div className="fp-company">{CONFIG.empresa}</div>
            <div className="fp-document">Folha de Ponto Eletrônica</div>
          </div>
        </div>
        <div className="fp-header-right">
          <div className="fp-badge fp-badge-periodo">
            {nomeMes} / {ano}
          </div>
        </div>
      </div>

      {/* ===== FUNCIONÁRIO ===== */}
      {emp && (
        <div className="fp-employee-card">
          <div className="fp-employee-avatar">
            {emp.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div className="fp-employee-info">
            <div className="fp-employee-name">{emp.nome}</div>
            <div className="fp-employee-meta">
              {emp.cargo && <span className="fp-meta-item">💼 {emp.cargo}</span>}
              {emp.matricula && <span className="fp-meta-item">🆔 {emp.matricula}</span>}
              {emp.email && <span className="fp-meta-item">✉️ {emp.email}</span>}
            </div>
          </div>
        </div>
      )}

      {/* ===== RESUMO ===== */}
      <div className="fp-summary">
        <div className={`fp-summary-item fp-summary-primary`}>
          <div className="fp-summary-value">{minutosParaHM(stats.totalMinTrab)}</div>
          <div className="fp-summary-label">Horas Trabalhadas</div>
        </div>
        <div className="fp-summary-divider" />
        <div className="fp-summary-item">
          <div className={`fp-summary-value ${stats.saldoMin >= 0 ? 'fp-positive' : 'fp-negative'}`}>
            {minutosParaHM(stats.saldoMin)}
          </div>
          <div className="fp-summary-label">Saldo</div>
        </div>
        <div className="fp-summary-divider" />
        <div className="fp-summary-item">
          <div className="fp-summary-value">{stats.diasTrab}</div>
          <div className="fp-summary-label">Dias Trab.</div>
        </div>
        <div className="fp-summary-divider" />
        <div className="fp-summary-item">
          <div className="fp-summary-value fp-negative">{stats.diasFalta}</div>
          <div className="fp-summary-label">Faltas</div>
        </div>
        <div className="fp-summary-divider" />
        <div className="fp-summary-item">
          <div className="fp-summary-value fp-warning">{stats.diasJust}</div>
          <div className="fp-summary-label">Justif.</div>
        </div>
      </div>

      {/* ===== CONTROLES ===== */}
      <div className="fp-controls">
        <button onClick={mesAnterior} className="fp-btn fp-btn-ghost">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div className="fp-month-label">
          <span className="fp-month-name">{nomeMes}</span>
          <span className="fp-year">{ano}</span>
        </div>
        <button onClick={proximoMes} className="fp-btn fp-btn-ghost">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
        <button className="fp-btn fp-btn-export" onClick={() => exportarCSV(empId, mesAnoAtual)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          Exportar CSV
        </button>
      </div>

      {/* ===== TABELA ===== */}
      <div className="fp-table-wrapper">
        <table className="fp-table">
          <thead>
            <tr>
              <th className="fp-col-date">Data</th>
              <th className="fp-col-day">Dia</th>
              <th className="fp-col-status">Status</th>
              <th className="fp-col-time">Horário</th>
              <th className="fp-col-hours">Horas</th>
              <th className="fp-col-overnight">Noturno</th>
            </tr>
          </thead>
          <tbody>
            {dias.map(({ iso, dia, wd, tipo, label, minutos, registros }) => {
              const fer = ehFeriado(iso);
              const dom = ehDomingo(iso);
              const sab = ehSabado(iso);
              const isUtil = !dom && !sab && !fer;
              const tipoInfo = getTipoInfo(tipo, label, fer, dom, sab);
              const registrosOrdenados = registros?.slice().sort((a, b) => a.dataHora.localeCompare(b.dataHora)) || [];

              return (
                <tr key={iso} className={`fp-row fp-row-${tipo} ${!isUtil ? 'fp-row-disabled' : ''}`}>
                  <td className="fp-col-date">
                    <div className="fp-date-cell">
                      <span className="fp-day-number">{dia}</span>
                      <span className="fp-day-month">/{mes}</span>
                    </div>
                  </td>
                  <td className="fp-col-day">
                    <span className={`fp-weekday fp-weekday-${wd === 0 || wd === 6 ? 'weekend' : 'work'}`}>
                      {DIAS_SEMANA[wd]}
                    </span>
                  </td>
                  <td className="fp-col-status">
                    <span className={`fp-badge fp-badge-${tipoInfo.badgeClass}`}>
                      {tipoInfo.icon && <span className="fp-badge-icon">{tipoInfo.icon}</span>}
                      {tipoInfo.label}
                    </span>
                  </td>
                  <td className="fp-col-time">
                    <div className="fp-time-list">
                      {registrosOrdenados.length > 0
                        ? registrosOrdenados.map((r, i) => {
                            const h = new Date(r.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                            return (
                              <div key={i} className={`fp-time-item fp-time-${r.tipo}`}>
                                <span className="fp-time-dot" />
                                <span className="fp-time-value">{h}</span>
                              </div>
                            );
                          })
                        : <span className="fp-time-empty">—</span>
                      }
                    </div>
                  </td>
                  <td className="fp-col-hours">
                    <span className={`fp-hours fp-hours-${isUtil ? (minutos >= 480 ? 'ok' : minutos > 0 ? 'partial' : 'empty') : 'disabled'}`}>
                      {isUtil ? minutosParaHM(minutos || 0) : '—'}
                    </span>
                  </td>
                  <td className="fp-col-overnight">
                    {isUtil && registrosOrdenados.some(r => {
                      const h = new Date(r.dataHora).getHours();
                      return h >= 22 || h < 5;
                    }) ? (
                      <span className="fp-overnight-badge">🌙</span>
                    ) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ===== LEGENDA ===== */}
      <div className="fp-legend">
        <div className="fp-legend-item">
          <span className="fp-legend-dot fp-legend-ok" /> Presente
        </div>
        <div className="fp-legend-item">
          <span className="fp-legend-dot fp-legend-falta" /> Falta
        </div>
        <div className="fp-legend-item">
          <span className="fp-legend-dot fp-legend-just" /> Justificado
        </div>
        <div className="fp-legend-item">
          <span className="fp-legend-dot fp-legend-feriado" /> Feriado
        </div>
        <div className="fp-legend-item">
          <span className="fp-legend-dot fp-legend-descanso" /> Descanso
        </div>
      </div>
    </div>
  );
}

function getTipoInfo(tipo, label, fer, dom, sab) {
  if (dom) return { label: 'Domingo', badgeClass: 'descanso', icon: '🔴' };
  if (sab) return { label: 'Sábado', badgeClass: 'descanso', icon: '⚪' };
  if (fer && tipo === 'feriado') return { label: fer.nome, badgeClass: 'feriado', icon: '⭐' };
  switch (tipo) {
    case 'ok': return { label: 'Presente', badgeClass: 'ok', icon: '✅' };
    case 'falta': return { label: 'Falta', badgeClass: 'falta', icon: '❌' };
    case 'justificado': return { label: 'Justificado', badgeClass: 'justificado', icon: '📝' };
    case 'sem_saida': return { label: 'Sem saída', badgeClass: 'partial', icon: '⏳' };
    default: return { label: label || '—', badgeClass: 'muted', icon: '' };
  }
}
