import { supabase } from '../lib/supabase'

export async function createProfile(userId, data) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...data })
    .select()
    .single()
  if (error) throw error
  return profile
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function uploadAvatar(userId, file) {
  const ext = file.name.split('.').pop()
  const path = `avatars/${userId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('tik-media')
    .upload(path, file, { upsert: true })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('tik-media').getPublicUrl(path)
  return data.publicUrl
}

export async function listProfiles({ municipality, search, city, startDate, endDate } = {}) {
  let query = supabase
    .from('profiles')
    .select('*, tiks(count)')
    .order('name', { ascending: true })

  if (municipality) query = query.eq('municipality', municipality)
  if (search) query = query.ilike('name', `%${search}%`)
  if (city) query = query.ilike('municipality', `%${city}%`)
  if (startDate) query = query.gte('created_at', startDate)
  if (endDate) query = query.lte('created_at', endDate + 'T23:59:59')

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function setAuthorized(userId, autorizado) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ autorizado })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProfile(userId) {
  const { error } = await supabase.from('profiles').delete().eq('id', userId)
  if (error) throw error
}
