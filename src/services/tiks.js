import { supabase } from '../lib/supabase'

export async function getTiks({ area, startDate, endDate, userId } = {}) {
  let query = supabase
    .from('tiks')
    .select(`
      *,
      profiles (id, name, avatar_url, secretaria, municipality, state),
      likes (id, user_id)
    `)
    .order('created_at', { ascending: false })

  if (area) query = query.eq('area', area)
  if (userId) query = query.eq('user_id', userId)
  if (startDate) query = query.gte('created_at', startDate)
  if (endDate) query = query.lte('created_at', endDate + 'T23:59:59')

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createTik({ userId, area, description, lat, lng, location, imageFile }) {
  let image_url = null

  if (imageFile) {
    const ext = imageFile.name.split('.').pop()
    const path = `tiks/${userId}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('tik-media')
      .upload(path, imageFile)
    if (uploadError) throw uploadError
    const { data } = supabase.storage.from('tik-media').getPublicUrl(path)
    image_url = data.publicUrl
  }

  const { data, error } = await supabase
    .from('tiks')
    .insert({ user_id: userId, area, description, lat, lng, location, image_url })
    .select(`
      *,
      profiles (id, name, avatar_url, secretaria, municipality, state),
      likes (id, user_id)
    `)
    .single()
  if (error) throw error
  return data
}

export async function deleteTik(tikId) {
  const { error } = await supabase.from('tiks').delete().eq('id', tikId)
  if (error) throw error
}

export async function getDashboardStats(municipality, startDate, endDate) {
  let query = supabase
    .from('tiks')
    .select('area, created_at, profiles(secretaria, municipality)')
    .order('created_at', { ascending: true })

  if (startDate) query = query.gte('created_at', startDate)
  if (endDate) query = query.lte('created_at', endDate + 'T23:59:59')

  const { data, error } = await query
  if (error) throw error
  return data
}
