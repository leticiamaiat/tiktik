import { supabase } from '../lib/supabase'
import { brDayStart, brDayEnd } from '../lib/brTime'

// Tiks públicos de uma prefeitura (widget incorporável e mapa público).
// Vai pelo RPC public_tiks_widget, que funciona sem login e só devolve campos
// seguros para exibição pública.
export async function getPublicTiks({ municipality, state, area, limit = 12, startDate, endDate }) {
  const { data, error } = await supabase.rpc('public_tiks_widget', {
    p_municipality: municipality,
    p_state: state,
    p_area: area || null,
    p_limit: limit,
    p_start: startDate ? brDayStart(startDate) : null,
    p_end: endDate ? brDayEnd(endDate) : null,
  })
  if (error) throw error
  return data || []
}

// Linha do RPC no mesmo formato que getTiks devolve (profiles aninhado), para
// as telas que já sabem desenhar um tik.
export function toTikShape(row) {
  return {
    ...row,
    profiles: { name: row.author_name, avatar_url: row.author_avatar, secretaria: row.secretaria },
  }
}
