import { supabase } from '../lib/supabase'

// Pedidos de demonstração do formulário da landing (src/pages/Principal.jsx).
// Quem preenche não está logado: a policy leads_insert_publico libera o insert
// para o papel anônimo, e a leitura fica só com o super admin.
export async function createLead({ nome, cargo, telefone, plano }) {
  const { error } = await supabase.from('leads').insert({
    nome: nome.trim(),
    cargo: cargo || null,
    telefone: telefone.trim(),
    plano: plano || null,
  })
  if (error) throw error
}
