// Limites de cada plano da landing (src/pages/Principal.jsx).
//
// ATENÇÃO: mantenha estes números iguais aos da seed da tabela plan_limits em
// supabase_migration_plan_limits_feed_story.sql — o frontend usa este arquivo
// para mensagens/contadores e as triggers do banco usam a tabela.
//
//   tiksPerDay        -> tiks que a prefeitura inteira pode criar por dia
//   maxUsers          -> nº de contas de colaborador por prefeitura
//   feedSharesPerDay  -> publicações no FEED por dia (Instagram + Facebook)
//   storySharesPerDay -> publicações em STORY por dia (Instagram + Facebook)
//
// Em qualquer um deles: null = ilimitado, 0 = o plano não inclui o recurso.

export const DEFAULT_PLAN = 'Básico'

export const PLAN_LIMITS = {
  'Básico':        { tiksPerDay: 2,    maxUsers: 2,    feedSharesPerDay: 0,    storySharesPerDay: 0 },
  'Essencial':     { tiksPerDay: 30,   maxUsers: 7,    feedSharesPerDay: 6,    storySharesPerDay: 12 },
  'Avançado':      { tiksPerDay: null, maxUsers: 20,   feedSharesPerDay: 12,   storySharesPerDay: 36 },
  'Transformador': { tiksPerDay: null, maxUsers: null, feedSharesPerDay: null, storySharesPerDay: null },
}

export const PLAN_NAMES = Object.keys(PLAN_LIMITS)

export const PLACEMENTS = ['feed', 'story']

// Aceita valores legados tipo "Plano Essencial" e devolve "Essencial".
export function normalizePlan(plan) {
  const name = (plan || '').replace(/^plano\s+/i, '').trim()
  return PLAN_NAMES.includes(name) ? name : DEFAULT_PLAN
}

export function planLimits(plan) {
  return PLAN_LIMITS[normalizePlan(plan)]
}

export function isUnlimited(limit) {
  return limit === null
}

// Para exibir o limite em tela ("30", "Ilimitado", "—" quando não incluso).
export function formatLimit(limit) {
  if (limit === null) return 'Ilimitado'
  if (limit === 0) return '—'
  return String(limit)
}

// Teto diário de publicações de um placement. undefined (plano antigo sem a
// chave) conta como 0 — melhor barrar do que liberar sem querer.
export function shareLimitFor(limits, placement) {
  if (!limits) return 0
  const value = placement === 'story' ? limits.storySharesPerDay : limits.feedSharesPerDay
  return value === undefined ? 0 : value
}

// Quanto ainda cabe hoje. Infinity em plano ilimitado, pra comparação direta.
export function quotaLeft(limit, used) {
  if (limit === null) return Infinity
  return Math.max(0, limit - (used || 0))
}
