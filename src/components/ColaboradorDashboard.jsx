import React, { useState } from 'react';
import BaterPonto from './BaterPonto.jsx';
import Folha from './Folha.jsx';
import JustificarAusencia from './JustificarAusencia.jsx';
import DadosCadastrais from './DadosCadastrais.jsx';
import AlterarSenha from './AlterarSenha.jsx';
import MinhasSolicitacoes from './MinhasSolicitacoes.jsx';
import Configuracoes from './Configuracoes.jsx';
import Ajuda from './Ajuda.jsx';
import { CONFIG } from '../data/config.js';
import { getRegistros, getEmpregados, updateEmpregado } from '../data/storage.js';
import { ehFeriado, ehDomingo, ehSabado } from '../data/feriados.js';
import { calcularMes, minutosParaHoras } from '../utils/calculos.js';

export default function ColaboradorDashboard({ emp, onLogout }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [view, setView] = useState('incluir-ponto'); // indicadores | cartao-ponto | incluir-ponto | incluir-atividade | ajustar-ponto | justificar-ausencia | solicitacoes | dados-cadastrais | alterar-senha | configuracoes | ajuda

  const hoje = new Date().toISOString().slice(0, 10);
  const mesAno = new Date().toISOString().slice(0, 7);
  const stats = calcularMes(emp.id, mesAno);

  const ultimoReg = getRegistros()
    .filter((r) => r.idEmpregado === emp.id)
    .sort((a, b) => b.dataHora.localeCompare(a.dataHora))[0];

  const statusHoje = stats.dados[hoje];
  const ferHoje = ehFeriado(hoje);
  const domHoje = ehDomingo(hoje);

  const navigate = (v) => {
    setView(v);
    setDrawerOpen(false);
  };

  return (
    <div className="collab-app">
      {/* ===== MAP BACKGROUND ===== */}
      <div className="map-bg">
        <div className="map-overlay" />
      </div>

      {/* ===== TOP BAR ===== */}
      <header className="collab-topbar">
        <button className="hamburger-btn" onClick={() => setDrawerOpen(true)} aria-label="Menu">
          <span /><span /><span />
        </button>
        <div className="topbar-brand">
          <img className="topbar-logo" src="/logo.png" alt="RFN Tecnologia" />
          <span className="topbar-title">PontoFácil</span>
        </div>
        <div className="topbar-user-badge">
          {emp.nome.split(' ')[0]}
        </div>
      </header>

      {/* ===== DRAWER ===== */}
      <div className={`drawer-overlay ${drawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)} />
      <nav className={`drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-logo">
            <img src="/logo.png" alt="RFN Tecnologia" />
            <span className="drawer-brand-text">RFNTecnologia</span>
          </div>
          <div className="drawer-company-badge">Central do Funcionário</div>
        </div>

        <div className="drawer-user-info">
          <div className="drawer-user-name">{emp.nome}</div>
          <div className="drawer-user-company">{emp.empresa || CONFIG.empresa}</div>
          <div className="drawer-user-role">{emp.cargo}</div>
        </div>

        <div className="drawer-divider" />

        <div className="drawer-nav">
          <button className={`drawer-item ${view === 'incluir-ponto' ? 'active' : ''}`} onClick={() => navigate('incluir-ponto')}>
            <span className="drawer-icon">➕</span> Incluir Ponto
          </button>
          <button className={`drawer-item ${view === 'indicadores' ? 'active' : ''}`} onClick={() => navigate('indicadores')}>
            <span className="drawer-icon">📊</span> Indicadores
          </button>
          <button className={`drawer-item ${view === 'cartao-ponto' ? 'active' : ''}`} onClick={() => navigate('cartao-ponto')}>
            <span className="drawer-icon">📋</span> Cartão Ponto
          </button>
          <button className={`drawer-item ${view === 'incluir-atividade' ? 'active' : ''}`} onClick={() => navigate('incluir-atividade')}>
            <span className="drawer-icon">📝</span> Incluir Atividade
          </button>
          <button className={`drawer-item ${view === 'ajustar-ponto' ? 'active' : ''}`} onClick={() => navigate('ajustar-ponto')}>
            <span className="drawer-icon">✏️</span> Ajustar Ponto
          </button>
          <button className={`drawer-item ${view === 'justificar-ausencia' ? 'active' : ''}`} onClick={() => navigate('justificar-ausencia')}>
            <span className="drawer-icon">📄</span> Justificar Ausência
          </button>
          <button className={`drawer-item ${view === 'solicitacoes' ? 'active' : ''}`} onClick={() => navigate('solicitacoes')}>
            <span className="drawer-icon">📬</span> Minhas Solicitações
          </button>
          <div className="drawer-divider" />
          <button className={`drawer-item ${view === 'dados-cadastrais' ? 'active' : ''}`} onClick={() => navigate('dados-cadastrais')}>
            <span className="drawer-icon">👤</span> Dados Cadastrais
          </button>
          <button className={`drawer-item ${view === 'alterar-senha' ? 'active' : ''}`} onClick={() => navigate('alterar-senha')}>
            <span className="drawer-icon">🔒</span> Alterar Senha
          </button>
          <button className={`drawer-item ${view === 'configuracoes' ? 'active' : ''}`} onClick={() => navigate('configuracoes')}>
            <span className="drawer-icon">⚙️</span> Configurações
          </button>
          <button className={`drawer-item ${view === 'ajuda' ? 'active' : ''}`} onClick={() => navigate('ajuda')}>
            <span className="drawer-icon">❓</span> Ajuda
          </button>
        </div>

        <div className="drawer-divider" />

        <button className="drawer-item drawer-sair" onClick={onLogout}>
          <span className="drawer-icon">🚪</span> Sair
        </button>
      </nav>

      {/* ===== MAIN CONTENT ===== */}
      <main className="collab-main">
        {view === 'indicadores' && (
          <Indicadores emp={emp} stats={stats} ultimoReg={ultimoReg} statusHoje={statusHoje} ferHoje={ferHoje} domHoje={domHoje} />
        )}
        {view === 'cartao-ponto' && <CartaoPontoView empId={emp.id} />}
        {view === 'incluir-ponto' && <IncluirPontoView emp={emp} onDone={() => navigate('indicadores')} />}
        {view === 'incluir-atividade' && <IncluirAtividadeView onDone={() => navigate('indicadores')} />}
        {view === 'ajustar-ponto' && <AjustarPontoView emp={emp} onDone={() => navigate('indicadores')} />}
        {view === 'justificar-ausencia' && <JustificarAusencia emp={emp} onDone={() => navigate('indicadores')} />}
        {view === 'solicitacoes' && <MinhasSolicitacoes emp={emp} />}
        {view === 'dados-cadastrais' && <DadosCadastrais emp={emp} onDone={() => navigate('indicadores')} />}
        {view === 'alterar-senha' && <AlterarSenha emp={emp} onDone={() => navigate('indicadores')} />}
        {view === 'configuracoes' && <Configuracoes />}
        {view === 'ajuda' && <Ajuda />}
      </main>
    </div>
  );
}

/* =================== SUB-VIEWS =================== */

function Indicadores({ emp, stats, ultimoReg, statusHoje, ferHoje, domHoje }) {
  const [showBaterPonto, setShowBaterPonto] = useState(false);

  return (
    <div className="indicadores-page">
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

      {/* Último registro */}
      {ultimoReg && (
        <div className="card">
          <h3>🕐 Último Registro</h3>
          <p>{new Date(ultimoReg.dataHora).toLocaleString('pt-BR')} — {ultimoReg.tipo === 'entrada' ? 'Entrada' : ultimoReg.tipo === 'saida' ? 'Saída' : 'Justificativa'}</p>
        </div>
      )}

      {showBaterPonto && <BaterPonto emp={emp} onClose={() => setShowBaterPonto(false)} />}
    </div>
  );
}

function CartaoPontoView({ empId }) {
  return <Folha empId={empId} />;
}

function IncluirPontoView({ emp, onDone }) {
  const [open, setOpen] = useState(true);
  return open ? <BaterPonto emp={emp} onClose={() => { setOpen(false); onDone(); }} /> : null;
}

function IncluirAtividadeView({ onDone }) {
  const registros = getRegistros();
  return (
    <div className="placeholder-page">
      <h2>📝 Incluir Atividade</h2>
      <div className="card">
        <p>Registre atividades extras realizadas no expediente.</p>
        <p className="text-muted">Registros disponíveis: {registros.length}</p>
      </div>
    </div>
  );
}

function AjustarPontoView({ emp, onDone }) {
  return (
    <div className="placeholder-page">
      <h2>✏️ Ajustar Ponto</h2>
      <div className="card">
        <p>Solicite ajustes nos seus registros de ponto.</p>
      </div>
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
