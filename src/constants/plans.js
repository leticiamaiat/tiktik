// Limites de cada plano da landing (src/pages/Principal.jsx).
//
// ATENÇÃO: mantenha estes números iguais aos da seed da tabela plan_limits em
// supabase_migration_municipalities_and_plans.sql — o frontend usa este arquivo
// para mensagens/contadores e as triggers do banco usam a tabela.
//
//   tiksPerDay   -> tiks que a prefeitura inteira pode criar por dia (null = ilimitado)
//   maxUsers     -> nº de contas de colaborador por prefeitura
//   sharesPerDay -> publicações em redes sociais por dia (0 = plano não inclui compartilhamento)

export const DEFAULT_PLAN = 'Básico'

export const PLAN_LIMITS = {
  'Básico':        { tiksPerDay: 10,   maxUsers: 2,  sharesPerDay: 0 },
  'Essencial':     { tiksPerDay: 20,   maxUsers: 8,  sharesPerDay: 5 },
  'Avançado':      { tiksPerDay: 40,   maxUsers: 15, sharesPerDay: 10 },
  'Transformador': { tiksPerDay: null, maxUsers: 30, sharesPerDay: 24 },
}

export const PLAN_NAMES = Object.keys(PLAN_LIMITS)

// Aceita valores legados tipo "Plano Essencial" e devolve "Essencial".
export function normalizePlan(plan) {
  const name = (plan || '').replace(/^plano\s+/i, '').trim()
  return PLAN_NAMES.includes(name) ? name : DEFAULT_PLAN
}

export function planLimits(plan) {
  return PLAN_LIMITS[normalizePlan(plan)]
}
