import { supabase } from '../lib/supabase'

export async function toggleLike(tikId, userId) {
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('tik_id', tikId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    const { error } = await supabase.from('likes').delete().eq('id', existing.id)
    if (error) throw error
    return false
  } else {
    const { error } = await supabase.from('likes').insert({ tik_id: tikId, user_id: userId })
    if (error) throw error
    return true
  }
}
