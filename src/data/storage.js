import { supabase } from './supabase.js';

let empregadosCache = [];
let registrosCache = [];
let feriadosCache = [];

const readLocal = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const defaults = [
  {
    id: '1',
    nome: 'Administrador',
    cargo: 'Admin',
    matricula: 'ADM-001',
    cpf: '000.000.000-00',
    email: 'admin@ponto.com',
    telefone: '(00) 00000-0000',
    senha: 'admin123',
    admin: true,
    ativo: true,
    foto: null,
    dataAdmissao: new Date().toISOString().slice(0, 10),
  },
  {
    id: '2',
    nome: 'Joao Silva',
    cargo: 'Desenvolvedor',
    matricula: 'EMP-001',
    cpf: '123.456.789-00',
    email: 'joao@ponto.com',
    telefone: '(11) 91234-5678',
    senha: '1234',
    admin: false,
    ativo: true,
    foto: null,
    dataAdmissao: '2024-01-15',
  },
];

async function fetchTable(table, transform) {
  if (!supabase) return null;
  const { data, error } = await supabase.from(table).select('*');
  if (error) {
    console.error(`Erro ao carregar ${table}:`, error);
    return null;
  }
  return (data || []).map(transform);
}

export async function initDB() {
  empregadosCache = readLocal('ponto.empregados', []);
  registrosCache = readLocal('ponto.registros', []);
  feriadosCache = readLocal('ponto.feriadosCustom', []);

  if (!supabase) return;

  const empregadosRemotos = await fetchTable('employees', (row) => ({ id: row.id, ...row.data }));
  const registrosRemotos = await fetchTable('time_records', (row) => ({ id: row.id, ...row.data }));
  const feriadosRemotos = await fetchTable('custom_holidays', (row) => ({ id: row.id, ...row.data }));

  if (empregadosRemotos && empregadosRemotos.length > 0) empregadosCache = empregadosRemotos;
  if (registrosRemotos) registrosCache = registrosRemotos;
  if (feriadosRemotos) feriadosCache = feriadosRemotos;

  if (empregadosRemotos && empregadosRemotos.length === 0) {
    const locais = empregadosCache.length > 0 ? empregadosCache : defaults;
    empregadosCache = locais;
    await Promise.all(locais.map((emp) =>
      supabase.from('employees').upsert({ id: String(emp.id), data: emp }, { onConflict: 'id' })
    ));
  }

  if (!empregadosCache.find((emp) => emp.admin)) {
    const admin = defaults[0];
    empregadosCache.push(admin);
    await supabase.from('employees').upsert({ id: admin.id, data: admin }, { onConflict: 'id' });
  }

  localStorage.setItem('ponto.empregados', JSON.stringify(empregadosCache));
  localStorage.setItem('ponto.registros', JSON.stringify(registrosCache));
  localStorage.setItem('ponto.feriadosCustom', JSON.stringify(feriadosCache));
}

function gerarEmail(emp) {
  if (!emp.nome) return '';
  const partes = emp.nome.toLowerCase().split(' ');
  if (partes.length >= 2) return `${partes[0]}.${partes[partes.length - 1]}@ponto.com`;
  return `${partes[0]}@ponto.com`;
}

export function getEmpregados() {
  return empregadosCache;
}

export function saveEmpregados(lista) {
  empregadosCache = lista;
  localStorage.setItem('ponto.empregados', JSON.stringify(lista));
  if (supabase) {
    Promise.all(lista.map((emp) =>
      supabase.from('employees').upsert({ id: String(emp.id), data: emp }, { onConflict: 'id' })
    )).catch((error) => console.error('Erro ao salvar empregados:', error));
  }
}

export function addEmpregado(emp) {
  const novo = {
    ...emp,
    id: Date.now().toString(),
    ativo: true,
    dataAdmissao: new Date().toISOString().slice(0, 10),
  };
  empregadosCache = [...empregadosCache, novo];
  saveEmpregados(empregadosCache);
  return novo;
}

export function updateEmpregado(id, dados) {
  const idx = empregadosCache.findIndex((emp) => emp.id === id);
  if (idx === -1) return null;
  empregadosCache[idx] = { ...empregadosCache[idx], ...dados };
  saveEmpregados([...empregadosCache]);
  return empregadosCache[idx];
}

export function deleteEmpregado(id) {
  empregadosCache = empregadosCache.filter((emp) => emp.id !== id);
  localStorage.setItem('ponto.empregados', JSON.stringify(empregadosCache));
  if (supabase) supabase.from('employees').delete().eq('id', String(id)).then(({ error }) => {
    if (error) console.error('Erro ao remover empregado:', error);
  });
}

export function getRegistros() {
  return registrosCache;
}

export function addRegistro(reg) {
  const novo = { ...reg, id: Date.now().toString() + Math.random().toString(36).slice(2, 8) };
  registrosCache = [...registrosCache, novo];
  localStorage.setItem('ponto.registros', JSON.stringify(registrosCache));
  if (supabase) {
    supabase.from('time_records').upsert({
      id: novo.id,
      employee_id: String(novo.idEmpregado),
      data: novo,
    }, { onConflict: 'id' }).then(({ error }) => {
      if (error) console.error('Erro ao salvar registro:', error);
    });
  }
  return novo;
}

export function getRegistrosPorEmpregado(idEmp, mesAno) {
  return registrosCache.filter((reg) =>
    reg.idEmpregado === idEmp && reg.dataHora.startsWith(mesAno)
  );
}

export function getFeriadosCustom() {
  return feriadosCache;
}

export function addFeriadoCustom(feriado) {
  const novo = { ...feriado, id: Date.now().toString() };
  feriadosCache = [...feriadosCache, novo];
  localStorage.setItem('ponto.feriadosCustom', JSON.stringify(feriadosCache));
  if (supabase) {
    supabase.from('custom_holidays').upsert({ id: novo.id, data: novo }, { onConflict: 'id' })
      .then(({ error }) => {
        if (error) console.error('Erro ao salvar feriado:', error);
      });
  }
  return novo;
}

export function removeFeriadoCustom(id) {
  feriadosCache = feriadosCache.filter((feriado) => feriado.id !== id);
  localStorage.setItem('ponto.feriadosCustom', JSON.stringify(feriadosCache));
  if (supabase) supabase.from('custom_holidays').delete().eq('id', String(id));
}

export function resetDB() {
  empregadosCache = [];
  registrosCache = [];
  feriadosCache = [];
  ['ponto.empregados', 'ponto.registros', 'ponto.feriadosCustom', 'ponto.initialized'].forEach((key) =>
    localStorage.removeItem(key)
  );
}
