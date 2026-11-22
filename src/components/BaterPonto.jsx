import React, { useState, useRef } from 'react';
import { useLocalStorage } from '../hooks.js';
import { useGeolocation } from '../hooks.js';
import { useCamera } from '../hooks.js';
import { CONFIG } from '../data/config.js';
import { getEmpregados, addRegistro } from '../data/storage.js';
import {
  ultimoTipoHoje,
  ehDomingo,
  ehSabado,
  ehFeriado,
  diaUtil,
} from '../utils/calculos.js';

// Bater ponto modal
export default function BaterPonto({ emp, onClose }) {
  const [tipo, setTipo] = useState('entrada');
  const [justificativa, setJustificativa] = useState('');
  const [foto, setFoto] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [msg, setMsg] = useState('');
  const [mostrarCamera, setMostrarCamera] = useState(true);
  const videoRef = useRef(null);
  const { pos, erro: geoErro, solicitar: solicitarGeo } = useGeolocation();
  const { stream, erro: camErro, iniciar, parar, capturar } = useCamera(videoRef, (f) => setFoto(f));

  const hoje = new Date().toISOString().slice(0, 10);
  const ultimo = emp ? ultimoTipoHoje(emp.id, hoje) : null;
  const isFeriado = ehFeriado(hoje);
  const isDomingo = ehDomingo(hoje);
  const isSabado = ehSabado(hoje);

  if (isDomingo || isFeriado) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h3>Bater Ponto</h3>
            <button className="btn-close" onClick={onClose}>✕</button>
          </div>
          <div className="card-info">
            <div className="info-badge holiday">
              {isDomingo ? '🔴 Domingo - Descanso' : `🔴 ${isFeriado.nome} - Feriado`}
            </div>
            <p>Hoje não é dia útil. Não é necessário bater ponto.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!diaUtil(hoje) && !isFeriado && !isDomingo) {
    // sábado sem expediente configurado
  }

  // Determinar tipo sugerido
  React.useEffect(() => {
    if (ultimo === 'entrada') setTipo('saida');
    else if (ultimo === 'saida' || ultimo === null) setTipo('entrada');
  }, [ultimo]);

  React.useEffect(() => {
    if (mostrarCamera) iniciar();
    return () => parar();
  }, [mostrarCamera]);

  const handleCapturar = () => {
    const f = capturar();
    if (f) setFoto(f);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setProcessando(true);
    setTimeout(() => {
      addRegistro({
        idEmpregado: emp.id,
        tipo,
        dataHora: new Date().toISOString(),
        localizacao: pos || null,
        foto: foto,
        justificativa: tipo === 'justificativa' ? justificativa : null,
        dispositivo: navigator.userAgent,
      });
      setMsg('Ponto registrado com sucesso! ✓');
      setProcessando(false);
      setTimeout(() => onClose(), 1200);
    }, 800);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>🎯 Bater Ponto</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Colaborador</label>
            <div className="readonly-field">{emp?.nome}</div>
          </div>

          <div className="form-group">
            <label>Data e Hora Atual</label>
            <div className="readonly-field">
              {new Date().toLocaleString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
          </div>

          {/* Tipo de registro */}
          <div className="form-group">
            <label>Tipo de Registro</label>
            <div className="btn-group">
              {['entrada', 'saida', 'justificativa'].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`btn-radio ${tipo === t ? 'active' : ''}`}
                  onClick={() => { setTipo(t); if (t === 'justificativa') setJustificativa(''); }}
                >
                  {t === 'entrada' ? '🟢 Entrada' : t === 'saida' ? '🔴 Saída' : '📝 Justificativa'}
                </button>
              ))}
            </div>
          </div>

          {/* Justificativa */}
          {tipo === 'justificativa' && (
            <div className="form-group">
              <label>Motivo da Justificativa</label>
              <select
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                required
              >
                <option value="">Selecione...</option>
                <option value="Atestado médico">Atestado médico</option>
                <option value="Atestado odontológico">Atestado odontológico</option>
                <option value="Licença maternidade/paternidade">Licença maternidade/paternidade</option>
                <option value="Falta justificada">Falta justificada</option>
                <option value="Compensação de horas">Compensação de horas</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          )}

          {/* Câmera */}
          <div className="form-group">
            <label>📸 Foto de Confirmação (obrigatória)</label>
            <div className="camera-box">
              {mostrarCamera && !foto && (
                <>
                  <video ref={videoRef} autoPlay playsInline muted />
                  {camErro && <div className="camera-erro">⚠️ {camErro}</div>}
                </>
              )}
              {foto && (
                <div className="foto-preview">
                  <img src={foto} alt="Foto capturada" />
                </div>
              )}
            </div>
            <div className="camera-actions">
              {!foto ? (
                <button type="button" className="btn-secondary" onClick={handleCapturar}>
                  📸 Capturar Foto
                </button>
              ) : (
                <>
                  <button type="button" className="btn-secondary" onClick={() => { setFoto(null); setMostrarCamera(true); }}>
                    🔄 Nova Foto
                  </button>
                  <span className="text-muted">✓ Foto capturada</span>
                </>
              )}
            </div>
          </div>

          {/* GPS */}
          <div className="form-group">
            <label>📍 Localização</label>
            <div className="gps-box">
              {!pos && !geoErro && (
                <button type="button" className="btn-secondary" onClick={solicitarGeo}>
                  📍 Obter Localização
                </button>
              )}
              {geoErro && <div className="gps-erro">⚠️ {geoErro}</div>}
              {pos && (
                <div className="gps-ok">
                  <span>✓ Localização capturada</span>
                  <span className="text-muted">
                    {pos.lat.toFixed(6)}, {pos.lng.toFixed(6)}
                  </span>
                  {pos.acc && <span className="text-muted"> (±{Math.round(pos.acc)}m)</span>}
                </div>
              )}
            </div>
          </div>

          {msg && <div className="success-msg">{msg}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={processando || !foto || !pos}>
              {processando ? 'Registrando...' : '✅ Confirmar Ponto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
