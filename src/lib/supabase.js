import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Dentro de um iframe de terceiro (widget no site da prefeitura) com cookies
// de terceiros bloqueados, só de tocar em window.localStorage o navegador
// lança SecurityError. Nesse caso cai num storage em memória.
function safeStorage() {
  try {
    const s = window.localStorage
    const k = '__tik_probe__'
    s.setItem(k, '1')
    s.removeItem(k)
    return s
  } catch {
    const mem = new Map()
    return {
      getItem: (k) => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, v) => mem.set(k, String(v)),
      removeItem: (k) => mem.delete(k),
    }
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Mantém a sessão salva no dispositivo (inclusive no PWA instalado) e
    // renova o token automaticamente, para o usuário não precisar logar de novo.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: safeStorage(),
  },
})
