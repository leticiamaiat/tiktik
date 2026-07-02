import { supabase } from '../lib/supabase'

const API_KEY = import.meta.env.VITE_UPLOAD_POST_API_KEY
const BASE = 'https://api.upload-post.com/api'

function apiHeaders() {
  return { Authorization: `Apikey ${API_KEY}`, 'Content-Type': 'application/json' }
}

// The connect-JWT (from generate-jwt's access_url) has to be kept around client-side
// so validate-jwt can be called later with it — upload-post.com's API doesn't offer
// a way to look this up by username again.
function jwtStorageKey(username) {
  return `tik_ig_jwt_${username}`
}

// Normalize municipality + state into a safe Upload-post profile username
// e.g. "São Paulo", "SP" → "sao_paulo_sp"
function profileId(municipality, state) {
  return `${municipality}_${state}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

// --- Supabase helpers ---

export async function getMunicipalityConnection(municipality, state) {
  const { data } = await supabase
    .from('municipality_integrations')
    .select('*')
    .eq('municipality', municipality)
    .eq('state', state)
    .eq('platform', 'instagram')
    .maybeSingle()
  return data // null if not connected
}

async function saveConnection(municipality, state, igUsername, connectedBy, uploadPostUsername) {
  const { error } = await supabase
    .from('municipality_integrations')
    .upsert(
      {
        municipality,
        state,
        platform: 'instagram',
        upload_post_username: uploadPostUsername,
        ig_username: igUsername,
        connected_by: connectedBy,
        connected_at: new Date().toISOString(),
      },
      { onConflict: 'municipality,state,platform' }
    )
  if (error) throw error
}

export async function deleteMunicipalityConnection(municipality, state) {
  const { error } = await supabase
    .from('municipality_integrations')
    .delete()
    .eq('municipality', municipality)
    .eq('state', state)
    .eq('platform', 'instagram')
  if (error) throw error
}

// --- Upload-post API ---

async function ensureProfile(username) {
  const res = await fetch(`${BASE}/uploadposts/users`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ username }),
  })
  const data = await res.json()
  // 409 = já existe, tudo certo
  if (!data.success && res.status !== 409) {
    throw new Error(data.message || 'Erro ao criar perfil no Upload-post')
  }
}

export async function generateInstagramConnectionUrl(municipality, state) {
  if (!API_KEY) throw new Error('VITE_UPLOAD_POST_API_KEY não configurado no .env')

  const username = profileId(municipality, state)
  await ensureProfile(username)

  const redirectUrl = `${window.location.origin}/integracao-redes?connected=1`

  const res = await fetch(`${BASE}/uploadposts/users/generate-jwt`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({
      username,
      redirect_url: redirectUrl,
      redirect_button_text: 'Voltar para o TIK',
      connect_title: `Conectar Instagram — ${municipality}/${state}`,
      connect_description: 'Conecte o Instagram da prefeitura para publicar automaticamente ao criar um Tik.',
      platforms: ['instagram'],
      language: 'pt',
    }),
  })
  const data = await res.json()
  if (!data.success || !data.access_url) {
    throw new Error(data.message || 'Erro ao gerar link de conexão')
  }

  // access_url looks like https://app.upload-post.com/connect?token=<jwt> — validate-jwt
  // needs that same token later, so stash it against this profile's username.
  const token = new URL(data.access_url).searchParams.get('token')
  if (token) localStorage.setItem(jwtStorageKey(username), token)

  return { url: data.access_url, username }
}

export async function verifyAndSaveConnection(municipality, state, userId) {
  const username = profileId(municipality, state)

  const token = localStorage.getItem(jwtStorageKey(username))
  if (!token) throw new Error('Clique em CONECTAR antes de verificar.')

  const res = await fetch(`${BASE}/uploadposts/users/validate-jwt`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!data.success) return null

  const igAccount = data.profile?.social_accounts?.instagram
  if (!igAccount || typeof igAccount !== 'object') return null

  const igUsername = igAccount.username || igAccount.display_name || username
  localStorage.removeItem(jwtStorageKey(username))
  await saveConnection(municipality, state, igUsername, userId, username)
  return { ig_username: igUsername, upload_post_username: username }
}

// --- Publish ---

export async function publishToInstagram(municipality, state, imageUrl, caption) {
  if (!API_KEY) throw new Error('VITE_UPLOAD_POST_API_KEY não configurado no .env')

  const conn = await getMunicipalityConnection(municipality, state)
  if (!conn) throw new Error('Instagram não conectado para este município. Acesse Integração com Redes Sociais.')

  const body = new FormData()
  body.append('user', conn.upload_post_username)
  body.append('platform[]', 'instagram')
  body.append('photos[]', imageUrl)
  body.append('title', caption)

  const res = await fetch(`${BASE}/upload_photos`, {
    method: 'POST',
    headers: { Authorization: `Apikey ${API_KEY}` },
    body,
  })
  const result = await res.json()
  if (!result.success) {
    throw new Error(result.message || result.error || 'Falha ao publicar no Instagram')
  }
  return result
}
