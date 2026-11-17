import { supabase } from '../lib/supabase'

// Falha de rede/servidor (não de senha errada). Comum na primeira requisição
// do PWA logo depois de abrir: vale uma nova tentativa automática.
export function isNetworkAuthError(error) {
  return (
    error?.name === 'AuthRetryableFetchError' ||
    error?.status === 0 ||
    (error?.status >= 500 && error?.status < 600) ||
    /fetch|network|load failed/i.test(error?.message || '')
  )
}

export async function signIn(email, password) {
  const credentials = { email: (email || '').trim().toLowerCase(), password }
  let { data, error } = await supabase.auth.signInWithPassword(credentials)
  if (error && isNetworkAuthError(error)) {
    await new Promise((r) => setTimeout(r, 800))
    ;({ data, error } = await supabase.auth.signInWithPassword(credentials))
  }
  if (error) throw error
  return data
}

export async function signUp(email, password, name, extra = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, ...extra } },
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function updatePassword(email, currentPassword, newPassword) {
  await signIn(email, currentPassword)
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function updateEmail(currentEmail, currentPassword, newEmail) {
  await signIn(currentEmail, currentPassword)
  const { error } = await supabase.auth.updateUser({ email: newEmail })
  if (error) throw error
}
