import { supabase } from '../lib/supabase'

const API_KEY = import.meta.env.VITE_UPLOAD_POST_API_KEY
const BASE = 'https://api.upload-post.com/api'

function apiHeaders() {
  return { Authorization: `Apikey ${API_KEY}`, 'Content-Type': 'application/json' }
}

// The upload-post API doesn't always return JSON (e.g. a deleted/invalid
// profile or token can produce a plain-text or HTML error response), so
// callers must never assume res.json() will succeed.
async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return { success: false }
  }
}

// The connect-JWT (from generate-jwt's access_url) has to be kept around client-side
// so validate-jwt can be called later with it — upload-post.com's API doesn't offer
// a way to look this up by username again. Keyed by platform too, so connecting
// Instagram and Facebook back-to-back for the same município never clobbers a
// still-pending token from the other flow.
function jwtStorageKey(username, platform) {
  return `tik_${platform}_jwt_${username}`
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

export async function getMunicipalityConnection(municipality, state, platform = 'instagram') {
  const { data } = await supabase
    .from('municipality_integrations')
    .select('*')
    .eq('upload_post_username', profileId(municipality, state))
    .eq('platform', platform)
    .maybeSingle()
  return data // null if not connected
}

// accountFields carries whatever is platform-specific: { ig_username } for
// Instagram, { page_id, page_name } for Facebook.
async function saveConnection(municipality, state, platform, connectedBy, uploadPostUsername, accountFields = {}) {
  const { error } = await supabase
    .from('municipality_integrations')
    .upsert(
      {
        municipality,
        state,
        platform,
        upload_post_username: uploadPostUsername,
        connected_by: connectedBy,
        connected_at: new Date().toISOString(),
        ...accountFields,
      },
      { onConflict: 'municipality,state,platform' }
    )
  if (error) throw error
}

export async function deleteMunicipalityConnection(municipality, state, platform = 'instagram') {
  const { error } = await supabase
    .from('municipality_integrations')
    .delete()
    .eq('upload_post_username', profileId(municipality, state))
    .eq('platform', platform)
  if (error) throw error

  // Drop any leftover connect-JWT so a stray VERIFICAR click can't reuse a
  // token tied to a connection that no longer exists.
  localStorage.removeItem(jwtStorageKey(profileId(municipality, state), platform))
}

// --- Upload-post API ---

// Best-effort: just makes sure a profile exists before generate-jwt runs.
// Whether it already existed (409, or any other "already there" shape the
// API uses) or was just created doesn't matter here — if profile creation
// is genuinely broken, the generate-jwt call right after will fail with its
// own clear error, so this never needs to throw.
async function ensureProfile(username) {
  await fetch(`${BASE}/uploadposts/users`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ username }),
  })
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
  const data = await safeJson(res)
  if (!data.success || !data.access_url) {
    throw new Error('Erro ao gerar link de conexão. Tente novamente em instantes.')
  }

  // access_url looks like https://app.upload-post.com/connect?token=<jwt> — validate-jwt
  // needs that same token later, so stash it against this profile's username.
  const token = new URL(data.access_url).searchParams.get('token')
  if (token) localStorage.setItem(jwtStorageKey(username, 'instagram'), token)

  return { url: data.access_url, username }
}

export async function verifyAndSaveConnection(municipality, state, userId) {
  const username = profileId(municipality, state)

  const token = localStorage.getItem(jwtStorageKey(username, 'instagram'))
  if (!token) throw new Error('Clique em CONECTAR antes de verificar.')

  const res = await fetch(`${BASE}/uploadposts/users/validate-jwt`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await safeJson(res)
  // A token tied to a profile that was deleted/disconnected (either here or
  // directly on upload-post) won't validate — treat that as "not connected
  // yet" instead of surfacing a raw network/parse error to the user.
  if (!res.ok || !data.success) {
    localStorage.removeItem(jwtStorageKey(username, 'instagram'))
    return null
  }

  const igAccount = data.profile?.social_accounts?.instagram
  if (!igAccount || typeof igAccount !== 'object') return null

  const igUsername = igAccount.username || igAccount.display_name || username
  localStorage.removeItem(jwtStorageKey(username, 'instagram'))
  await saveConnection(municipality, state, 'instagram', userId, username, { ig_username: igUsername })
  return { ig_username: igUsername, upload_post_username: username }
}

// --- Facebook: connect ---
//
// Igual ao Instagram, mas com um passo a mais: uma conta do Meta pode
// administrar várias Páginas do Facebook, então depois de autorizar é preciso
// escolher qual Página recebe as publicações (o Instagram não tem isso — é
// sempre uma conta por perfil). Ver listFacebookPages/pinFacebookPage.

export async function generateFacebookConnectionUrl(municipality, state) {
  if (!API_KEY) throw new Error('VITE_UPLOAD_POST_API_KEY não configurado no .env')

  const username = profileId(municipality, state)
  await ensureProfile(username)

  const redirectUrl = `${window.location.origin}/integracao-redes?connected=1&platform=facebook`

  const res = await fetch(`${BASE}/uploadposts/users/generate-jwt`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({
      username,
      redirect_url: redirectUrl,
      redirect_button_text: 'Voltar para o TIK',
      connect_title: `Conectar Facebook — ${municipality}/${state}`,
      connect_description: 'Conecte a Página do Facebook da prefeitura para publicar automaticamente ao criar um Tik.',
      platforms: ['facebook'],
      language: 'pt',
    }),
  })
  const data = await safeJson(res)
  if (!data.success || !data.access_url) {
    throw new Error('Erro ao gerar link de conexão. Tente novamente em instantes.')
  }

  const token = new URL(data.access_url).searchParams.get('token')
  if (token) localStorage.setItem(jwtStorageKey(username, 'facebook'), token)

  return { url: data.access_url, username }
}

// Páginas que a conta do Meta conectada administra. Usado logo após validar a
// conexão (pra decidir se dá pra fixar direto ou se precisa perguntar pro
// usuário) e também pro seletor de Página na tela de integração.
export async function listFacebookPages(municipality, state) {
  const username = profileId(municipality, state)
  const res = await fetch(`${BASE}/uploadposts/users/facebook-page?profile_username=${encodeURIComponent(username)}`, {
    headers: apiHeaders(),
  })
  const data = await safeJson(res)
  return Array.isArray(data.pages) ? data.pages : []
}

// Fixa qual Página recebe as publicações — uma Página fixada tem prioridade
// sobre o facebook_page_id passado na hora de publicar, mas mandamos os dois
// (ver publishToFacebook) por segurança.
async function pinFacebookPage(username, pageId) {
  const res = await fetch(`${BASE}/uploadposts/users/facebook-page`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ profile_username: username, facebook_page_id: pageId }),
  })
  const data = await safeJson(res)
  if (!res.ok || data.success === false) {
    throw new Error('Erro ao selecionar a Página do Facebook. Tente novamente.')
  }
}

// Chamada logo após validate-jwt. Se a conta só administra uma Página, já
// fixa e salva de cara; se administra várias, salva a conexão sem Página
// ainda (page_id null) e devolve a lista pra tela mostrar um seletor —
// nesse caso o fluxo só termina quando confirmFacebookPage for chamado.
export async function verifyAndSaveFacebookConnection(municipality, state, userId) {
  const username = profileId(municipality, state)

  const token = localStorage.getItem(jwtStorageKey(username, 'facebook'))
  if (!token) throw new Error('Clique em CONECTAR antes de verificar.')

  const res = await fetch(`${BASE}/uploadposts/users/validate-jwt`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await safeJson(res)
  if (!res.ok || !data.success) {
    localStorage.removeItem(jwtStorageKey(username, 'facebook'))
    return null
  }

  const fbAccount = data.profile?.social_accounts?.facebook
  if (!fbAccount || typeof fbAccount !== 'object') return null
  localStorage.removeItem(jwtStorageKey(username, 'facebook'))

  const pages = await listFacebookPages(municipality, state)
  if (pages.length === 0) {
    throw new Error('Nenhuma Página do Facebook encontrada nessa conta. Crie ou vincule uma Página antes de conectar.')
  }

  if (pages.length === 1) {
    await pinFacebookPage(username, pages[0].id)
    await saveConnection(municipality, state, 'facebook', userId, username, {
      page_id: pages[0].id,
      page_name: pages[0].name,
    })
    return { page_id: pages[0].id, page_name: pages[0].name, pages }
  }

  await saveConnection(municipality, state, 'facebook', userId, username, { page_id: null, page_name: null })
  return { page_id: null, page_name: null, pages }
}

// Usada pelo seletor de Página quando a conta administra mais de uma.
export async function confirmFacebookPage(municipality, state, userId, pageId, pageName) {
  const username = profileId(municipality, state)
  await pinFacebookPage(username, pageId)
  await saveConnection(municipality, state, 'facebook', userId, username, { page_id: pageId, page_name: pageName })
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
  const result = await safeJson(res)
  if (!res.ok || !result.success) {
    throw new Error('Falha ao publicar no Instagram. Verifique se a conexão ainda está ativa.')
  }
  return result
}

export async function publishToFacebook(municipality, state, imageUrl, caption) {
  if (!API_KEY) throw new Error('VITE_UPLOAD_POST_API_KEY não configurado no .env')

  const conn = await getMunicipalityConnection(municipality, state, 'facebook')
  if (!conn) throw new Error('Facebook não conectado para este município. Acesse Integração com Redes Sociais.')
  if (!conn.page_id) throw new Error('Nenhuma Página do Facebook selecionada. Acesse Integração com Redes Sociais e escolha uma Página.')

  const body = new FormData()
  body.append('user', conn.upload_post_username)
  body.append('platform[]', 'facebook')
  body.append('photos[]', imageUrl)
  body.append('title', caption)
  // Manda mesmo com Página fixada — não custa nada e cobre o caso de a
  // pinada ter sido trocada em outro lugar sem essa conexão saber ainda.
  body.append('facebook_page_id', conn.page_id)

  const res = await fetch(`${BASE}/upload_photos`, {
    method: 'POST',
    headers: { Authorization: `Apikey ${API_KEY}` },
    body,
  })
  const result = await safeJson(res)
  if (!res.ok || !result.success) {
    throw new Error('Falha ao publicar no Facebook. Verifique se a conexão ainda está ativa.')
  }
  return result
}
