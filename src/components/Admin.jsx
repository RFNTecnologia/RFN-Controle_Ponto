import React, { useState, useMemo, useEffect } from 'react';
import { todosFeriados } from '../data/feriados.js';
import { getEmpregados, addEmpregado, updateEmpregado, deleteEmpregado, getRegistros, getFeriadosCustom, addFeriadoCustom, removeFeriadoCustom, getSolicitacoes, carregarSolicitacoes, decidirSolicitacao } from '../data/storage.js';
import { getConfig, saveConfig, CONFIG } from '../data/config.js';

export function exportarCSV(idEmp, mesAno) {
  const registros = getRegistros().filter(
    (r) => r.idEmpregado === idEmp && r.dataHora.startsWith(mesAno)
  );
  const emp = getEmpregados().find((e) => e.id === idEmp);
  const escapeCSV = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const header = ['Data','Hora','Tipo','Latitude','Longitude','Justificativa'].map(escapeCSV).join(';') + '\n';
  const rows = registros
    .map((r) => {
      const data = r.dataHora.split('T')[0];
      const hora = new Date(r.dataHora).toLocaleTimeString('pt-BR');
      const loc = r.localizacao ? `${r.localizacao.lat},${r.localizacao.lng}` : '';
      const just = r.justificativa || '';
      const [lat, lng] = loc ? loc.split(',') : ['', ''];
      return [data, hora, r.tipo, lat, lng, just].map(escapeCSV).join(';');
    })
    .join('\n');
  const csv = '﻿' + header + rows;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `folha_ponto_${emp?.nome || idEmp}_${mesAno}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Admin({ onLogout }) {
  const [tab, setTab] = useState('empregados');
  const [empregados, setEmpregados] = useState(getEmpregados());
  const [solicitacoes, setSolicitacoes] = useState(getSolicitacoes());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: '', cargo: '', matricula: '', cpf: '', email: '', telefone: '', admin: false });
  const [editId, setEditId] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [anoFeriados, setAnoFeriados] = useState(new Date().getFullYear());
  const [customFeriados, setCustomFeriados] = useState(getFeriadosCustom());
  const [novoFeriado, setNovoFeriado] = useState({ nome: '', data: '' });
  const [search, setSearch] = useState('');
  const [cfg, setCfg] = useState(getConfig());
  const [cfgSaved, setCfgSaved] = useState(false);

  useEffect(() => {
    if (tab !== 'solicitacoes') return undefined;
    let ativo = true;
    carregarSolicitacoes()
      .then((itens) => {
        if (ativo) setSolicitacoes(itens);
      })
      .catch((error) => {
        if (ativo) setSaveError(error.message);
      });
    return () => {
      ativo = false;
    };
  }, [tab]);

  const registros = useMemo(() => {
    const termo = search.toLowerCase();
    return getRegistros().filter((r) => {
      if (!termo) return true;
      const emp = getEmpregados().find((e) => e.id === r.idEmpregado);
      return (emp?.nome || '').toLowerCase().includes(termo) || r.tipo.includes(termo);
    });
  }, [search, empregados]);

  const refresh = () => {
    setEmpregados(getEmpregados());
    setCustomFeriados(getFeriadosCustom());
    setSolicitacoes(getSolicitacoes());
  };

  const analisarSolicitacao = async (solicitacao, status) => {
    setSaveError('');
    setSaveMessage('');
    try {
      await decidirSolicitacao(solicitacao.id, status);
      setSolicitacoes(getSolicitacoes());
      setSaveMessage(status === 'Aprovado'
        ? 'Solicitação aprovada e aplicada ao cartão de ponto.'
        : 'Solicitação rejeitada.');
    } catch (error) {
      setSaveError(error.message);
    }
  };

  const salvarConfig = async (e) => {
    e.preventDefault();
    setSaveError('');
    try {
      await saveConfig(cfg);
      setCfgSaved(true);
      setTimeout(() => setCfgSaved(false), 2000);
    } catch (error) {
      setSaveError(error.message);
    }
  };

  const handleCfgChange = (key, value) => {
    setCfg((prev) => ({ ...prev, [key]: value }));
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveMessage('');
    try {
      if (editId) {
        await updateEmpregado(editId, form);
      } else {
        await addEmpregado(form);
        setSaveMessage('Convite criado. O colaborador deve usar “Primeiro acesso” com este e-mail.');
      }
      setShowForm(false);
      setEditId(null);
      setForm({ nome: '', cargo: '', matricula: '', cpf: '', email: '', telefone: '', admin: false });
      refresh();
    } catch (error) {
      setSaveError(error.message);
    }
  };

  const editar = (emp) => {
    setForm({
      nome: emp.nome,
      cargo: emp.cargo,
      matricula: emp.matricula,
      cpf: emp.cpf || '',
      email: emp.email || '',
      telefone: emp.telefone || '',
      admin: emp.admin,
    });
    setEditId(emp.id);
    setShowForm(true);
  };

  const remover = async (id) => {
    if (window.confirm('Remover este colaborador?')) {
      try {
        await deleteEmpregado(id);
        refresh();
      } catch (error) {
        setSaveError(error.message);
      }
    }
  };

  const adicionarFeriado = async (e) => {
    e.preventDefault();
    try {
      await addFeriadoCustom(novoFeriado);
      setNovoFeriado({ nome: '', data: '' });
      setCustomFeriados(getFeriadosCustom());
    } catch (error) {
      setSaveError(error.message);
    }
  };

  const removerFeriado = async (id) => {
    try {
      await removeFeriadoCustom(id);
      setCustomFeriados(getFeriadosCustom());
    } catch (error) {
      setSaveError(error.message);
    }
  };

  const feriadosAno = todosFeriados(anoFeriados);

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>⚙️ Painel Administrativo</h2>
        <div className="admin-header-actions">
          <button
            type="button"
            className="btn-primary novo-colaborador-cabecalho"
            onClick={() => {
              setTab('empregados');
              setShowForm(true);
              setEditId(null);
              setSaveError('');
              setForm({ nome: '', cargo: '', matricula: '', cpf: '', email: '', telefone: '', admin: false });
            }}
          >
            + Novo Colaborador
          </button>
          <button className="btn-logout-admin" onClick={onLogout}>Sair</button>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={`tab ${tab === 'empregados' ? 'active' : ''}`} onClick={() => setTab('empregados')}>
          👥 Empregados
        </button>
        <button className={`tab ${tab === 'registros' ? 'active' : ''}`} onClick={() => setTab('registros')}>
          📝 Registros
        </button>
        <button className={`tab ${tab === 'solicitacoes' ? 'active' : ''}`} onClick={() => setTab('solicitacoes')}>
          📬 Solicitações ({solicitacoes.filter((item) => item.status === 'Pendente').length})
        </button>
        <button className={`tab ${tab === 'feriados' ? 'active' : ''}`} onClick={() => setTab('feriados')}>
          📅 Feriados
        </button>
        <button className={`tab ${tab === 'config' ? 'active' : ''}`} onClick={() => setTab('config')}>
          ⚙️ Configurações
        </button>
      </div>
      {saveError && <div className="error-msg">{saveError}</div>}
      {saveMessage && <div className="success-msg">{saveMessage}</div>}

      {tab === 'solicitacoes' && (
        <div className="tab-content">
          <h3>Solicitações dos colaboradores</h3>
          {solicitacoes.length === 0 ? (
            <p className="text-muted">Nenhuma solicitação recebida.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Tipo</th>
                  <th>Data</th>
                  <th>Detalhes</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {solicitacoes.map((item) => {
                  const colaborador = empregados.find((employee) => employee.id === item.employeeId);
                  const detalhe = item.tipo === 'Ajuste de Ponto'
                    ? `${item.tipoRegistro === 'entrada' ? 'Entrada' : 'Saída'} ${item.horario || ''} — ${item.motivo || ''}`
                    : item.motivo || '—';
                  return (
                    <tr key={item.id}>
                      <td>{colaborador?.nome || item.employeeId}</td>
                      <td>{item.tipo}</td>
                      <td>{item.data ? new Date(`${item.data}T12:00:00`).toLocaleDateString('pt-BR') : '—'}</td>
                      <td>
                        {detalhe}
                        {item.foto && <a href={item.foto} target="_blank" rel="noreferrer">Ver anexo</a>}
                      </td>
                      <td>{item.status}</td>
                      <td>
                        {item.status === 'Pendente' ? (
                          <div className="admin-request-actions">
                            <button className="btn-small btn-primary" onClick={() => analisarSolicitacao(item, 'Aprovado')}>Aprovar</button>
                            <button className="btn-small btn-danger" onClick={() => analisarSolicitacao(item, 'Rejeitado')}>Rejeitar</button>
                          </div>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB: EMPREGADOS */}
      {tab === 'empregados' && (
        <div className="tab-content">
          <div className="section-header">
            <h3>Colaboradores ({empregados.length})</h3>
            <button
              type="button"
              className="btn-primary novo-colaborador"
              onClick={() => { setShowForm(true); setEditId(null); setSaveError(''); setForm({ nome: '', cargo: '', matricula: '', cpf: '', email: '', telefone: '', admin: false }); }}
            >
              + Novo Colaborador
            </button>
          </div>

          {showForm && (
            <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
              <div className="modal">
                <div className="modal-header">
                  <h3>{editId ? 'Editar' : 'Novo'} Colaborador</h3>
                  <button className="btn-close" onClick={() => setShowForm(false)}>✕</button>
                </div>
                <form onSubmit={handleSalvar}>
                  <div className="form-group">
                    <label>Nome Completo *</label>
                    <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Cargo *</label>
                    <input required value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Matrícula *</label>
                    <input required value={form.matricula} onChange={(e) => setForm({ ...form, matricula: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>CPF</label>
                    <input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" />
                  </div>
                  <div className="form-group">
                    <label>E-mail *</label>
                    <input type="email" required readOnly={Boolean(editId)} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@empresa.com" />
                  </div>
                  <div className="form-group">
                    <label>Telefone *</label>
                    <input required value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 91234-5678" />
                  </div>
                  {!editId && <p>A conta e a senha serão criadas pelo colaborador usando o convite.</p>}
                  <div className="form-group">
                    <label>Tipo</label>
                    <div className="btn-group">
                      <button type="button" className={`btn-radio ${!form.admin ? 'active' : ''}`} onClick={() => setForm({ ...form, admin: false })}>Funcionário</button>
                      <button type="button" className={`btn-radio ${form.admin ? 'active' : ''}`} onClick={() => setForm({ ...form, admin: true })}>Administrador</button>
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                    <button type="submit" className="btn-primary">Salvar</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>CPF</th>
                <th>Matrícula</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {empregados.map((e) => (
                <tr key={e.id}>
                  <td><strong>{e.nome}</strong></td>
                  <td>{e.email}</td>
                  <td>{e.telefone}</td>
                  <td>{e.cpf}</td>
                  <td>{e.matricula}</td>
                  <td>{e.admin ? 'Admin' : 'Funcionário'}</td>
                  <td><span className="badge badge-ok">{e.ativo ? 'Ativo' : 'Inativo'}</span></td>
                  <td>
                    <button className="btn-small btn-secondary" onClick={() => editar(e)}>Editar</button>
                    <button className="btn-small btn-danger" onClick={() => remover(e.id)}>Remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: REGISTROS */}
      {tab === 'registros' && (
        <div className="tab-content">
          <h3>Histórico de Registros</h3>
          <div className="form-group">
            <input placeholder="🔍 Buscar por nome ou tipo..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Colaborador</th>
                <th>Tipo</th>
                <th>Localização</th>
                <th>Justificativa</th>
              </tr>
            </thead>
            <tbody>
              {registros.slice(-50).reverse().map((r) => {
                const emp = getEmpregados().find((e) => e.id === r.idEmpregado);
                return (
                  <tr key={r.id}>
                    <td>{new Date(r.dataHora).toLocaleString('pt-BR')}</td>
                    <td>{emp?.nome || r.idEmpregado}</td>
                    <td>
                      <span className={`badge badge-${r.tipo === 'entrada' ? 'ok' : r.tipo === 'saida' ? 'danger' : 'warn'}`}>
                        {r.tipo === 'entrada' ? 'Entrada' : r.tipo === 'saida' ? 'Saída' : r.justificativa || 'Justificativa'}
                      </span>
                    </td>
                    <td>{r.localizacao ? `${r.localizacao.lat.toFixed(4)}, ${r.localizacao.lng.toFixed(4)}` : '—'}</td>
                    <td>{r.justificativa || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: FERIADOS */}
      {tab === 'feriados' && (
        <div className="tab-content">
          <h3>Gerenciar Feriados</h3>
          <div className="mes-nav">
            <button className="btn-secondary" onClick={() => setAnoFeriados((a) => a - 1)}>◀</button>
            <span className="mes-label">{anoFeriados}</span>
            <button className="btn-secondary" onClick={() => setAnoFeriados((a) => a + 1)}>▶</button>
          </div>

          <form onSubmit={adicionarFeriado} className="add-form">
            <input placeholder="Nome do feriado" value={novoFeriado.nome} onChange={(e) => setNovoFeriado({ ...novoFeriado, nome: e.target.value })} required />
            <input type="date" value={novoFeriado.data} onChange={(e) => setNovoFeriado({ ...novoFeriado, data: e.target.value })} required />
            <button type="submit" className="btn-primary">+ Adicionar</button>
          </form>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Feriado</th>
                <th>Tipo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {feriadosAno.map((f, i) => {
                const isCustom = customFeriados.find((cf) => cf.nome === f.nome && cf.data === f.data);
                return (
                  <tr key={i}>
                    <td>{new Date(`${f.data}T12:00:00`).toLocaleDateString('pt-BR')}</td>
                    <td>{f.nome}</td>
                    <td>{isCustom ? '📝 Personalizado' : '📅 Fixo'}</td>
                    <td>
                      {isCustom && (
                        <button className="btn-small btn-danger" onClick={() => removerFeriado(isCustom.id)}>Remover</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: CONFIG */}
      {tab === 'config' && (
        <div className="tab-content">
          <h3>⚙️ Configurações da Empresa e Jornada</h3>
          <form onSubmit={salvarConfig} className="config-form">
            <div className="form-row">
              <div className="form-group">
                <label>Nome da Empresa</label>
                <input value={cfg.empresa} onChange={(e) => handleCfgChange('empresa', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Jornada Diária (h)</label>
                <input type="number" min="1" max="24" value={cfg.jornadaDiariaMinutos / 60} onChange={(e) => handleCfgChange('jornadaDiariaMinutos', Number(e.target.value) * 60)} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Horário de Entrada</label>
                <input type="time" value={cfg.entrada} onChange={(e) => handleCfgChange('entrada', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Horário de Saída</label>
                <input type="time" value={cfg.saida} onChange={(e) => handleCfgChange('saida', e.target.value)} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Início do Almoço</label>
                <input type="time" value={cfg.inicioAlmoco} onChange={(e) => handleCfgChange('inicioAlmoco', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Fim do Almoço</label>
                <input type="time" value={cfg.fimAlmoco} onChange={(e) => handleCfgChange('fimAlmoco', e.target.value)} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Tolerância (minutos)</label>
                <input type="number" min="0" max="120" value={cfg.toleranciaMinutos} onChange={(e) => handleCfgChange('toleranciaMinutos', Number(e.target.value))} required />
              </div>
              <div className="form-group">
                <label>Máximo Horas Extras (minutos)</label>
                <input type="number" min="0" value={cfg.maxHorasExtras} onChange={(e) => handleCfgChange('maxHorasExtras', Number(e.target.value))} required />
              </div>
            </div>
            <div className="modal-actions">
              <button type="submit" className="btn-primary">{cfgSaved ? 'Salvo ✓' : 'Salvar Configurações'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
