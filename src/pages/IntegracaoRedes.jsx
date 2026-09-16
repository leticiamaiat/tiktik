import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle, AlertCircle, ExternalLink, RefreshCw, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import {
  getMunicipalityConnection,
  deleteMunicipalityConnection,
  generateInstagramConnectionUrl,
  verifyAndSaveConnection,
  generateFacebookConnectionUrl,
  verifyAndSaveFacebookConnection,
  confirmFacebookPage,
} from '../services/uploadPost'

export default function IntegracaoRedes() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [conn, setConn] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'idle' | 'generating' | 'checking' | 'connected'

  const [fbConn, setFbConn] = useState(null)
  const [fbStatus, setFbStatus] = useState('loading')
  // Preenchido quando a conta do Meta administra mais de uma Página — nesse
  // caso a conexão já foi salva sem page_id e falta o usuário escolher.
  const [fbPendingPages, setFbPendingPages] = useState(null)
  const [fbSelectingPageId, setFbSelectingPageId] = useState(null)

  const municipality = user?.municipality || ''
  const state = user?.state || ''
  const municipalityLabel = municipality && state ? `${municipality} - ${state}` : '...'

  useEffect(() => {
    if (!municipality || !state) {
      setStatus('idle')
      setFbStatus('idle')
      return
    }

    getMunicipalityConnection(municipality, state)
      .then((data) => {
        if (data) { setConn(data); setStatus('connected') }
        else setStatus('idle')
      })
      .catch(() => setStatus('idle'))

    getMunicipalityConnection(municipality, state, 'facebook')
      .then((data) => {
        if (data?.page_id) { setFbConn(data); setFbStatus('connected') }
        else if (data) { setFbConn(data); setFbStatus('idle') } // conectado, mas Página não escolhida ainda
        else setFbStatus('idle')
      })
      .catch(() => setFbStatus('idle'))
  }, [municipality, state])

  // Voltou da página do Upload-post após conectar — o platform na URL diz
  // qual dos dois fluxos (Instagram ou Facebook) verificar.
  useEffect(() => {
    if (searchParams.get('connected') === '1' && municipality && state) {
      const platform = searchParams.get('platform')
      setSearchParams({}, { replace: true })
      if (platform === 'facebook') handleVerifyFacebook()
      else handleVerify()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, municipality, state])

  const handleConnect = async () => {
    if (!municipality || !state) return toast.error('Perfil sem município/estado. Atualize seu perfil.')
    setStatus('generating')
    try {
      const { url } = await generateInstagramConnectionUrl(municipality, state)
      // Navigate the same tab instead of window.open — opening a new tab after an
      // await loses the user-gesture context and gets silently popup-blocked in
      // most browsers. redirect_url already brings the user back here afterwards.
      window.location.href = url
    } catch (err) {
      toast.error(err.message || 'Erro ao gerar link de conexão')
      setStatus('idle')
    }
  }

  const handleVerify = async () => {
    if (!municipality || !state || !user?.id) return
    setStatus('checking')
    try {
      const result = await verifyAndSaveConnection(municipality, state, user.id)
      if (result) {
        const refreshed = await getMunicipalityConnection(municipality, state)
        setConn(refreshed)
        setStatus('connected')
        toast.success(`Instagram "${result.ig_username}" conectado para ${municipalityLabel}!`)
      } else {
        setStatus('idle')
        toast.error('Instagram ainda não conectado. Finalize a autorização na aba do Upload-post.')
      }
    } catch (err) {
      setStatus('idle')
      toast.error(err.message || 'Erro ao verificar conexão')
    }
  }

  const handleDisconnect = async () => {
    try {
      await deleteMunicipalityConnection(municipality, state)
      setConn(null)
      setStatus('idle')
      toast.success('Instagram desconectado')
    } catch (err) {
      toast.error(err.message || 'Erro ao desconectar')
    }
  }

  const handleConnectFacebook = async () => {
    if (!municipality || !state) return toast.error('Perfil sem município/estado. Atualize seu perfil.')
    setFbStatus('generating')
    try {
      const { url } = await generateFacebookConnectionUrl(municipality, state)
      window.location.href = url
    } catch (err) {
      toast.error(err.message || 'Erro ao gerar link de conexão')
      setFbStatus('idle')
    }
  }

  const handleVerifyFacebook = async () => {
    if (!municipality || !state || !user?.id) return
    setFbStatus('checking')
    try {
      const result = await verifyAndSaveFacebookConnection(municipality, state, user.id)
      if (!result) {
        setFbStatus('idle')
        toast.error('Facebook ainda não conectado. Finalize a autorização na aba do Upload-post.')
        return
      }
      const refreshed = await getMunicipalityConnection(municipality, state, 'facebook')
      setFbConn(refreshed)
      if (result.page_id) {
        setFbStatus('connected')
        setFbPendingPages(null)
        toast.success(`Facebook "${result.page_name}" conectado para ${municipalityLabel}!`)
      } else {
        // Mais de uma Página — falta o usuário escolher qual.
        setFbStatus('idle')
        setFbPendingPages(result.pages)
        toast('Conta conectada! Escolha qual Página vai receber as publicações.')
      }
    } catch (err) {
      setFbStatus('idle')
      toast.error(err.message || 'Erro ao verificar conexão')
    }
  }

  const handleSelectFacebookPage = async (page) => {
    setFbSelectingPageId(page.id)
    try {
      await confirmFacebookPage(municipality, state, user.id, page.id, page.name)
      const refreshed = await getMunicipalityConnection(municipality, state, 'facebook')
      setFbConn(refreshed)
      setFbStatus('connected')
      setFbPendingPages(null)
      toast.success(`Página "${page.name}" selecionada!`)
    } catch (err) {
      toast.error(err.message || 'Erro ao selecionar a Página')
    } finally {
      setFbSelectingPageId(null)
    }
  }

  const handleDisconnectFacebook = async () => {
    try {
      await deleteMunicipalityConnection(municipality, state, 'facebook')
      setFbConn(null)
      setFbStatus('idle')
      setFbPendingPages(null)
      toast.success('Facebook desconectado')
    } catch (err) {
      toast.error(err.message || 'Erro ao desconectar')
    }
  }

  const igConnected = status === 'connected'
  const fbConnected = fbStatus === 'connected' && !!fbConn?.page_id
  const fbChoosingPage = !!fbPendingPages

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <h2 className="text-base text-gray-600 mb-4">Integração com redes sociais:</h2>

          <p className="text-sm text-gray-700 mb-3">
            Conecte as contas da <strong>Prefeitura de {municipality || '...'}</strong> e simplifique suas publicações!
          </p>

          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-5">
            <Users size={15} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              A conexão é <strong>compartilhada por município</strong>: basta um usuário de{' '}
              <strong>{municipalityLabel}</strong> conectar cada rede uma vez. Todos os colegas
              do mesmo município poderão publicar automaticamente usando a mesma conta.
            </p>
          </div>

          <p className="text-sm text-gray-600 mb-3">
            Ao integrar Instagram e Facebook, ao criar um Tik com foto você poderá publicar
            automaticamente nos perfis conectados, garantindo mais alcance e agilidade na comunicação.
          </p>

          <p className="text-sm font-semibold text-gray-700 mb-8">
            Nenhum dado de acesso é armazenado por nós — a autenticação é feita com total segurança
            pela plataforma parceira.
          </p>

          {/* Facebook */}
          <div className={`border rounded-lg px-4 py-4 mb-4 transition-colors ${fbConnected ? 'border-green-400 bg-green-50' : 'border-blue-200'}`}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="#1877F2" className="flex-shrink-0">
                  <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z" />
                </svg>
                <div>
                  <span className="font-bold text-blue-700 tracking-wide text-sm">FACEBOOK</span>
                  {fbConnected && fbConn && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <CheckCircle size={12} className="text-green-500" />
                      <span className="text-xs text-green-600">
                        Página "{fbConn.page_name}" · conectado por{' '}
                        {fbConn.connected_at ? new Date(fbConn.connected_at).toLocaleDateString('pt-BR') : ''}
                      </span>
                    </div>
                  )}
                  {fbStatus === 'loading' && (
                    <span className="text-xs text-gray-400">Carregando...</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {fbConnected ? (
                  <button
                    onClick={handleDisconnectFacebook}
                    className="bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    DESCONECTAR
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleConnectFacebook}
                      disabled={fbStatus === 'generating' || fbStatus === 'checking' || fbStatus === 'loading'}
                      className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center gap-1.5"
                    >
                      <ExternalLink size={14} />
                      {fbStatus === 'generating' ? 'GERANDO...' : 'CONECTAR'}
                    </button>
                    <button
                      onClick={handleVerifyFacebook}
                      disabled={fbStatus === 'generating' || fbStatus === 'checking' || fbStatus === 'loading'}
                      title="Verificar se a conexão foi concluída"
                      className="bg-gray-100 text-gray-600 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-60 flex items-center gap-1"
                    >
                      <RefreshCw size={14} className={fbStatus === 'checking' ? 'animate-spin' : ''} />
                      {fbStatus === 'checking' ? 'VERIFICANDO...' : 'VERIFICAR'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {fbChoosingPage && (
              <div className="mt-3 pt-3 border-t border-blue-100">
                <p className="text-xs text-gray-600 mb-2">
                  Essa conta administra várias Páginas — escolha qual vai receber as publicações:
                </p>
                <div className="flex flex-col gap-1.5">
                  {fbPendingPages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => handleSelectFacebookPage(page)}
                      disabled={fbSelectingPageId === page.id}
                      className="flex items-center justify-between text-left border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-60"
                    >
                      {page.name}
                      {fbSelectingPageId === page.id && (
                        <span className="w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {fbConnected && (
              <p className="mt-3 pt-3 border-t border-green-200 text-xs text-green-700">
                Ao criar um Tik com foto, selecione a opção de publicar também no Facebook.
              </p>
            )}

            {!fbConnected && !fbChoosingPage && fbStatus !== 'loading' && (
              <p className="mt-3 pt-3 border-t border-blue-100 text-xs text-gray-500">
                Clique em <strong>CONECTAR</strong> para ir até a página de autorização. Após conectar,
                você volta automaticamente para cá — se não confirmar sozinho, clique em <strong>VERIFICAR</strong>.
              </p>
            )}
          </div>

          {/* Instagram */}
          <div className={`border rounded-lg px-4 py-4 transition-colors ${igConnected ? 'border-green-400 bg-green-50' : 'border-pink-400'}`}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <div>
                  <span className="font-bold text-pink-600 tracking-wide text-sm">INSTAGRAM</span>
                  {igConnected && conn && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <CheckCircle size={12} className="text-green-500" />
                      <span className="text-xs text-green-600">
                        {conn.ig_username} · conectado por{' '}
                        {conn.connected_at ? new Date(conn.connected_at).toLocaleDateString('pt-BR') : ''}
                      </span>
                    </div>
                  )}
                  {status === 'loading' && (
                    <span className="text-xs text-gray-400">Carregando...</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {igConnected ? (
                  <button
                    onClick={handleDisconnect}
                    className="bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    DESCONECTAR
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleConnect}
                      disabled={status === 'generating' || status === 'checking' || status === 'loading'}
                      className="text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-1.5"
                      style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
                    >
                      <ExternalLink size={14} />
                      {status === 'generating' ? 'GERANDO...' : 'CONECTAR'}
                    </button>
                    <button
                      onClick={handleVerify}
                      disabled={status === 'generating' || status === 'checking' || status === 'loading'}
                      title="Verificar se a conexão foi concluída"
                      className="bg-gray-100 text-gray-600 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-60 flex items-center gap-1"
                    >
                      <RefreshCw size={14} className={status === 'checking' ? 'animate-spin' : ''} />
                      {status === 'checking' ? 'VERIFICANDO...' : 'VERIFICAR'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {igConnected && (
              <p className="mt-3 pt-3 border-t border-green-200 text-xs text-green-700">
                Ao criar um Tik com foto, selecione a opção de publicar também no Instagram.
              </p>
            )}

            {!igConnected && status !== 'loading' && (
              <p className="mt-3 pt-3 border-t border-pink-100 text-xs text-gray-500">
                Clique em <strong>CONECTAR</strong> para ir até a página de autorização. Após conectar,
                você volta automaticamente para cá — se não confirmar sozinho, clique em <strong>VERIFICAR</strong>.
              </p>
            )}
          </div>

          {!fbConnected && !fbChoosingPage && fbStatus !== 'loading' && (
            <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">
                <strong>Pré-requisito:</strong> é preciso ter uma <strong>Página do Facebook</strong> da
                prefeitura (não um perfil pessoal). Se ainda não existe uma, crie em{' '}
                <em>facebook.com/pages/create</em> — qualquer administrador da Página pode autorizar a conexão.
              </p>
            </div>
          )}

          {!igConnected && status !== 'loading' && (
            <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">
                <strong>Pré-requisito:</strong> O Instagram deve ser do tipo Business ou Creator e estar
                vinculado a uma Página do Facebook. No app do Instagram: Configurações → Conta → Trocar
                para conta profissional.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
