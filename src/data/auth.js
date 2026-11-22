import { supabase } from './supabase.js';
import { clearDB, getProfileForUser, initDB } from './storage.js';

function requireSupabase() {
  if (!supabase) {
    throw new Error('A conexão segura com o Supabase não está configurada.');
  }
  return supabase;
}

export async function loadAuthenticatedProfile(userId) {
  const profile = await getProfileForUser(userId);
  if (!profile || !profile.ativo) {
    await signOut();
    throw new Error('Este usuário não tem um perfil ativo. Fale com o administrador.');
  }
  await initDB();
  return profile;
}

export async function signInWithEmail(email, password) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw new Error('E-mail ou senha incorretos.');
  return loadAuthenticatedProfile(data.user.id);
}

export async function signUpWithInvite(email, password) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) {
    if (error.message.includes('Database error saving new user')) {
      throw new Error('Cadastro não autorizado. Peça ao administrador para criar um convite para este e-mail.');
    }
    throw new Error(error.message);
  }

  if (!data.session || !data.user) {
    return { profile: null, confirmationRequired: true };
  }

  return {
    profile: await loadAuthenticatedProfile(data.user.id),
    confirmationRequired: false,
  };
}

export async function requestPasswordReset(email) {
  const client = requireSupabase();
  const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}${window.location.pathname}`,
  });
  if (error) throw new Error(error.message);
}

export async function updatePassword(password) {
  const client = requireSupabase();
  const { error } = await client.auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

export async function signOut() {
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(`Não foi possível encerrar a sessão: ${error.message}`);
  }
  clearDB();
}
