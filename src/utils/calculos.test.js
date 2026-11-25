import { describe, expect, it } from 'vitest';
import { hmParaMinutos, minutosParaHM, minutosParaHoras } from './calculos.js';

describe('Conversões de tempo', () => {
  it('converte HH:MM em minutos', () => {
    expect(hmParaMinutos('08:30')).toBe(510);
  });

  it('formata minutos como HH:MM', () => {
    expect(minutosParaHM(510)).toBe('08:30');
    expect(minutosParaHM(-30)).toBe('-00:30');
  });

  it('formata minutos como horas legíveis', () => {
    expect(minutosParaHoras(90)).toBe('1h30min');
  });
});
