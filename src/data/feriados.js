import { FERIADOS_FIXOS, getConfig } from './config.js';

// Retorna a data (YYYY-MM-DD) do feriado no ano informado, se existir.
export function feriadoNoAno(ano) {
  const mapa = {
    'Carnaval (Segunda)': dataCarnaval(ano, -48),
    'Carnaval (Terça)': dataCarnaval(ano, -47),
    'Quarta-feira de Cinzas': dataCarnaval(ano, -46),
    'Sexta-feira Santa': dataSextaSanta(ano),
    'Corpus Christi': dataCorpusChristi(ano),
  };
  return FERIADOS_FIXOS.map((f) => {
    const d = mapa[f.nome] || `${ano}-${f.data}`;
    return { nome: f.nome, data: d };
  });
}

// Carnaval: 47 dias antes da Páscoa (terça-feira é 47 dias antes)
function dataCarnaval(ano, offsetDias) {
  const pascoa = dataPascoa(ano);
  const d = new Date(pascoa.getTime());
  d.setDate(d.getDate() + offsetDias);
  return paraISO(d);
}

// Sexta-feira Santa: 2 dias antes da Páscoa
function dataSextaSanta(ano) {
  const pascoa = dataPascoa(ano);
  const d = new Date(pascoa.getTime());
  d.setDate(d.getDate() - 2);
  return paraISO(d);
}

// Corpus Christi: 60 dias depois da Páscoa
function dataCorpusChristi(ano) {
  const pascoa = dataPascoa(ano);
  const d = new Date(pascoa.getTime());
  d.setDate(d.getDate() + 60);
  return paraISO(d);
}

// Algoritmo de Meeus/Jones/Butcher
export function dataPascoa(ano) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

function paraISO(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dia}`;
}

// Feriados personalizados salvos no storage (empresa pode adicionar)
export function feriadosPersonalizados() {
  return getFeriadosCustom();
}

export function todosFeriados(ano) {
  const base = feriadoNoAno(ano);
  const custom = feriadosPersonalizados()
    .filter((f) => f.data.startsWith(String(ano)))
    .map((f) => ({ nome: f.nome, data: f.data, custom: true }));
  return [...base, ...custom];
}

export function ehFeriado(iso) {
  const ano = Number(iso.slice(0, 4));
  return todosFeriados(ano).find((f) => f.data === iso) || null;
}

export function ehDomingo(iso) {
  const d = new Date(`${iso}T12:00:00`);
  return d.getDay() === 0;
}

export function ehSabado(iso) {
  const d = new Date(`${iso}T12:00:00`);
  return d.getDay() === 6;
}

export function diaUtil(iso) {
  const diaSemana = new Date(`${iso}T12:00:00`).getDay();
  return getConfig().diasSemana.includes(diaSemana) && !ehFeriado(iso);
}
import { getFeriadosCustom } from './storage.js';
