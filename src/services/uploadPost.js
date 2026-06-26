import { supabase } from '../lib/supabase'

const API_KEY = import.meta.env.VITE_UPLOAD_POST_API_KEY
const BASE = 'https://api.upload-post.com/api'

function apiHeaders() {
  return { Authorization: `Apikey ${API_KEY}`, 'Content-Type': 'application/json' }
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
  return { url: data.access_url, username }
}

export async function verifyAndSaveConnection(municipality, state, userId) {
  const username = profileId(municipality, state)

  const res = await fetch(`${BASE}/uploadposts/users/validate-jwt`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ username }),
  })
  const data = await res.json()

  const igConn = (data.profile?.social_connections || []).find(
    (c) => c.platform === 'instagram' && c.connected && c.auth_status === 'valid'
  )
  if (!igConn) return null

  await saveConnection(municipality, state, igConn.username, userId, username)
  return { ig_username: igConn.username, upload_post_username: username }
}

// --- Publish ---

export async function publishToInstagram(municipality, state, imageUrl, caption) {
  if (!API_KEY) throw new Error('VITE_UPLOAD_POST_API_KEY não configurado no .env')

  const conn = await getMunicipalityConnection(municipality, state)
  if (!conn) throw new Error('Instagram não conectado para este município. Acesse Integração com Redes Sociais.')

  const body = new FormData()
  body.append('user', conn.upload_post_username)
  body.append('platform[]', 'instagram')
  body.append('video', imageUrl)
  body.append('description', caption)
  body.append('media_type', 'FEED')

  const res = await fetch(`${BASE}/upload`, {
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
