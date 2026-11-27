import React, { useState, useEffect } from 'react';
import { supabase } from '../data/supabase.js';

const STORAGE_KEY = 'ponto.servidor_proprio';

function loadServerConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return {
    host: '',
    port: '22',
    usuario: '',
    caminho: '/var/www/pontofacil',
    status: 'desconhecido',
  };
}

function saveServerConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export default function ServidorProprio() {
  const [cfg, setCfg] = useState(loadServerConfig);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [testando, setTestando] = useState(false);

  useEffect(() => {
    saveServerConfig(cfg);
  }, [cfg]);

  const handleChange = (key, value) => {
    setCfg((prev) => ({ ...prev, [key]: value }));
    setMensagem('');
  };

  const testarConexao = async () => {
    setTestando(true);
    setMensagem('');
    try {
      if (!cfg.host || !cfg.usuario) {
        throw new Error('Preencha o host e o usuário para testar.');
      }
      // Simula teste de conexão via API própria (deve ser substituída por um backend real)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setCfg((prev) => ({ ...prev, status: 'online' }));
      setMensagem('Conexão testada com sucesso (simulação).');
    } catch (error) {
      setCfg((prev) => ({ ...prev, status: 'offline' }));
      setMensagem(error.message || 'Erro ao testar conexão.');
    } finally {
      setTestando(false);
    }
  };

  const salvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setMensagem('');
    try {
      if (supabase) {
        const { error } = await supabase
          .from('app_settings')
          .upsert({ id: 'servidor_proprio', data: cfg }, { onConflict: 'id' });
        if (error) throw error;
      }
      saveServerConfig(cfg);
      setMensagem('Configurações do servidor salvas com sucesso!');
    } catch (error) {
      setMensagem(error.message || 'Erro ao salvar configurações.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="tab-content">
      <h3>🖥️ Servidor Próprio / VPS</h3>
      <p className="text-muted">Configure aqui os dados do seu servidor para deploy local ou VPS.</p>

      {mensagem && (
        <div className={`msg ${mensagem.includes('sucesso') || mensagem.includes('Salvas') ? 'success-msg' : 'error-msg'}`}>
          {mensagem}
        </div>
      )}

      <form onSubmit={salvar} className="config-form">
        <div className="form-row">
          <div className="form-group">
            <label>Host / Endereço *</label>
            <input
              type="text"
              value={cfg.host}
              onChange={(e) => handleChange('host', e.target.value)}
              placeholder="ex: 192.168.1.10 ou servidor.empresa.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Porta SSH *</label>
            <input
              type="number"
              value={cfg.port}
              onChange={(e) => handleChange('port', e.target.value)}
              placeholder="22"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Usuário SSH *</label>
            <input
              type="text"
              value={cfg.usuario}
              onChange={(e) => handleChange('usuario', e.target.value)}
              placeholder="ex: root, deploy, ubuntu"
              required
            />
          </div>
          <div className="form-group">
            <label>Caminho do Projeto no Servidor</label>
            <input
              type="text"
              value={cfg.caminho}
              onChange={(e) => handleChange('caminho', e.target.value)}
              placeholder="/var/www/pontofacil"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Status da Conexão</label>
            <div className="status-display">
              <span className={`status-badge status-${cfg.status === 'online' ? 'ok' : cfg.status === 'offline' ? 'danger' : 'warn'}`}>
                {cfg.status === 'online' ? '🟢 Online' : cfg.status === 'offline' ? '🔴 Offline' : '🟡 Desconhecido'}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={testarConexao} disabled={testando}>
            {testando ? 'Testando...' : '🔌 Testar Conexão'}
          </button>
          <button type="submit" className="btn-primary" disabled={salvando}>
            {salvando ? 'Salvando...' : '💾 Salvar Configurações'}
          </button>
        </div>
      </form>

      <div className="help-box">
        <h4>ℹ️ Como usar</h4>
        <ul>
          <li>Informe o endereço IP ou domínio do seu VPS/servidor.</li>
          <li>Informe a porta SSH (padrão: 22).</li>
          <li>Informe o usuário com permissão de deploy no servidor.</li>
          <li>Informe o caminho onde o projeto será hospedado no servidor.</li>
          <li>Clique em <strong>Testar Conexão</strong> para verificar acessibilidade (simulação).</li>
          <li>Após configurar, use o comando <code>npm run build:vps</code> para gerar os arquivos para deploy.</li>
        </ul>
      </div>
    </div>
  );
}
