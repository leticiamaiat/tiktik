import toast from 'react-hot-toast'

const FB_VERSION = 'v22.0'
const CONN_KEY = 'tik_ig_conn'
const GRAPH = `https://graph.facebook.com/${FB_VERSION}`

// --- SDK ---

let _sdkPromise = null

function initFacebookSDK() {
  if (window.FB && window.FB.version) return Promise.resolve(window.FB)
  if (_sdkPromise) return _sdkPromise

  _sdkPromise = new Promise((resolve) => {
    window.fbAsyncInit = () => {
      window.FB.init({
        appId: import.meta.env.VITE_META_APP_ID,
        version: FB_VERSION,
        cookie: true,
        xfbml: false,
      })
      resolve(window.FB)
    }
    if (!document.getElementById('facebook-jssdk')) {
      const s = document.createElement('script')
      s.id = 'facebook-jssdk'
      s.src = 'https://connect.facebook.net/pt_BR/sdk.js'
      s.async = true
      document.body.appendChild(s)
    }
  })

  return _sdkPromise
}

// --- Stored connection (metadata only, no sensitive secrets) ---

export function getInstagramConnection() {
  try {
    return JSON.parse(localStorage.getItem(CONN_KEY) || 'null')
  } catch {
    return null
  }
}

function saveConnection(data) {
  localStorage.setItem(CONN_KEY, JSON.stringify(data))
}

// --- OAuth connect ---

async function fetchPageData(accessToken) {
  const res = await fetch(
    `${GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name}&access_token=${accessToken}`
  )
  const data = await res.json()

  if (data.error) throw new Error(data.error.message)

  const page = (data.data || []).find((p) => p.instagram_business_account)
  if (!page) {
    throw new Error(
      'Nenhuma conta do Instagram Business/Creator vinculada a uma Página do Facebook foi encontrada. ' +
        'No app da Instagram, vá em Configurações → Conta → Trocar para conta profissional e vincule à sua Página.'
    )
  }

  return {
    pageId: page.id,
    pageToken: page.access_token,
    igUserId: page.instagram_business_account.id,
    username: page.instagram_business_account.username,
    displayName: page.instagram_business_account.name || page.name,
  }
}

export async function connectInstagram() {
  if (!import.meta.env.VITE_META_APP_ID) {
    throw new Error('VITE_META_APP_ID não configurado no .env — consulte o guia de configuração do Meta App.')
  }

  const FB = await initFacebookSDK()

  const authResponse = await new Promise((resolve, reject) => {
    FB.login(
      (res) => {
        if (res.status === 'connected') resolve(res.authResponse)
        else reject(new Error('Login cancelado ou não autorizado'))
      },
      { scope: 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement' }
    )
  })

  const pageData = await fetchPageData(authResponse.accessToken)
  // pageToken from /me/accounts is long-lived when the user token was exchanged — safe to store
  saveConnection({ ...pageData, connectedAt: Date.now() })
  return pageData
}

export async function disconnectInstagram() {
  localStorage.removeItem(CONN_KEY)
  try {
    const FB = await initFacebookSDK()
    await new Promise((r) => FB.logout(r))
  } catch {
    // logout errors are non-fatal
  }
}

// --- Refresh page token before publishing ---

async function getFreshToken() {
  try {
    const FB = await initFacebookSDK()
    const status = await new Promise((r) => FB.getLoginStatus(r))
    if (status.status !== 'connected') return null

    const data = await fetchPageData(status.authResponse.accessToken)
    const conn = getInstagramConnection()
    if (conn) saveConnection({ ...conn, pageToken: data.pageToken })
    return data.pageToken
  } catch {
    return null
  }
}

// --- Publish ---

export async function publishToInstagram(imageUrl, caption) {
  const conn = getInstagramConnection()
  if (!conn) throw new Error('Instagram não conectado. Acesse Integração com Redes Sociais para conectar.')

  // Try to get a fresh token; fall back to stored one
  const token = (await getFreshToken()) || conn.pageToken
  if (!token) throw new Error('Sessão expirada. Reconecte sua conta na página de Integração.')

  const { igUserId } = conn

  // Step 1: Create media container
  const containerRes = await fetch(`${GRAPH}/${igUserId}/media`, {
    method: 'POST',
    body: new URLSearchParams({ image_url: imageUrl, caption, access_token: token }),
  })
  const container = await containerRes.json()
  if (!container.id) {
    throw new Error(container.error?.message || 'Falha ao criar container de mídia no Instagram')
  }

  // Step 2: Wait for Instagram to process the image (up to ~20s)
  let ready = false
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 2000))
    const checkRes = await fetch(`${GRAPH}/${container.id}?fields=status_code&access_token=${token}`)
    const check = await checkRes.json()
    if (check.status_code === 'FINISHED') { ready = true; break }
    if (check.status_code === 'ERROR') throw new Error('O Instagram recusou a imagem. Verifique formato e dimensões.')
  }
  if (!ready) throw new Error('Tempo esgotado aguardando o Instagram processar a imagem.')

  // Step 3: Publish
  const publishRes = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
    method: 'POST',
    body: new URLSearchParams({ creation_id: container.id, access_token: token }),
  })
  const published = await publishRes.json()
  if (!published.id) {
    throw new Error(published.error?.message || 'Falha ao publicar no Instagram')
  }

  return published.id
}
