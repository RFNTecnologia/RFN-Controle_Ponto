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

export function getConfig() {
  try {
    const salvo = localStorage.getItem(CONFIG_KEY);
    if (salvo) return JSON.parse(salvo);
  } catch {
    // ignore
  }
  return { ...CONFIG };
}

export function saveConfig(values) {
  const atual = getConfig();
  const merged = { ...atual, ...values };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(merged));
}

export function resetConfig() {
  localStorage.removeItem(CONFIG_KEY);
}
