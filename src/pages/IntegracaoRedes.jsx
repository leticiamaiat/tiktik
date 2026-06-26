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
} from '../services/uploadPost'

export default function IntegracaoRedes() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [conn, setConn] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'idle' | 'generating' | 'checking' | 'connected'

  const municipality = user?.municipality || ''
  const state = user?.state || ''
  const municipalityLabel = municipality && state ? `${municipality} - ${state}` : '...'

  useEffect(() => {
    if (!municipality || !state) return

    getMunicipalityConnection(municipality, state)
      .then((data) => {
        if (data) { setConn(data); setStatus('connected') }
        else setStatus('idle')
      })
      .catch(() => setStatus('idle'))
  }, [municipality, state])

  // Voltou da página do Upload-post após conectar
  useEffect(() => {
    if (searchParams.get('connected') === '1' && municipality && state) {
      setSearchParams({}, { replace: true })
      handleVerify()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, municipality, state])

  const handleConnect = async () => {
    if (!municipality || !state) return toast.error('Perfil sem município/estado. Atualize seu perfil.')
    setStatus('generating')
    try {
      const { url } = await generateInstagramConnectionUrl(municipality, state)
      window.open(url, '_blank', 'noopener')
      toast('Conecte o Instagram na aba que abriu e depois clique em VERIFICAR.', { duration: 7000 })
      setStatus('idle')
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
        toast.success(`Instagram @${result.ig_username} conectado para ${municipalityLabel}!`)
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

  const igConnected = status === 'connected'

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
              <strong>{municipalityLabel}</strong> conectar o Instagram uma vez. Todos os colegas
              do mesmo município poderão publicar automaticamente usando a mesma conta.
            </p>
          </div>

          <p className="text-sm text-gray-600 mb-3">
            Ao integrar o Instagram, ao criar um Tik com foto você poderá publicar automaticamente
            no perfil conectado, garantindo mais alcance e agilidade na comunicação.
          </p>

          <p className="text-sm font-semibold text-gray-700 mb-8">
            Nenhum dado de acesso é armazenado por nós — a autenticação é feita com total segurança
            pela plataforma parceira.
          </p>

          {/* Facebook — placeholder */}
          <div className="flex items-center gap-4 border border-blue-200 rounded-lg px-4 py-3 mb-4 opacity-50">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">f</div>
              <span className="font-bold text-blue-700 tracking-wide text-sm">FACEBOOK</span>
            </div>
            <span className="text-xs text-gray-400 font-medium">EM BREVE</span>
          </div>

          {/* Instagram */}
          <div className={`border rounded-lg px-4 py-4 transition-colors ${igConnected ? 'border-green-400 bg-green-50' : 'border-pink-400'}`}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-8 h-8 rounded flex items-center justify-center text-white text-sm"
                  style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
                >
                  📷
                </div>
                <div>
                  <span className="font-bold text-pink-600 tracking-wide text-sm">INSTAGRAM</span>
                  {igConnected && conn && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <CheckCircle size={12} className="text-green-500" />
                      <span className="text-xs text-green-600">
                        @{conn.ig_username} · conectado por{' '}
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
                Clique em <strong>CONECTAR</strong> para abrir a página de autorização em nova aba.
                Após conectar, clique em <strong>VERIFICAR</strong> para confirmar.
              </p>
            )}
          </div>

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
