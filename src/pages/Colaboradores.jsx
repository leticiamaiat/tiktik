import { useState, useEffect, useCallback } from 'react'
import { ThumbsUp, ThumbsDown, Trash2, X, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { listProfiles, setAuthorized, deleteProfile } from '../services/profiles'
import { setMunicipalityAdmin, unsetMunicipalityAdmin, listMunicipalityPlans } from '../services/plans'
import { DEFAULT_PLAN } from '../constants/plans'

export default function Colaboradores() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [planByKey, setPlanByKey] = useState(new Map())

  const municipality = user?.municipality
  const isAdmin = !!user?.is_admin
  const isSuperAdmin = !!user?.super_admin
  const canManage = isAdmin || isSuperAdmin

  const load = useCallback(() => {
    if (!municipality && !isSuperAdmin) {
      setLoading(false)
      return
    }
    setLoading(true)
    listProfiles({
      // Super admin não passa município: enxerga colaboradores de todas as
      // prefeituras. O filtro de "Pesquise por município..." (city) continua
      // funcionando normalmente pra estreitar a busca.
      municipality: isSuperAdmin ? undefined : municipality,
      search: search || undefined,
      city: city || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
      .then(setProfiles)
      .catch((err) => {
        console.error(err)
        toast.error('Erro ao carregar colaboradores')
      })
      .finally(() => setLoading(false))
  }, [municipality, isSuperAdmin, search, city, startDate, endDate])

  useEffect(() => { load() }, [load])

  // Plano real de cada município (mesma fonte do Header/Municípios) — não
  // depende de filtro, só carrega uma vez.
  useEffect(() => {
    listMunicipalityPlans().then(setPlanByKey).catch((err) => console.error('listMunicipalityPlans falhou:', err))
  }, [])

  const handleClearFilters = () => {
    setSearch('')
    setCity('')
    setStartDate('')
    setEndDate('')
  }

  const handleToggleAuth = async (profile) => {
    if (!canManage) return
    const next = !profile.autorizado
    setProfiles((prev) => prev.map((p) => (p.id === profile.id ? { ...p, autorizado: next } : p)))
    try {
      await setAuthorized(profile.id, next)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao atualizar autorização')
      setProfiles((prev) => prev.map((p) => (p.id === profile.id ? { ...p, autorizado: !next } : p)))
    }
  }

  const handleDelete = async (profile) => {
    if (!canManage) return
    if (!window.confirm(`Tem certeza que deseja excluir ${profile.name || 'este colaborador'}?`)) return
    try {
      await deleteProfile(profile.id)
      setProfiles((prev) => prev.filter((p) => p.id !== profile.id))
      toast.success('Colaborador excluído')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir colaborador')
    }
  }

  const handleMakeAdmin = async (profile) => {
    if (!isSuperAdmin || profile.is_admin) return
    if (!window.confirm(`Tornar ${profile.name || 'este colaborador'} o administrador da Prefeitura de ${profile.municipality || '—'}?`)) return
    try {
      await setMunicipalityAdmin(profile.id)
      // Só um admin por município: rebaixa o anterior localmente.
      setProfiles((prev) =>
        prev.map((p) =>
          p.municipality === profile.municipality && p.state === profile.state
            ? { ...p, is_admin: p.id === profile.id }
            : p
        )
      )
      toast.success(`${profile.name || 'Colaborador'} agora é admin de ${profile.municipality}`)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao definir admin')
    }
  }

  const handleRemoveAdmin = async (profile) => {
    if (!isSuperAdmin || !profile.is_admin) return
    if (!window.confirm(`Remover ${profile.name || 'este colaborador'} como administrador da Prefeitura de ${profile.municipality || '—'}? O município fica sem admin até você escolher outro.`)) return
    try {
      await unsetMunicipalityAdmin(profile.id)
      setProfiles((prev) => prev.map((p) => (p.id === profile.id ? { ...p, is_admin: false } : p)))
      toast.success(`${profile.name || 'Colaborador'} não é mais admin de ${profile.municipality}`)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao remover admin')
    }
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-sm text-gray-500 mb-1">
          <span className="font-bold text-gray-700">{profiles.length}</span>{' '}
          {isSuperAdmin ? 'Colaboradores de todos os municípios' : `Colaboradores da Prefeitura de ${municipality || '—'}`}
        </h1>
        <p className="text-xs text-gray-400 mb-4">
          {!isSuperAdmin && user?.planLimits ? (
            <>
              Plano {user.plan}:{' '}
              <span className={profiles.length > user.planLimits.maxUsers ? 'text-red-500 font-semibold' : ''}>
                {profiles.length} / {user.planLimits.maxUsers} usuários
              </span>
            </>
          ) : (
            'Gerencie a autorização e o administrador de cada colaborador.'
          )}
        </p>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquise por nome..."
            className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Pesquise por municipio..."
            className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
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
            <div className="flex-1">Nome</div>
            <div className="flex-1">Secretaria | Empresa Parceira</div>
          </div>

          {loading && <p className="text-center text-gray-400 text-sm py-8">Carregando colaboradores...</p>}
          {!loading && !municipality && !isSuperAdmin && (
            <p className="text-center text-gray-400 text-sm py-8">
              Seu perfil está sem município definido. Atualize seu perfil para ver os colaboradores.
            </p>
          )}
          {!loading && (municipality || isSuperAdmin) && profiles.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">Nenhum colaborador encontrado.</p>
          )}

          {profiles.map((p, i) => {
            const tiksCount = p.tiks?.[0]?.count ?? 0
            const cadastradoEm = p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '—'
            return (
              <div
                key={p.id}
                className={`flex items-center gap-4 px-5 py-3 ${i < profiles.length - 1 ? 'border-b border-gray-100' : ''} ${i % 2 === 1 ? 'bg-gray-50' : ''}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt={p.name} className="w-11 h-11 rounded-full object-cover border-2 border-gray-200 flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-tik-orange flex items-center justify-center border-2 border-gray-200 flex-shrink-0">
                      <span className="text-white text-sm font-bold">{(p.name || '?')[0].toUpperCase()}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate flex items-center gap-1.5">
                      {p.name || 'Sem nome'}
                      {p.is_admin && (
                        <span className="bg-tik-orange/10 text-tik-orange text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                          Admin
                        </span>
                      )}
                      {p.super_admin && (
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                          Super Admin
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">CPF: {p.cpf || '—'}</p>
                  </div>
                </div>

                <div className="flex-1 text-xs text-gray-600 min-w-0">
                  <p className="font-semibold text-gray-700">
                    {p.empresa_parceira ? `Empresa: ${p.empresa_parceira}` : `Secretaria: ${p.secretaria || '—'}`}
                  </p>
                  <p>Cadastrado em: {cadastradoEm}</p>
                  <p className="text-gray-400">
                    Prefeitura de {p.municipality || '—'} - Plano {planByKey.get(`${p.municipality}|${p.state}`) || DEFAULT_PLAN}
                  </p>
                </div>

                <div className="text-sm text-gray-600 whitespace-nowrap px-2">
                  Enviou {tiksCount} TIKs
                </div>

                {canManage ? (
                  <>
                    {isSuperAdmin && (
                      <button
                        onClick={() => (p.is_admin ? handleRemoveAdmin(p) : handleMakeAdmin(p))}
                        title={p.is_admin ? 'Remover admin do município' : 'Tornar admin do município'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                          p.is_admin
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        <ShieldCheck size={14} />
                        {p.is_admin ? 'Remover admin' : 'Tornar admin'}
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleAuth(p)}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-white text-xs font-bold whitespace-nowrap transition-colors ${
                        p.autorizado ? 'bg-tik-orange hover:bg-tik-dark' : 'bg-red-500 hover:bg-red-600'
                      }`}
                    >
                      {p.autorizado ? <ThumbsUp size={14} /> : <ThumbsDown size={14} />}
                      {p.autorizado ? 'Autorizado' : 'Autorizar'}
                    </button>

                    <button
                      onClick={() => handleDelete(p)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                      title="Excluir colaborador"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                ) : (
                  <span
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-white text-xs font-bold whitespace-nowrap ${
                      p.autorizado ? 'bg-tik-orange' : 'bg-red-500'
                    }`}
                  >
                    {p.autorizado ? <ThumbsUp size={14} /> : <ThumbsDown size={14} />}
                    {p.autorizado ? 'Autorizado' : 'Não autorizado'}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
