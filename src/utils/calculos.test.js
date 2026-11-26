import { describe, expect, it } from 'vitest';
import { diaUtil, hmParaMinutos, minutosParaHM, minutosParaHoras } from './calculos.js';
import { dataLocalISO, mesLocalISO } from './datas.js';

describe('Conversões de tempo', () => {
  it('converte HH:MM em minutos', () => {
    expect(hmParaMinutos('08:30')).toBe(510);
  });

  describe('Datas locais', () => {
    it('mantém a data e o mês no fuso local', () => {
      const data = new Date(2026, 10, 26, 23, 30);
      expect(dataLocalISO(data)).toBe('2026-11-26');
      expect(mesLocalISO(data)).toBe('2026-11');
    });

    it('respeita os dias de expediente configurados', () => {
      expect(diaUtil('2026-11-27')).toBe(true);
      expect(diaUtil('2026-11-28')).toBe(false);
    });
  });

  it('formata minutos como HH:MM', () => {
    expect(minutosParaHM(510)).toBe('08:30');
    expect(minutosParaHM(-30)).toBe('-00:30');
  });

  it('formata minutos como horas legíveis', () => {
    expect(minutosParaHoras(90)).toBe('1h30min');
  });
});
