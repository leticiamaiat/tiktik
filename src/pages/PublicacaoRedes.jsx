import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ExternalLink, Pencil, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { getTiks, updateLegendaRedes } from '../services/tiks'
import { getMunicipalityConnection, publishToInstagram } from '../services/uploadPost'
import { areas } from '../data/mockData'

// Legenda padrão sugerida quando o tik ainda não tem uma legenda de redes
// personalizada (legenda_redes) — só o texto do tik, sem a secretaria.
// Usada tanto pra exibir quanto pra publicar.
function defaultCaption(tik) {
  return tik.description || ''
}

export default function PublicacaoRedes() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = !!user?.is_admin
  const municipality = user?.municipality
  const state = user?.state

  const [tiks, setTiks] = useState([])
  const [loading, setLoading] = useState(true)
  const [conn, setConn] = useState(null)
  const [connChecked, setConnChecked] = useState(false)

  const [search, setSearch] = useState('')
  const [area, setArea] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [publishingId, setPublishingId] = useState(null)
  const [publishedIds, setPublishedIds] = useState(() => new Set())

  const [editingId, setEditingId] = useState(null)
  const [draftText, setDraftText] = useState('')
  const [savingId, setSavingId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getTiks({
      area: area || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
      .then((data) => {
        const scoped = municipality
          ? data.filter((t) => t.profiles?.municipality === municipality)
          : data
        setTiks(scoped)
      })
      .catch((err) => {
        console.error(err)
        toast.error('Erro ao carregar tiks')
      })
      .finally(() => setLoading(false))
  }, [municipality, area, startDate, endDate])

  useEffect(() => { if (isAdmin) load() }, [isAdmin, load])

  useEffect(() => {
    if (!isAdmin || !municipality || !state) { setConnChecked(true); return }
    getMunicipalityConnection(municipality, state)
      .then(setConn)
      .catch(() => setConn(null))
      .finally(() => setConnChecked(true))
  }, [isAdmin, municipality, state])

  const filteredTiks = useMemo(() => {
    if (!search.trim()) return tiks
    const q = search.trim().toLowerCase()
    return tiks.filter(
      (t) => t.description?.toLowerCase().includes(q) || t.area?.toLowerCase().includes(q)
    )
  }, [tiks, search])

  const handleClearFilters = () => {
    setSearch('')
    setArea('')
    setStartDate('')
    setEndDate('')
  }

  const handlePublishInstagram = async (tik) => {
    if (!conn) return toast.error('Conecte o Instagram do município em Integração com Redes Sociais.')
    if (!tik.image_url) return toast.error('Este tik não possui foto para publicar.')

    setPublishingId(tik.id)
    try {
      const caption = tik.legenda_redes || defaultCaption(tik)
      await publishToInstagram(municipality, state, tik.image_url, caption)
      setPublishedIds((prev) => new Set(prev).add(tik.id))
      toast.success('Publicado no Instagram!')
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Erro ao publicar no Instagram')
    } finally {
      setPublishingId(null)
    }
  }

  const handleStartEdit = (tik) => {
    setEditingId(tik.id)
    setDraftText(tik.legenda_redes ?? defaultCaption(tik))
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setDraftText('')
  }

  const handleSaveLegenda = async (tik) => {
    setSavingId(tik.id)
    try {
      const legenda = draftText.trim() || null
      await updateLegendaRedes(tik.id, legenda)
      setTiks((prev) => prev.map((t) => (t.id === tik.id ? { ...t, legenda_redes: legenda } : t)))
      setEditingId(null)
      setDraftText('')
      toast.success('Legenda atualizada')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar legenda')
    } finally {
      setSavingId(null)
    }
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-sm text-gray-500">
            Apenas administradores podem acessar a publicação nas redes sociais.
          </p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-sm text-gray-500 mb-1">
          <span className="font-bold text-gray-700">{filteredTiks.length}</span> Tiks de {municipality || '—'} disponíveis para publicação
        </h1>
        <p className="text-xs text-gray-400 mb-4">
          Centralize aqui a publicação dos tiks nas redes sociais do município.
        </p>

        {connChecked && !conn && (
          <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
            <p className="text-xs text-amber-700">
              O Instagram do município ainda não está conectado. Conecte para poder publicar os tiks por aqui.
            </p>
            <button
              onClick={() => navigate('/integracao-redes')}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 whitespace-nowrap"
            >
              Conectar <ExternalLink size={12} />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquise por título ou texto..."
            className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Todas as Secretarias</option>
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 whitespace-nowrap">Data inicial:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 whitespace-nowrap">Data final:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={handleClearFilters}
            className="w-9 h-9 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-300 transition-colors flex-shrink-0"
            title="Limpar filtros"
          >
            <X size={16} />
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="flex items-center bg-tik-orange text-white text-sm font-semibold px-5 py-2">
            <div className="w-32 flex-shrink-0">Tik</div>
            <div className="flex-1">Legenda</div>
            <div className="flex-1">Criado por</div>
            <div className="w-40 flex-shrink-0">Data de criação</div>
            <div className="w-44 flex-shrink-0 text-right">Publicar nas redes</div>
          </div>

          {loading && <p className="text-center text-gray-400 text-sm py-8">Carregando tiks...</p>}
          {!loading && !municipality && (
            <p className="text-center text-gray-400 text-sm py-8">
              Seu perfil está sem município definido. Atualize seu perfil para ver os tiks.
            </p>
          )}
          {!loading && municipality && filteredTiks.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">Nenhum tik encontrado.</p>
          )}

          {filteredTiks.map((tik, i) => {
            const criadoEm = tik.created_at
              ? new Date(tik.created_at).toLocaleDateString('pt-BR')
              : '—'
            const published = publishedIds.has(tik.id)
            const publishing = publishingId === tik.id
            const canPublish = !!conn && !!tik.image_url
            const editing = editingId === tik.id
            const savingLegenda = savingId === tik.id
            const legendaAtual = tik.legenda_redes || defaultCaption(tik)

            return (
              <div
                key={tik.id}
                className={`flex items-center gap-4 px-5 py-3 ${i < filteredTiks.length - 1 ? 'border-b border-gray-100' : ''} ${i % 2 === 1 ? 'bg-gray-50' : ''}`}
              >
                <div className="w-32 flex-shrink-0 flex items-center gap-2">
                  {tik.image_url ? (
                    <img src={tik.image_url} alt={tik.area} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xl flex-shrink-0">📷</div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-xs truncate">{tik.area || 'Sem secretaria'}</p>
                    {tik.location && <p className="text-[11px] text-gray-400 truncate">📍 {tik.location}</p>}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  {editing ? (
                    <div className="flex flex-col gap-1.5">
                      <textarea
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        rows={3}
                        autoFocus
                        className="w-full border border-tik-orange rounded-lg px-2 py-1.5 text-xs text-gray-700 resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveLegenda(tik)}
                          disabled={savingLegenda}
                          className="flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700 disabled:opacity-50"
                        >
                          <Check size={13} /> {savingLegenda ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={savingLegenda}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <X size={13} /> Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-1.5">
                      <p className="text-xs text-gray-600 whitespace-pre-line line-clamp-3 flex-1">{legendaAtual}</p>
                      <button
                        onClick={() => handleStartEdit(tik)}
                        title="Editar legenda"
                        className="text-gray-400 hover:text-tik-orange transition-colors flex-shrink-0 p-0.5"
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 text-xs text-gray-600">
                  <p className="font-medium text-gray-700 truncate">{tik.profiles?.name || '—'}</p>
                  <p className="truncate">{tik.profiles?.secretaria || ''}</p>
                </div>

                <div className="w-40 flex-shrink-0 text-xs text-gray-500">{criadoEm}</div>

                <div className="w-44 flex-shrink-0 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handlePublishInstagram(tik)}
                    disabled={!canPublish || publishing}
                    title={
                      !conn
                        ? 'Conecte o Instagram do município primeiro'
                        : !tik.image_url
                        ? 'Este tik não possui foto'
                        : published
                        ? 'Publicar novamente'
                        : 'Publicar no Instagram'
                    }
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-opacity disabled:opacity-40 ${
                      published ? 'bg-green-500' : ''
                    }`}
                    style={published ? {} : { background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
                  >
                    {publishing ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span className="text-sm leading-none">📷</span>
                    )}
                  </button>
                  <span
                    title="Facebook — em breve"
                    className="w-9 h-9 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center cursor-not-allowed"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z"/>
                    </svg>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
