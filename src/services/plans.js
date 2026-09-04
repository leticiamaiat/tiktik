import { supabase } from '../lib/supabase'
import { DEFAULT_PLAN } from '../constants/plans'

// Início do dia em UTC — casa com o date_trunc('day', now()) das triggers do
// banco (Supabase roda em UTC por padrão).
function startOfTodayUTC() {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}

// Plano + configurações da prefeitura (municipality + state). Sem linha em
// `municipalities` = plano 'Básico' com publicação direta liberada (padrão).
export async function getMunicipalitySettings(municipality, state) {
  if (!municipality || !state) return { plan: DEFAULT_PLAN, selfPublishEnabled: true }
  const { data, error } = await supabase
    .from('municipalities')
    .select('plan, self_publish_enabled')
    .eq('municipality', municipality)
    .eq('state', state)
    .maybeSingle()
  if (error) throw error
  return {
    plan: data?.plan || DEFAULT_PLAN,
    selfPublishEnabled: data?.self_publish_enabled ?? true,
  }
}

// Liga/desliga a publicação direta no Instagram ao criar um tik (Home.jsx),
// para o MUNICÍPIO do usuário logado. Só o admin do município (ou o super
// admin) consegue — checado dentro do RPC.
export async function setSelfPublishEnabled(enabled) {
  const { error } = await supabase.rpc('set_self_publish_enabled', { p_enabled: enabled })
  if (error) throw error
}

// Consumo do dia da prefeitura: quantos tiks e quantos compartilhamentos já
// foram feitos hoje (por todos os colaboradores do município).
export async function getPlanUsage(municipality, state) {
  if (!municipality || !state) return { tiksToday: 0, sharesToday: 0 }
  const since = startOfTodayUTC()

  const [tiks, shares] = await Promise.all([
    supabase
      .from('tiks')
      .select('id, profiles!inner(municipality, state)', { count: 'exact', head: true })
      .eq('profiles.municipality', municipality)
      .eq('profiles.state', state)
      .gte('created_at', since),
    supabase
      .from('share_events')
      .select('id', { count: 'exact', head: true })
      .eq('municipality', municipality)
      .eq('state', state)
      .gte('created_at', since),
  ])

  if (tiks.error) throw tiks.error
  if (shares.error) throw shares.error
  return { tiksToday: tiks.count ?? 0, sharesToday: shares.count ?? 0 }
}

// Registra um compartilhamento bem-sucedido (chamar SÓ após publicar de verdade).
export async function recordShare({ tikId, userId, municipality, state, platform = 'instagram' }) {
  const { error } = await supabase.from('share_events').insert({
    tik_id: tikId || null,
    user_id: userId,
    municipality,
    state,
    platform,
  })
  if (error) throw error
}

// Mapa "município|UF" -> plano, pra telas que listam colaboradores de vários
// municípios de uma vez (ex.: Colaboradores.jsx) e precisam mostrar o plano
// de cada linha. Diferente do RPC list_municipalities: não exige super admin
// (a policy municipalities_select_authenticated já libera leitura geral).
export async function listMunicipalityPlans() {
  const { data, error } = await supabase.from('municipalities').select('municipality, state, plan')
  if (error) throw error
  const map = new Map()
  for (const row of data || []) {
    map.set(`${row.municipality}|${row.state}`, row.plan)
  }
  return map
}

// --- Super admin ---

export async function listMunicipalities() {
  const { data, error } = await supabase.rpc('list_municipalities')
  if (error) throw error
  return data || []
}

export async function setMunicipalityAdmin(profileId) {
  const { error } = await supabase.rpc('set_municipality_admin', { target: profileId })
  if (error) throw error
}

export async function setMunicipalityPlan(municipality, state, plan, updatedBy) {
  const { error } = await supabase.from('municipalities').upsert(
    {
      municipality,
      state,
      plan,
      updated_by: updatedBy || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'municipality,state' }
  )
  if (error) throw error
}

// Pré-checagem de vaga no cadastro (antes do login). { used, max }
export async function municipalitySeats(municipality, state) {
  const { data, error } = await supabase.rpc('municipality_seats', {
    p_m: municipality,
    p_s: state,
  })
  if (error) throw error
  return data?.[0] || null
}
