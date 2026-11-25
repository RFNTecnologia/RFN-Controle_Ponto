export const CONFIG = {
  empresa: 'RFNTecnologia',
  entrada: '08:00',
  saida: '17:00',
  inicioAlmoco: '12:00',
  fimAlmoco: '13:00',
  diasSemana: [1, 2, 3, 4, 5], // Segunda a Sexta
  toleranciaMinutos: 10,
  jornadaDiariaMinutos: 480, // 8h
  maxHorasExtras: 120,
};

export const FERIADOS_FIXOS = [
  { nome: 'Confraternização Universal', data: '01-01' },
  { nome: 'Carnaval (Segunda)', data: '02-12' }, // Varia - configurável
  { nome: 'Carnaval (Terça)', data: '02-13' },
  { nome: 'Quarta-feira de Cinzas', data: '02-14' },
  { nome: 'Sexta-feira Santa', data: '03-29' }, // Varia
  { nome: 'Tiradentes', data: '04-21' },
  { nome: 'Dia do Trabalhador', data: '05-01' },
  { nome: 'Corpus Christi', data: '05-30' }, // Varia
  { nome: 'Independência do Brasil', data: '09-07' },
  { nome: 'Nossa Senhora Aparecida', data: '10-12' },
  { nome: 'Finados', data: '11-02' },
  { nome: 'Proclamação da República', data: '11-15' },
  { nome: 'Natal', data: '12-25' },
];

const CONFIG_KEY = 'ponto.config';

import { supabase } from './supabase.js';

export function getConfig() {
  try {
    const salvo = localStorage.getItem(CONFIG_KEY);
    if (salvo) return { ...CONFIG, ...JSON.parse(salvo) };
  } catch {
    // ignore
  }
  return { ...CONFIG };
}

export async function loadRemoteConfig() {
  if (!supabase) return getConfig();
  const { data, error } = await supabase
    .from('app_settings')
    .select('data')
    .eq('id', 'company')
    .maybeSingle();
  if (error) throw new Error(`Não foi possível carregar as configurações: ${error.message}`);
  if (!data?.data) return getConfig();
  const config = { ...CONFIG, ...data.data };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  return config;
}

export async function saveConfig(values) {
  const atual = getConfig();
  const merged = { ...atual, ...values };
  if (!supabase) throw new Error('A conexão com o Supabase não está configurada.');
  const { error } = await supabase
    .from('app_settings')
    .upsert({ id: 'company', data: merged }, { onConflict: 'id' });
  if (error) throw new Error(`Não foi possível salvar as configurações: ${error.message}`);
  localStorage.setItem(CONFIG_KEY, JSON.stringify(merged));
  return merged;
}

export function resetConfig() {
  localStorage.removeItem(CONFIG_KEY);
}
