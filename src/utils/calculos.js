import { CONFIG } from '../data/config.js';
import { ehDomingo, ehFeriado, ehSabado, diaUtil, todosFeriados } from '../data/feriados.js';
import { getRegistros } from '../data/storage.js';

// Re-export para compatibilidade com componentes
export { ehDomingo, ehFeriado, ehSabado, diaUtil, todosFeriados };

// Converte HH:MM para minutos desde 00:00
export function hmParaMinutos(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function minutosParaHM(min) {
  const sinal = min < 0 ? '-' : '';
  const abs = Math.abs(min);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sinal}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function minutosParaHoras(min) {
  const sinal = min < 0 ? '-' : '';
  const abs = Math.abs(min);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sinal}${h}h${String(m).padStart(2, '0')}min`;
}

// Calcula minutos trabalhados em um dia a partir dos registros
export function minutosTrabalhadosDia(registrosDia) {
  let total = 0;
  const entradas = registrosDia
    .filter((r) => r.tipo === 'entrada')
    .sort((a, b) => (a.dataHora < b.dataHora ? -1 : 1));
  const saidas = registrosDia
    .filter((r) => r.tipo === 'saida')
    .sort((a, b) => (a.dataHora < b.dataHora ? -1 : 1));

  for (let i = 0; i < Math.min(entradas.length, saidas.length); i++) {
    const ini = new Date(entradas[i].dataHora).getTime();
    const fim = new Date(saidas[i].dataHora).getTime();
    if (fim > ini) total += fim - ini;
  }
  // Subtrai intervalo de almoço se houver
  const iniAlmoco = hmParaMinutos(CONFIG.inicioAlmoco);
  const fimAlmoco = hmParaMinutos(CONFIG.fimAlmoco);
  const almoco = fimAlmoco - iniAlmoco;
  const horasTrab = total / 60000; // em horas
  if (horasTrab >= 6) {
    total -= almoco * 60000;
  }
  return Math.max(0, Math.round(total / 60000));
}

// Analisa um dia: se falta entrada/saída corretas
export function analisarDia(dataISO, registrosDia) {
  if (ehDomingo(dataISO)) return { tipo: 'descanso', label: 'Domingo', falta: false };
  if (ehFeriado(dataISO)) {
    const f = ehFeriado(dataISO);
    return { tipo: 'feriado', label: `Feriado: ${f?.nome || ''}`, falta: false };
  }
  if (!registrosDia || registrosDia.length === 0) {
    return { tipo: 'falta', label: 'Falta não justificada', falta: true };
  }
  const entradas = registrosDia.filter((r) => r.tipo === 'entrada');
  const saidas = registrosDia.filter((r) => r.tipo === 'saida');
  const justificativa = registrosDia.find((r) => r.tipo === 'justificativa');

  if (justificativa) {
    return { tipo: 'justificado', label: justificativa.justificativa || 'Justificado', falta: false };
  }
  if (entradas.length === 0) return { tipo: 'falta', label: 'Falta', falta: true };
  if (entradas.length > 0 && saidas.length === 0) {
    return { tipo: 'sem_saida', label: 'Saída não registrada', falta: false };
  }
  return { tipo: 'ok', label: 'OK', falta: false };
}

// Retorna todos os dias do mês
export function diasDoMes(ano, mes) {
  const dias = [];
  const ultimo = new Date(ano, mes + 1, 0).getDate();
  for (let d = 1; d <= ultimo; d++) {
    const iso = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const wd = new Date(`${iso}T12:00:00`).getDay();
    dias.push({ data: iso, diaSemana: wd });
  }
  return dias;
}

// Estatísticas do mês
export function calcularMes(idEmp, mesAno) {
  const [ano, mes] = mesAno.split('-').map(Number);
  const registros = getRegistrosMes(idEmp, mesAno);
  const todasDias = diasDoMes(ano, mes - 1);
  const dados = {};

  todasDias.forEach(({ data }) => {
    const regDia = registros.filter((r) => r.dataHora.startsWith(data));
    const minTrab = minutosTrabalhadosDia(regDia);
    const status = analisarDia(data, regDia);
    dados[data] = { ...status, minutos: minTrab, registros: regDia };
  });

  // Totais
  let diasUteis = 0,
    diasTrab = 0,
    diasFalta = 0,
    diasJust = 0;
  let totalMinTrab = 0,
    totalMinEsperado = 0;

  todasDias.forEach(({ data }) => {
    const d = dados[data];
    if (diaUtil(data)) {
      diasUteis++;
      totalMinEsperado += CONFIG.jornadaDiariaMinutos;
      if (d.tipo === 'ok' || d.tipo === 'sem_saida') {
        diasTrab++;
        totalMinTrab += d.minutos;
      } else if (d.tipo === 'falta') {
        diasFalta++;
      } else if (d.tipo === 'justificado') {
        diasJust++;
      }
    }
  });

  const saldoMin = totalMinTrab - totalMinEsperado;
  return {
    dados,
    diasUteis,
    diasTrab,
    diasFalta,
    diasJust,
    totalMinTrab,
    totalMinEsperado,
    saldoMin,
  };
}

function getRegistrosMes(idEmp, mesAno) {
  return getRegistros().filter((r) =>
    r.idEmpregado === idEmp && r.dataHora.startsWith(mesAno)
  );
}

// Descobre qual foi o último tipo batido no dia
export function ultimoTipoHoje(idEmp, dataISO) {
  const doDia = getRegistros()
    .filter((r) => r.idEmpregado === idEmp && r.dataHora.startsWith(dataISO))
    .sort((a, b) => b.dataHora.localeCompare(a.dataHora));
  return doDia[0]?.tipo || null;
}
