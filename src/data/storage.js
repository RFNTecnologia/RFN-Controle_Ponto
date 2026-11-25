import { supabase } from './supabase.js';

let empregadosCache = [];
let registrosCache = [];
let feriadosCache = [];
let solicitacoesCache = [];
let atividadesCache = [];

function requireSupabase() {
  if (!supabase) {
    throw new Error('A conexão com o Supabase não está configurada.');
  }
  return supabase;
}

function clearLegacyStorage() {
  [
    'ponto.empregados',
    'ponto.registros',
    'ponto.feriadosCustom',
    'ponto.initialized',
    'ponto.session',
    'ponto_facil_db',
  ].forEach((key) => localStorage.removeItem(key));
}

export async function getProfileForUser(userId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('employees')
    .select('id,data')
    .eq('auth_user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`Não foi possível carregar o perfil: ${error.message}`);
  if (!data) return null;
  const profile = { ...data.data };
  delete profile.id;
  delete profile.senha;
  return { ...profile, id: data.id };
}

export async function initDB() {
  clearLegacyStorage();
  const client = requireSupabase();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw new Error(`Não foi possível verificar a sessão: ${sessionError.message}`);
  if (!sessionData.session) {
    clearDB();
    return;
  }

  const [employees, records, holidays, requests, activities, settings] = await Promise.all([
    client.from('employees').select('id,data'),
    client.from('time_records').select('id,employee_id,data'),
    client.from('custom_holidays').select('id,data'),
    client.from('requests').select('id,employee_id,data').order('created_at', { ascending: false }),
    client.from('activities').select('id,employee_id,data').order('created_at', { ascending: false }),
    client.from('app_settings').select('data').eq('id', 'company').maybeSingle(),
  ]);
  for (const result of [employees, records, holidays, requests, activities, settings]) {
    if (result.error) throw new Error(`Não foi possível carregar os dados: ${result.error.message}`);
  }

  empregadosCache = (employees.data || []).map((row) => {
    const profile = { ...row.data };
    delete profile.id;
    delete profile.senha;
    return { ...profile, id: row.id };
  });
  registrosCache = (records.data || []).map((row) => ({
    ...row.data,
    id: row.id,
    idEmpregado: row.employee_id,
  }));
  feriadosCache = (holidays.data || []).map((row) => ({ ...row.data, id: row.id }));
  solicitacoesCache = (requests.data || []).map((row) => ({ ...row.data, id: row.id, employeeId: row.employee_id }));
  atividadesCache = (activities.data || []).map((row) => ({ ...row.data, id: row.id, employeeId: row.employee_id }));
  if (settings.data?.data) {
    localStorage.setItem('ponto.config', JSON.stringify({ ...settings.data.data }));
  }
}

export function getSolicitacoes(employeeId) {
  return solicitacoesCache.filter((item) => item.employeeId === employeeId);
}

export async function addSolicitacao(employeeId, data) {
  const client = requireSupabase();
  const id = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  const row = {
    id,
    employee_id: String(employeeId),
    data: { ...data, status: 'Pendente' },
  };
  const { error } = await client.from('requests').insert(row);
  if (error) throw new Error(`Não foi possível enviar a solicitação: ${error.message}`);
  const item = { ...row.data, id, employeeId: String(employeeId) };
  solicitacoesCache = [item, ...solicitacoesCache];
  return item;
}

export function getAtividades(employeeId) {
  return atividadesCache.filter((item) => item.employeeId === employeeId);
}

export async function addAtividade(employeeId, data) {
  const client = requireSupabase();
  const id = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  const row = { id, employee_id: String(employeeId), data };
  const { error } = await client.from('activities').insert(row);
  if (error) throw new Error(`Não foi possível registrar a atividade: ${error.message}`);
  const item = { ...row.data, id, employeeId: String(employeeId) };
  atividadesCache = [item, ...atividadesCache];
  return item;
}

export function getEmpregados() {
  return empregadosCache;
}

export async function saveEmpregados(lista) {
  const client = requireSupabase();
  const { error } = await client.from('employees').upsert(
    lista.map(({ id, ...data }) => ({ id: String(id), data })),
    { onConflict: 'id' }
  );
  if (error) throw new Error(`Não foi possível salvar o perfil: ${error.message}`);
  empregadosCache = lista;
}

export async function addEmpregado(emp) {
  const client = requireSupabase();
  const novo = {
    ...emp,
    id: Date.now().toString(),
    ativo: true,
    dataAdmissao: new Date().toISOString().slice(0, 10),
  };
  delete novo.senha;
  const { id, ...profileData } = novo;

  const { error } = await client.from('employee_invites').insert({
    id,
    email: novo.email.trim().toLowerCase(),
    data: profileData,
  });
  if (error) throw new Error(`Não foi possível criar o convite: ${error.message}`);
  empregadosCache = [...empregadosCache, novo];
  return novo;
}

export async function updateEmpregado(id, dados) {
  const idx = empregadosCache.findIndex((emp) => emp.id === id);
  if (idx === -1) return null;

  const atualizado = { ...empregadosCache[idx], ...dados };
  delete atualizado.senha;
  const client = requireSupabase();
  const { error } = await client.from('employees')
    .update({ data: Object.fromEntries(Object.entries(atualizado).filter(([key]) => key !== 'id')) })
    .eq('id', String(id));
  if (error) throw new Error(`Não foi possível atualizar o perfil: ${error.message}`);

  empregadosCache[idx] = atualizado;
  return atualizado;
}

export async function deleteEmpregado(id) {
  const client = requireSupabase();
  const { error } = await client.from('employees').delete().eq('id', String(id));
  if (error) throw new Error(`Não foi possível remover o colaborador: ${error.message}`);
  empregadosCache = empregadosCache.filter((emp) => emp.id !== id);
}

export function getRegistros() {
  return registrosCache;
}

export async function addRegistro(reg) {
  const client = requireSupabase();
  const novo = {
    ...reg,
    id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
  };
  const { error } = await client.from('time_records').insert({
    id: novo.id,
    employee_id: String(novo.idEmpregado),
    data: novo,
  });
  if (error) throw new Error(`Não foi possível salvar o ponto: ${error.message}`);

  registrosCache = [...registrosCache, novo];
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

export async function addFeriadoCustom(feriado) {
  const client = requireSupabase();
  const novo = { ...feriado, id: Date.now().toString() };
  const { error } = await client.from('custom_holidays').insert({
    id: novo.id,
    data: novo,
  });
  if (error) throw new Error(`Não foi possível salvar o feriado: ${error.message}`);
  feriadosCache = [...feriadosCache, novo];
  return novo;
}

export async function removeFeriadoCustom(id) {
  const client = requireSupabase();
  const { error } = await client.from('custom_holidays').delete().eq('id', String(id));
  if (error) throw new Error(`Não foi possível remover o feriado: ${error.message}`);
  feriadosCache = feriadosCache.filter((feriado) => feriado.id !== id);
}

export function clearDB() {
  empregadosCache = [];
  registrosCache = [];
  feriadosCache = [];
  solicitacoesCache = [];
  atividadesCache = [];
  clearLegacyStorage();
}

export const resetDB = clearDB;
